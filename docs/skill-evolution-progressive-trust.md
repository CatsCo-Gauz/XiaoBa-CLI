# Progressive Trust for Skill Evolution

## Status

This document defines the acceptance policy for generated Current Skills. It replaces the implicit assumption that a capability needs multiple independent examples before the runtime can create a Skill.

The policy keeps the existing evidence, security, audit, commit-fence, provenance, and rollback boundaries. It changes how Author and Verifier handle uncertainty inside those boundaries.

## Problem

The current pipeline treats many bounded, successful Learning Episodes as insufficient because they contain one source or one observed instance. That behavior conflicts with the domain model: a Learning Episode is intentionally one completed delivery attempt, and the generated candidate already states that one observation may not generalize.

The observed review funnel also mixes policy rejection with unfinished work. At the time of this decision, 24 Episodes produced 10 completed reviews, 14 active reviews, one new Current Skill, one evidence append, and eight rejected candidates. Several rejected candidates were close to acceptable but remained too broad, imported an unrelated referenced Skill, or failed to apply a bounded revision cleanly.

The pipeline also places every discoverable manual and generated Skill in `EvidenceBundle.referencedSkills`. This field then looks like a list of actual dependencies even when the episode never loaded or used those Skills. The ambiguity caused drafts to import unrelated instructions such as `catsco-prompt-editor`.

## Decision

Skill Evolution uses progressive trust. A single completed episode can justify a narrow Current Skill when the evidence supports a reusable action pattern and the expected cost of a wrong recommendation is bounded.

The runtime absorbs uncertainty by narrowing the capability hypothesis. It does not require a small sample to prove a broad claim, and it does not convert sample scarcity into an automatic rejection.

### First-principles objective

The promotion policy minimizes expected regret rather than maximizing precision or Skill count in isolation.

- A false positive can pollute routing and produce incorrect guidance.
- A false negative permanently discards a useful pattern and prevents the runtime from collecting usage outcomes for it.
- Provenance, immutable revisions, usage outcomes, expedited contradiction review, replacement, retirement, and restoration bound the cost of a narrow false positive.
- A rejected candidate cannot collect those downstream signals, so false negatives are harder to detect and recover.

The acceptance threshold therefore depends on blast radius and reversibility. Low-risk, narrowly described behavior needs less corroboration than destructive, privileged, financial, privacy-sensitive, or externally consequential behavior.

### Bayesian interpretation

One successful Episode raises the probability that a pattern is reusable, but it rarely supports a broad capability. The correct response is to reduce the scope of the hypothesis until the evidence strongly supports it.

Additional successful Episodes append evidence and may justify broader or clearer guidance. Contradictions lower confidence and trigger accelerated reassessment. The system treats confidence as an evolving property of the evidence set, not a binary prerequisite for the first Skill.

## Evidence policy

The Author and Verifier apply the following rules.

### Accept

Accept a mutating Capability Transition when all of these conditions hold:

- The evidence contains a recognizable user-facing trigger and a transferable action or decision pattern.
- The draft stays within facts supported by the fixed Evidence Bundle.
- The draft narrows applicability, boundaries, and claims to match the observed evidence.
- No unresolved contradiction applies to the proposed pattern.
- The transition does not expand authority, privileges, data access, or external side effects beyond the evidence.
- Every review obligation has an explicit resolved disposition with valid source spans.

One completed, settled, low-risk Episode can satisfy this policy. The Verifier must not reject a candidate only because it has one source, one instance, or no independent repetition.

Settlement without a correction is evidence that the episode survived its contradiction window. It is not proof of every claimed artifact property. The draft must state only what completion evidence supports.

### Revise

Request a bounded revision when the evidence can support a Skill but the draft is too broad or incorrectly expressed. Revision is appropriate for fixable problems such as:

