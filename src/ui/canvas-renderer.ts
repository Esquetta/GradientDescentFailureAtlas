import type { GradientDescentStep, Point } from '../core/gradient-descent.ts'
import type { MultivariateGradientDescentStep } from '../core/multivariate-gradient-descent.ts'
import type { FitRun, ParameterPathRun } from '../experiments/types.ts'

const INK = '#2b2922'
const GRID = 'rgba(42, 40, 33, 0.12)'
const PAPER = '#f6f0df'
const DANGER = '#c7472f'
const PLOT_PADDING = 28

export interface AxisBounds {
  min: number
  max: number
}

export interface PlotBounds {
  x: AxisBounds
  y: AxisBounds
}

function padAxis(values: readonly number[]): AxisBounds {
  const finite = values.filter(Number.isFinite)
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const span = max - min
  const padding = span === 0 ? Math.max(1, Math.abs(min) * 0.1) : span * 0.1

  return { min: min - padding, max: max + padding }
}

export function getFitBounds(points: readonly Point[]): PlotBounds {
  return {
    x: padAxis(points.map((point) => point.x)),
    y: padAxis(points.map((point) => point.y)),
  }
}

export function getParameterPathBounds(runs: readonly ParameterPathRun[]): PlotBounds {
  const weights = runs.flatMap((run) => [
    ...run.history.map((step) => step.parameters.weights),
    run.optimumWeights,
  ])

  return {
    x: padAxis(weights.map((pair) => pair[0])),
    y: padAxis(weights.map((pair) => pair[1])),
  }
}

interface CanvasSurface {
  context: CanvasRenderingContext2D
  width: number
  height: number
}

export function prepareCanvas(
  canvas: HTMLCanvasElement,
  devicePixelRatio = window.devicePixelRatio || 1,
): CanvasSurface | null {
  const { width, height } = canvas.getBoundingClientRect()
  if (width <= 0 || height <= 0) return null

  const ratio = devicePixelRatio
  const intrinsicWidth = Math.max(1, Math.round(width * ratio))
  const intrinsicHeight = Math.max(1, Math.round(height * ratio))
  if (canvas.width !== intrinsicWidth) canvas.width = intrinsicWidth
  if (canvas.height !== intrinsicHeight) canvas.height = intrinsicHeight
  const context = canvas.getContext('2d')
  if (!context) return null
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)

  return { context, width, height }
}

