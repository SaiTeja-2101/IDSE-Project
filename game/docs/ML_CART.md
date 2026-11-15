# ml-cart compatibility fix

The dependency remains pinned to **ml-cart 1.0.8**. The application imports the copy at `game-source/public/game/vendor/ml-cart.js`. It retains the original CART implementation, Gini splitting, depth handling, and `<` / `>=` comparisons.

The starting file was the installed package's `lib/index.js`, with SHA-256:

```text
A0C44CDAADAD4B3512F7E106F7A976755F1ADE96AA5D93E5497F007070D55C31
```

One function is changed. `getNumberOfClasses` originally returned the number of distinct labels. The distribution code then used the actual label as an array index. A subset containing only label `1` allocated one slot and wrote into a second, uninitialised slot. This produced `NaN` probabilities and Gini values. It affected positive-only branches even when the full dataset had both classes.

The compatibility copy returns `max(label) + 1` for a nonempty set of nonnegative integer labels, so binary labels always have the slots they require. Empty subsets return zero. A header records the modification. The remaining implementation is copied unchanged.

The model adapter also handles a fully single-class dataset explicitly and calculates leaf support and positive-label rates from the actual routed training records. This gives explanations counts with clear label meanings.

The original MIT notice is preserved beside the source in `ml-cart.LICENSE`, and in the built assets as `assets/text/ml-cart-LICENSE.txt`. Copyright: 2015 ml.js. Source project: [mljs/decision-tree-cart](https://github.com/mljs/decision-tree-cart).

`tests/phase3.test.cjs` includes a six-example separation fixture that checks a finite Gini value, a pure positive branch, and equality at the learned threshold. Other tests compare the displayed tree with a direct fit from this compatibility copy. This repair does not choose models using audit or final outcomes.
