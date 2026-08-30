import { experimentRegistry } from '../experiments/registry.ts'
import type { AtlasFrame, AtlasReadout } from '../core/atlas-controller.ts'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function formatAtlasReadout(readout: AtlasReadout): string {
  if (readout.label === 'iteration') {
    return String(readout.value).padStart(2, '0')
  }

  if (readout.label === 'mean squared error') {
    return readout.value < 1000 ? readout.value.toFixed(4) : readout.value.toExponential(2)
  }

  return readout.value.toFixed(3)
}

export function createAtlasMarkup(initialFrame: AtlasFrame): string {
  const { definition, maxStep, mode: selectedMode, readouts, run, step } = initialFrame
  const index = String(definition.order).padStart(2, '0')
  const fitPlot = run.kind === 'fit'
    ? {
        kicker: 'Model space',
        title: 'Fit against observations',
        legend: 'observed data',
        canvasLabel: 'Data points and the current regression line',
        axisX: 'x / feature',
        axisY: 'y / target',
      }
    : {
        kicker: 'Parameter space',
        title: 'Weight path through the valley',
        legend: 'current weights',
        canvasLabel: 'The current first and second feature weights',
        axisX: 'weight 1 / w1',
        axisY: 'weight 2 / w2',
      }
  const activeClass = initialFrame.trend === 'rising'
    ? ' is-danger'
    : initialFrame.trend === 'falling'
      ? ' is-stable'
      : ''

  return `
  <a class="skip-link" href="#top">Skip to main content</a>
  <header class="site-header">
    <a class="wordmark" href="#top" aria-label="Gradient Descent Failure Atlas home">
      <span class="wordmark-mark" aria-hidden="true">GD</span>
      <span>Failure Atlas</span>
    </a>
    <div class="header-meta">
      <span>Linear regression</span>
      <span id="header-experiment-count">Experiment ${index} / 05</span>
    </div>
  </header>

  <main id="top" tabindex="-1">
    <section class="intro" aria-labelledby="experiment-title">
      <div id="experiment-index" class="intro-index">${index}</div>
      <div class="intro-copy">
        <p id="experiment-eyebrow" class="eyebrow">${escapeHtml(definition.eyebrow)}</p>
        <h1 id="experiment-title">${escapeHtml(definition.title)}</h1>
        <p id="experiment-lede" class="lede">${escapeHtml(definition.lede)}</p>
      </div>
      <div id="experiment-thesis" class="thesis" aria-label="Experiment thesis">
        <span>Observe</span>
        <strong>${escapeHtml(definition.thesis)}</strong>
      </div>
    </section>

    <section class="lab-shell" aria-label="Interactive gradient descent laboratory">
      <aside class="control-rail">
        <div class="rail-section">
          <p class="rail-label">Atlas index</p>
          <ol class="experiment-list" aria-label="Experiments">
            ${experimentRegistry.map((experiment) => {
              const selected = experiment.id === definition.id
              const buttonClass = `experiment-button${selected ? ' is-selected' : ''}`
              return `<li class="${selected ? 'is-active' : ''}"><button type="button" class="${buttonClass}" id="experiment-${experiment.id}" data-experiment="${experiment.id}" aria-pressed="${selected}"><span>${String(experiment.order).padStart(2, '0')}</span><span>${escapeHtml(experiment.shortLabel)}</span><b>live</b></button></li>`
            }).join('')}
          </ol>
        </div>

        <div class="rail-section controls">
          <p id="condition-group-label" class="rail-label">Run condition</p>
          <div class="mode-switch" role="group" aria-label="${escapeHtml(definition.shortLabel)} run condition">
            ${(['stable', 'unstable'] as const).map((mode) => {
              const candidate = definition.conditions[mode]
              const selected = mode === selectedMode
              return `<button id="condition-${mode}" class="mode-button${selected ? ' is-selected' : ''}" data-mode="${mode}" type="button" aria-pressed="${selected}"><span id="condition-${mode}-label">${escapeHtml(candidate.label)}</span><strong id="condition-${mode}-value">${escapeHtml(candidate.value)}</strong></button>`
            }).join('')}
          </div>

          <label class="step-control" for="step-range">
            <span>Iteration</span>
            <output id="step-output" for="step-range">${initialFrame.currentStep.iteration} / ${maxStep}</output>
          </label>
          <input id="step-range" type="range" min="0" max="${maxStep}" value="${step}" />

          <div class="transport">
            <button id="play-button" class="primary-action" type="button">Run experiment</button>
            <button id="reset-button" class="text-action" type="button">Reset</button>
          </div>
        </div>
      </aside>

      <div class="plots">
        <article class="plot-panel">
          <header>
            <div>
              <p id="fit-plot-kicker" class="plot-kicker">${fitPlot.kicker}</p>
              <h2 id="fit-plot-title">${fitPlot.title}</h2>
            </div>
            <span id="fit-plot-legend" class="legend"><i class="legend-dot"></i>${fitPlot.legend}</span>
          </header>
          <canvas id="fit-canvas" aria-label="${fitPlot.canvasLabel}"></canvas>
          <div class="axis-note"><span id="fit-axis-x">${fitPlot.axisX}</span><span id="fit-axis-y">${fitPlot.axisY}</span></div>
        </article>

        <article class="plot-panel loss-panel">
          <header>
            <div>
              <p id="loss-plot-kicker" class="plot-kicker">Training trace</p>
              <h2 id="loss-plot-title">Loss over iterations</h2>
            </div>
            <span id="loss-trend" class="trend-badge${activeClass}">${initialFrame.trend}</span>
          </header>
          <canvas id="loss-canvas" aria-label="Mean squared error over iterations"></canvas>
          <div class="axis-note"><span id="loss-axis-x">iteration</span><span id="loss-axis-y">log loss</span></div>
        </article>
      </div>

      <aside class="diagnosis">
        <div class="diagnosis-header">
          <p class="rail-label">Field diagnosis</p>
          <span id="status-light" class="status-light${initialFrame.trend === 'rising' ? ' is-danger' : ''}"></span>
        </div>
        <dl>
          <div>
            <dt>Symptom</dt>
            <dd id="symptom-copy">${escapeHtml(initialFrame.activeSymptom)}</dd>
          </div>
          <div>
            <dt>Cause</dt>
            <dd id="cause-copy">${escapeHtml(definition.diagnosis.cause)}</dd>
          </div>
          <div>
            <dt>Correction</dt>
            <dd id="correction-copy">${escapeHtml(definition.diagnosis.correction)}</dd>
          </div>
          <div>
            <dt>Caveat</dt>
            <dd id="caveat-copy">${escapeHtml(definition.diagnosis.caveat)}</dd>
          </div>
        </dl>

        <blockquote>“A correct gradient can still produce a failing training run.”</blockquote>
      </aside>
    </section>

    <section class="readout" aria-label="Current training values">
      ${readouts.map((readout, index) => `<div data-readout-slot="${index + 1}"><span id="readout-${index + 1}-label">${escapeHtml(readout.label)}</span><strong id="readout-${index + 1}-value">${formatAtlasReadout(readout)}</strong></div>`).join('')}
      <p id="live-status" class="sr-only" aria-live="polite"></p>
    </section>
  </main>

  <footer>
    <p>Gradient Descent Failure Atlas / controlled experiments, not a generic playground.</p>
    <p>Built with deterministic synthetic data. No model API. No tracking.</p>
  </footer>
`
}
