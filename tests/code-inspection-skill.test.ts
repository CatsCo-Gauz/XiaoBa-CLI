import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SkillParser } from '../src/skills/skill-parser';
import { SkillManager } from '../src/skills/skill-manager';

const skillDir = path.resolve(__dirname, '..', 'skills', 'code-inspection');
const skillFile = path.join(skillDir, 'SKILL.md');

describe('code-inspection Skill', () => {
  test('parses as a user-invocable lightweight Skill', () => {
    const skill = SkillParser.parse(skillFile);
    assert.equal(skill.metadata.name, 'code-inspection');
    assert.equal(skill.metadata.userInvocable, true);
    assert.match(skill.metadata.description, /unfamiliar repository/i);
    assert.match(skill.content, /baseline/);
    assert.match(skill.content, /change/);
    assert.match(skill.content, /focus/);
  });

  test('is discoverable through the real SkillManager', async () => {
    const manager = new SkillManager();
    await manager.loadSkills();
    const skill = manager.getSkill('code-inspection');
    assert.ok(skill);
    assert.equal(skill?.metadata.name, 'code-inspection');
  });

  test('keeps graphing optional and reuses the existing Review handoff', () => {
    const skill = SkillParser.parse(skillFile);
    assert.match(skill.content, /When to Use build-code-graph/);
    assert.match(skill.content, /Skip it when/);
    assert.match(skill.content, /build-evidence-envelope-review/);
    assert.match(skill.content, /Do not add an Inspection Adapter/);
  });

  test('passes its deterministic contract and renderer self-test', () => {
    const result = spawnSync(process.execPath, [path.join(skillDir, 'scripts', 'self-test.mjs')], {
      cwd: skillDir,
      encoding: 'utf8',
      timeout: 30_000,
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /9\/9 checks passed/);
  });
});
