# Netlify Deployment Contract

## Purpose

Gradient Descent Failure Atlas is deployed as a static Vite site on Netlify.
Production reflects accepted commits on GitHub `main`, without a separate
application server. This document records the deployment contract; it does not
claim that unmerged or uncommitted work is live.

## Production settings

- Repository: `Esquetta/GradientDescentFailureAtlas`
- Production branch: `main`
- Build command: `npm run build`
- Publish directory: `dist`
- Build environment: `NODE_VERSION=24`
- Browser runtime environment variables: none

The repository-root `netlify.toml` is the source of truth for the build command
and publish directory, including the build Node version. Dashboard settings
must not override those values.

## Routing and state

The application has one HTML entry point and does not require redirect or
rewrite rules. Shareable experiment state lives in the URL fragment, such as
`#experiment=correlated-features&mode=stable&step=7`, and is interpreted
entirely in the browser. Netlify does not need to receive or transform that
fragment.

No backend, serverless function, model API, analytics integration, or secret is
part of this deployment.

## Release verification

For each proposed change:

1. Run the test suite and production build locally.
2. Verify a Netlify deploy preview using the production build settings before
   the change is accepted.
3. After the accepted commit reaches `main`, verify the resulting production
   deploy, its public URL, and its deployed revision.

## Verification

The preview and production site must both pass these checks:

- the root page loads without a runtime error;
- `#experiment=correlated-features&mode=stable&step=7` restores that selected
  condition at iteration 7 and does not start playback;
- an invalid fragment is canonicalized to
  `#experiment=learning-rate&mode=unstable&step=0` on a cold load;
- the legacy compatibility fragment `#mode=stable&step=7` restores Learning
  Rate and is rewritten to its three-field canonical form;
- static assets return successful responses; and
- the deployed revision matches the intended `main` commit.

If preview verification fails, production publication stops. If a production
regression is found, restore the previous successful Netlify deploy before
attempting another release.
