# Hire and Seek: Phased Implementation Checklist

> **You hire. It learns.**

**Companion specification:** [README.md](README.md)

## Status and working rules

All six chapters are connected. Phases 5 to 7 are implemented and covered by engine and DOM integration tests. Phase 8 save/resume and controller reliability are implemented. Final browser visual/audio checks and real peer playtests are pending. See [delivery notes](docs/DELIVERY.md) and the [round revision](docs/ROUND_REVISION.md).

- `[x]` means completed and supported by evidence.
- `[ ]` means planned or not yet verified.
- Work in phase order; each phase has an exit gate.
- Update this checklist when work actually passes its gate.
- Keep the upstream UI, font, animation, and assets where useful; extend the existing application.
- Never substitute fixed numbers for predictions, metrics, explanations, or endings.
- Never invent test results, user feedback, screenshots, or learning evidence.

## Locked product decisions

- [x] Game: **Hire and Seek**.
- [x] Tagline: **You hire. It learns.**
- [x] AI assistant: **Scout**.
- [x] Company: **Orbit Works**.
- [x] Orange applicant sprites: **Bengaluru**.
- [x] Blue applicant sprites: **Chennai**.
- [x] Retain the original female applicant sprites and VT323 font.
- [x] Use navy, teal, cream, mint, and amber instead of the original pink theme.
- [x] Teach algorithmic bias through labelled examples, proxy features, decision trees, repair, and evaluation.
- [x] Define a six-chapter, self-paced, approximately 12–15 minute browser experience.
- [x] Write the end-to-end README and this phased TODO.

## Phase 0: Import the upstream source safely

**Goal:** Begin from the real game while giving the assignment its own Git history.

- [x] Recheck the workspace status before importing; preserve any files created since planning.
- [x] Clone `survivalofthebestfit/survivalofthebestfit` into a temporary checkout.
- [x] Check out inspected revision `ecf9bee80dd4889a8960c5a987783f37fd09aa55`.
- [x] Import working files without the upstream `.git` directory.
- [x] Preserve the assignment workspace's Git repository and these two documents.
- [x] Preserve the upstream README separately as provenance material instead of overwriting this README.
- [x] Create branch `hire-and-seek` and a fresh assignment baseline commit when appropriate.
- [x] Confirm no upstream commits appear in the assignment's history and no upstream push remote is accidentally used.
- [x] Preserve existing license metadata and copyright notices.
- [x] Verify notices for the VT323 font, sound, artwork, and dependencies; record unresolved items accurately.
- [x] Record source URL, revision, creators, and imported components in the credits/provenance documentation.
- [x] Verify the resolved temporary path before any checkout cleanup; never remove the workspace `.git` directory.

**Exit gate:** Source and assets are present, planning documents survive, provenance is recorded, and assignment history does not contain upstream commits.

## Phase 1: Establish a reproducible original build

**Goal:** Make the retained application run before changing its behaviour.

- [x] Confirm the available Node/npm runtime and record the supported version after validation.
- [x] Install game and website dependencies and check in reproducible lockfiles.
- [x] Keep PixiJS, Machina, Pug, Sass, Browserify, and Gulp.
- [x] Pin the initially inspected `ml-cart` version to `1.0.8`.
- [x] Declare directly required build dependencies rather than relying on accidental transitive availability.
- [x] Fix JavaScript build tasks to return/await their streams and report real failures.
- [x] Ensure asset copying succeeds without requiring unnecessary image optimisation.
- [x] Build website output before game output into shared `dist/`.
- [x] Add and verify root `setup`, `dev`, `build`, and `test` scripts.
- [x] Verify local asset, sprite-sheet, font, and sound URLs.
- [x] Capture an actual baseline screenshot and a brief scene/interaction inventory.
- [x] Record upstream defects separately from changes introduced during adaptation.

**Exit gate:** A clean checkout can follow the documented setup and build commands, then open the retained game without a blank screen or missing essential assets.

## Phase 2: Rebrand and reskin the retained UI

**Goal:** Preserve the recognisable office interface while giving the adaptation its own identity.

