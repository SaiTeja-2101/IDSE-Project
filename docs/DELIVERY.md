# Hire & Seek delivery notes

The current game uses the journey documented in [GAME_DESIGN.md](GAME_DESIGN.md). The older phase notes, baseline screenshots and scenario files describe earlier builds. The active route is served at `/game/`.

## Verification

- The full suite covers manual-round limits, the original and repaired tree paths, the complaint and routine-case branches, held-out evaluation and receipt replay. The DOM walkthrough uses the actual UI handlers, model and save controller with Pixi, sound and timing isolated.
- The resume check waits on the Continue screen and verifies that the full saved time remains. The audio checks cover playback blocked by the browser, including pause and cancelling a warning at the end of a round.
- Factory checks cover both rack routes, a resize during a scan, cleanup, and reduced motion. The full story check keeps the factory visible during mail, rebuilds the preview queue from the save, and can finish screening even when the animation fails. The engine also checks that watching all four previews has the same final result as skipping them.
- The ending walkthrough uses the saved CV, actual tree paths and final report. The DOM tests cover all four scenes, matching chart numbers to the receipt, skipping, reopening, and reloading halfway through without repeating the quiz.
- The game page scrolls when its content is taller than the screen. At phone widths, the inspector opens a separate CV panel with a scrollable body. The DOM checks cover closing it, returning focus to the same name, and replying only for the applicant in the email.
- The 200-CV report now opens before the recap. Each example comes from the evaluated batch, and older saves can still resume within the quiz or open their receipt.
- The production build and asset checker validate the deployed paths, sprite atlases and sound files.
- The browser preview tool was unavailable during the recheck. Rendered layout at desktop and mobile sizes, actual touch interaction, and audible sound playback remain unverified.
- The [playtest evidence log](PLAYTEST_EVIDENCE.md) records five peer comments and the changes made in response. A follow-up peer test has not been recorded.

## Run and package

Use Node.js 22 and npm 10. Run `npm run setup`, `npm run build`, then `npm run preview`. Open [the game](http://127.0.0.1:4000/game/). Run `npm test` and `npm run check:assets` to repeat the checks.

Run `npm run package` to produce a folder, a ZIP and a checksum in `artifacts/submission/`. The ZIP includes the project report PDF at its top level, plus source, dependency manifests and lockfiles, tests, docs, and the compiled site. It excludes installed dependencies and Git history. Extract it and read `START-HERE.txt`. The prebuilt site can be served with Node without installing packages.

For Vercel, keep the Root Directory at the repository root. The included `vercel.json` installs both sets of dependencies, builds both portions of the site, and serves `dist/`. If a deploy fails with `gulp: command not found`, confirm the build is using the version that includes the config and that setup runs before the build.

Progress uses `hire-and-seek:v2`. The previous version's save is left alone. The current game replays recorded choices and actions to reconstruct the run. It does not load scores or fitted models from local storage.
