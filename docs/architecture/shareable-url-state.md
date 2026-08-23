# Shareable URL State

## Purpose

The learning-rate experiment must be shareable at the exact state a reader is
observing. A copied URL restores the selected learning-rate mode and iteration
without starting playback automatically.

## URL contract

The canonical fragment is:

```text
#mode=unstable&step=7
```

`mode` accepts `stable` or `unstable`. `step` accepts an integer from zero
through the final recorded iteration for the active experiment.

Missing or invalid fields fall back independently:

- `mode` defaults to `unstable`.
- `step` defaults to `0`.

Negative, fractional, non-numeric, and out-of-range step values are invalid.
Unknown fragment fields are discarded when the application writes the
canonical state.

## Architecture

`src/core/url-state.ts` owns two pure functions:

- `parseAtlasState(fragment, maxStep)` returns a validated `{ mode, step }`
  state.
- `serializeAtlasState(state)` returns the complete canonical fragment,
  including the leading `#`.

The module has no DOM or browser-history dependency, so all URL rules can be
tested in the existing Node-based Vitest environment.

`src/main.ts` remains the owner of the runtime `mode` and `step` state. After
the experiment history is created, it reads the initial fragment and validates
the step against the actual history length. User actions follow one sequence:

1. Update `mode` or `step`.
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

- parsing a valid stable and unstable state;
- defaults for an empty fragment;
- independent fallback for an unknown mode;
- independent fallback for negative, fractional, non-numeric, and out-of-range
  steps; and
- deterministic serialization order.

The existing gradient-descent tests remain unchanged. Completion also requires
the production build and a browser check covering mode changes, scrubbing,
playback, reset, reload restoration, and the absence of automatic playback
after reload.

## Deliberate exclusions

This slice does not add a router, an experiment registry, query-string state,
or live reaction to manual fragment edits and browser back/forward navigation.
Those capabilities are not required while only one experiment is implemented.
