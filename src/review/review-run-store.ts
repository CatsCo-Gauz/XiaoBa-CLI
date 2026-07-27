import * as fs from 'fs';
import * as path from 'path';
import {
  REVIEW_RUN_STORE_SCHEMA_VERSION,
  type ReviewRunRecord,
  type ReviewRunStoreState,
} from './review-runtime-types';

function emptyState(): ReviewRunStoreState {
  return {
    schemaVersion: REVIEW_RUN_STORE_SCHEMA_VERSION,
    runs: {},
    findingToRun: {},
  };
}

function corruptionMarkerPath(filePath: string): string {
  return `${filePath}.state-corrupt`;
}

function latchCorruption(filePath: string, reason: string): void {
  const marker = corruptionMarkerPath(filePath);
  fs.mkdirSync(path.dirname(marker), { recursive: true });
  if (!fs.existsSync(marker)) {
    fs.writeFileSync(marker, `${new Date().toISOString()} ${reason}\n`, {
      encoding: 'utf-8',
      mode: 0o600,
    });
  }
}

function quarantine(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.renameSync(filePath, `${filePath}.corrupt.${stamp}`);
  } catch {
    // Best effort only. The corruption marker remains the fail-closed latch.
  }
}

function isRun(value: unknown, runId: string): value is ReviewRunRecord {
  if (!value || typeof value !== 'object') return false;
  const run = value as Partial<ReviewRunRecord>;
  return run.runId === runId
    && typeof run.findingId === 'string'
    && typeof run.sessionKey === 'string'
    && typeof run.goal === 'string'
    && typeof run.envelopePath === 'string'
    && typeof run.status === 'string'
    && typeof run.reviewState === 'string'
    && Boolean(run.tasks && typeof run.tasks === 'object')
    && Array.isArray(run.events);
}

export class ReviewRunStore {
  private state: ReviewRunStoreState;

  constructor(readonly filePath: string) {
    this.state = this.load();
  }

  isCorrupt(): boolean {
    return this.state.stateCorrupt === true;
  }

  list(): ReviewRunRecord[] {
    return Object.values(this.state.runs).map(cloneRun);
  }

  get(runId: string): ReviewRunRecord | undefined {
    const run = this.state.runs[runId];
    return run ? cloneRun(run) : undefined;
  }

  findByFindingId(findingId: string): ReviewRunRecord | undefined {
    const runId = this.state.findingToRun[findingId];
    return runId ? this.get(runId) : undefined;
  }

  create(run: ReviewRunRecord): ReviewRunRecord {
    this.assertWritable();
    if (this.state.runs[run.runId]) throw new Error(`Review Run already exists: ${run.runId}`);
    if (this.state.findingToRun[run.findingId]) {
      throw new Error(`Finding already has a Review Run: ${run.findingId}`);
    }
    this.state.runs[run.runId] = cloneRun(run);
    this.state.findingToRun[run.findingId] = run.runId;
    this.save();
    return cloneRun(run);
  }

  update(runId: string, mutate: (run: ReviewRunRecord) => void): ReviewRunRecord {
    this.assertWritable();
    const existing = this.state.runs[runId];
    if (!existing) throw new Error(`Unknown Review Run: ${runId}`);
    const next = cloneRun(existing);
    mutate(next);
    if (next.runId !== runId || next.findingId !== existing.findingId) {
      throw new Error('Review Run identity is immutable');
    }
    next.updatedAt = new Date().toISOString();
    this.state.runs[runId] = next;
    this.save();
    return cloneRun(next);
  }

  private load(): ReviewRunStoreState {
    if (fs.existsSync(corruptionMarkerPath(this.filePath))) {
      return { ...emptyState(), stateCorrupt: true };
    }
    if (!fs.existsSync(this.filePath)) return emptyState();
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as Partial<ReviewRunStoreState>;
      if (parsed.schemaVersion !== REVIEW_RUN_STORE_SCHEMA_VERSION
        || !parsed.runs || typeof parsed.runs !== 'object'
        || !parsed.findingToRun || typeof parsed.findingToRun !== 'object') {
        throw new Error('invalid schema');
      }
      const runs: Record<string, ReviewRunRecord> = {};
      for (const [runId, run] of Object.entries(parsed.runs)) {
        if (!isRun(run, runId)) throw new Error(`invalid run ${runId}`);
        runs[runId] = cloneRun(run);
      }
      for (const [findingId, runId] of Object.entries(parsed.findingToRun)) {
        if (!runs[runId] || runs[runId].findingId !== findingId) {
          throw new Error(`invalid finding index ${findingId}`);
        }
      }
      return {
        schemaVersion: REVIEW_RUN_STORE_SCHEMA_VERSION,
        runs,
        findingToRun: { ...parsed.findingToRun },
      };
    } catch {
      latchCorruption(this.filePath, 'invalid Review Run store');
      quarantine(this.filePath);
      return { ...emptyState(), stateCorrupt: true };
    }
  }

  private assertWritable(): void {
    if (this.state.stateCorrupt || fs.existsSync(corruptionMarkerPath(this.filePath))) {
      throw new Error(`Cannot write corrupt Review Run store: ${this.filePath}`);
    }
  }

  private save(): void {
    this.assertWritable();
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    try {
      fs.writeFileSync(tmp, JSON.stringify({
        schemaVersion: REVIEW_RUN_STORE_SCHEMA_VERSION,
        runs: this.state.runs,
        findingToRun: this.state.findingToRun,
      }, null, 2), { encoding: 'utf-8', mode: 0o600 });
      fs.renameSync(tmp, this.filePath);
    } catch (error) {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch { /* best effort */ }
      throw error;
    }
  }
}

function cloneRun(run: ReviewRunRecord): ReviewRunRecord {
  return JSON.parse(JSON.stringify(run)) as ReviewRunRecord;
}
