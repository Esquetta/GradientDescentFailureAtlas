import { describe, expect, it } from 'vitest'
import { getAtlasFrame } from '../src/core/atlas-controller.ts'
import { createAtlasMarkup } from '../src/ui/atlas-markup.ts'

describe('atlas markup', () => {
  it('provides a first-focus skip link and a focusable main target', () => {
    const markup = createAtlasMarkup(
      getAtlasFrame({ experimentId: 'learning-rate', mode: 'unstable', step: 0 }),
    )

    expect(markup.trimStart()).toMatch(/^<a class="skip-link" href="#top">Skip to main content<\/a>/)
    expect(markup).toContain('<main id="top" tabindex="-1">')
  })

  it('renders five accessible live experiment buttons with one active selection', () => {
    const markup = createAtlasMarkup(
      getAtlasFrame({ experimentId: 'learning-rate', mode: 'unstable', step: 0 }),
    )
    const buttons = [...markup.matchAll(/<button type="button" class="experiment-button[^>]*>/g)]

    expect(buttons).toHaveLength(5)
    expect(markup).toMatch(/id="experiment-learning-rate"[^>]*data-experiment="learning-rate"[^>]*aria-pressed="true"/)
    expect(markup).toMatch(/id="experiment-correlated-features"[^>]*data-experiment="correlated-features"[^>]*aria-pressed="false"/)
    expect(new Set([...markup.matchAll(/id="(experiment-(?:learning-rate|feature-scale|outlier-pull|correlated-features|initialization))"/g)].map((match) => match[1]))).toHaveLength(5)
    expect(markup).toContain('Learning rate')
    expect(markup).toContain('<b>live</b>')
    expect(markup).not.toContain('queued')
  })

  it('renders header and intro identity from the initial frame', () => {
    const markup = createAtlasMarkup(
      getAtlasFrame({ experimentId: 'learning-rate', mode: 'stable', step: 0 }),
    )

    expect(markup).toContain('id="header-experiment-count">Experiment 01 / 05')
    expect(markup).toMatch(/id="experiment-index"[^>]*>01/)
    expect(markup).toMatch(/id="experiment-eyebrow"[^>]*>Failure mode \/ step size/)
    expect(markup).toContain('id="experiment-title">When the step is larger than the valley.')
  })

  it('includes the required accessible controls, live region, and four readout slots', () => {
    const markup = createAtlasMarkup(
      getAtlasFrame({ experimentId: 'learning-rate', mode: 'unstable', step: 0 }),
    )

    expect(markup).toContain('id="condition-group-label"')
    expect(markup).toContain('data-mode="stable"')
    expect(markup).toContain('data-mode="unstable"')
    expect(markup).toContain('id="step-range"')
    expect(markup).toContain('id="play-button"')
    expect(markup).toContain('id="reset-button"')
    expect(markup).toContain('id="live-status" class="sr-only" aria-live="polite"')
    expect([...markup.matchAll(/data-readout-slot="\d"/g)]).toHaveLength(4)
    expect(markup).toContain('id="caveat-copy"')
  })

  it('uses the correlated experiment identity and condition copy without changing the shell', () => {
    const markup = createAtlasMarkup(
      getAtlasFrame({ experimentId: 'correlated-features', mode: 'stable', step: 0 }),
    )

    expect(markup).toContain('id="header-experiment-count">Experiment 04 / 05')
    expect(markup).toMatch(/id="experiment-index"[^>]*>04/)
    expect(markup).toContain('>independent<')
    expect(markup).toContain('>correlated<')
    expect(markup).toContain('class="mode-switch" role="group" aria-label="Correlated features run condition"')
    expect(markup).toContain('class="lab-shell"')
    expect(markup).toContain('class="plots"')
    expect(markup).toContain('class="diagnosis"')
  })

  it('uses frame mode and step when the frame condition is structurally cloned', () => {
    const frame = getAtlasFrame({ experimentId: 'learning-rate', mode: 'stable', step: 2 })
    const markup = createAtlasMarkup({ ...frame, condition: { ...frame.condition } })

    expect(markup).toMatch(/data-mode="stable"[^>]*aria-pressed="true"/)
    expect(markup).toMatch(/id="step-range"[^>]*value="2"/)
  })
})
