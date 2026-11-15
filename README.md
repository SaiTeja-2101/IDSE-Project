# Hire & Seek

**You hire. It learns.**

You run the hiring desk at Orbit Works. Review CVs in three increasingly busy rounds, then train Scout to help. When a candidate asks why they were passed over, open their CV, test one change, and see if you can train a better Scout. The game is for learners with no coding experience.

## Play locally

Use Node.js 22 and npm 10. In this repository:

```sh
npm run setup
npm run build
npm run preview
```

Open [the game](http://127.0.0.1:4000/game/). Keep the terminal open. If you have the submission ZIP, extract it and follow `START-HERE.txt`; the included build can be played without installing packages.

## How to play

1. **Hire by hand.** Open each CV and choose **Shortlist** or **Pass**. Aim for 3, 5 and 8 shortlists over the three rounds. The last two give you 45 seconds each. Moving on leaves unreviewed CVs out of training.
2. **Train Scout.** Send the reviewed CVs to the engineer. Peek at the old hiring records, then choose which to include. Run the factory or scan one CV at a time. Follow the belt to see which rack Scout uses. The line stops when a message arrives.
3. **Investigate.** Find the named applicant in the CV inspector. Check Scout's answer against the work test, reply to Maya and finish the batch. Reopen the same case from the news report.
4. **Change one detail.** Change only city or academy on a copy. Scan both CVs and compare the learned paths. The answer might change, or it might stay the same.
5. **Try a repair.** Hide city or train on work test results. Compare each repair with the original Scout on 80 practice CVs. Lock one, then watch up to four factory scans or go straight to the comparison on 200 new CVs.
6. **Read the results.** Compare the two versions of Scout, then open a CV from the final batch to see what each model did. Click **Continue to recap** when ready.
7. **Explain your run.** Finish **What did you learn?** Then open the case notes to explore your first CV, replay Scout's paths, see what your repair changed, and compare charts from the final batch. Skip or revisit the walkthrough from your audit receipt.

Mouse, touch and native buttons work with the CV interface. On a keyboard, use Tab and Enter, or use the arrow keys to open another CV and S/P to shortlist or pass once it is open. Use the pause menu to stop the clock. Continue resumes the current version of the game in the same browser.

## What the game teaches

- **Features and labels:** Skill, experience, academy and city are details Scout can read. Your hiring answer is a label. Passing the fictional work test is a separate label.
- **Decision trees:** Scout learns a set of questions from the examples. Follow the answers to see how it made its prediction.
- **Bias, shortcuts and proxies:** A model can learn a pattern from old decisions. Academy can be an indirect clue about city in this fictional data. Changing one detail checks what happens to one prediction.
- **Testing on new data:** Compare models on the same CVs. Count missed qualified applicants and mistaken shortlists, and compare qualified shortlist rates by city.

The archive, skill profiles and work test results are synthetic. The classifier really fits a CART decision tree in the browser. The data is designed for a lesson and does not describe real applicants, cities or academies.

## Project files

- [Game design and phase plan](docs/GAME_DESIGN.md)
- [Assignment rubric](docs/RUBRIC.md)
- [Classroom demo guide](docs/DEMO.md)
- [Beginner playtest guide](docs/PLAYTEST.md)
- [Delivery and verification](docs/DELIVERY.md)
- [Remaining work](TODO.md)

Run `npm test` for automated checks, `npm run check:assets` after a build, or `npm run package` for the local submission ZIP. Beginner playtest evidence must be collected from real sessions.

This classroom game adapts **Survival of the Best Fit** by Alia ElKattan, Miha Klasinc, Gabor Csapo and Jihyun Kim. The adaptation retains original office and character art, sound and parts of the game engine. See [upstream provenance](docs/UPSTREAM.md), [asset credits](docs/ASSETS.md) and [classifier notes](docs/ML_CART.md).
