import './style.css'
import {
  formatAtlasLiveAnnouncement,
  getAtlasFrame,
  getPlayButtonLabel,
  restoreAtlasControllerState,
  selectExperiment,
  selectMode,
  selectStep,
  type AtlasControllerState,
  type AtlasAnnouncementState,
} from './core/atlas-controller.ts'
import { serializeAtlasState } from './core/url-state.ts'
import { experimentRegistry } from './experiments/registry.ts'
import type { AtlasMode, ExperimentDefinition, ParameterPathRun } from './experiments/types.ts'
import { createAtlasMarkup, formatAtlasReadout } from './ui/atlas-markup.ts'
import { drawFit, drawLoss, drawParameterPath } from './ui/canvas-renderer.ts'

const stableColor = '#315e82'
const dangerColor = '#c7472f'
const app = document.querySelector<HTMLDivElement>('#app')!
let state: AtlasControllerState = restoreAtlasControllerState(window.location.hash)
let timer: number | undefined

app.innerHTML = createAtlasMarkup(getAtlasFrame(state))

const headerExperimentCount = document.querySelector<HTMLElement>('#header-experiment-count')!
const experimentIndex = document.querySelector<HTMLElement>('#experiment-index')!
const experimentEyebrow = document.querySelector<HTMLElement>('#experiment-eyebrow')!
const experimentTitle = document.querySelector<HTMLElement>('#experiment-title')!
const experimentLede = document.querySelector<HTMLElement>('#experiment-lede')!
const experimentThesis = document.querySelector<HTMLElement>('#experiment-thesis strong')!
const experimentButtons = [...document.querySelectorAll<HTMLButtonElement>('.experiment-button')]
const conditionGroup = document.querySelector<HTMLElement>('.mode-switch')!
const modeButtons = [...document.querySelectorAll<HTMLButtonElement>('.mode-button')]
const conditionLabels = (['stable', 'unstable'] as const).map((mode) => ({
  mode,
  button: document.querySelector<HTMLButtonElement>(`#condition-${mode}`)!,
  label: document.querySelector<HTMLElement>(`#condition-${mode}-label`)!,
  value: document.querySelector<HTMLElement>(`#condition-${mode}-value`)!,
}))
const range = document.querySelector<HTMLInputElement>('#step-range')!
const stepOutput = document.querySelector<HTMLOutputElement>('#step-output')!
const playButton = document.querySelector<HTMLButtonElement>('#play-button')!
const resetButton = document.querySelector<HTMLButtonElement>('#reset-button')!
const fitPlotKicker = document.querySelector<HTMLElement>('#fit-plot-kicker')!
const fitPlotTitle = document.querySelector<HTMLElement>('#fit-plot-title')!
const fitPlotLegend = document.querySelector<HTMLElement>('#fit-plot-legend')!
const fitAxisX = document.querySelector<HTMLElement>('#fit-axis-x')!
const fitAxisY = document.querySelector<HTMLElement>('#fit-axis-y')!
const fitCanvas = document.querySelector<HTMLCanvasElement>('#fit-canvas')!
const lossCanvas = document.querySelector<HTMLCanvasElement>('#loss-canvas')!
const lossTrend = document.querySelector<HTMLElement>('#loss-trend')!
const statusLight = document.querySelector<HTMLElement>('#status-light')!
const symptomCopy = document.querySelector<HTMLElement>('#symptom-copy')!
const causeCopy = document.querySelector<HTMLElement>('#cause-copy')!
const correctionCopy = document.querySelector<HTMLElement>('#correction-copy')!
const caveatCopy = document.querySelector<HTMLElement>('#caveat-copy')!
const readoutLabels = [1, 2, 3, 4].map((index) => document.querySelector<HTMLElement>(`#readout-${index}-label`)!)
const readoutValues = [1, 2, 3, 4].map((index) => document.querySelector<HTMLElement>(`#readout-${index}-value`)!)
const liveStatus = document.querySelector<HTMLElement>('#live-status')!

function getConditionColor(mode: AtlasMode): string {
  return mode === 'stable' ? stableColor : dangerColor
}

function getComparisonRuns(definition: ExperimentDefinition): ParameterPathRun[] {
  return (['stable', 'unstable'] as const)
    .map((mode) => definition.conditions[mode].run)
    .filter((run): run is ParameterPathRun => run.kind === 'parameter-path')
}