- [x] Replace visible game names with Hire and Seek, the assistant name with Scout, and company references with Orbit Works.
- [x] Add the tagline to the title screen and landing page.
- [x] Apply the README palette to Sass and Pixi drawings.
- [x] Replace the pink page, training, panel, and shadow colors.
- [x] Keep the local VT323 font.
- [x] Keep the orange and blue applicant animations and frame files.
- [x] Add Bengaluru and Chennai labels. Color is not the only clue.
- [x] Show city and all four inputs used by the retained model on CV cards. Add the real academy field with the Phase 3 data model.
- [x] Add chapter progress, credits, pause, sound, and clear keyboard focus.
- [x] Add Scout's panel, Orbit Works name, and a new favicon.
- [x] Add reusable tree branches, tree cards, and evidence labels for later screens.
- [x] Record the new favicon and artwork source in the asset list.
- [x] Fix pause so waiting scanner animations stay paused after resume.
- [x] Align retained model city IDs with applicant colours and city labels.
- [x] Remove made-up academy labels and show the retained model's four qualification scores.
- [x] Add a Hire and Seek logo and document its generation prompt.
- [x] Pass four regression checks for pause, city consistency, CV values, and source preservation.
- [ ] Recheck responsive layout, color contrast, and all game screens in the browser.

**Exit gate:** The title, office, CV, training, and message interfaces use the new identity while retaining the original visual language and functional controls.

## Phase 3: Build the data and decision-tree foundation

**Goal:** Establish one consistent source of truth for training, explanation, and reporting.

### Candidate data and pools

- [x] Implement the explicit candidate schema from the README.
- [x] Use unique IDs and independent named random streams derived from the session seed.
- [x] Generate 160 historical records with a 75/25 Bengaluru/Chennai mix.
- [x] Generate six distinct onboarding applicants and a separate 12-applicant introductory screening batch.
- [x] Add separate ten- and fourteen-applicant manual pools for the growing workload.
- [x] Generate the optional 80-record historical expansion with the same historical process.
- [x] Generate 80 audit and 200 final applicants, balanced by city and readiness within each city.
- [x] Keep academy association separate from ability; implement the documented proxy relationship.
- [x] Implement assessed readiness from practical skill and relevant experience.
- [x] Implement the documented biased historical label rule.
- [x] Keep player decisions, historical decisions, and independent assessments in separate fields.
- [x] Prevent rendering, animation, and narrative choices from changing candidate-generation randomness.

### Model adapter and metrics

- [x] Implement `createSession`, `trainModel`, `predictApplicant`, `evaluateModel`, and `buildTreeView`.
- [x] Use stable feature ordering and an explicit mapping after feature removal.
- [x] Train with Gini splitting, depth three, and stopping parameter `minNumSamples: 5`.
- [x] Handle one-class training sets with a correctly labelled constant model.
- [x] Derive leaf support and positive-label rates from routed training examples.
- [x] Match the library's exact `<` and `>=` branch behaviour.
- [x] Apply the same threshold convention in all predictions and explanations.
- [x] Calculate confusion counts, screening accuracy, city-specific qualified shortlist rates, and opportunity gap.
- [x] Use unrounded values for scoring and handle missing denominators explicitly.
- [x] Preserve immutable original and current model snapshots.
- [x] Remove fixed substitute statistics and final-test-driven model fallback logic.
- [x] Remove the original analytics identifier and replace tracking with a local event log.

**Exit gate:** Deterministic tests demonstrate real training, disjoint datasets, correct feature masks, matching explanation paths, and correct metrics before narrative integration.

## Phase 4: Implement Chapters 1 and 2

**Goal:** Turn human choices into examples and make Scout's automation visible.

- [x] Add the Orbit Works briefing without requiring technical knowledge.
- [x] Use three rounds with 6/10/14 available CVs, shortlist targets 3/5/8, and two 45-second clocks. End each round when its target is reached, time expires, or CVs run out.
- [x] Remove the duplicate game title screen, mode choice, full name-card queue and six-chapter progress rail.
- [x] Restore original office assets and sound cues in a container-sized canvas with a stacked layout on small screens.
- [x] Move panel actions outside scrollable instructions and remove the portrait blocking screen.
- [x] Support explicit Shortlist and Pass actions with keyboard equivalents.
- [x] Record each decision once and prevent accidental double submissions.
- [x] Ensure unseen applicants are never inferred to have negative labels.
- [x] Fit the player-only tree first, then fit the company tree using the archive plus all explicitly recorded player choices.
- [x] Save the baseline model before running the introductory batch.
- [x] Reuse training/scanner/character animations with actual prediction outcomes.
- [x] Display calculated agreement with historical decisions using the correct label.
- [x] Introduce the model as learned questions, without prematurely explaining the entire mystery.
- [x] Keep unreviewed applicants unlabelled when time expires, including a completely unreviewed timed round.
- [x] Freeze logical deadline time during pause and reject choices at or beyond the deadline.
- [x] Compare both models on the same introductory IDs and calculate changed choices, including zero.
- [x] Derive training counts and report messages from the actual session.
- [ ] Complete the browser size/zoom walkthrough and listen to the sound cues when the browser access host is available. Automated checks do not prove visual or audible quality.

