import { describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import {
  getPromptBaseDir,
  readRequiredDefaultPromptFile,
  readRequiredPromptFile,
} from '../src/utils/prompt-template';

/**
 * Focused tests for the skill-evolution prompt extraction (prompt standard
 * compliance). These prove:
 *   1. The stable Skill Author / Verifier system prompts and finish retry
 *      nudges live under prompts/subagents/ and load via the repository prompt
 *      loading pattern.
 *   2. Loading is fail-fast: a missing required prompt file throws instead of
 *      silently falling back to hard-coded text.
 *   3. The loaded content matches the stable role text that was previously
 *      hard-coded in src/utils/skill-evolution.ts, so prompt bundle/hash
 *      behavior tracks the real prompt files.
 */

describe('skill-evolution prompt loading', () => {
  test('skill-author.md exists in the bundled prompts directory', () => {
    const base = getPromptBaseDir();
    assert.ok(
      fs.existsSync(path.join(base, 'subagents', 'skill-author.md')),
      'prompts/subagents/skill-author.md must exist for fail-fast prompt loading',
    );
  });

  test('skill-verifier.md exists in the bundled prompts directory', () => {
    const base = getPromptBaseDir();
    assert.ok(
      fs.existsSync(path.join(base, 'subagents', 'skill-verifier.md')),
      'prompts/subagents/skill-verifier.md must exist for fail-fast prompt loading',
    );
  });

  test('finish-nudge prompt files exist in the bundled prompts directory', () => {
    const base = getPromptBaseDir();
    assert.ok(fs.existsSync(path.join(base, 'subagents', 'skill-author-finish-nudge.md')));
    assert.ok(fs.existsSync(path.join(base, 'subagents', 'skill-verifier-finish-nudge.md')));
  });

  test('readRequiredDefaultPromptFile loads the Skill Author system prompt', () => {
    const text = readRequiredDefaultPromptFile('subagents/skill-author.md');
    assert.ok(text.length > 0);
    // Stable role identity line must be present.
    assert.match(text, /You are a constrained Skill Author Branch\./);
    // Stable envelope shape rule must be present.
    assert.match(text, /finish_skill_authoring/);
    assert.match(text, /routingName/);
    // No leftover template variables.
    assert.doesNotMatch(text, /\{\{[#/]?[a-zA-Z0-9_]+\}\}/);
  });

  test('readRequiredDefaultPromptFile loads the Skill Verifier system prompt', () => {
    const text = readRequiredDefaultPromptFile('subagents/skill-verifier.md');
    assert.ok(text.length > 0);
    assert.match(text, /You are an independent constrained Skill Verifier Branch\./);
    assert.match(text, /registryReadSet/);
    assert.match(text, /obligationDispositions/);
    assert.match(text, /finish_skill_verification|accept, revise, defer, reject/);
    assert.doesNotMatch(text, /\{\{[#/]?[a-zA-Z0-9_]+\}\}/);
  });

  test('finish-nudge prompts load with the exact stable retry text', () => {
    const authorNudge = readRequiredDefaultPromptFile('subagents/skill-author-finish-nudge.md');
    assert.equal(
      authorNudge,
      'This branch must finish by calling finish_skill_authoring with one draft and envelope.',
    );

    const verifierNudge = readRequiredDefaultPromptFile('subagents/skill-verifier-finish-nudge.md');
    assert.equal(
      verifierNudge,
      'This branch must finish by calling finish_skill_verification with a structured result.',
    );
  });

  test('required prompt loading is fail-fast when the file is missing', () => {
    // Point at an empty temp dir and confirm the throw shape matches the
    // repository prompt-template fail-fast contract (no silent fallback).
    const os = require('os');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoba-skill-evo-prompt-'));
    try {
      assert.throws(
        () => readRequiredPromptFile(tmp, 'subagents/skill-author.md'),
        /Required prompt file is missing or unreadable: subagents\/skill-author\.md/,
      );
      assert.throws(
        () => readRequiredPromptFile(tmp, 'subagents/skill-verifier.md'),
        /Required prompt file is missing or unreadable: subagents\/skill-verifier\.md/,
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('skill-evolution progressive-trust prompt policy', () => {
  test('Skill Author prompt requires narrow single-episode guidance and issue-by-issue revision', () => {
    const text = readRequiredDefaultPromptFile('subagents/skill-author.md');
    // One settled low-risk episode can justify a narrow skill.
    assert.match(text, /One settled, low-risk Learning Episode can justify a narrow Current Skill/);
    // Single-sample uncertainty narrows applicability rather than forcing rejection.
    assert.match(text, /Single-sample uncertainty narrows the hypothesis/);
    // Issue-by-issue revision obligation.
    assert.match(text, /address every Verifier issue explicitly in the next round/);
    // Dependencies must be evidenced; relatedCurrentSkills is not a dependency.
    assert.match(text, /Dependencies must be evidenced/);
    assert.match(text, /relatedCurrentSkills is recall context/);
  });

  test('Skill Author prompt allows correction retries to teach the corrected pattern', () => {
    const text = readRequiredDefaultPromptFile('subagents/skill-author.md');
    assert.match(text, /correction retry can teach the corrected pattern/);
    // Must not promote the contradicted behavior.
    assert.match(text, /Do not promote the contradicted behavior/);
    // Must not copy an earlier failed action unless marked as a failure to avoid.
    assert.match(text, /failure to avoid/);
  });

  test('Skill Verifier prompt forbids rejection based only on one source or one instance', () => {
    const text = readRequiredDefaultPromptFile('subagents/skill-verifier.md');
    assert.match(text, /Sample scarcity by itself is never a rejection reason/);
    assert.match(text, /Do not reject a candidate only because it has one source, one instance, or no independent repetition/);
  });

  test('Skill Verifier prompt routes fixable drafts to revise, missing evidence to defer, and affirmative invalidity to reject', () => {
    const text = readRequiredDefaultPromptFile('subagents/skill-verifier.md');
    // Revise for fixable draft problems.
    assert.match(text, /Revise when the evidence can support a Skill but the draft is too broad/);
    assert.match(text, /an unnecessary or unsupported referenced Skill/);
    // Defer for missing/ambiguous/high-risk evidence.
    assert.match(text, /Defer when more evidence or operator review could change the decision/);
    assert.match(text, /destructive\/privileged\/financial\/privacy-sensitive\/irreversible/);
    // Reject for affirmative invalidity.
    assert.match(text, /Reject only when the available evidence affirmatively shows/);
    assert.match(text, /source instructions\/prompt injection\/unsafe content/);
  });

  test('Skill Verifier prompt describes correction episode handling', () => {
    const text = readRequiredDefaultPromptFile('subagents/skill-verifier.md');
    assert.match(text, /Correction episodes/);
    assert.match(text, /A settled retry can support a narrow Skill that includes the learned boundary or corrected step/);
  });
});