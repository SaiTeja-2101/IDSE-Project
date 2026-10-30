# Hire and Seek — Phased Implementation Checklist

> **You hire. It learns.**

**Companion specification:** [README.md](README.md)

## Status and working rules

The planning documents are created. The upstream repository has been inspected remotely, but it has not yet been imported into this workspace. No playable build, application tests, deployment, or peer playtests are complete.

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

## Phase 0 — Import the upstream source safely

**Goal:** Begin from the real game while giving the assignment its own Git history.

- [ ] Recheck the workspace status before importing; preserve any files created since planning.
- [ ] Clone `survivalofthebestfit/survivalofthebestfit` into a temporary checkout.
- [ ] Check out inspected revision `ecf9bee80dd4889a8960c5a987783f37fd09aa55`.
- [ ] Import working files without the upstream `.git` directory.
- [ ] Preserve the assignment workspace's Git repository and these two documents.
- [ ] Preserve the upstream README separately as provenance material instead of overwriting this README.
- [ ] Create branch `hire-and-seek` and a fresh assignment baseline commit when appropriate.
- [ ] Confirm no upstream commits appear in the assignment's history and no upstream push remote is accidentally used.
- [ ] Preserve existing license metadata and copyright notices.
- [ ] Verify notices for the VT323 font, sound, artwork, and dependencies; record unresolved items accurately.
- [ ] Record source URL, revision, creators, and imported components in the credits/provenance documentation.
- [ ] Verify the resolved temporary path before any checkout cleanup; never remove the workspace `.git` directory.

**Exit gate:** Source and assets are present, planning documents survive, provenance is recorded, and assignment history does not contain upstream commits.

## Phase 1 — Establish a reproducible original build

**Goal:** Make the retained application run before changing its behaviour.

- [ ] Confirm the available Node/npm runtime and record the supported version after validation.
- [ ] Install game and website dependencies and check in reproducible lockfiles.
- [ ] Keep PixiJS, Machina, Pug, Sass, Browserify, and Gulp.
- [ ] Pin the initially inspected `ml-cart` version to `1.0.8`.
- [ ] Declare directly required build dependencies rather than relying on accidental transitive availability.
- [ ] Fix JavaScript build tasks to return/await their streams and report real failures.
- [ ] Ensure asset copying succeeds without requiring unnecessary image optimisation.
- [ ] Build website output before game output into shared `dist/`.
- [ ] Add and verify root `setup`, `dev`, `build`, and `test` scripts.
- [ ] Verify local asset, sprite-sheet, font, and sound URLs.
- [ ] Capture an actual baseline screenshot and a brief scene/interaction inventory.
- [ ] Record upstream defects separately from changes introduced during adaptation.

**Exit gate:** A clean checkout can follow the documented setup and build commands, then open the retained game without a blank screen or missing essential assets.

## Phase 2 — Rebrand and reskin the retained UI

**Goal:** Preserve the recognisable office interface while giving the adaptation its own identity.

- [ ] Replace visible game names with Hire and Seek, AI references with Scout, and company references with Orbit Works.
- [ ] Add the tagline to the title screen and landing page.
- [ ] Apply the README palette to both Sass variables and Pixi drawing constants.
- [ ] Replace original pink page, training, panel, and shadow treatments; inspect baked-in image colours before changing artwork.
- [ ] Retain VT323 locally and verify text readability at normal laptop sizes.
- [ ] Retain orange/blue applicant animations and their sprite-sheet frame metadata.
- [ ] Label the applicant cities explicitly; do not rely on colour alone.
- [ ] Adapt CV layout to two ability indicators plus textual academy/city fields.
- [ ] Add chapter progress, credit count, pause, mute, and visible focus states.
- [ ] Create Scout's nameplate/status panel and Orbit Works title/favicon.
- [ ] Add reusable visual components for evidence stamps, tree nodes, and branch arrows.
- [ ] Maintain an asset manifest with sources, modifications, and notices.
- [ ] Check responsive overlay layout and contrast in all core scenes.

**Exit gate:** The title, office, CV, training, and message interfaces use the new identity while retaining the original visual language and functional controls.

## Phase 3 — Build the data and decision-tree foundation

**Goal:** Establish one consistent source of truth for training, explanation, and reporting.

### Candidate data and pools

- [ ] Implement the explicit candidate schema from the README.
- [ ] Use unique IDs and independent named random streams derived from the session seed.
- [ ] Generate 160 historical records with a 75/25 Bengaluru/Chennai mix.
- [ ] Generate six distinct onboarding applicants and a separate 12-applicant introductory screening batch.
- [ ] Generate the optional 80-record historical expansion with the same historical process.
- [ ] Generate 80 audit and 200 final applicants, balanced by city and readiness within each city.
- [ ] Keep academy association separate from ability; implement the documented proxy relationship.
- [ ] Implement assessed readiness from practical skill and relevant experience.
- [ ] Implement the documented biased historical label rule.
- [ ] Keep player decisions, historical decisions, and independent assessments in separate fields.
- [ ] Prevent rendering, animation, and narrative choices from changing candidate-generation randomness.