**Exit gate:** The player completes three hiring rounds, trains Scout first on recorded player choices and then on those choices plus the archive, and compares actual choices on the same new applicants. Goals do not block progression or define job readiness.

## Phase 5: Implement Chapter 3 investigation

**Goal:** Let the player find evidence and inspect Scout's actual reasoning.

- [x] Select an inbox complaint from a genuine model mistake when available.
- [x] Provide a routine audit branch if there is no suitable mistake.
- [x] Build the applicant/comparison/evidence layout using retained interface components.
- [x] Start the eight-credit budget and charge one credit per distinct assessment inspection.
- [x] Require two distinct inspections and avoid charging again for reopening one.
- [x] Display assessment outcomes separately from historical hiring decisions.
- [x] Render the trained tree with readable feature names, questions, and branches.
- [x] Highlight the selected applicant's exact route and show its feature values.
- [x] Show real leaf support counts and label-source descriptions.
- [x] Support a single-leaf tree and trees that do not use city or academy.
- [x] Display the 80-applicant audit after the inspections.
- [x] Present counts and rates by city without inventing a discrepancy.
- [x] Introduce the terms decision tree, label bias, and proxy only after relevant evidence appears.

**Exit gate:** Selecting an applicant produces an explanation consistent with its prediction, and the investigation changes the budget and progress correctly.

## Phase 6: Implement Chapter 4 repair workshop

**Goal:** Let player interventions change training and measurable outcomes.

- [x] Add Hide City for one credit.
- [x] Add Hide Academy for one credit.
- [x] Add Expand Archive for two credits and 80 additional historical records.
- [x] Add Independent Assessments for four credits, replacing labels only in active training records.
- [x] Keep the assessment intervention consistent if archive expansion is toggled afterward.
- [x] Reject overspending, prevent duplicate charges, and show each operation's effect plainly.
- [x] Implement workshop undo/refund while preserving earlier inspection costs.
- [x] Add a strictness control from 10% to 90%, step 5%, default 50%.
- [x] Retrain after configuration changes and evaluate only on the audit batch.
- [x] Update the tree, predictions, metrics, and label-source text atomically.
- [x] Retain original/current model comparisons and experiment history.
- [x] Generate feedback from measured differences, including no-change and worse-result cases.
- [x] Add a clear commit/deploy action and lock the selected configuration afterward.

**Exit gate:** Affordable interventions and threshold changes produce genuine, reproducible outcomes; experimentation is reversible before deployment and never exposes final-test feedback.

## Phase 7: Implement Chapters 5 and 6

**Goal:** Evaluate on unseen applicants and make the ending follow the evidence.

- [x] Run original and committed models against the same 200-applicant final pool.
- [x] Keep assessment answers hidden until final evaluation.
- [x] Animate a representative sequence while computing the entire batch.
- [x] Make each animated applicant follow its computed prediction.
- [x] Add animation skip/replay without recomputing a different batch.
- [x] Calculate all three stars using the README thresholds.
- [x] Derive the four endings from screening and opportunity checks.
- [x] Show original/repaired counts, rates, label source, threshold, features, and spending.
- [x] Build the Audit Receipt, printing view, and anonymous JSON export.
- [x] Add the explanation of what the model learned and two short reflection prompts.
- [x] Start a new session with fresh data for full replay; do not reopen tuning on a revealed final batch.
- [x] Implement `exportSession` and verify export values against the displayed report.

**Exit gate:** A player reaches a computed ending, receives a consistent receipt, and can explain the result without relying on a fixed story outcome.

## Phase 8: Persistence, accessibility, and reliability

**Goal:** Make the game usable as a classroom assignment.

- [x] Save progress with versioned `hire-and-seek:v1` state.
- [x] Restore chapter, seed, decisions, credits, interventions, threshold, and model snapshots consistently.
- [x] Offer a fresh session for invalid or incompatible saves.
- [x] Fall back to an in-memory session if browser storage is unavailable.
- [x] Ensure scene exits dispose of event listeners, timers, and animation references.
- [ ] Verify pause, mute, reduced motion, keyboard control, and focus handling.
- [x] Make important information available beyond sprite colour or canvas graphics alone.
- [ ] Check laptop and landscape tablet layouts, including tree navigation and long names.
- [ ] Provide clear small-screen guidance without losing progress.
- [x] Start without optional audio if loading fails.
- [x] Show actionable errors for essential asset failures.
- [x] Verify there is no dependency on the original analytics account or an external AI service.

**Exit gate:** Save/resume and all chapters remain reliable through revisits, resize events, missing optional audio, and common browser-storage failures.

## Phase 9: Verification and balancing

**Goal:** Verify correctness before documenting successful outcomes.