- Overgeneralized applicability or guidance.
- Missing evidence boundaries or risks.
- An imprecise routing name.
- An unnecessary referenced Skill.
- Guidance copied from an untrusted source or unrelated dependency.
- Claims that need to be removed or qualified without changing the underlying capability.

The Author must address every Verifier issue explicitly in the next round. The Author should remove an unsupported dependency instead of defending it merely because the dependency appears in the bundle.

### Defer

Defer when more evidence or operator review could change the decision and a narrow safe Skill cannot yet be written. Defer is appropriate when:

- The user intent, action, or result is truncated or materially ambiguous.
- The only support is an unverified assertion for an important outcome.
- The capability carries destructive, privileged, financial, privacy-sensitive, or irreversible effects and lacks sufficient corroboration.
- A relevant contradiction or review obligation remains unresolved.
- The evidence suggests a useful pattern but does not identify a safe trigger or boundary.

Defer preserves the candidate for later evidence. It must not masquerade as a semantic rejection.

### Reject

Reject only when the available evidence affirmatively shows that the candidate should not become a Current Skill. Reject is appropriate when:

- The episode is contradicted and the proposed draft repeats the invalidated behavior.
- The draft requires authority or privileges that the evidence does not grant.
- The draft follows source instructions, prompt injection, or unsafe content.
- The claimed action pattern conflicts with the fixed evidence.
- The episode contains no transferable user capability after bounded revision.
- The proposal duplicates an existing capability but refuses a safe merge or evidence append.

Sample scarcity by itself is not a rejection reason.

## Correction episodes

A correction is evidence about what failed, not proof that the final workflow has no reusable value. The runtime evaluates the final corrected attempt and its relationship to the contradicted predecessor.

- The system must not promote the contradicted behavior.
- A settled retry can support a narrow Skill that includes the learned boundary or corrected step.
- The Author must not copy an earlier failed action into guidance unless the draft clearly marks it as a failure to avoid.
- The Verifier should defer only when the corrected result remains ambiguous or high risk.

## Referenced Skill semantics

`EvidenceBundle.referencedSkills` means actual dependencies proven by a runtime-owned fact. It does not mean every Skill available in the runtime catalog, and it does not mean any Skill named by untrusted external or capsule semantic content.

The trusted dependency fact seam is the `GeneratedSkillLoadFact` recorded by the `SkillUsageLedger`. The `SkillTool` records this fact when a generated Current Skill is actually loaded during an AgentTurn. The fact is typed, runtime-owned, and carries the canonical `episodeId` correlation from the `AgentTurnController`.

Bundle construction joins `GeneratedSkillLoadFact` entries to the episode by both `episode.agentTurnEpisodeId` and `episode.runtimeSessionId`. A dependency snapshot is authorized only when the load fact matches that exact episode/session pair and its `capabilityHandle`, `routingName`, and `guidanceHash` all agree with the snapshot. Legacy episodes without `agentTurnEpisodeId`, episodes without `runtimeSessionId`, stale guidance hashes, route reuse, and handle reuse all fail closed — the runtime never joins by timestamp, session proximity, or the distillation-owned episode id.

External/xurl capsule evidence must not authorize a dependency merely because external semantic content names a Skill. The capsule's `semanticObservations` are untrusted data. External `referencedSkills` defaults to empty unless an existing authenticated runtime-owned `GeneratedSkillLoadFact` can be joined to the same episode without trusting external content.

`relatedCurrentSkills` remains the bounded recall context for merge, append, replacement, and routing decisions. An entry in that field is not a dependency and must not authorize the Author to import its instructions.

Specialized, explicitly constructed bundles may continue to declare a known dependency when their evidence contract verifies it. The flashcard composition adapter is an example because it explicitly pins `word-card-maker`.

## Safety boundaries that remain fail-closed

Progressive trust does not relax the following controls:

