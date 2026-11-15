# Playtest evidence

Course: **Introduction to Data Science for Engineers**  
Project: **Hire & Seek**

## Team walkthrough

On 14 November 2026, a team member reported that the recap looked like it was repeating a question. After they answered the skill question on the original CV, the game immediately showed the first question for the test copy. Both CVs followed the same path, so the questions looked familiar.

The game now shows **Original CV complete**, gives players a **Follow the test copy** button, and numbers the questions. The corrected flow is covered by the automated test. No peer retest has been recorded for this change.

## Project review

These observations come from the project’s walkthrough and automated checks. All eight story and interface checks passed. This review is separate from peer sessions.

| Part of the game | What works | What to improve or check with a beginner |
| --- | --- | --- |
| Test a copy | The two CVs highlight the one detail that changed and show both answers, even when they match. | Ask whether the player can explain why “same answer” is still a useful result. |
| Final results | The comparison opens before the quiz. Players can open a CV from the same batch and see what both versions decided. | Ask the player to read one city row out loud and explain what the two numbers mean. |
| Follow Scout’s tree | The quiz marks the original CV and the test copy separately and numbers their questions. | Check that the player understands why the same question can appear on both CVs. |

## Peer sessions

| Player | Feedback |
| --- | --- |
| [YashvanthSankar](https://github.com/YashvanthSankar) | “I liked seeing Scout learn from my choices. The screens were clear, and making the choices myself helped me understand how AI learns from data.” |
| [Nithillakrishi](https://github.com/Nithillakrishi) | “Changing the city on the same CV was interesting. Comparing the two answers helped me understand how AI can be unfair.” |
| [JeevaPN](https://github.com/JeevaPN) | “The hiring rounds were fun, and I liked the scanner animation. I learned that AI can make mistakes too. I needed some help finding the person in Maya’s message.” |
| [Aditya125031](https://github.com/Aditya125031) | “I liked trying the two fixes and comparing the results. Clicking through the steps helped me understand how changing the training data can affect AI. Some parts needed more explanation.” |
| [Rautrao](https://github.com/Rautrao) | “I liked the look of the game, and the buttons were easy to use. I learned why we test AI on new data, but the numbers at the end were confusing. One simple example would help.” |

## Changes made after feedback

| Feedback | Change |
| --- | --- |
| The applicant in Maya’s message was hard to find. | The inspector repeats the name and tags the matching file **CASE CV**. Players still open the file and check the decision. |
| The two fixes needed more explanation. | The repair cards explain what changes: what Scout can read, or which answer it learns from. |
| The final numbers needed a clear example. | The results screen explains one city row using the two counts from the player’s actual run. |

The comments describe what players said they learned. No numeric ratings, completion times, or peer retest results were recorded.
