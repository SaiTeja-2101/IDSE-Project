# CS3006: Introduction to Data Science for Engineers

This repository contains both parts of the course project. Open [submission](submission/README.md) for the final reports and presentation.

| Part | Project | What to open |
| --- | --- | --- |
| A | [ResilientBite](resilientbite/README.md) forecasts how many portions a dining hall should prepare for each dish. | [Report](resilientbite/ResilientBite%20Phase%20Report.pdf), [analysis notebook](resilientbite/food_pred%20%281%29.ipynb), [app source](resilientbite/forecast_app/) |
| B | [Hire & Seek](game/README.md) is a game about how a model learns from hiring choices. | [How to play](game/README.md#how-to-play), [demo guide](game/docs/DEMO.md), [learning objectives](game/README.md#learning-objectives) |

## Submission documents

| File | Contents |
| --- | --- |
| [Hire & Seek report](submission/Hire-and-Seek-Report.pdf) | Game design, learning objectives, screenshots, results and feedback |
| [ResilientBite report](submission/ResilientBite-Report.pdf) | Data preparation, forecasting, evaluation and the app |
| [ResilientBite presentation](submission/ResilientBite-Presentation.pptx) | Presentation with charts, app screenshots and speaker notes |

The editable report sources remain in `game/report/` and `resilientbite/ResilientBite LaTeX/`.

| Team member | Roll number |
| --- | --- |
| Akula Sai Teja | CS24I1054 |
| Karthik Kavuri | CS24I1025 |
| Muvvala Harsha Vardhan | EC24B1019 |

## Start here

- **Play Hire & Seek from the ZIP:** Open `game/START-HERE.txt`. With Node.js 22 installed, run `node game/scripts/preview.mjs` from this folder and visit `http://127.0.0.1:4000/game/`. The ZIP already includes the built game.
- **Play Hire & Seek from a Git checkout:** With Node.js 22 and npm 10, run `npm run setup`, `npm run build`, then `npm run preview` from this folder.
- **Try ResilientBite:** Start with its [README](resilientbite/README.md) for the hosted demo and setup steps for the Python notebook, local Streamlit app and Android client. Use the included demo CSV or the app's **Historical demo** to replay a dated example.

## Package or deploy

On Windows, `npm run package` builds the game and puts both projects, the `submission` folder and a file checksum list in `artifacts/submission/idse-course-project.zip`. Use `npm run package:game` for the game alone. Packaging replaces the previous ZIP for that command and removes its temporary staging folder.

Vercel builds and serves Hire & Seek from the repository root. ResilientBite runs separately. When deploying it to Render from this repository, set its root directory to `resilientbite`.

ResilientBite was imported from [Hackerliongloi/ResilientBite at a38e814](https://github.com/Hackerliongloi/ResilientBite/tree/a38e8147e2e324669473a05108bb50d4fc3a2327).
