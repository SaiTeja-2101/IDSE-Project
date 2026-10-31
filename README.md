# Hire and Seek

> **You hire. It learns.**

A story-driven browser game about training an AI, investigating its decisions, and discovering how data shapes who gets an opportunity.

| Item | Decision |
| --- | --- |
| Game | **Hire and Seek** |
| Tagline | **You hire. It learns.** |
| AI assistant | **Scout** |
| Fictional company | **Orbit Works** |
| Orange applicants | **Bengaluru** |
| Blue applicants | **Chennai** |
| Audience | Beginners with no coding or machine learning experience |
| Session | Approximately 12–15 minutes; self-paced |
| Platform | Single-player browser game, designed first for laptops |
| Foundation | An adaptation of **Survival of the Best Fit** |

## Project status

**All six chapters are connected.** Shortlist 3, 5, then 8 people across three rounds. Train Scout, compare the effect of company records, inspect real tree paths, spend credits on repairs, and test the locked result on 200 fresh CVs. Download or print the computed audit receipt. Progress saves on this browser and can be resumed. All counts, predictions and endings are calculated. Browser visual/audio checks and genuine beginner playtest evidence are still pending. See [delivery notes](docs/DELIVERY.md), the [rubric map](docs/RUBRIC.md) and the [playtest kit](docs/PLAYTEST.md).

The source import has independent history on `hire-and-seek`. The retained build is verified with Node **22.15.0** and npm **10.9.2**. See [baseline verification](docs/BASELINE.md), [upstream provenance](docs/UPSTREAM.md), and [asset inventory](docs/ASSETS.md).

### Run the game

```bash
npm run setup
npm run dev
```

Open **http://127.0.0.1:4000/game/** to play or **http://127.0.0.1:4000/** for the landing page. Keep that terminal running. Press Ctrl+C to stop it. The layout adapts to laptops, tablets and phones, including portrait screens.

Other verified commands:

```bash
npm run build
npm test
npm run check:assets
npm run preview
```

`preview` serves the built output on loopback port 4000 without rebuilding. Stop `dev` before using it, or choose another port with `PORT`. The test suite includes a loopback HTTP test, so a restricted execution sandbox must permit local network access.

See [Phase 2 notes](docs/PHASE2.md) and [TODO.md](TODO.md) for what is ready and what is still planned.

## 1. The game in one paragraph

You become a recruiter at Orbit Works. After screening a few applicants yourself, you train Scout using your decisions and the company's historical records. Scout looks efficient, but an audit raises questions about whom it rejects. You inspect real decision-tree paths, compare applicants, spend a limited research budget on repairs, and retrain the model. A final recruitment drive tests your chosen system on unfamiliar applicants. The ending depends on measured results, not a predetermined moral outcome.

**The question that drives the story:**

> Did Scout learn who could do the job, or who Orbit Works used to hire?

## 2. Learning goals

### Main concept

**Algorithmic bias caused by biased training labels and proxy features.**

A model can reproduce historical decisions accurately while learning patterns that are unsuitable for identifying capable applicants. The player must discover this through evidence and experimentation.

### Supporting concepts

| Concept | Beginner explanation | Where it appears |
| --- | --- | --- |
| Supervised learning | A model learns from examples paired with answers | Chapters 1–2: decisions become labels and train Scout |
| Features and labels | Features describe an applicant; a label is the answer used for training | Applicant cards and the training archive |
| Biased labels | Previous decisions may contain unfair or misleading patterns | Chapters 2–3: past hiring versus independent assessments |
| Decision trees | A model classifies examples by following learned questions | Chapter 3: the interactive tree inspector |
| Proxy features | One detail can carry a pattern associated with another | Chapters 3–4: academy can remain a shortcut after city is hidden |
| Group-level evaluation | One overall score can hide uneven errors | Audit reports for Bengaluru and Chennai |
| Generalization | A useful repair should work on unfamiliar examples | Chapter 5: untouched final applicants |
| Validation versus final testing | Development feedback helps choose a model; a separate final evaluation checks it | Workshop audit batch versus recruitment-day batch |

### Observable learning objectives

After playing, a learner should be able to:

