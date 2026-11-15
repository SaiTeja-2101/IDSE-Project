# Phase 4: Your first shift

**Revised flow:** The six-choice implementation documented below has been extended to three hiring rounds and separate player-only/company models. The current plan and completion record is [ROUND_REVISION.md](ROUND_REVISION.md). The original section below records the earlier Phase 4 milestone.

## Plan

1. **Briefing.** Keep the title screen. Open a short message from Orbit Works explaining the six CVs and the Shortlist / Pass choices. No countdown.
2. **Six decisions.** Show the new candidate schema in a paper CV: skill out of 100, experience in years, academy, and city. Reuse the applicant animations, office floor, and doors. Provide six native applicant buttons, visible progress, and S/P keyboard shortcuts. Save each decision once; never label an unseen person.
3. **Training handoff.** Show a ledger of the six choices. Explain that Scout will use those six examples and 160 historical records. One Train Scout action fits the Phase 3 tree and saves the immutable original model before screening starts.
4. **Watch Scout.** Reuse the training dots, machine, conveyor, scanner, and character assets. Screen the separate 12-applicant introductory pool using actual model predictions. Let the player move at their own pace or screen the remaining applicants immediately.
5. **Shift notes.** Show the calculated count and percentage for Match to past hiring decisions. Introduce a decision tree as learned questions using the fitted model's actual first question. Explain that agreement with old choices does not prove readiness. Keep the audit and final pools out of training and this report.
6. **Checks and handoff.** Check all-shortlist, all-pass, mixed choices, repeated submissions, phase guards, original snapshot timing, and all 12 decisions. Compile the game and record browser limits honestly. Leave the full investigation and tree inspector for Phase 5.

## Implementation boundaries

- The active route will use the Phase 3 session throughout. Legacy modules remain as attributed source but will no longer control the first shift.
- A pure flow controller will own the session, choices, training, and screening. The DOM and sprites will consume its state.
- Pause must freeze timers, GSAP, and sprites. Native keyboard actions must respect pause and animation locks.
- Each view will dispose of its listeners, timers, and sprites. Restart creates fresh pools; a `?seed=20261030` development URL allows a reproducible run.
- The result panel is a natural checkpoint for the first two chapters. It will not pretend that the later investigation, workshop, or final evaluation is implemented.

## Completion evidence

The implementation is complete. The active route now follows this plan and uses the new session throughout.

| Area | Implementation |
| --- | --- |
| Progression and choices | `learning/firstShift.js` |
| Native controls, CVs, ledgers, and reports | `components/interface/first-shift/` |
| Retained floors, doors, characters, machine, conveyor, and scanner | `components/pixi/first-shift/first-shift-scene.js` |
| Layout and responsive styling | `scss/pages/first-shift.scss` |
| Entry and scene lifecycle | `controllers/game/gameEntry.js` and `stateManager.js` |
| Regression checks | `tests/phase4.test.cjs` |

The CV uses skill out of 100, experience out of five years, and textual academy/city fields. Each applicant has one explicit immutable answer. Duplicate clicks and held shortcut keys cannot add a second choice. A native applicant queue provides the keyboard equivalent of sprite selection.

Training fits once using the 160 historical records and the six explicit player labels. It saves the original snapshot before the introductory pool is screened. Both step-by-step and immediate screening compute the same twelve decisions. The shift report uses the introductory pool's historical labels and names that comparison clearly.

The reused training effect now owns and cancels its timers, resize listener, and ticker callback. Floor, door, and conveyor wrappers now retain the exact listener references needed for disposal. The scanner scene owns its sprites and GSAP effects. Pause makes the first-shift surface inert and freezes the clocks and animations. Reduced-motion mode uses still characters, immediate movement, and a static training pattern.

## How to try it

Run `npm run dev`, then open `http://127.0.0.1:4000/game/`.

1. Start, then choose **Take the desk**.
2. Open the six CVs and choose **Shortlist** or **Pass**. S/P make a choice; arrow keys switch pending CVs.
3. Check your ledger and choose **Train Scout**.
4. Choose **Watch Scout**, then **Screen next CV** or **Screen the rest**.
5. Read the shift notes and expand either ledger to review the choices.

Normal restarts generate a fresh seed. `http://127.0.0.1:4000/game/?seed=20261030` fixes the seed for development, including when restarting that URL. Progress remains in memory while the page stays open; durable save/resume is Phase 8.

## Verification limits

Ten Phase 4 checks pass. They cover early-action guards, explicit labels, duplicate decisions, all-shortlist/all-pass/mixed playthroughs, 166-example model input, separate evaluation IDs, immutable original timing, all twelve predictions, report correctness, equivalent skip behaviour, fresh and development seeds, actual click/keyboard handlers, compiled Pug controls, and training-effect disposal.

On 2026-10-30, the final `npm run build` completed for both the website and game. After that build, `node --test --test-skip-pattern='local preview' tests/*.test.cjs` passed all thirty selected checks. `git diff --check` reports no whitespace errors.

No new browser walkthrough or screenshot is claimed. The earlier local-origin browser action was rejected by automatic approval review. Full visual review, real browser keyboard interaction, and animation layout at laptop/tablet sizes still need browser access. The local HTTP baseline test remains excluded because this session rejected loopback connections with `EACCES`.
