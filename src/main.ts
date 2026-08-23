import './style.css'
import { createHighLearningRateExperiment } from './experiments/high-learning-rate.ts'
import type { GradientDescentStep, Parameters, Point } from './core/gradient-descent.ts'
import { parseAtlasState, serializeAtlasState, type AtlasMode } from './core/url-state.ts'

const experiment = createHighLearningRateExperiment()
const maxStep = experiment.unstable.length - 1
const initialState = parseAtlasState(window.location.hash, maxStep)
const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <header class="site-header">
    <a class="wordmark" href="#top" aria-label="Gradient Descent Failure Atlas home">
      <span class="wordmark-mark" aria-hidden="true">GD</span>
      <span>Failure Atlas</span>
    </a>
    <div class="header-meta">
      <span>Linear regression</span>
      <span>Experiment 01 / 05</span>
    </div>
  </header>

  <main id="top">
    <section class="intro" aria-labelledby="experiment-title">
      <div class="intro-index">01</div>
      <div class="intro-copy">
        <p class="eyebrow">Failure mode / step size</p>
        <h1 id="experiment-title">When the step is larger than the valley.</h1>
        <p class="lede">
          A high learning rate does not make learning faster. It can make each correction
          overshoot the solution until error grows instead of shrinking.
        </p>
      </div>
      <div class="thesis" aria-label="Experiment thesis">
        <span>Observe</span>
        <strong>oscillation → divergence</strong>
      </div>
    </section>

    <section class="lab-shell" aria-label="Interactive gradient descent laboratory">
      <aside class="control-rail">
        <div class="rail-section">
          <p class="rail-label">Atlas index</p>
          <ol class="experiment-list">
            <li class="is-active"><span>01</span> Learning rate <b>live</b></li>
            <li><span>02</span> Feature scale <b>queued</b></li>
            <li><span>03</span> Outlier pull <b>queued</b></li>
            <li><span>04</span> Correlated features <b>queued</b></li>
            <li><span>05</span> Initialization <b>queued</b></li>
          </ol>
        </div>

        <div class="rail-section controls">
          <p class="rail-label">Run condition</p>
          <div class="mode-switch" role="group" aria-label="Learning rate mode">
            <button class="mode-button${initialState.mode === 'stable' ? ' is-selected' : ''}" data-mode="stable" type="button">
              <span>stable</span><strong>η ${experiment.stableLearningRate}</strong>
            </button>
            <button class="mode-button${initialState.mode === 'unstable' ? ' is-selected' : ''}" data-mode="unstable" type="button">
              <span>unstable</span><strong>η ${experiment.unstableLearningRate}</strong>
            </button>
          </div>

          <label class="step-control" for="step-range">
            <span>Iteration</span>
            <output id="step-output" for="step-range">${initialState.step} / ${maxStep}</output>
          </label>
          <input id="step-range" type="range" min="0" max="${maxStep}" value="${initialState.step}" />

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
              <p class="plot-kicker">Model space</p>
              <h2>Fit against observations</h2>
            </div>
            <span class="legend"><i class="legend-dot"></i> observed data</span>
          </header>
          <canvas id="fit-canvas" aria-label="Data points and the current regression line"></canvas>
          <div class="axis-note"><span>x / feature</span><span>y / target</span></div>
        </article>

        <article class="plot-panel loss-panel">
          <header>
            <div>
              <p class="plot-kicker">Training trace</p>
              <h2>Loss over iterations</h2>
            </div>
            <span id="loss-trend" class="trend-badge">waiting</span>
          </header>
          <canvas id="loss-canvas" aria-label="Mean squared error over iterations"></canvas>
          <div class="axis-note"><span>iteration</span><span>log loss</span></div>
        </article>
      </div>

      <aside class="diagnosis">
        <div class="diagnosis-header">
          <p class="rail-label">Field diagnosis</p>
          <span id="status-light" class="status-light"></span>
        </div>
        <dl>
          <div>
            <dt>Symptom</dt>
            <dd id="symptom-copy">The first update has not been applied.</dd>
          </div>
          <div>
            <dt>Cause</dt>
            <dd>The update step crosses the minimum and lands farther away on the opposite side.</dd>
          </div>
          <div>
            <dt>Correction</dt>
            <dd>Reduce η until each update remains inside the local geometry of the loss surface.</dd>
          </div>
        </dl>

        <blockquote>
          “A correct gradient can still produce a failing training run.”
        </blockquote>
      </aside>
    </section>

    <section class="readout" aria-label="Current training values">
      <div><span>iteration</span><strong id="iteration-value">00</strong></div>
      <div><span>slope / w</span><strong id="slope-value">0.000</strong></div>
      <div><span>intercept / b</span><strong id="intercept-value">0.000</strong></div>
      <div><span>mean squared error</span><strong id="loss-value">—</strong></div>
      <p id="live-status" class="sr-only" aria-live="polite"></p>
    </section>
  </main>

  <footer>
    <p>Gradient Descent Failure Atlas / controlled experiments, not a generic playground.</p>
    <p>Built with deterministic synthetic data. No model API. No tracking.</p>
  </footer>
