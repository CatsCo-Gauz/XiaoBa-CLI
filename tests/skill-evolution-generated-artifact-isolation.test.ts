import { describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  reconcileActiveGeneratedSkillArtifacts,
  type CurrentSkillRegistryState,
} from '../src/utils/skill-evolution';

function writeSkill(filePath: string, name: string): string {
  const content = `---\nname: "${name}"\ndescription: test\n---\n\n# ${name}\n`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return crypto.createHash('sha256').update(content).digest('hex');
}

describe('generated artifact reconciliation', () => {
  test('quarantines one hash-mismatched artifact without hiding healthy capabilities', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-skill-isolation-'));
    try {
      const healthyPath = path.join(root, 'healthy', 'SKILL.md');
      const brokenPath = path.join(root, 'broken', 'SKILL.md');
      const healthyHash = writeSkill(healthyPath, 'healthy-skill');
      writeSkill(brokenPath, 'broken-skill');
      const state: CurrentSkillRegistryState = {
        schemaVersion: 2,
        catalogRevision: 1,
        routeRedirects: { 'retired-broken': 'broken' },
        capabilities: {
          healthy: { handle: 'healthy', revision: 1, routingName: 'healthy-skill', description: 'healthy', skillFilePath: healthyPath, guidanceHash: healthyHash, evidenceRefs: [], referencedSkills: [], semanticObservations: [], createdAt: '', updatedAt: '' },
          broken: { handle: 'broken', revision: 1, routingName: 'broken-skill', description: 'broken', skillFilePath: brokenPath, guidanceHash: '0'.repeat(64), evidenceRefs: [], referencedSkills: [], semanticObservations: [], createdAt: '', updatedAt: '' },
        },
      };
      const result = reconcileActiveGeneratedSkillArtifacts(state);
      assert.deepEqual(Object.keys(result.state.capabilities), ['healthy']);
      assert.equal(result.quarantined.length, 1);
      assert.equal(result.quarantined[0].handle, 'broken');
      assert.deepEqual(result.state.routeRedirects, {});
      assert.equal(result.repaired, false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