- [x] Test reproducibility from identical seeds and action sequences.
- [x] Test pairwise disjoint pool IDs and prevent audit/final records entering training.
- [x] Test readiness boundaries at skill 59/60 and experience 0/1.
- [x] Test all feature masks and consistent column-to-feature explanations.
- [x] Test one-class models and exact learned-split boundary comparisons.
- [x] Check tree traversal decisions against the model adapter on every development fixture.
- [x] Verify historical and assessed label sources are never silently mixed in reporting.
- [x] Test confusion counts, missing denominators, percentages, and rounding.
- [x] Test score boundaries immediately below, at, and above 85%, 75%, and 15 percentage points.
- [x] Test always-shortlist and always-pass policy fixtures; neither may earn three stars.
- [x] Test all four ending combinations.
- [x] Test budget accounting, refunds, repeated clicks, and insufficient funds.
- [x] Test save restoration, final locking, replay freshness, and report/export consistency.
- [x] Complete the game with several different repair configurations and record actual differences.
- [x] Check a meaningful range of seeds and onboarding choices, including all-shortlist and all-pass onboarding.
- [x] Confirm an affordable successful repair exists in the intended scenario and investigate failures without substituting fake metrics.
- [ ] Record real before/after screenshots and the exact tested runtime/commands.
- [ ] Run appropriate automated checks and complete one full browser walkthrough after final changes.

**Exit gate:** Meaningful checks pass, computed behaviour supports the intended lesson, and any remaining limits are documented honestly.

## Phase 10: Peer playtesting and assignment package

**Goal:** Supply real evidence for the documentation and learning criterion.

- [ ] Recruit three to five beginner peers with their consent.
- [ ] Record anonymous session references and completion times.
- [ ] Ask the README's pre-play question about imitating past decisions.
- [ ] Observe decision-making, investigation choices, confusion points, and use of the tree.
- [ ] Collect genuine final explanations and comments.
- [ ] Use the recycling/background-colour scenario to check transfer to a different context.
- [ ] Summarise the observed outcomes without claiming universal effectiveness.
- [ ] Make and document at least one improvement based on those observations.
- [ ] Verify the improvement and recheck affected flows.
- [x] Finalise the how-to-play guide, learning objectives, screenshots, and rubric mapping.
- [x] Finalise asset notices, original-author credits, and a retained-versus-new contribution summary.
- [x] Replace planned command descriptions with setup instructions actually verified.
- [x] Package source and rebuilt static output with documented local serving instructions. ZIP manifest and standalone serving checks passed.
- [x] Update README/TODO status and identify any incomplete requirement explicitly.

**Exit gate:** The submission is runnable, attributed, documented, and backed by genuine playtest evidence. Implementation completeness alone does not close the playtest requirement.

## Evidence register

| Evidence | Current status |
| --- | --- |
| Upstream code inspection | Completed remotely during planning |
| Product identity and scenario decisions | Recorded in README and this file |
| Local upstream import | Complete; independent root commit and provenance retained |
| Reproducible original build | Complete; Node 22.15.0 / npm 10.9.2, lockfile-based setup |
| New data, decision tree, and learning gameplay | All six chapters implemented; engine, persistence and DOM journey coverage; visual/audio and real learner evidence pending |
| Phase 2 reskin build (`npm run build`) | Passed on 2026-10-30 |
| Phase 3 data and model engine | Complete; deterministic pools, training, explanations, metrics, immutable snapshots, and legacy reporting cleanup |
| Phase 4 first shift | Three rounds, honest deadline handling, player-only and company models, and computed before/after comparison implemented |
| Automated application tests | Full npm test passes all 52 checks, including the complete six-chapter DOM journey, real models/reports, budgets, final locking, save/resume, local HTTP, audio behaviour, canvas sizing and pause. Sixty repair fixtures and 48 additional scenario runs support balancing. |
| Browser walkthrough and screenshots | Original hiring, training, automation, inspector, and mute verified; Phase 2 title opened once, full reskin review blocked by Work settings |
| Peer playtests and transfer explanations | Pending |
| Feedback-driven revision | Pending |
| Final runnable package | Built `artifacts/submission/hire-and-seek-5Iv3At.zip`; 496 files verified against its manifest, excluded metadata checked, and standalone HTTP serving passed |

## Final sign-off

- [ ] A beginner can complete the game without coding knowledge.
- [ ] The player can inspect the actual rules Scout learned.
- [ ] Decisions and interventions affect the real model and ending.
- [ ] Displayed statistics contain no story-enforcing substitute values.
- [ ] Final evaluation is separate from training and workshop selection.
- [ ] Applicant city/colour never determines assessed ability.
- [ ] Original work and our additions are clearly credited.
- [ ] Setup, tests, documentation, assets, and genuine learning evidence are complete.
