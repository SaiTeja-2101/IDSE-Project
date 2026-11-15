# Phase 2: Hire and Seek look and feel

## What changed

- The landing page and game title now say **Hire and Seek**.
- Both screens use the tagline **You hire. It learns.**
- The game uses navy, teal, cream, mint, and amber. It keeps the original VT323 font and animated applicants.
- The office shows Orbit Works and Scout.
- Orange applicants are labelled Bengaluru. Blue applicants are labelled Chennai.
- CV cards show city and all four scores used by the retained model: practical skill, school score, experience, and ambition. The invented academy names were removed. Phase 3 will add the planned academy field with the new model and data.
- The game has a chapter bar, a starting credit count, pause, sound, keyboard focus, and a new pause screen.
- Training, email, and choice text now use short sentences and familiar words.
- A few labels in the old review screen now explain that its example numbers may not match the player's choices.
- A new folder-and-Scout logo appears in the headers, title screen, and browser tab. See [BRAND.md](BRAND.md) for its source and prompt.
- The CV has a clearer header and compact score rows. Its height is bounded by the screen, with scrolling for short windows.
- The title and landing page have a logo lockup, amber accent, and button feedback.

## Review fixes

- Pause records which GSAP animations were running and resumes only those. Waiting scanner animations remain paused.
- Retained applicant data is adapted at load time to one city mapping: orange is Bengaluru (`1`), blue is Chennai (`0`). Model inputs, CVs, and city summaries use that mapping. The imported JSON files remain intact for provenance.
- Old evaluation fixtures with only numeric city IDs receive matching sprite colours when adapted.
- All four old qualification scores are visible, so the model cannot read a hidden qualification. Academy becomes a real field when the Phase 3 model is added.
- Four regression checks in `tests/phase2.test.cjs` cover pause cycles, city consistency across all pools and model input, CV values, and preservation of original data.

## How to open it

From the project folder, run:

```bash
npm run dev
```

Open `http://127.0.0.1:4000/` for the landing page or `http://127.0.0.1:4000/game/` for the game.

The production build completed with `npm run build` on 2026-10-30. It compiled the website and game.

After the review fixes, `node --test --test-skip-pattern='local preview' tests/*.test.cjs` passed all nine selected checks. The HTTP preview test was deliberately excluded because the session previously rejected the loopback connection with `EACCES`.

## What still uses the old game

Phase 2 established the look and words. Phase 3 added the new model/data engine and removed substitute statistics and story-driven model selection. Phase 4 now uses that engine in the active six-decision office and twelve-CV screening flow. The old four-score CV is retained as attributed source; the active CV shows skill, experience, academy, and city. See [PHASE4.md](PHASE4.md).

## Review status

The earlier title screen was opened once. The latest preview attempt was rejected by automatic approval review because local-origin browser access had not been granted after the earlier Work settings block. The revised landing page and game screens still need a visual walkthrough at laptop and phone sizes. That work remains open in TODO.md. The four Phase 2 regression checks pass; the loopback HTTP baseline check is blocked by this session's connection permissions (`EACCES`).