function project(value: number, bounds: AxisBounds, start: number, end: number): number {
  return start + ((value - bounds.min) / (bounds.max - bounds.min)) * (end - start)
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.strokeStyle = GRID
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

function drawAxes(
  context: CanvasRenderingContext2D,
  bounds: PlotBounds,
  width: number,
  height: number,
): void {
  const x = (value: number) => project(value, bounds.x, PLOT_PADDING, width - PLOT_PADDING)
  const y = (value: number) => project(value, bounds.y, height - PLOT_PADDING, PLOT_PADDING)

  context.strokeStyle = INK
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(x(bounds.x.min), y(0))
  context.lineTo(x(bounds.x.max), y(0))
  context.moveTo(x(0), y(bounds.y.min))
  context.lineTo(x(0), y(bounds.y.max))
  context.stroke()
}

function drawPath(
  context: CanvasRenderingContext2D,
  history: readonly MultivariateGradientDescentStep[],
  step: number,
  x: (value: number) => number,
  y: (value: number) => number,
  color: string,
): void {
  const visible = history.slice(0, step + 1)
  if (visible.length === 0) return

  context.strokeStyle = color
  context.lineWidth = 3
  context.beginPath()
  visible.forEach((entry, index) => {
    const [weight1, weight2] = entry.parameters.weights
    if (index === 0) context.moveTo(x(weight1), y(weight2))
    else context.lineTo(x(weight1), y(weight2))
  })
  context.stroke()
}

export function drawFit(
  canvas: HTMLCanvasElement,
  run: FitRun,
  currentStep: GradientDescentStep,
  color: string,
): void {
  const surface = prepareCanvas(canvas)
  if (!surface) return

  const bounds = getFitBounds(run.points)
  const x = (value: number) => project(value, bounds.x, PLOT_PADDING, surface.width - PLOT_PADDING)
  const y = (value: number) => project(value, bounds.y, surface.height - PLOT_PADDING, PLOT_PADDING)
  const { context, width, height } = surface
  drawGrid(context, width, height)
  drawAxes(context, bounds, width, height)

  context.strokeStyle = color
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(x(bounds.x.min), y(currentStep.parameters.slope * bounds.x.min + currentStep.parameters.intercept))
  context.lineTo(x(bounds.x.max), y(currentStep.parameters.slope * bounds.x.max + currentStep.parameters.intercept))
  context.stroke()

  run.points.forEach((point, index) => {
    const highlighted = index === run.highlightedPointIndex
    context.fillStyle = highlighted ? DANGER : PAPER
    context.strokeStyle = highlighted ? DANGER : INK
    context.lineWidth = 2
    context.beginPath()
    context.arc(x(point.x), y(point.y), highlighted ? 6 : 5, 0, Math.PI * 2)
    context.fill()
    context.stroke()
  })
}

export function drawParameterPath(
  canvas: HTMLCanvasElement,
  run: ParameterPathRun,
  comparisonRuns: readonly ParameterPathRun[],
  step: number,
  color: string,
): void {
  const surface = prepareCanvas(canvas)
  if (!surface) return

  const bounds = getParameterPathBounds(comparisonRuns)
  const x = (value: number) => project(value, bounds.x, PLOT_PADDING, surface.width - PLOT_PADDING)
  const y = (value: number) => project(value, bounds.y, surface.height - PLOT_PADDING, PLOT_PADDING)
  const { context, width, height } = surface
  drawGrid(context, width, height)
  drawAxes(context, bounds, width, height)
  drawPath(context, run.history, step, x, y, color)

  const start = run.history[0].parameters.weights
  const current = run.history[Math.min(step, run.history.length - 1)].parameters.weights
  context.fillStyle = PAPER
  context.strokeStyle = color
  context.lineWidth = 2
  context.strokeRect(x(start[0]) - 4, y(start[1]) - 4, 8, 8)
  context.fillStyle = color
  context.beginPath()
  context.arc(x(current[0]), y(current[1]), 5, 0, Math.PI * 2)
  context.fill()

  const [optimum1, optimum2] = run.optimumWeights
  context.strokeStyle = INK
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(x(optimum1) - 6, y(optimum2) - 6)
  context.lineTo(x(optimum1) + 6, y(optimum2) + 6)
  context.moveTo(x(optimum1) + 6, y(optimum2) - 6)
  context.lineTo(x(optimum1) - 6, y(optimum2) + 6)
  context.stroke()
}

export function drawLoss(
  canvas: HTMLCanvasElement,
  history: readonly { loss: number }[],
  step: number,
  color: string,
): void {
  const surface = prepareCanvas(canvas)
  if (!surface || history.length === 0) return

  const { context, width, height } = surface
  const logLosses = history.map((entry) => Math.log10(entry.loss + 1))
  const maxLoss = Math.max(1, ...logLosses)
  const x = (index: number) => PLOT_PADDING + (index / Math.max(1, history.length - 1)) * (width - PLOT_PADDING * 2)
  const y = (loss: number) => height - PLOT_PADDING - (Math.log10(loss + 1) / maxLoss) * (height - PLOT_PADDING * 2)
  drawGrid(context, width, height)

  const visible = history.slice(0, step + 1)
  context.strokeStyle = color
  context.lineWidth = 3
  context.beginPath()
  visible.forEach((entry, index) => {
    if (index === 0) context.moveTo(x(index), y(entry.loss))
    else context.lineTo(x(index), y(entry.loss))
  })
  context.stroke()

  const currentIndex = Math.min(step, history.length - 1)
  context.fillStyle = color
  context.beginPath()
  context.arc(x(currentIndex), y(history[currentIndex].loss), 5, 0, Math.PI * 2)
  context.fill()
}
