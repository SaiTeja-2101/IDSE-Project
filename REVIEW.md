# Project review guide

CS3006: Introduction to Data Science for Engineers

This guide links each part of the submission to its explanation, source code and evidence. It can be read without installing either project.

## Start here

1. Open [submission](submission/README.md) for both reports and the ResilientBite presentation.
2. For Part A, read the [ResilientBite report](submission/ResilientBite-Report.pdf), then inspect the [notebook and saved outputs](resilientbite/food_pred%20%281%29.ipynb).
3. For Part B, [play Hire & Seek](https://hireandseek-liart.vercel.app/) and follow the [classroom demo guide](game/docs/DEMO.md). The [game report](submission/Hire-and-Seek-Report.pdf) includes screenshots of the same journey.

## Part A: ResilientBite

The project predicts portions for one dish, meal and dining hall. It compares a weekly baseline with Linear Regression and Random Forest, then tests preparation rules using the same held-out demand records.

| What to review | Where to look |
| --- | --- |
| Data preparation, exploration, date splits and model fitting | [Analysis notebook](resilientbite/food_pred%20%281%29.ipynb) |
| Original input records | [Master dataset](resilientbite/resilientbite_master_extended.csv) |
| Practice rows with intentional cleaning errors | [Cleaning practice CSV](resilientbite/resilientbite_cleaning_practice.csv) |
| Baseline and model comparison | [Model results](resilientbite/model_comparison.csv) |
| Settings selected using validation data | [Validation tuning](resilientbite/validation_tuning.csv) |
| Individual test predictions and grouped errors | [Predictions](resilientbite/test_predictions.csv), [grouped errors](resilientbite/test_error_by_group.csv) |
| Excess and unmet portions under each preparation rule | [Preparation comparison](resilientbite/preparation_policy_comparison.csv) |
| App input validation, training and daily forecasts | [forecast.py](resilientbite/forecast_app/forecast.py) |
| Streamlit interface | [app.py](resilientbite/forecast_app/app.py) |
| Android app to install | [Submitted APK](submission/ResilientBite.apk), [Android guide](resilientbite/forecast_app/ANDROID.md) |
| Report source and original findings images | [LaTeX and image guide](resilientbite/ResilientBite%20LaTeX/README.md) |
| Reproduction commands and the dated app demo | [ResilientBite README](resilientbite/README.md#reproduce) |

The master dataset's collection method is not documented. The cleaning practice file is a separate exercise. The preparation comparison is a simulation using recorded demand, so it does not establish measured food-waste savings in a kitchen.

## Part B: Hire & Seek

The player creates hiring labels, trains Scout, checks one decision, tries a repair and compares results on new CVs. The current game logic starts in the `learning` folder below.

| What to review | Where to look |
| --- | --- |
| Rules and learning objectives | [Player guide](game/README.md#how-to-play), [learning objectives](game/README.md#learning-objectives) |
| Full game flow and separate data batches | [Game design](game/docs/GAME_DESIGN.md) |
| Fictional candidates, archives and qualification rule | [candidates.js](game/game-source/public/game/learning/candidates.js) |
| Features, training labels, fitted CART tree and predictions | [model.js](game/game-source/public/game/learning/model.js) |
| Copy test, repairs and final comparison | [scoutStory.js](game/game-source/public/game/learning/scoutStory.js) |
| Error counts and city-level results | [metrics.js](game/game-source/public/game/learning/metrics.js) |
| Screen interactions and ending walkthrough | [Interface controller](game/game-source/public/game/components/interface/scout-story/scout-story.js), [walkthrough](game/game-source/public/game/components/interface/scout-story/run-walkthrough.js) |
| Automated checks | [Tests](game/tests/), [verification notes](game/docs/DELIVERY.md) |
| Peer comments and changes after feedback | [Playtest evidence](game/docs/PLAYTEST_EVIDENCE.md) |
| Rubric criteria and supporting evidence | [Rubric map](game/docs/RUBRIC.md) |
| Editable report and screenshots | [Report source guide](game/report/README.md) |

The applicants and work test are fictional. The report documents one reproducible run with seed 17. Different player choices can change the fitted model and final counts. A fixed qualification rule provides the answer for this teaching exercise; Scout still trains a real decision tree from the selected examples and labels.

## Repeat the checks

For Hire & Seek, use Node.js 22 and npm 10. Run these commands from the repository root:

```sh
npm run setup
npm run build
npm test
npm run check:assets
npm run preview
```

Open `http://127.0.0.1:4000/game/` after starting the preview. See the [ResilientBite setup instructions](resilientbite/README.md#reproduce) for the Python notebook and app, which run separately.

## Files to edit and files to submit

Edit game code under `game/game-source/` and website code under `game/website-source/`. `game/dist/` is a generated build. Edit the reports in their LaTeX folders, then rebuild their PDFs. The notebook generates the saved result CSVs and the cleaning practice CSV. Keep the master dataset unchanged when rerunning the analysis.

Use the documents and Android APK in [submission](submission/README.md) as the final hand-in copies. Report PDFs also remain in their project folders for local use and packaging. On Windows, `npm run package` creates the combined source ZIP and a checksum under `artifacts/submission/`.