function render(announcementState?: AtlasAnnouncementState): void {
  const frame = getAtlasFrame(state)
  const { definition, mode, run } = frame
  const index = String(definition.order).padStart(2, '0')
  const color = getConditionColor(mode)
  playButton.textContent = getPlayButtonLabel(frame, timer !== undefined)
  const plotCopy = run.kind === 'fit'
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

  headerExperimentCount.textContent = `Experiment ${index} / ${String(experimentRegistry.length).padStart(2, '0')}`
  experimentIndex.textContent = index
  experimentEyebrow.textContent = definition.eyebrow
  experimentTitle.textContent = definition.title
  experimentLede.textContent = definition.lede
  experimentThesis.textContent = definition.thesis
  experimentButtons.forEach((button) => {
    const selected = button.dataset.experiment === definition.id
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
    button.closest('li')?.classList.toggle('is-active', selected)
  })

  conditionGroup.setAttribute('aria-label', `${definition.shortLabel} run condition`)
  conditionLabels.forEach(({ button, label, mode: buttonMode, value }) => {
    const condition = definition.conditions[buttonMode]
    const selected = buttonMode === mode
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
    label.textContent = condition.label
    value.textContent = condition.value
  })
  range.max = String(frame.maxStep)
  range.value = String(frame.step)
  stepOutput.value = `${frame.step} / ${frame.maxStep}`

  fitPlotKicker.textContent = plotCopy.kicker
  fitPlotTitle.textContent = plotCopy.title
  fitPlotLegend.lastChild!.textContent = plotCopy.legend
  fitCanvas.setAttribute('aria-label', plotCopy.canvasLabel)
  fitAxisX.textContent = plotCopy.axisX
  fitAxisY.textContent = plotCopy.axisY
  if (run.kind === 'fit') drawFit(fitCanvas, run, run.history[frame.step], color)
  else drawParameterPath(fitCanvas, run, getComparisonRuns(definition), frame.step, color)
  drawLoss(lossCanvas, run.history, frame.step, color)

  lossTrend.textContent = frame.trend
  lossTrend.classList.toggle('is-danger', frame.trend === 'rising')
  lossTrend.classList.toggle('is-stable', frame.trend === 'falling')
  statusLight.classList.toggle('is-danger', frame.trend === 'rising')
  statusLight.classList.toggle('is-stable', frame.trend === 'falling')
  symptomCopy.textContent = frame.activeSymptom
  causeCopy.textContent = definition.diagnosis.cause
  correctionCopy.textContent = definition.diagnosis.correction
  caveatCopy.textContent = definition.diagnosis.caveat
  frame.readouts.forEach((readout, index) => {
    readoutLabels[index].textContent = readout.label
    readoutValues[index].textContent = formatAtlasReadout(readout)
  })
  if (announcementState !== undefined) {
    liveStatus.textContent = formatAtlasLiveAnnouncement(frame, announcementState)
  }
}

function syncUrl(): void {
  const nextUrl = `${window.location.pathname}${window.location.search}${serializeAtlasState(state)}`
  window.history.replaceState(null, '', nextUrl)
}

function renderAndSync(announcementState?: AtlasAnnouncementState): void {
  render(announcementState)
  syncUrl()
}

function stop(announcementState: AtlasAnnouncementState | false = false): void {
  if (timer !== undefined) window.clearInterval(timer)
  timer = undefined
  if (announcementState) renderAndSync(announcementState)
}

function play(): void {
  if (timer !== undefined) {
    stop('paused')
    return
  }
  const frame = getAtlasFrame(state)
  if (frame.step >= frame.maxStep) {
    state = selectStep(state, 0)
  }
  timer = window.setInterval(() => {
    const currentFrame = getAtlasFrame(state)
    state = selectStep(state, currentFrame.step + 1)
    const nextFrame = getAtlasFrame(state)
    if (nextFrame.step >= nextFrame.maxStep) {
      stop(false)
      renderAndSync('complete')
      return
    }
    renderAndSync()
  }, 420)
  renderAndSync('running')
}

document.querySelector<HTMLAnchorElement>('.wordmark')!.addEventListener('click', (event) => {
  event.preventDefault()
  document.querySelector('#top')!.scrollIntoView()
})

document.querySelector<HTMLAnchorElement>('.skip-link')!.addEventListener('click', (event) => {
  event.preventDefault()
  const main = document.querySelector<HTMLElement>('#top')!
  window.requestAnimationFrame(() => {
    main.focus()
    main.scrollIntoView()
  })
})

experimentButtons.forEach((button) => {
  button.addEventListener('click', () => {
    stop(false)
    state = selectExperiment(state, button.dataset.experiment)
    renderAndSync('updated')
  })
})

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    stop(false)
    state = selectMode(state, button.dataset.mode as AtlasMode)
    renderAndSync('updated')
  })
})

range.addEventListener('input', () => {
  stop(false)
  state = selectStep(state, Number(range.value))
  renderAndSync('updated')
})
playButton.addEventListener('click', play)
resetButton.addEventListener('click', () => {
  stop(false)
  state = selectStep(state, 0)
  renderAndSync('updated')
})

new ResizeObserver(() => render()).observe(document.querySelector('.plots')!)
renderAndSync()
