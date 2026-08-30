# Gradient Descent Failure Atlas

A controlled visual atlas for understanding why gradient descent converges, oscillates, or diverges in deterministic linear-regression experiments. The project intentionally uses no backend, account system, model API, or external dataset.

## Commands

```bash
npm install
npm test
npm run dev
npm run build
```

## Experiments

- **Learning rate:** a step larger than local curvature can overshoot and grow error instead of descending.
- **Feature scale:** multiplying a feature changes curvature, so the same learning rate can become unstable.
- **Outlier pull:** squared residuals give a large outlier disproportionate influence on the fitted line.
- **Correlated features:** low loss can coexist with slow, poorly identified individual coefficients when features nearly duplicate one another.
- **Initialization:** in convex linear regression, starts share one final optimum; a fixed iteration budget changes the path and time to reach it, not the optimum.

## Interaction and sharing

- Shared playback, reset, and direct iteration scrubbing work across all five experiments.
- Canvases show model fit or coefficient paths as appropriate, alongside logarithmic loss.
- Accessible controls, live status updates, reduced-motion handling, and responsive layouts support keyboard and smaller-screen use.
- Shareable URL fragments restore the selected experiment, internal run mode, and iteration; for example, `#experiment=correlated-features&mode=stable&step=7`.
