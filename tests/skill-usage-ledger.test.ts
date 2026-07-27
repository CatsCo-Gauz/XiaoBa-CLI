import { afterEach, describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  SkillUsageLedger,
  type SkillUsageLedgerFact,
} from '../src/utils/skill-usage-ledger';

const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) {
    fs.rmSync(tempRoots.pop()!, { recursive: true, force: true });
  }
});

function makeLedgerPath(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoba-skill-usage-ledger-'));
  tempRoots.push(root);
  return path.join(root, 'skill-usage-ledger.jsonl');
}

describe('skill-usage-ledger read validation', () => {
  test('listFacts ignores malformed JSONL and generated-skill-load facts that fail write-side invariants', () => {
    const ledgerPath = makeLedgerPath();
    const validLoad: SkillUsageLedgerFact = {
      schemaVersion: 1,
      kind: 'generated-skill-load',
      factId: 'load-valid',
      recordedAt: '2026-07-19T00:00:00.000Z',
      runtimeSessionId: 'sess-1',
      episodeId: 'turn-ep-1',
      requestedRoutingName: 'skill-a',
      skill: {
        capabilityHandle: 'cap-a',
        routingName: 'skill-a',
        skillFilePath: '/tmp/skills/generated-distilled/cap-a/SKILL.md',
        guidanceHash: 'hash-a',
      },
    };

    const invalidMissingRoutingName = {
      ...validLoad,
      factId: 'load-missing-route',
      skill: {
        ...validLoad.skill,
        routingName: '',
      },
    };
    const invalidMissingGuidanceHash = {
      ...validLoad,
      factId: 'load-missing-hash',
      skill: {
        ...validLoad.skill,
        guidanceHash: '   ',
      },
    };
    const invalidMissingCapabilityHandle = {
      ...validLoad,
      factId: 'load-missing-handle',
      skill: {
        ...validLoad.skill,
        capabilityHandle: '',
      },
    };
    const invalidBadPath = {
      ...validLoad,
      factId: 'load-bad-path',
      skill: {
        ...validLoad.skill,
        skillFilePath: '/tmp/skills/manual/cap-a/SKILL.md',
      },
    };
    const invalidMissingSession = {
      ...validLoad,
      factId: 'load-missing-session',
      runtimeSessionId: '   ',
    };

    fs.writeFileSync(
      ledgerPath,
      [
        JSON.stringify(validLoad),
        '{not-json',
        JSON.stringify(invalidMissingRoutingName),
        JSON.stringify(invalidMissingGuidanceHash),
        JSON.stringify(invalidMissingCapabilityHandle),
        JSON.stringify(invalidBadPath),
        JSON.stringify(invalidMissingSession),
      ].join('\n') + '\n',
      'utf8',
    );

    const facts = new SkillUsageLedger(ledgerPath).listFacts();

    assert.equal(facts.length, 1);
    assert.deepEqual(facts[0], validLoad);
  });

  test('listFacts ignores malformed episode-outcome facts and preserves valid ones', () => {
    const ledgerPath = makeLedgerPath();
    const validOutcome: SkillUsageLedgerFact = {
      schemaVersion: 1,
      kind: 'episode-outcome',
      factId: 'outcome-valid',
      recordedAt: '2026-07-19T00:00:00.000Z',
      loadFactId: 'load-valid',
      episodeId: 'turn-ep-1',
      outcome: 'verified-success',
      evidenceRefs: ['session.jsonl#12', 'session.jsonl#13'],
    };
    const invalidMissingLoadFactId = {
      ...validOutcome,
      factId: 'outcome-missing-load',
      loadFactId: '',
    };
    const invalidBadOutcome = {
      ...validOutcome,
      factId: 'outcome-bad-kind',
      outcome: 'accepted',
    };
    const invalidEvidenceRefs = {
      ...validOutcome,
      factId: 'outcome-bad-evidence',
      evidenceRefs: ['session.jsonl#12', 42],
    };

    fs.writeFileSync(
      ledgerPath,
      [
        JSON.stringify(validOutcome),
        JSON.stringify(invalidMissingLoadFactId),
        JSON.stringify(invalidBadOutcome),
        JSON.stringify(invalidEvidenceRefs),
      ].join('\n') + '\n',
      'utf8',
    );

    const facts = new SkillUsageLedger(ledgerPath).listFacts();

    assert.equal(facts.length, 1);
    assert.deepEqual(facts[0], validOutcome);
  });
});
