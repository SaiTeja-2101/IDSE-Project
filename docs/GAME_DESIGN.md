# Hire & Seek: game design

## Goal and audience

The player runs the hiring desk at Orbit Works. They train Scout, check one of its decisions, and see if a fix helps. Start with the [player guide](../README.md#how-to-play). The [learning objectives](../README.md#learning-objectives) list what a beginner should be able to explain after playing.

## Phase 1: Manual hiring

| Round | CVs in the queue | Shortlist goal | Time |
| --- | ---: | ---: | --- |
| First day | 6 | 3 | Untimed |
| Business picks up | 10 | 5 | 45 seconds |
| Hiring rush | 14 | 8 | 45 seconds |

The animated office shows a queue and a place to open a CV. The player can pick which CV to review next. The round ends on reaching the goal, running out of time or reviewing every CV. The goal is a round target, so the count cannot go past it. A click or keypress only becomes a label after an explicit Shortlist or Pass with a CV open. A player can miss the target and still move on.

The player experiences how the data is created. Two people playing the same seed can produce different examples or labels.

## Phase 2: Handoff and training

The engineer asks for the reviewed CV file. The player sends it and picks the company archive (160 rows), partner archive (80 rows) or both (240 rows). Before choosing, they can peek at each archive to see how many qualified people per city were shortlisted in the old records. The peek reads the fictional training records only. Those rows plus the explicitly reviewed CVs become the training examples.

Each row contains skill, years of experience, academy and city. Scout learns from the player's Shortlist/Pass labels on manual rows and the old Shortlist/Pass labels on archive rows. The synthetic work test says an applicant qualifies if skill is at least 60 out of 100 and experience is at least one year. That benchmark is separate from what the original Scout learns. In the synthetic archives, the old decisions use the work test and also favour Bengaluru or Central Academy. The fictional data deliberately makes academy and city related.

The game fits a CART decision tree with the pinned ml-cart implementation, using Gini, depth setting 3 and minimum-sample setting 5. At the end of a path, it shortlists when at least half of the routed training labels are positive. It handles a tree with no questions too. The name and character art are not model inputs.

## Phase 3: Scanner, complaint and inspector

The same fitted Scout scans 12 new CVs. People queue on the lower floor while their CVs travel through the scanner on the belt above. Each CV goes to the Shortlisted or Passed over rack based on Scout's prediction. The player can scan one at a time or run until a message interrupts. An investor message comes after scan three. After that message, the first scanned person whom Scout passed over despite passing the work test triggers a complaint. If all 12 are scanned without such an error, a routine case uses a qualified person who was scanned. The same factory stays visible for both messages.

The inbox points to the named person. The player finds that person in the inspector, reads both decisions and replies. The scanner finishes the batch if needed. The news screen reports qualified shortlist rates by city, then lets the player reopen the same case. Twelve observations give the player a clue; the final batch is a better check.

## Phase 4: Test a copy

The player changes city or academy on a test copy. Skill, experience and the work test result stay fixed. The game evaluates the original and copy with the exact same model and shows the real questions and answers. There are three possible results:

- The final decision changes. Scout relied on that detail for this CV.
- The path changes but the final decision stays the same. Scout used a different branch to get there.
- The path and decision stay the same. This test did not expose a difference for this CV.

The player can try both details. They run at least one copy test to continue. The result applies to that one case. An academy-based split can be an indirect clue about city, so hiding city alone is not guaranteed to fix disparities.

## Phase 5: Try a repair, then test on new CVs

| Repair | What changes | What stays fixed |
| --- | --- | --- |
| Hide city | Remove city from the tree's inputs and fit again | Same training rows and labels |
| Learn from work tests | Use the synthetic work test results as the training labels and fit again | Same training rows and features |

Both repairs start from the original setup. The player can switch freely between them. Each uses the same cutoff and compares with the original Scout on the same 80 practice CVs. The player chooses one before seeing the final dataset results. The factory previews up to four predictions from the repaired model. Watching the preview has no effect on the final calculation. The original and repaired models screen the same 200 fresh CVs. The scanner, practice and final pools are distinct and excluded from training.

The table shows missed qualified applicants (false negatives), shortlisted applicants who failed the work test (false positives), and qualified shortlist rates by city. That rate is the number of qualified applicants shortlisted divided by the number of qualified applicants in that city. The game presents actual counts and changes, including ties or regressions. The synthetic work test is a teaching benchmark, not a recommendation for hiring.

## Phase 6: Interactive recap and receipt

The final test opens directly to the two models' 200-CV results. Players can expand examples from the batch to compare each decision with the work test. The examples distinguish an error fixed by the repair, a new error, an error both versions made, and a case both got right, when those cases exist in the run.

The player then chooses Continue to recap. They pick a feature on the first CV they reviewed, identify their recorded label, then follow the learned branches of the original and copy. Finally, they say which model missed fewer qualified applicants or whether they tied. The downloadable JSON receipt records the seed, archive, number of training examples, case, copy outcome, chosen repair and final comparison.

After the last recap answer, **What your run revealed** explains the same concepts without scoring. Players can switch between the hiring choice and the work test, replay the paths, inspect the chosen repair, and explore the final charts. Each scene uses their own evidence. Players can skip to the receipt or return to the walkthrough later. If they leave partway through, Continue reopens the walkthrough at its first scene without repeating the quiz.

## Phase 7: Classroom delivery

The versioned save replays the seed and recorded actions on resume. It keeps prior version saves separate. The static build, local ZIP, attribution and verification commands are in [DELIVERY.md](DELIVERY.md). Finish the assignment evidence by running the [beginner playtests](PLAYTEST.md) and documenting what the learners can explain and what changed after their feedback.
