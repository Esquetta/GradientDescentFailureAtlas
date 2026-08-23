# Gradient Descent Failure Atlas

A controlled visual atlas for understanding why gradient descent converges, oscillates, or diverges.

The first vertical slice compares a stable learning rate with an unstable one on the same deterministic linear-regression dataset. The project intentionally uses no backend, account system, model API, or external dataset.

## Commands

```bash
npm install
npm test
npm run dev
npm run build
```

## Current scope

- Analytical mean-squared-error gradients for one-dimensional linear regression.
- Stable and unstable learning-rate traces.
- Interactive iteration playback and direct scrubbing.
- Shareable URL fragments that restore the selected mode and iteration.
- Canvas visualizations for model fit and logarithmic loss.
- Accessible status updates and reduced-motion handling.

The remaining failure modes are visible in the atlas index but are deliberately not implemented yet.