`

let mode: AtlasMode = initialState.mode
let step = initialState.step
let timer: number | undefined

const fitCanvas = document.querySelector<HTMLCanvasElement>('#fit-canvas')!
const lossCanvas = document.querySelector<HTMLCanvasElement>('#loss-canvas')!
const range = document.querySelector<HTMLInputElement>('#step-range')!
const stepOutput = document.querySelector<HTMLOutputElement>('#step-output')!
const playButton = document.querySelector<HTMLButtonElement>('#play-button')!
const resetButton = document.querySelector<HTMLButtonElement>('#reset-button')!

function history(): GradientDescentStep[] {
  return mode === 'stable' ? experiment.stable : experiment.unstable
}

function configureCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const bounds = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(bounds.width * ratio))
  canvas.height = Math.max(1, Math.round(bounds.height * ratio))
  const context = canvas.getContext('2d')!
  context.scale(ratio, ratio)
  return context
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.strokeStyle = 'rgba(42, 40, 33, 0.12)'
  context.lineWidth = 1
  for (let x = 32; x < width; x += 32) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
  }
  for (let y = 32; y < height; y += 32) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }
}

function drawFit(points: Point[], parameters: Parameters): void {
  const context = configureCanvas(fitCanvas)
  const { width, height } = fitCanvas.getBoundingClientRect()
  const pad = 28
  const xMin = -3.5
  const xMax = 3.5
  const yMin = -5
  const yMax = 5
  const px = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (width - pad * 2)
  const py = (y: number) => height - pad - ((y - yMin) / (yMax - yMin)) * (height - pad * 2)

  context.clearRect(0, 0, width, height)
  drawGrid(context, width, height)

  context.strokeStyle = '#2b2922'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(px(xMin), py(0))
  context.lineTo(px(xMax), py(0))
  context.moveTo(px(0), py(yMin))
  context.lineTo(px(0), py(yMax))
  context.stroke()

  context.strokeStyle = mode === 'stable' ? '#315e82' : '#c7472f'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(px(xMin), py(parameters.slope * xMin + parameters.intercept))
  context.lineTo(px(xMax), py(parameters.slope * xMax + parameters.intercept))
  context.stroke()

  points.forEach((point) => {
    context.fillStyle = '#f6f0df'
    context.strokeStyle = '#2b2922'
    context.lineWidth = 2
    context.beginPath()
    context.arc(px(point.x), py(point.y), 5, 0, Math.PI * 2)
    context.fill()
    context.stroke()
  })
}

function drawLoss(run: GradientDescentStep[], currentStep: number): void {
  const context = configureCanvas(lossCanvas)
  const { width, height } = lossCanvas.getBoundingClientRect()
  const pad = 28
  const visible = run.slice(0, currentStep + 1)
  const logLosses = run.map((entry) => Math.log10(entry.loss + 1))
  const maxLoss = Math.max(...logLosses, 1)
  const px = (index: number) => pad + (index / (run.length - 1)) * (width - pad * 2)
  const py = (loss: number) => height - pad - (Math.log10(loss + 1) / maxLoss) * (height - pad * 2)

  context.clearRect(0, 0, width, height)
  drawGrid(context, width, height)

  context.strokeStyle = mode === 'stable' ? '#315e82' : '#c7472f'
  context.lineWidth = 3
  context.beginPath()
  visible.forEach((entry, index) => {
    const x = px(index)
    const y = py(entry.loss)
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  })
  context.stroke()

  const latest = visible.at(-1)!
  context.fillStyle = mode === 'stable' ? '#315e82' : '#c7472f'
  context.beginPath()
  context.arc(px(currentStep), py(latest.loss), 5, 0, Math.PI * 2)
  context.fill()
}

function render(): void {
  const run = history()
  const current = run[step]
  drawFit(experiment.points, current.parameters)
  drawLoss(run, step)

  document.querySelectorAll<HTMLButtonElement>('.mode-button').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.mode === mode)
  })
  range.value = String(step)
  stepOutput.value = `${step} / ${run.length - 1}`
  document.querySelector('#iteration-value')!.textContent = String(step).padStart(2, '0')
  document.querySelector('#slope-value')!.textContent = current.parameters.slope.toFixed(3)
  document.querySelector('#intercept-value')!.textContent = current.parameters.intercept.toFixed(3)
  document.querySelector('#loss-value')!.textContent = current.loss < 1000
    ? current.loss.toFixed(4)
    : current.loss.toExponential(2)

  const previousLoss = step > 0 ? run[step - 1].loss : current.loss
  const rising = current.loss > previousLoss
  const trend = document.querySelector('#loss-trend')!
  trend.textContent = step === 0 ? 'waiting' : rising ? 'loss rising' : 'loss falling'
  trend.classList.toggle('is-danger', rising)
  trend.classList.toggle('is-stable', step > 0 && !rising)
  document.querySelector('#status-light')!.classList.toggle('is-danger', rising)
  document.querySelector('#symptom-copy')!.textContent = step === 0
    ? 'The first update has not been applied.'
    : rising
      ? 'Each update lands farther from the minimum; loss is growing.'
      : 'Each update remains controlled; loss is shrinking.'
  document.querySelector('#live-status')!.textContent =
    `Iteration ${step}. Loss ${current.loss.toFixed(4)}. ${rising ? 'Loss rising.' : 'Loss controlled.'}`
}

function syncUrl(): void {
  const nextUrl = `${window.location.pathname}${window.location.search}${serializeAtlasState({ mode, step })}`
  window.history.replaceState(null, '', nextUrl)
}

function renderAndSync(): void {
  render()
  syncUrl()
}

function stop(): void {
  if (timer !== undefined) window.clearInterval(timer)
  timer = undefined
  playButton.textContent = step >= history().length - 1 ? 'Run again' : 'Run experiment'
}

function play(): void {
  if (timer !== undefined) {
    stop()
    return
  }
  if (step >= history().length - 1) {
    step = 0
    renderAndSync()
  }
  playButton.textContent = 'Pause'
  timer = window.setInterval(() => {
    step += 1
    renderAndSync()
    if (step >= history().length - 1) stop()
  }, 420)
}

document.querySelectorAll<HTMLButtonElement>('.mode-button').forEach((button) => {
  button.addEventListener('click', () => {
    stop()
    mode = button.dataset.mode as AtlasMode
    step = 0
    renderAndSync()
  })
})

range.addEventListener('input', () => {
  stop()
  step = Number(range.value)
  renderAndSync()
})
playButton.addEventListener('click', play)
resetButton.addEventListener('click', () => {
  stop()
  step = 0
  renderAndSync()
})

new ResizeObserver(render).observe(document.querySelector('.plots')!)
renderAndSync()
