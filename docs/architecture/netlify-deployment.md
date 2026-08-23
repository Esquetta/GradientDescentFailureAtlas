# Netlify Deployment Contract

## Purpose

Gradient Descent Failure Atlas is deployed as a static Vite site on Netlify.
The GitHub `main` branch is the production source, so accepted changes can be
built and published without a separate application server.

## Production settings

- Repository: `Esquetta/GradientDescentFailureAtlas`
- Production branch: `main`
- Build command: `npm run build`
- Publish directory: `dist`
- Runtime environment variables: none

The repository-root `netlify.toml` is the source of truth for the build command
and publish directory. Dashboard settings must not override those values.

The first public address uses a Netlify-provided `.netlify.app` domain. The
preferred site name is `gradient-descent-failure-atlas` when available; an
available Netlify-generated name is acceptable for the initial release. A
custom domain is a separate follow-up decision.

## Routing and state

The application has one HTML entry point and does not require redirect or
rewrite rules. Shareable experiment state lives in the URL fragment, such as
`#mode=stable&step=7`, and is interpreted entirely in the browser. Netlify does
not need to receive or transform that fragment.

No backend, serverless function, model API, analytics integration, or secret is
part of this deployment.

## Release flow

1. Run the test suite and production build locally.
2. Create or update a Netlify deploy preview from the same production build
   settings.
3. Verify the preview before promoting or publishing it to production.
4. Connect GitHub continuous deployment so future accepted `main` updates use
   the same build and publish settings.
5. Read back the production URL and deployed revision after publication.

## Verification

The preview and production site must both pass these checks:

- the root page loads without a runtime error;
- `#mode=stable&step=7` restores stable mode at iteration 7 and does not start
  playback;
- an invalid fragment is canonicalized to `#mode=unstable&step=0` on a cold
  load;
- static assets return successful responses; and
- the deployed revision matches the intended `main` commit.

If preview verification fails, production publication stops. If a production
regression is found, restore the previous successful Netlify deploy before
attempting another release.