1. Distinguish a previous hiring decision from evidence that someone can do the job.
2. Follow an applicant through a decision tree and describe the questions used.
3. Explain why hiding a city does not necessarily remove a related shortcut.
4. Compare qualified-applicant shortlist rates across two groups.
5. Choose a repair using evidence and check whether it helps on new applicants.

The game introduces terminology after the corresponding experience. Reflection questions support assessment; the main activity is not a quiz.

## 3. World, applicants, and story rules

- **Orbit Works** is fictional. Its historical recruitment process favours Bengaluru applicants.
- **Scout** is an eager assistant that learns the patterns supplied to it. Its behaviour is inspectable and changeable.
- Retain the original female applicant sprites and animations. Orange represents Bengaluru; blue represents Chennai.
- Both cities contain a comparable range of abilities. City, sprite colour, name, and gender do not determine job readiness.
- Two fictional academies, **Central Academy** and **Riverside Academy**, provide a possible proxy. Neither academy determines ability in the simulated world.
- The story concerns this fictional employer's dataset; it makes no claim about real applicants, companies, cities, or academies.

### The controlled job-readiness rule

For the teaching simulation, an applicant is assessed as ready when:

```text
practical skill >= 60 out of 100
AND relevant experience >= 1 year
```

This deliberately simple rule makes the learning exercise inspectable. It is the data generator's assessment rule, not a replacement for model training. Scout must learn its own splits from the labels available to it.

Real job performance is more complex; the final explanation identifies this simplification.

## 4. End-to-end player journey

### Chapter 1: Your First Day

**Target time:** 3–4 minutes.

Reuse the animated office across three rounds: First day (6 available CVs, no timer, shortlist target 3), Business picks up (10 CVs, 45 seconds, target 5), and Hiring rush (14 CVs, 45 seconds, target 8). There is one game mode. Targets measure workload and do not define readiness. Missing a target does not block progression.

Each CV contains:

- Name and city.
- Practical skill score, 0–100.
- Relevant experience, 0–5 years.
- Academy.

Use bars for skill and experience, with text labels for academy and city. Do not turn academy or city into apparent ability scores.

The player explicitly selects **Shortlist** or **Pass** for each reviewed applicant. Each round ends when the shortlist target is reached, its CVs are reviewed, or its clock expires. Save only explicit choices. Unreviewed applicants remain unlabelled and are excluded from fitting. Pause freezes the deadline clock. Switching tabs pauses the game until the player resumes.

**Learning moment:** Your decisions can become training data.

**Exit condition:** Three rounds completed, with three to thirty explicit labels saved. Shortlisting everyone completes the targets in sixteen choices; timeouts can produce fewer examples. All counts come from the actual choices.

### Chapter 2: Meet Scout

**Target time:** 1–2 minutes.

First train Scout on the player's saved choices alone. Reuse the training animation, scanner, and automated hiring scene to screen the introductory batch. Explain that this is a small training set; if it contains only one answer, show a correctly labelled constant model.

Then explicitly add 160 historical records and refit using those records plus the same player choices. Keep the player model and save the company model as the immutable baseline for later repairs. Screen the exact same introductory CVs with both versions and calculate changed decisions, including zero when appropriate.

The dashboard says **“Match to past hiring decisions.”** Calculate this against historical labels. Do not present it as job-readiness accuracy.

Introduce the tree in plain language: Scout has learned a sequence of questions from the examples.

**Learning moment:** Agreement with previous decisions is not the same as identifying capable applicants.

**Exit condition:** The model is trained and the introductory batch has been screened.

### Chapter 3: Something Doesn't Add Up

**Target time:** 2–3 minutes.

Open an investigation through an inbox message. Select a real qualified applicant whom the current model rejected. If no suitable rejection exists, use a routine audit message; never invent a mistake.

The player receives **eight research credits**. Inspecting an independent assessment costs one credit. Require two distinct inspections to introduce evidence gathering, leaving six credits for repairs.

The investigation desk displays:

- The selected applicant's CV and Scout's decision.
- An independently assessed readiness result, when inspected.
- A comparable applicant.
- Relevant training examples.
- The actual learned decision tree.

#### Decision-tree interaction

Selecting an applicant highlights its path through the model:

```text
Applicant's values
    -> learned question
    -> matching branch
    -> next question
    -> shortlist/pass leaf
```

Each highlighted question shows the feature, threshold or category comparison, and the applicant's value. The leaf shows supporting training-example counts and the positive-label rate.

The questions must come from the trained model. Never draw a convenient explanation unrelated to the prediction.

After the two inspections, present a report for an independent **80-applicant audit batch**. Show both overall screening results and qualified-applicant shortlist rates for Bengaluru and Chennai.

**Learning moments:** Inspect learned rules; distinguish labels from evidence; notice that a related characteristic can act as a shortcut.

**Exit condition:** Two assessment inspections completed and the audit report acknowledged.

### Chapter 4: The Repair Workshop

**Target time:** 3–4 minutes.

Extend the laboratory interface with four purchasable interventions:

| Intervention | Cost | Actual operation |
| --- | ---: | --- |
| Hide city | 1 | Remove city from the feature vector |
| Hide academy | 1 | Remove academy from the feature vector |
| Expand the archive | 2 | Add 80 historical records generated by the same historical process |
| Commission independent assessments | 4 | Replace the active training records' labels with assessed readiness |

Independent assessment applies to the selected archive and all explicitly reviewed player applicants from the three rounds. It never adds unreviewed, introductory, audit, or final-evaluation applicants to training.

The player can undo workshop purchases and receive refunds before deployment. Earlier inspection costs stay spent. Charge each selected intervention once, and reject purchases exceeding the remaining budget.

Add a free **strictness slider**, from 10% to 90% in 5-point steps, initially 50%. It adjusts the positive-label-rate cutoff for shortlisting. Explain that this is support from the training examples, not calibrated certainty about someone's ability.

Each experiment must retrain and update the tree, audit predictions, metrics, and budget together. Record the configuration and results in an experiment log.

Let the player compare the original and current models on the audit batch. Show contextual feedback only when the calculated results support it. For example, say that removing city left predictions unchanged only if they actually stayed unchanged.

**Learning moments:** More data is not automatically better data; a hidden feature may have a proxy; better labels can change learned behaviour; indiscriminate shortlisting has costs.

**Exit condition:** The player commits an affordable configuration and threshold.

### Chapter 5: Recruitment Day

**Target time:** 1–2 minutes.

Lock the model and evaluate **200 fresh applicants**. The player has not seen their assessment results during development.

Reuse the conveyor, scanner, characters, and doors. Animate a representative portion of the batch while computing all results. Supply skip/replay controls so animation never becomes a waiting task.

Evaluate the original and repaired models on the same final batch for a valid before/after comparison. Final results must never be used to choose between models or revise the workshop configuration.

**Learning moment:** A repair needs to work on unfamiliar examples.

**Exit condition:** All final predictions and metrics are available.

### Chapter 6: Your Audit Receipt

**Target time:** 1–2 minutes.

Award one star for each condition, using unrounded metric values:

1. **Screening quality:** At least 85% of final decisions agree with assessed readiness.
2. **Qualified applicants reached:** At least 75% of ready applicants in each city are shortlisted.
3. **Opportunity gap:** The difference between those two rates is at most 15 percentage points.

The opportunity check passes only when conditions 2 and 3 both pass.

| Screening-quality check | Opportunity check | Ending |
| --- | --- | --- |
| Pass | Pass | **Trust Earned** |
| Pass | Fail | **A Problem Beneath the Numbers** |
| Fail | Pass | **The Unchecked Shortlist** |
| Fail | Fail | **Recruitment Recalled** |

Present the ending through company messages and a report. Do not declare the player personally biased or claim that these checks establish universal fairness.

The **Audit Receipt** includes original/repaired results, label source, retained features, threshold, spending, stars, and experiment history. Display counts with percentages. Unspent credits are an efficiency result, separate from the three stars.

Finish with a short explanation and two reflection prompts. Export and printing are available here.

**Replay rule:** A new complete playthrough creates a new session and fresh data pools. Do not let the player tune against a final batch whose answers have already been revealed.

## 5. Dataset design and model behaviour

### Candidate record

```text
id, name, spriteGroup, city, academy,
skill, experience,
historicalDecision, assessedReady,
playerDecision (when supplied), pool
```