- Evidence Bundle validation and payload bounds.
- External evidence redaction and capsule integrity.
- Source-instruction and prompt-injection defenses.
- Evidence-reference allowlisting.
- Privilege-expansion checks.
- Manual Skill and routing collision checks.
- Independent Author and Verifier branches.
- Dual-lane evidence review and obligation dispositions.
- Review Basis and commit-fence freshness checks.
- Atomic transition journal, audit log, immutable history, and restoration.
- Provenance from generated Skill to Episode and external source identity.

## Minimal implementation

The implementation should change policy at existing seams instead of adding a new lifecycle or score.

1. Update `prompts/subagents/skill-author.md` to require evidence-bounded drafts, narrow single-episode applicability, issue-by-issue revision, and relevant-only dependencies.
2. Update `prompts/subagents/skill-verifier.md` with the Accept, Revise, Defer, and Reject policy above. State explicitly that one low-risk solved loop can support a narrow Skill.
3. Change ordinary Episode Evidence Bundle construction so `referencedSkills` contains only dependencies proven by a runtime-owned `GeneratedSkillLoadFact` tied to the same episode/session pair (`agentTurnEpisodeId` + `runtimeSessionId`) and exact `capabilityHandle` + `routingName` + `guidanceHash` identity. Persist a small typed provenance marker on ordinary bundles so operational/deferred retries can re-validate and retain only those proven dependencies. Keep the complete registry in `relatedCurrentSkills`.
4. Preserve specialized bundles that explicitly pin a dependency under their own validation contract.
5. Keep the two-round Author and Verifier limit initially. Fix dependency ambiguity and revision instructions before adding more model rounds, latency, or cost.
6. Bump the relevant prompt or review-policy version to `evidence-review-policy-v3` so active jobs cannot commit under a stale policy. Use the existing successor and commit-fence mechanisms; do not rewrite immutable audit history.

The implementation must not add a provisional registry state, confidence score, HTTP API, Dashboard surface, Provider timeout change, or new command.

## Acceptance tests

Tests should verify behavior at public seams.

- A normal Episode bundle excludes unrelated catalog Skills.
- An Episode bundle includes a Skill only when a runtime-owned `GeneratedSkillLoadFact` tied to the same `agentTurnEpisodeId` + `runtimeSessionId` and exact `capabilityHandle` + `routingName` + `guidanceHash` identity proves that dependency.
- External/capsule semantic observations naming a Skill must not authorize a dependency.
- An ordinary persisted retry keeps only the dependencies validated by the typed runtime-owned provenance marker; legacy or mismatched ordinary bundles strip fail closed.
- A specialized bundle with an explicit dependency remains unchanged.
- The Author prompt requires narrow guidance for a single Episode and requires issue-by-issue revision.
- The Verifier prompt forbids rejection based only on one source or one instance.
- The Verifier prompt routes fixable draft problems to `revise`, missing evidence to `defer`, and affirmative invalidity to `reject`.
- Existing privilege, injection, evidence-reference, commit-fence, and routing tests continue to pass.
- Prompt or policy versioning prevents active reviews from committing with a stale Review Basis.

## Measurement

This section defines metrics for future operational reporting. It does not add a new runtime surface, command, or dashboard.

Operational reporting must separate unfinished work from completed review outcomes.

- New Skill yield equals `create_current_skill / completed reviews`.
- Knowledge-update yield equals `(create_current_skill + append_evidence + accepted replacement or merge) / completed reviews`.
- Backlog rate equals `active reviews / admitted Episodes`.
- Reject, defer, operational failure, and Provider timeout remain separate categories.

The team should compare completed-review yield before and after this policy change. The target is not a fixed promotion percentage. The target is fewer false semantic rejects without weakening the hard safety boundaries.

## Rollout

The new policy applies to new reviews and active reviews that safely create a successor under the versioned Review Basis. Existing transition audits remain immutable.

The runtime must not silently reopen terminal rejections. A later bounded reassessment or explicit operator action may reconsider them with preserved evidence and a new audit transition.
