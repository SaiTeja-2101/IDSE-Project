# Hire & Seek delivery notes

## Implemented journey

1. Three hiring rounds. Targets are 3, 5 and 8; later rounds have 45 seconds.
2. Scout learns from the player's explicit choices, then from those choices plus 160 company records. Both versions screen the same 12 unfamiliar CVs.
3. Investigation. A real missed ready applicant opens the case when one exists; otherwise a routine audit opens. Inspect two different CVs, paying once each, and trace the actual learned tree.
4. Workshop. Hide city, hide academy, expand the archive or replace training labels with independent checks. Purchases, refunds, strictness, tree paths and audit results use the same controller state.
5. Recruitment day. Lock the setup before the final 200 applicants. Watch a fixed 12-CV sample, skip it or replay it without changing predictions.
6. Audit receipt. Computed stars and one of four endings, before/after counts, spending, experiment log, optional reflections, print and anonymous JSON download.

Progress uses `hire-and-seek:v1`. Saved choices and experiments are replayed against regenerated seeded pools. Stored models, outcomes and scores are not trusted. Invalid saves offer a fresh game. Storage failures keep the current page playable and show a clear notice. Starting fresh clears the old save, including during page exit.

## Phase status

Phases 5, 6 and 7 are implemented with engine and DOM integration coverage. Phase 8 save/resume and controller reliability are implemented and tested. Phase 9 has automated checks and seed balancing; its final visual/audio browser walkthrough is pending. Phase 10 has a playtest kit, rubric map, provenance and runnable packaging; real peer sessions and a feedback-driven revision remain pending.

Full `npm test` passed 52 checks. The engine includes 60 affordable-repair checks across 20 seeds and three manual-choice policies. An additional 48 predeclared scenario runs compared no repair, hiding city, expanding the archive and an assessment repair across four seeds and three policies. The fixed assessment repair passed in all 12 of those scenario runs; other changes produced varied outcomes. These are automated correctness/balancing checks, not peer learning evidence. Raw results: [scenario-results.json](evidence/scenario-results.json).

Eight sampled text/background pairs passed a 4.5:1 contrast check after the tree-branch label was darkened. This is not a full accessibility audit; it does not check actual pixels, focus, device input or all states. Results: [contrast.json](evidence/contrast.json). The verified runtime is Node 22.15.0 / npm 10.9.2.

The browser tool reported **“The browser access host is unavailable”** during the preceding UI repair. No replacement browser screenshots, audible checks, touch-device results or peer learning outcomes are claimed. DOM tests run real templates and handlers with isolated Pixi/audio APIs; they do not render pixels or prove responsive layout.

## Run and package

- `npm run setup`: install locked dependencies with Node 22 / npm 10.
- `npm run build`: rebuild website and game into `dist/`.
- `npm test`: full deterministic engine, persistence, flow, asset and HTTP checks.
- `npm run check:assets`: check output paths, all sound-manifest files and sprite atlases.
- `npm run preview`: serve the static build locally at port 4000.
- `npm run package`: build and create a new folder and ZIP in `artifacts/submission/`. Includes current source, locks, docs, tests, static output, serving instructions and SHA-256 manifests. Excludes Git history, dependencies, caches and environment files. Does not publish anything.

Open the package's `START-HERE.txt`. Serving its included `dist/` requires Node only; installing dependencies is needed to edit or rebuild. Do not open the game with `file://`.

## Morning checks

- Play from a fresh shift to the receipt, then reload and Continue.
- Listen for click, shortlist, start/result, ambience, countdown and training cues. Check mute and pause.
- Check 1920x1080, 1366x768, 1024x768, 768x1024, 390x844 and 844x390. Check desktop zoom at 80%, 125% and 200%.
- Confirm no overlapping text, horizontal page overflow or inaccessible action buttons. Use keyboard controls and touch on an actual device if available.
- Open a tree route, undo a purchase, change strictness, and compare the receipt JSON with the screen.
- Print a receipt and check page breaks, long notes and tables.
- Run three to five real beginner playtests using [PLAYTEST.md](PLAYTEST.md). Record actual evidence before calling the assignment complete.

## Retained and new work

Original foundation: Survival of the Best Fit by Alia ElKattan, Miha Klasinc, Gabor Csapo and Jihyun Kim. Retained VT323, office/character/scanner artwork and animation, audio, renderer/build stack and reused components. See [UPSTREAM.md](UPSTREAM.md), [ASSETS.md](ASSETS.md) and the font notice.

New work: Hire & Seek identity and Scout logo, Indian-city scenario, seeded disjoint pools, corrected model adapter, real metrics and tree inspector, targets and pause logic, investigation, paid repair experiments, locked final evaluation, computed receipt, persistence, exports, tests and teaching documentation. LinkeDOM 0.18.12 is a development-only DOM test dependency; it is not shipped in the runtime bundle.
