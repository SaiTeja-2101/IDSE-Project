# Hire & Seek

**You hire. It learns.**

Course project for **Introduction to Data Science for Engineers**.

| Team member | Roll number |
| --- | --- |
| Akula Sai Teja | CS24I1054 |
| Karthik Kavuri | CS24I1025 |

You decide who gets an interview at Orbit Works. Scout learns from your choices and old hiring records. See who it shortlists, check one decision, then see whether you can make Scout better. No coding needed.

[How to play](#how-to-play) · [Learning objectives](#learning-objectives) · [Classroom demo](docs/DEMO.md) · [Rubric](docs/RUBRIC.md)

## Play locally

Use Node.js 22 and npm 10. In this repository:

```sh
npm run setup
npm run build
npm run preview
```

Open [the game](http://127.0.0.1:4000/game/). Keep the terminal open. If you have the submission ZIP, extract it and follow `START-HERE.txt`; the included build can be played without installing packages.

## How to play

1. **Pick who gets an interview.** Open a CV. Choose **Shortlist** to invite them or **Pass** to move on. Aim for 3, 5, and 8 shortlists. The first round has no timer. The next two give you 45 seconds each. You can keep playing if you miss the target.
2. **Teach Scout.** Send your choices to the engineer. Choose a file of old hiring decisions to go with them. Click **Run scanner** and watch Scout make its own choices.
3. **Check a decision.** Open Maya’s message and find the person’s CV. The work test tells you whether they qualified. Compare it with Scout’s answer, then click **Reply to Maya**.
4. **Test one change.** Open the case from the city report. Change city or academy on a copy and click **Scan both**. See whether Scout’s answer changes.
5. **Try a fix.** Compare **Hide city** and **Learn from work tests** on 80 practice CVs. Choose one, then click **See results for all 200 CVs**. The four preview scans are optional.
6. **Look back.** Compare the results, then click **Continue to recap**. Use your own run to answer the recap questions. Explore the case notes or skip to your receipt, a short report you can download.

To take a break, click **Pause** or press **Esc**. Click **Continue** when you reopen the game in the same browser. On a keyboard, the arrow keys switch CVs. Press **S** to shortlist or **P** to pass after opening a CV.

## Learning objectives

After one run, a beginner should be able to:

- **Tell a feature from a label.** Skill is a detail Scout reads. Your Shortlist or Pass choice is an answer it learns from.
- **Follow a decision tree.** It works like a flowchart: each answer leads to another question or a final decision.
- **Check for a shortcut.** Change one detail and see if Scout gives a different answer even though the person’s skill and experience stayed the same.
- **Check whether a fix helps on new CVs.** Both versions see the same people they didn’t learn from. Count how many qualified people each version missed, and how many it invited who didn’t qualify.

Scout trains a real decision tree in your browser. The applicants and work test are made up for the lesson.

## Project files

- [Game design and phase plan](docs/GAME_DESIGN.md)
- [Assignment rubric](docs/RUBRIC.md)
- [Classroom demo guide](docs/DEMO.md)
- [Beginner playtest guide](docs/PLAYTEST.md)
- [Playtest evidence log](docs/PLAYTEST_EVIDENCE.md)
- [Delivery and verification](docs/DELIVERY.md)
- [Remaining work](TODO.md)

Run `npm test` for automated checks, `npm run check:assets` after a build, or `npm run package` for the local submission ZIP. Beginner playtest evidence must be collected from real sessions.

Source and asset credits are recorded in [the credits file](docs/UPSTREAM.md). For implementation details, see the [asset inventory](docs/ASSETS.md) and [classifier notes](docs/ML_CART.md).
