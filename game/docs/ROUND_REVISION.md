# Hiring rounds and UI repair

This supersedes the earlier Classic/Relaxed revision. Keep the original office, characters, animations and VT323 font, with the Hire & Seek navy, teal and cream palette.

## Player flow

Homepage, short briefing, three hiring rounds, player-only Scout, company archive, comparison on the same twelve new CVs. The homepage is the only title screen. Author credits remain on About and in project documentation; the adaptation footer is removed from the homepage.

| Round | Available CVs | Shortlist target | Clock |
| --- | ---: | ---: | --- |
| First day | 6 | 3 | Untimed |
| Business picks up | 10 | 5 | 45 seconds |
| Hiring rush | 14 | 8 | 45 seconds |

A round ends on the saved choice that reaches its target, when its queue is exhausted, or when its deadline arrives. The target cannot be exceeded. A late choice is rejected. Only explicit choices are training labels, including explicit passes. Unreviewed CVs never become passes. Repeated clicks and stale animation callbacks cannot add decisions or repaint a later screen. Missing a target does not block the story.

Round reports store `reason` as `goal`, `completed` (queue exhausted), or `time`. `begin()` starts the single flow without a mode argument. Timers start on entering a round and stop during pause. Switching tabs pauses until the player returns and explicitly resumes.

## Interface and audio

The active UI has one office viewport and one CV, with a heading and target/clock above the scene. Characters are selectable. Native Previous/Next buttons and arrow keys provide alternatives; S/P submit choices. The full grid of name cards, floating Scout status and six-chapter rail are removed from the active screens. Visible applicants have unique names from an independent seeded stream.

`mountCanvas(host)` moves the shared canvas into the active manual, screening or training viewport. A ResizeObserver measures that host and resizes Pixi; previous observers are disconnected. Floors, doors, sprites, scanner and belt are placed within the measured scene. The render loop has a guard against multiple starts.

At 900px and above, office and CV sit side by side. Below 900px they stack and the page scrolls. Portrait play is allowed. Panel actions sit outside scrollable text. Small-screen decision controls use a sticky action area. Reduced motion remains supported.

The original button, shortlist, round-start/result, office ambience, countdown and training sounds are connected. Countdown warnings start in the last ten seconds and stop on exit. Audio unlock retries after unsuccessful gestures, works with pointer or keyboard input, and preserves mute through pause. Stopped tracks do not restart after pause. Optional load failures leave the game playable and are reflected in the audio control. Every sound in the manifest is checked in the built assets.

## Learning and computation

First fit a tree using only the player's recorded examples. Add the 160 historical records only after the player chooses that action, refit and screen the same introductory IDs. Preserve both snapshots and compute every comparison, including zero changes. Training counts reflect early round endings and timeouts. All-shortlist play produces 16 positive examples and a real constant player model, not an invented split.

Skill and experience are ability inputs; academy and city are categorical inputs. The model chooses its own splits. The fictional readiness rule, historical process and round targets are documented simulation rules. Predictions, tree questions, metrics and outcomes are computed. Agreement with old decisions is not job-readiness accuracy.

## Verification and pending walkthrough

The production build passed for both apps. Full `npm test` passed all 40 checks with none excluded. The asset check found 84 assets and 8 atlases with no errors, including all sound-manifest paths. The local HTTP preview test now passes in this session.

Automated regression coverage includes all-shortlist/all-pass/mixed play, real fitted snapshots, no data leakage, target caps, exact timeout boundaries, unreviewed applicants, pause, duplicate clicks, stale animation completion, unique names, host-based canvas resizing, render-loop ownership, audio unlock retries, mute and pause cleanup. Tests use fake audio/browser APIs for controller behaviour; they do not establish that sound is audible or layout looks correct.

Browser access returned **“The browser access host is unavailable”** during this repair. Visual and audible verification is still pending. Required walkthrough: 1920x1080, 1366x768, 1024x768, 768x1024, 390x844, 844x390; desktop zoom 80%, 125%, 200%; keyboard and touch play, scrolling, visible actions, no overlap or horizontal overflow, pause/resume and audible effects. Do not mark the UI repair fully verified until this passes.
