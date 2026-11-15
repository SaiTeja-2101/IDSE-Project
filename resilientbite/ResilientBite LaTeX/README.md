# ResilientBite report source and images

[main.tex](main.tex) is the editable report. The final documents are in [submission](../../submission/README.md).

## Images used in the report

| File | What it shows | Data scope |
| --- | --- | --- |
| [demand.png](images/demand.png) | Demand distribution, daily totals, meal averages and vacation comparison | Earliest 60% of dates used for exploration |
| [errors.png](images/errors.png) | Forecast-minus-demand errors and MAE by vacation status | Held-out test dates |
| [preparation.png](images/preparation.png) | Excess and unmet portions for the recorded and forecast-based preparation rules | Same held-out test records |
| [android-upload.jpg](images/android-upload.jpg) | Menu and recent-demand upload screen | App demonstration |
| [android-results.jpg](images/android-results.jpg) | Forecast results on a phone | 15 November 2026 demonstration |

The presentation uses the daily-demand panel from `demand.png`, the error-distribution panel from `errors.png`, and both app screenshots. It uses an editable chart for the preparation comparison. The complete figures remain here and in the report.

## Rebuild the report

Run these commands in this folder with pdfLaTeX installed:

```sh
pdflatex main.tex
pdflatex main.tex
```

You can also upload `main.tex` and the `images` folder to Overleaf and select pdfLaTeX. After checking the new PDF, update both `../ResilientBite Phase Report.pdf` and `../../submission/ResilientBite-Report.pdf`.