Keep the different label meanings explicit. The player-facing text must identify the active label source.

### Separate, reproducible pools

| Pool | Size | Purpose |
| --- | ---: | --- |
| Historical training | 160 | Initial archive; 120 Bengaluru and 40 Chennai |
| Player onboarding | 6 | Six distinct applicants and their explicit player labels |
| Business picks up | 10 | 45-second manual round; stop at 5 shortlists; explicit labels only |
| Hiring rush | 14 | 45-second manual round; stop at 8 shortlists; explicit labels only |
| Introductory screening | 12 | Show automated predictions without changing training |
| Historical expansion | 80 | Optional archive purchase; same 75/25 city mix |
| Audit | 80 | Workshop evaluation; 40 applicants per city |
| Final evaluation | 200 | Locked final test; 100 applicants per city |

Audit and final pools contain equal ready/not-yet-ready counts within each city. Initial and expansion archives also contain both readiness classes within each city.

Use a seeded random generator and independent named seed streams for the pools. Default development seed: **20261030**. IDs are unique across pools, and rendering must not consume the data-generation random stream.

The onboarding set has three applicants per city, varied academies, and three ready/three not-yet-ready applicants overall. The introductory batch is likewise balanced across cities and contains both classes.

### Historical bias and proxy construction

For the initial scenario, Central Academy is common among Bengaluru applicants and uncommon among Chennai applicants: approximately 90% versus 10%. Generate the academy association separately from ability.

The historical decision process is:

```text
historically shortlisted = assessed ready
                          AND (city is Bengaluru OR academy is Central Academy)
```

This is the deliberately biased process being imitated, not Scout's hard-coded prediction rule. Model predictions must still come from training a classifier on the active records and labels.

Preserve comparable ability distributions across cities through stratified generation. Include skill/experience boundary cases in development fixtures so readiness and model behaviour can be checked precisely.

### Decision tree

Retain the existing `ml-cart` integration, initially pinned to the inspected **1.0.8** version. The application uses a documented compatibility copy that fixes class counting in positive-only branches; see [ML_CART.md](docs/ML_CART.md). Use Gini splitting, maximum depth three, and `minNumSamples: 5`.

`minNumSamples` is a stopping rule; it does not guarantee a minimum of five examples in every leaf.

Use a stable feature order: skill, experience, academy, city. Feature removal must update both the training encoder and the explanation's feature-index mapping.

The inspected library routes values with **less than** versus **greater than or equal to**. Match those exact comparisons in the inspector. Derive leaf counts and positive-label rates by routing training examples through the fitted tree. Define shortlisting consistently as rate greater than or equal to the selected threshold.

Provide explicit handling for a single-class training set. Return a constant model with the real class label rather than relying on class-index assumptions.

### Shared internal interfaces

```text
createSession(seed) -> separate candidate pools and initial state
trainModel(trainingRecords, configuration) -> modelSnapshot
predictApplicant(modelSnapshot, applicant, threshold)
    -> decision, positiveLabelRate, leafSupport, decisionPath
evaluateModel(modelSnapshot, applicants, threshold)
    -> overallMetrics, cityMetrics
buildTreeView(modelSnapshot) -> displayable nodes and branches
exportSession(session) -> anonymous downloadable report
```

There is no public backend API. Visual components, reports, and narrative all consume these shared results rather than performing their own competing calculations.

### Metrics

```text
Accuracy = correct decisions / all decisions

Qualified-applicant shortlist rate for a city
    = ready applicants shortlisted / all ready applicants in that city

Opportunity gap
    = absolute difference between the two city rates
```

Retain true/false positive and true/false negative counts internally. Explain them in ordinary language in the main game. Show unavailable denominators as “Not available,” never fabricated zero or success.

## 6. Design and asset plan

### Visual identity: Midnight Office

Preserve the upstream retro office aesthetic and bundled **VT323** font.

| Role | Colour |
| --- | --- |
| Main navy | `#142D4E` |
| Teal accent | `#2BB3A3` |
| Cream paper | `#F6F1E8` |
| Pale mint background | `#E2F1EC` |
| Amber highlight | `#F0B84B` |
| Main text | `#1B2939` |
| Error accent | `#B64450` |

