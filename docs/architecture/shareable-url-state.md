# Shareable URL State

## Purpose

Every atlas experiment must be shareable at the exact state a reader is
observing. A copied URL restores the experiment, selected condition, and
iteration without starting playback automatically.

## URL contract

The canonical fragment is:

```text
#experiment=correlated-features&mode=stable&step=7
```

The fields are:

- `experiment`: `learning-rate`, `feature-scale`, `outlier-pull`,
  `correlated-features`, or `initialization`.
- `mode`: the internal `stable` or `unstable` condition key. The user-visible
  labels vary by experiment, such as `scaled`/`raw` or
  `independent`/`correlated`.
- `step`: an integer from zero through the final recorded iteration for the
  selected experiment and mode.

Missing or invalid fields fall back independently:

- an unknown or missing `experiment` defaults to `learning-rate`;
- `mode` defaults to `unstable`.
- `step` defaults to `0`.

Negative, fractional, non-numeric, and out-of-range step values are invalid.
The maximum step is validated against the selected run, not a shared atlas
limit. Unknown fragment fields are discarded when the application writes the
canonical state.

Legacy learning-rate links remain supported. For example,
`#mode=stable&step=7` restores Learning Rate and is rewritten as
`#experiment=learning-rate&mode=stable&step=7`.

## Architecture

`src/core/url-state.ts` owns two pure functions:

- `parseAtlasState(fragment, maxStepFor)` returns a validated
  `{ experimentId, mode, step }` state.
- `serializeAtlasState(state)` returns the complete canonical fragment,
  including the leading `#`.

The module has no DOM or browser-history dependency, so all URL rules can be
tested in the existing Node-based Vitest environment.

`src/experiments/registry.ts` owns the ordered experiment definitions and
provides the fallback definition for an unknown ID. `src/core/atlas-controller.ts`
restores URL state, selects the active run, and resolves its maximum step.
`src/main.ts` owns runtime state and rendering. After the registry is ready, it
reads the initial fragment and validates the step against the selected run's
history. User actions follow one sequence:

1. Update `experimentId`, `mode`, or `step`.
2. Render the interface.
3. Replace the current URL fragment.

Playback applies the same sequence for every iteration. URL writes use
`history.replaceState`, so scrubbing and playback do not create a browser
history entry for every step. Canvas redraws caused by `ResizeObserver` do not
write to the URL.

The first render replaces missing or invalid input with the canonical fragment.
Recoverable fragment errors do not display an error message or write console
noise.

## Verification

`tests/url-state.test.ts` covers:

- parsing valid states for more than one experiment;
- legacy Learning Rate links and canonical serialization;
- defaults for missing or unknown experiment IDs;
- independent fallback for an invalid mode;
- independent fallback for negative, fractional, non-numeric, and out-of-range
  selected-run steps; and
- deterministic serialization order.

`tests/atlas-controller.test.ts` covers restoration, selection resets, and
selected-run maximum-step handling. Completion also requires the production
build and a browser check covering experiment and condition changes, scrubbing,
playback, reset, reload restoration, and the absence of automatic playback
after reload.
