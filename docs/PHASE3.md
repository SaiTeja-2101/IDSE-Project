# Phase 3: Data and decision-tree foundation

The shared engine in `game-source/public/game/learning/` generates the applicant pools, fits Scout's tree, explains decisions, calculates reports, and preserves model snapshots. Phase 4 has now connected it to the active office and scanner flow, with skill out of 100, experience in years, academy, city, and six explicit player choices. The legacy adapters described below remain attributed source but no longer control the active route.

## Data

`createSession(20261030)` generates six separate, frozen pools:

| Pool | Size | Cities |
| --- | ---: | --- |
| Historical | 160 | 120 Bengaluru, 40 Chennai |
| Onboarding | 6 | 3 per city |
| Introductory | 12 | 6 per city |
| Expansion | 80 | 60 Bengaluru, 20 Chennai |
| Audit | 80 | 40 per city |
| Final | 200 | 100 per city |

Each record has `id`, `name`, `spriteGroup`, `city`, `academy`, `skill`, `experience`, `historicalDecision`, `assessedReady`, `playerDecision`, and `pool`. IDs include seed, pool, city, and index. Independent named random streams generate ability, academy, names, and ordering. Animations cannot change the data by consuming randomness.

Readiness means skill at least 60 and experience at least 1. Historical shortlisting additionally requires Bengaluru or Central Academy. A player's answer is separate and initially `null`.

Academy is assigned independently of ability. The archives have exactly 90% Central Academy in Bengaluru and 10% in Chennai. Onboarding includes both academies within each city and three ready applicants overall. The other stratified pools share ability profiles across cities and balance readiness within each city.

## Model

```js
import {createSession, trainModel, predictApplicant, evaluateModel,
    buildTreeView, withModelSnapshot} from './learning';

let session = createSession(20261030);
const original = trainModel(session.pools.historical);
session = withModelSnapshot(session, original);
const decision = predictApplicant(original, session.pools.introductory[0], 0.5);
const tree = buildTreeView(original, 0.5);
const audit = evaluateModel(original, session.pools.audit, 0.5);
```

Training accepts historical, expansion, and explicitly labelled onboarding records. Audit, introductory, and final pools are rejected, as are duplicate IDs and missing player answers.

`configuration.features` selects from skill, experience, academy, city in that stable order. Central Academy and Bengaluru encode as 1; City Academy and Chennai as 0. An empty feature subset produces one leaf with the actual label rate.

`configuration.labelSource` is `historical` or `assessed`. Historical mode uses archive decisions and explicit player choices for onboarding. Assessed mode uses independent readiness labels. The snapshot names its active source.

Fitting uses Gini, depth three, and `minNumSamples: 5`. A fully single-class dataset gets an explicit constant snapshot with its real label. Snapshots contain plain frozen objects that can be serialised. The first model remains the immutable original while later fits replace the current model. Final locking prevents replacement.

Explanations follow the fitted tree's exact `<` and `>=` branches. Leaf support and positive-label rates come from routed training records. A rate at or above the selected threshold means Shortlist. See [ML_CART.md](ML_CART.md) for the small library compatibility repair and its retained licence.

## Reports and observed outputs

Reports contain predictions, confusion counts, overall accuracy, city-specific qualified shortlist rates, and opportunity gap. Rates remain unrounded. Missing denominators return `null`, to be displayed as “Not available.” Assessment reports say **Screening accuracy**. Historical-label reports say **Match to past hiring decisions** and do not call historical positives “ready.”

For the development seed, an archive-only model on the audit pool produced 75% screening accuracy, with qualified shortlist rates of 100% in Bengaluru and 0% in Chennai. A model trained on independent assessments with skill and experience produced 100% audit accuracy and qualified shortlist rates of 100% in both cities. These are observed outputs for that seed and those configurations. No runtime code uses these numbers to choose models or change results.

## Retained-screen cleanup

- Removed substitute statistics and minimum 5% bar widths. Real zeros stay zero; unavailable values have text.
- Recorded explicit rejections. Manual summaries include actual accept/reject events only.
- Stored actual predicted CVs for automated summaries without rewriting historical labels.
- Removed story-driven model rejection/retraining, canned player decisions, inferred feature preferences, and forced rejection of the inspection candidate.
- Aligned the compatibility adapter's training and prediction feature indices and row shapes.
- Made the inspection message a review of Scout's choice without assuming rejection.
- Retained the bounded local event log from Phase 1. No original analytics account is used.

## Verification

`node --test tests/phase3.test.cjs` runs eleven checks covering deterministic disjoint pools; city, readiness, and academy balance; readiness boundaries; label sources; training leakage; all sixteen feature masks; actual fitted questions; split equality; routed support; single-class models; threshold ties; exact metrics; missing denominators; serialisation; immutable snapshots; the library repair; and legacy statistics.

The loopback preview test was excluded from the combined checks because this session previously returned `EACCES`. The Phase 2 browser review remains open. No new browser walkthrough is claimed.

On 2026-10-30, `npm run build` compiled the website and game successfully. `node --test --test-skip-pattern='local preview' tests/*.test.cjs` passed all twenty selected checks after the build.
