# Phase 0–1 verification

Verified on 2026-10-30 on Windows with Node 22.15.0, npm 10.9.2, and Git.

## Source and history

- Assignment branch: `hire-and-seek`.

## Commands exercised

| Command | Result |
| --- | --- |
| Initial dependency bootstrap | Website and game dependencies installed; lockfiles generated |
| `npm run setup` | Both projects successfully installed with `npm ci` from lockfiles |
| `npm run build` | Website and game compilation completed successfully |
| `npm run dev` | Both builds completed and BrowserSync served loopback port 4000 |
| `npm test` | Six baseline checks passed |
| `npm run check:assets` | 81 asset files, eight sprite atlases, zero errors |
| `npm run preview` | Built website and game served successfully; website Start Game reached the game title |
| Local preview HTTP handler | Game/font requests succeeded; traversal, missing files, and unsupported methods were rejected |

The initial sandboxed HTTP test failed because loopback fetch was restricted.
Repeating it with local network access passed; the result was not bypassed or marked skipped.

## Six automated checks

1. Required built outputs and sprite-sheet images/frames exist.
2. The atlas validator catches missing textures and invalid frames.
3. A broken JavaScript entry rejects the build rather than reporting success.
4. Retained analytics calls stay in bounded local memory.
5. The shared wrap-up script works without website-only Bootstrap plugins.
6. The preview handler serves local game/media and restricts requests to `dist/`.

These are baseline/build tests. The new candidate generator, repair workshop,
fairness metrics, and new endings have not been implemented or tested yet.

## Browser walkthrough

Using the in-app browser against the local development server:

- Confirmed the original title and VT323 interface render.
- Confirmed the portrait orientation notice and landscape office layout.
- Opened applicant CV cards and exercised Accept and Reject.
- Completed all three original hiring rounds (goals of 3, 5, and 8).
- Verified counters, candidate movement, doors, and round transitions.
- Progressed through the engineer conversation, local CV-file handoff, and dataset choice.
- Triggered classifier training and observed the completion message.
- Observed automated predictions changing the accept/reject counters and triggering the applicant complaint.
- Opened the dataset inspector and selected the named rejected candidate to view their CV.
- Verified the mute control toggles and restores its state.
- Checked runtime error logs after the startup fixes; no errors were reported through candidate inspection.
- Opened the original website through the built-only preview and followed Start Game successfully.

Actual screenshots are retained in `docs/screenshots/`:

- [Title](screenshots/baseline-title.jpg)
- [Applicant card](screenshots/baseline-applicant.jpg)
- [Training scene](screenshots/baseline-training.jpg)
- [Automated hiring](screenshots/baseline-automated.jpg)

## Repairs made in Phase 1

- Kept the existing Pixi/Machina/Pug/Sass/Browserify/Gulp stack.
- Removed optional native image-optimiser dependencies; retained original media bytes.
- Declared the game's direct clean-task dependency and pinned `ml-cart` 1.0.8 and Sass 1.72.0.
- Changed JavaScript bundling to await completion and propagate errors.
- Added reproducible lockfiles and portable root commands.
- Corrected shared wrap-up script loading: jQuery is available first, and website navbar code only runs when its navbar exists.
- Removed original Google/Facebook/Cloudflare tracking scripts. Old `gtag` calls now use a local memory shim.
- Made optional audio loading non-blocking and added an actionable essential-asset error screen.
- Added a loopback-only static preview and asset integrity checks.

## Inherited limitations and later work

- Original colours, branding, characters, and story remain. The generated Hire and Seek mockup is a design reference, not a screenshot of this baseline.
- Original educational wording, biased-data generation, fixed substitute statistics, and model fallback selection remain for Phase 3 replacement.
- Pixi emits duplicate global texture-cache-key warnings because the original character atlases reuse frame names. Specific sprite-sheet animations rendered correctly in the walkthrough.
- The original desktop conversation date formatter displays the wrong month; correct it during the interface adaptation.
- The retained dependency tree includes deprecated legacy development packages. This phase establishes a local baseline, not a full dependency/security modernisation or a public production release.
- New gameplay, learning claims, and peer playtest evidence remain pending.