Replace pink theme backgrounds and shadows in both Sass and Pixi drawing constants. Character orange/blue colours remain city identifiers. Test foreground/background combinations for readable contrast.

### Layout

- Top strip: chapter, progress, credits, pause, and sound.
- Main stage: the retained animated office or laboratory.
- Windows: CV, inbox, investigation, workshop, and results.
- Investigation: candidate comparison beside a readable, pannable tree.
- Workshop: intervention cards beside live audit feedback.
- Results: before/after metrics, stars, ending, and receipt actions.

Use VT323 at readable sizes, aiming for 22px body copy on desktop. Keep messages short and reveal one interaction at a time. Use labels and icons together; colour alone never communicates a decision.

### Assets

| Asset | Plan |
| --- | --- |
| Original female characters and sprite sheets | Retain animations and corresponding JSON frame metadata |
| Office, scanner, conveyor, doors, servers | Reuse through the existing scene components |
| CVs, file icons, desktop windows | Reuse and update labels/data |
| Existing sound effects and ambience | Retain with optional audio and graceful loading failure |
| VT323 font | Bundle locally and retain applicable font notice |
| Scout | Adapt the existing machine with a new nameplate and status/expression panel |
| Tree nodes, arrows, evidence stamps | New SVG/HTML/CSS interface assets |
| Orbit Works branding and favicon | New typographic/vector assets |
| Audit Receipt | Print-friendly HTML/CSS and JSON export |

Maintain a manifest recording each asset's source, use, modifications, and applicable notices. New image generation is not necessary for the first version. Any baked-in colours requiring later artwork edits must be inspected before modification.

### Accessibility and runtime behaviour

Support keyboard interaction, visible focus, meaningful labels, pause, mute, and reduced motion. The first round is untimed; later rounds have a pausable 45-second deadline. The layout supports desktop, tablet and portrait phone use. Final responsive and touch-device checks remain pending.

An audio failure must not prevent the game starting. An essential asset failure must display an actionable error, not leave a blank canvas.

## 7. Architecture, build, and persistence

### Retain the upstream application

The source is divided into `game-source/`, `website-source/`, and generated `dist/`. Keep PixiJS, Machina, Pug, Sass, Browserify, and Gulp for this adaptation.

Reuse the office, scanner, character, CV, dataset, conversation, and endgame components. Extend the state machine into:

```text
Homepage -> Briefing -> Manual Decisions -> Training -> Automated Demo
      -> Investigation -> Workshop -> Final Evaluation -> Results -> Debrief
```

Each scene owns and cleans up its listeners, timers, animation references, and overlays. Revisiting a screen must not duplicate handlers or purchases.

### Known upstream integration work

- Make player decision labels consistent; the inspected training code uses different employment field names in different places.
- Replace inferred feature preferences with explicit configuration and consistent feature indexing.
- Fix preprocessing shapes so training, prediction, and explanation use identical encodings.
- Replace fixed substitute reporting values with calculated results.
- Remove final-test-driven model fallback/selection logic.
- Replace the original analytics integration and identifier with local-only session logging.
- Ensure build streams finish before the build reports success, and surface failures accurately.
- Declare required build dependencies explicitly and produce reproducible lockfiles.

These changes require model/metric tests as well as browser checks; a successful animation alone is insufficient.

### Developer commands

The following root interface is implemented and verified for the retained baseline:

```bash
npm run setup
npm run dev
npm run build
npm test
```

- `setup`: install the website/game dependencies from their checked-in lockfiles.
- `dev`: build the website shell and start the retained game development server, normally on port 4000.
- `build`: build website then game into the shared `dist/` output.
- `test`: run deterministic model, metric, budget, and state checks.

`npm run preview` serves the existing build through a dependency-free local HTTP server. `npm run check:assets` checks output resources, sound paths and sprite-sheet references. `npm run package` rebuilds and creates a source-plus-static-output ZIP with serving instructions and SHA-256 manifests in `artifacts/submission/`. Tests cover the engine, budgets, outcomes, persistence and the six-chapter DOM flow. LinkeDOM is a development-only test dependency. Real browser rendering/audio and classroom playtests remain separate checks.

### Save, resume, and export

