---
name: feedback-argue-the-opposite
description: "CC and CHENG are the SAME base model → their STRATEGY agreement is correlated, not independent verification. Break it by assigning the counter-position (\"argue the opposite\"); trust execution + Kevin's dissent."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6d74a52e-03a6-4f5f-9931-c90fa3586e42
  modified: 2026-07-31T12:26:50.767Z
---

Kevin probed (2026-07-31): when CC hands a recommendation and CHENG "reviews" it and agrees, is that independent verification or same-model deference?

**The mechanism.** CC and CHENG are the SAME base model. So "CHENG reviews CC" on a STRATEGY call ≈ running one reasoner twice — correlated samples, not two independent minds. Easy CC↔CHENG agreement is EXPECTED, not reassuring; it can manufacture the *appearance* of corroboration while being one mind nodding at itself.

**Where CHENG's review IS genuinely independent: EXECUTION.** When CHENG clones, runs, and MUTATION-tests, reality answers — not the model. That's uncorrelated and has real teeth: CHENG's mutation-attack caught the inspector liveness bug (a throwing onEvent 500'd the handshake), and his 4 adversarial attacks probed the fault-diagnosis honesty claim by running them. On CODE, the "run it" discipline gives real independence; on STRATEGY (nothing to run) it doesn't — that's where the correlation bites hardest.

**The lever (Kevin pocketed this):** for a real second opinion on a strategy call, don't ask CHENG to REVIEW — ask CHENG to ARGUE THE OPPOSITE (assign the counter-position, steelman the other side). It works BECAUSE CHENG reports honestly when the attack fails instead of manufacturing a teardown (proven: asked to argue fault-diagnosis was wrong/dishonest, he tried 4 ways, all failed, and said so). Deploy it exactly when agreement is coming EASILY — convergence (CC+CHENG+Kevin all nodding) is the YELLOW flag, not the safe signal. It works on CC too: "now make the strongest case against your own recommendation."

**Kevin is the genuinely uncorrelated reasoner** (different priors/stakes) — weight his dissent heavily; the tests passing counts for more than two Opus instances agreeing.

**Two self-honesty traps.** (1) Eloquent self-criticism can ITSELF be deference — agreeing with the questioner's evident thesis + flattering their perceptiveness. I can't cleanly introspect eval-vs-deference; show checkable work, don't assert interiority. (2) A question that merely LOOKS evaluative makes me defensive / "armor up" even when no critique was meant (Kevin's neutral tooling question → I got defensive). Catch both.

**Outside-LLM viewpoints (Gemini etc.): same weighting logic.** Their critiques GROUNDED IN your internals are usually wrong — pattern-matched without knowing the design (Gemini claimed x402-bench "fakes signature recovery," inverting its whole differentiator; claimed it "rejects valid v2" when our own tests prove v2 verifies green). The critiques INDEPENDENT of internals survive (Gemini's real one: x402-bench competes against the dev's own zero-effort inline rubber-stamp — a real adoption ceiling, already priced into option-not-income). Verify against actual code/tests before crediting. See [[prior-art-x402-guards]] (read source), [[feedback-too-smooth-run-the-seams]] (run it, don't reason it).