### Model adapter and metrics

- [ ] Implement `createSession`, `trainModel`, `predictApplicant`, `evaluateModel`, and `buildTreeView`.
- [ ] Use stable feature ordering and an explicit mapping after feature removal.
- [ ] Train with Gini splitting, depth three, and stopping parameter `minNumSamples: 5`.
- [ ] Handle one-class training sets with a correctly labelled constant model.
- [ ] Derive leaf support and positive-label rates from routed training examples.
- [ ] Match the library's exact `<` and `>=` branch behaviour.
- [ ] Apply the same threshold convention in all predictions and explanations.
- [ ] Calculate confusion counts, screening accuracy, city-specific qualified shortlist rates, and opportunity gap.
- [ ] Use unrounded values for scoring and handle missing denominators explicitly.
- [ ] Preserve immutable original and current model snapshots.
- [ ] Remove fixed substitute statistics and final-test-driven model fallback logic.
- [ ] Remove the original analytics identifier and replace tracking with a local event log.

**Exit gate:** Deterministic tests demonstrate real training, disjoint datasets, correct feature masks, matching explanation paths, and correct metrics before narrative integration.

## Phase 4 — Implement Chapters 1 and 2

**Goal:** Turn human choices into examples and make Scout's automation visible.

- [ ] Add the Orbit Works briefing without requiring technical knowledge.
- [ ] Adapt the office to six complete applicant decisions rather than the original multi-round hiring target.
- [ ] Support explicit Shortlist and Pass actions with keyboard equivalents.
- [ ] Record each decision once and prevent accidental double submissions.
- [ ] Ensure unseen applicants are never inferred to have negative labels.
- [ ] Train Scout on the selected historical records plus the six player examples.
- [ ] Save the baseline model before running the introductory batch.
- [ ] Reuse training/scanner/character animations with actual prediction outcomes.
- [ ] Display calculated agreement with historical decisions using the correct label.
- [ ] Introduce the model as learned questions, without prematurely explaining the entire mystery.

**Exit gate:** The player completes six decisions, trains Scout, and watches it screen distinct applicants through the retained scenes.

## Phase 5 — Implement Chapter 3 investigation

**Goal:** Let the player find evidence and inspect Scout's actual reasoning.

- [ ] Select an inbox complaint from a genuine model mistake when available.
- [ ] Provide a routine audit branch if there is no suitable mistake.
- [ ] Build the applicant/comparison/evidence layout using retained interface components.
- [ ] Start the eight-credit budget and charge one credit per distinct assessment inspection.
- [ ] Require two distinct inspections and avoid charging again for reopening one.
- [ ] Display assessment outcomes separately from historical hiring decisions.
- [ ] Render the trained tree with readable feature names, questions, and branches.
- [ ] Highlight the selected applicant's exact route and show its feature values.
- [ ] Show real leaf support counts and label-source descriptions.
- [ ] Support a single-leaf tree and trees that do not use city or academy.
- [ ] Display the 80-applicant audit after the inspections.
- [ ] Present counts and rates by city without inventing a discrepancy.
- [ ] Introduce the terms decision tree, label bias, and proxy only after relevant evidence appears.

**Exit gate:** Selecting an applicant produces an explanation consistent with its prediction, and the investigation changes the budget and progress correctly.

## Phase 6 — Implement Chapter 4 repair workshop

**Goal:** Let player interventions change training and measurable outcomes.

- [ ] Add Hide City for one credit.
- [ ] Add Hide Academy for one credit.
- [ ] Add Expand Archive for two credits and 80 additional historical records.
- [ ] Add Independent Assessments for four credits, replacing labels only in active training records.
- [ ] Keep the assessment intervention consistent if archive expansion is toggled afterward.
- [ ] Reject overspending, prevent duplicate charges, and show each operation's effect plainly.
- [ ] Implement workshop undo/refund while preserving earlier inspection costs.
- [ ] Add a strictness control from 10% to 90%, step 5%, default 50%.
- [ ] Retrain after configuration changes and evaluate only on the audit batch.
- [ ] Update the tree, predictions, metrics, and label-source text atomically.
- [ ] Retain original/current model comparisons and experiment history.
- [ ] Generate feedback from measured differences, including no-change and worse-result cases.
- [ ] Add a clear commit/deploy action and lock the selected configuration afterward.

**Exit gate:** Affordable interventions and threshold changes produce genuine, reproducible outcomes; experimentation is reversible before deployment and never exposes final-test feedback.

## Phase 7 — Implement Chapters 5 and 6

**Goal:** Evaluate on unseen applicants and make the ending follow the evidence.