Use a versioned browser-local save under `hire-and-seek:v1`. Store the seed, chapter, player decisions, inspected IDs, budget, interventions, threshold, immutable baseline, active model, and experiment log.

Offer Continue, Restart, and workshop Undo. If storage is unavailable, continue in memory. If a save is incompatible or corrupt, explain it and offer a fresh session rather than silently using partial state.

Exports contain the anonymous session ID, seed, decisions on fictional applicants, configuration, metrics, stars, ending, and reflections when supplied. No real applicant data or account is required. Keep full final-test answers hidden until final evaluation completes.

Deliver both source and the rebuilt static game. Local use must not depend on external AI services; document serving the static output through a local web server rather than assuming `file://` loading works.

## 8. Provenance and fresh Git history

Adapt [Survival of the Best Fit](https://github.com/survivalofthebestfit/survivalofthebestfit) at inspected revision:

```text
ecf9bee80dd4889a8960c5a987783f37fd09aa55
```

Original creators: **Alia ElKattan, Miha Klasinc, Gabor Csapo, and Jihyun Kim**.

The inspected game and website package manifests declare MIT. Preserve upstream notices and verify separate font, sound, and artwork requirements; do not assume every bundled asset has an identical license solely from package metadata.

Import source through a temporary clone, excluding its `.git` directory. Keep the assignment workspace's existing empty Git repository and begin fresh assignment history on `hire-and-seek`. Do not rewrite the upstream repository or remove creator credits.

Clearly distinguish:

- **Retained work:** original UI structure, font, scenes, artwork, animation, and reusable components.
- **Our additions:** new identity, palette, story, seeded scenario, unified training/evaluation, tree inspector, repair workshop, computed reports/endings, persistence, tests, and learning evidence.

Any temporary checkout cleanup must verify its resolved location first. Never delete or replace the workspace's `.git` directory as part of the import.

## 9. Verification and rubric evidence

| Area | Acceptance evidence |
| --- | --- |
| Concept correctness | Clear objectives, explicit label meanings, valid tree explanations, and separate final evaluation |
| Gameplay | Player-controlled decisions, investigation costs, interventions, feedback, and outcomes |
| Computation | Real fitted trees; no fixed success statistics or predetermined endings |
| Reliability | Complete playable journey, clean transitions, working restart/resume/export |
| Documentation | README, phased TODO, how-to-play guide, model/data explanation, and provenance |
| Learning evidence | Genuine beginner playtests, reflections, and at least one resulting improvement |

### Required automated and manual scenarios

- Identical seeds and choices reproduce results.
- Dataset IDs are disjoint and no audit/final records enter fitting.
- Feature removal affects training, inference, and explanation consistently.
- Label repair changes only the intended training label source.
- Tree paths match classifier comparisons, including exact threshold boundaries.
- Constant-label fixtures retain the correct class.
- Confusion counts, denominators, rates, and star boundaries are correct.
- Always-shortlist and always-pass policies cannot earn three stars on the balanced final batch.
- All four endings follow computed checks.
- Undo refunds only workshop purchases; repeated clicks do not double charge.
- Final deployment locks the configuration and hides test feedback until evaluation.
- Save/resume, new-session replay, exports, keyboard use, and reduced motion work.
- Missing optional sound does not block the game; required asset failures are visible.

### Beginner playtests

Invite three to five peers with little or no coding experience. Record their actual decisions, difficulties, completion time, explanations, and feedback. Mark evidence as pending until those sessions happen.

Ask before and after:

> If an AI matches previous hiring decisions very closely, does that mean it identifies good employees? Explain.

Check transfer with a second scenario: a recycling classifier learned from photos in which object category was associated with background colour. Ask what examples the learner would collect to investigate that shortcut.

Report observed understanding honestly. A successful game score alone is not proof of understanding. Record at least one concrete revision made in response to playtest evidence.

## 10. Definition of done

The assignment is ready when a beginner can finish the six chapters, inspect Scout's real rules, test a repair, and explain why fresh examples matter; the build and meaningful tests pass; the documentation distinguishes original and adapted work; and genuine playtest evidence is included.

Development order, task status, and phase-specific exit checks are maintained in [TODO.md](TODO.md).
