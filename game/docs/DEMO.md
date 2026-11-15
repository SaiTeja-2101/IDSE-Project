# Demo Hire & Seek in class

Let someone in the audience make a hiring choice. Show how Scout learns from it, then change one detail on a CV. Finish by comparing the two versions of Scout on new CVs. If you only have a few minutes, show the copy test and the final results.

## A reproducible run

1. Open [the demo seed](http://127.0.0.1:4000/game/?seed=17). In the Continue prompt, choose **Start fresh** only if you are ready to replace the save on that browser. Use a separate browser profile to keep your own save.
2. In each of the three rounds, review CVs in the order they appear. Start with **Pass**, then alternate **Shortlist**, **Pass**, **Shortlist** until the round ends. Start with Pass again in the next round. The example below assumes you finish before either timer runs out.
3. Choose **Company archive**. Open **Peek at the records** to compare the old shortlist rates for qualified people in each city.
4. Run the scanner, read the messages and open the complaint from **Varun Singh**. Ask the audience why a person who qualified might still have been passed over.
5. Test only **City** on Varun's copy. In this run, changing the city flips the decision while the work test result stays the same. One test shows a shortcut on this CV. The final batch checks a wider pattern.
6. Try **Learn from work tests**, lock it and click **See results for all 200 CVs**. The demo run goes from **50 to 0 qualified people missed** and **1 to 0 mistaken shortlists**. Open an example, then click **Continue to recap**.

If your numbers differ, use the results on screen. The archive and the decisions in your actual run affect what Scout learns. The seed fixes the fictional people, not the answer.

## What to say if the teacher asks

| Question | Short answer |
| --- | --- |
| What is actually trained? | A decision tree fitted in the browser. It learns questions from the player's recorded choices plus the selected archive. |
| What does the repair change? | Hiding city changes what Scout can read. Learning from work tests changes which answers it learns from. |
| Why use 200 fresh CVs? | Both models get the same examples they never saw in training or practice. That is a fairer test of what each model learned. |
| Is this proof about real hiring? | No. The CVs and job rule are fictional. The experiment shows how a model can repeat patterns from its examples. |
| What can a beginner learn? | Point to a feature and a label, follow a decision path, explain a controlled change, and read the two kinds of error. |

The numbers above are for a reproducible demonstration, not peer learning evidence. Use [the playtest guide](PLAYTEST.md) to record what real beginners can explain after playing.