- [ ] Run original and committed models against the same 200-applicant final pool.
- [ ] Keep assessment answers hidden until final evaluation.
- [ ] Animate a representative sequence while computing the entire batch.
- [ ] Make each animated applicant follow its computed prediction.
- [ ] Add animation skip/replay without recomputing a different batch.
- [ ] Calculate all three stars using the README thresholds.
- [ ] Derive the four endings from screening and opportunity checks.
- [ ] Show original/repaired counts, rates, label source, threshold, features, and spending.
- [ ] Build the Audit Receipt, printing view, and anonymous JSON export.
- [ ] Add the explanation of what the model learned and two short reflection prompts.
- [ ] Start a new session with fresh data for full replay; do not reopen tuning on a revealed final batch.
- [ ] Implement `exportSession` and verify export values against the displayed report.

**Exit gate:** A player reaches a computed ending, receives a consistent receipt, and can explain the result without relying on a fixed story outcome.

## Phase 8 — Persistence, accessibility, and reliability

**Goal:** Make the game usable as a classroom assignment.

- [ ] Save progress with versioned `hire-and-seek:v1` state.
- [ ] Restore chapter, seed, decisions, credits, interventions, threshold, and model snapshots consistently.
- [ ] Offer a fresh session for invalid or incompatible saves.
- [ ] Fall back to an in-memory session if browser storage is unavailable.
- [ ] Ensure scene exits dispose of event listeners, timers, and animation references.
- [ ] Verify pause, mute, reduced motion, keyboard control, and focus handling.
- [ ] Make important information available beyond sprite colour or canvas graphics alone.
- [ ] Check laptop and landscape tablet layouts, including tree navigation and long names.
- [ ] Provide clear small-screen guidance without losing progress.
- [ ] Start without optional audio if loading fails.
- [ ] Show actionable errors for essential asset failures.
- [ ] Verify there is no dependency on the original analytics account or an external AI service.

**Exit gate:** Save/resume and all chapters remain reliable through revisits, resize events, missing optional audio, and common browser-storage failures.

## Phase 9 — Verification and balancing

**Goal:** Verify correctness before documenting successful outcomes.

- [ ] Test reproducibility from identical seeds and action sequences.
- [ ] Test pairwise disjoint pool IDs and prevent audit/final records entering training.
- [ ] Test readiness boundaries at skill 59/60 and experience 0/1.
- [ ] Test all feature masks and consistent column-to-feature explanations.
- [ ] Test one-class models and exact learned-split boundary comparisons.
- [ ] Check tree traversal decisions against the model adapter on every development fixture.
- [ ] Verify historical and assessed label sources are never silently mixed in reporting.
- [ ] Test confusion counts, missing denominators, percentages, and rounding.
- [ ] Test score boundaries immediately below, at, and above 85%, 75%, and 15 percentage points.
- [ ] Test always-shortlist and always-pass policy fixtures; neither may earn three stars.
- [ ] Test all four ending combinations.
- [ ] Test budget accounting, refunds, repeated clicks, and insufficient funds.
- [ ] Test save restoration, final locking, replay freshness, and report/export consistency.
- [ ] Complete the game with several different repair configurations and record actual differences.
- [ ] Check a meaningful range of seeds and onboarding choices, including all-shortlist and all-pass onboarding.
- [ ] Confirm an affordable successful repair exists in the intended scenario and investigate failures without substituting fake metrics.
- [ ] Record real before/after screenshots and the exact tested runtime/commands.
- [ ] Run appropriate automated checks and complete one full browser walkthrough after final changes.

**Exit gate:** Meaningful checks pass, computed behaviour supports the intended lesson, and any remaining limits are documented honestly.

## Phase 10 — Peer playtesting and assignment package

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
- [ ] Finalise the how-to-play guide, learning objectives, screenshots, and rubric mapping.
- [ ] Finalise asset notices, original-author credits, and a retained-versus-new contribution summary.
- [ ] Replace planned command descriptions with setup instructions actually verified.
- [ ] Package source and rebuilt static output with documented local serving instructions.
- [ ] Update README/TODO status and identify any incomplete requirement explicitly.

**Exit gate:** The submission is runnable, attributed, documented, and backed by genuine playtest evidence. Implementation completeness alone does not close the playtest requirement.

## Evidence register

| Evidence | Current status |
| --- | --- |
| Upstream code inspection | Completed remotely during planning |
| Product identity and scenario decisions | Recorded in README and this file |
| Local upstream import | Pending |
| Reproducible original build | Pending |
| New game implementation | Pending |
| Automated application tests | Pending |
| Browser walkthrough and screenshots | Pending |
| Peer playtests and transfer explanations | Pending |
| Feedback-driven revision | Pending |
| Final runnable package | Pending |

## Final sign-off

- [ ] A beginner can complete the game without coding knowledge.
- [ ] The player can inspect the actual rules Scout learned.
- [ ] Decisions and interventions affect the real model and ending.
- [ ] Displayed statistics contain no story-enforcing substitute values.
- [ ] Final evaluation is separate from training and workshop selection.
- [ ] Applicant city/colour never determines assessed ability.
- [ ] Original work and our additions are clearly credited.
- [ ] Setup, tests, documentation, assets, and genuine learning evidence are complete.
