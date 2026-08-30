import { getExperimentDefinition } from '../experiments/registry.ts'
import type {
  AtlasMode,
  ExperimentCondition,
  ExperimentDefinition,
  ExperimentId,
  ExperimentRun,
} from '../experiments/types.ts'
import { parseAtlasState, type AtlasState } from './url-state.ts'

export type AtlasControllerState = AtlasState

export type AtlasTrend = 'waiting' | 'falling' | 'rising'
export type AtlasAnnouncementState = 'updated' | 'running' | 'paused' | 'complete'

export interface AtlasReadout {
  label: string
  value: number
}

export interface AtlasFrame {
  definition: ExperimentDefinition
  mode: AtlasMode
  condition: ExperimentCondition
  run: ExperimentRun
  step: number
  currentStep: ExperimentRun['history'][number]
  maxStep: number
  trend: AtlasTrend
  activeSymptom: string
  readouts: readonly [AtlasReadout, AtlasReadout, AtlasReadout, AtlasReadout]
}

function formatLoss(loss: number): string {
  return loss < 1000 ? loss.toFixed(4) : loss.toExponential(2)
}

export function formatAtlasLiveAnnouncement(
  frame: AtlasFrame,
  announcementState: AtlasAnnouncementState,
): string {
  const identity = `${frame.definition.shortLabel}, ${frame.condition.label}`
  if (announcementState === 'running') {
    return `${identity}. Running from step ${frame.step} of ${frame.maxStep}.`
  }

  const status = announcementState === 'paused'
    ? 'Paused'
    : announcementState === 'complete'
      ? 'Complete'
      : 'Step'
  const position = announcementState === 'updated'
    ? `${status} ${frame.step} of ${frame.maxStep}`
    : `${status} at step ${frame.step} of ${frame.maxStep}`

  return `${identity}. ${position}. Loss ${formatLoss(frame.currentStep.loss)}; ${frame.trend}.`
}

export function getPlayButtonLabel(frame: AtlasFrame, isPlaying: boolean): string {
  if (isPlaying) return 'Pause'
  return frame.step >= frame.maxStep ? 'Run again' : 'Run experiment'
}

export function getRunMaxStep(experimentId: ExperimentId, mode: AtlasMode): number {
  return getExperimentDefinition(experimentId).conditions[mode].run.history.length - 1
}

export function restoreAtlasControllerState(fragment: string): AtlasControllerState {
  return parseAtlasState(fragment, getRunMaxStep)
}

export function selectExperiment(
  _currentState: AtlasControllerState,
  requestedId: string | null | undefined,
): AtlasControllerState {
  return { experimentId: getExperimentDefinition(requestedId).id, mode: 'unstable', step: 0 }
}

export function selectMode(
  currentState: AtlasControllerState,
  mode: AtlasMode,
): AtlasControllerState {
  return { experimentId: currentState.experimentId, mode, step: 0 }
}

export function selectStep(currentState: AtlasControllerState, step: number): AtlasControllerState {
  const maxStep = getRunMaxStep(currentState.experimentId, currentState.mode)

  return {
    ...currentState,
    step: Number.isInteger(step) && step >= 0 && step <= maxStep ? step : 0,
  }
}

function createReadouts(run: ExperimentRun, currentStep: ExperimentRun['history'][number]): AtlasFrame['readouts'] {
  if (run.kind === 'fit') {
    const step = currentStep as typeof run.history[number]
    return [
      { label: 'iteration', value: step.iteration },
      { label: 'slope / w', value: step.parameters.slope },
      { label: 'intercept / b', value: step.parameters.intercept },
      { label: 'mean squared error', value: step.loss },
    ]
  }

  const step = currentStep as typeof run.history[number]
  return [
    { label: 'iteration', value: step.iteration },
    { label: 'weight 1 / w1', value: step.parameters.weights[0] },
    { label: 'weight 2 / w2', value: step.parameters.weights[1] },
    { label: 'mean squared error', value: step.loss },
  ]
}

export function getAtlasFrame(state: AtlasControllerState): AtlasFrame {
  const definition = getExperimentDefinition(state.experimentId)
  const mode = state.mode === 'stable' ? 'stable' : 'unstable'
  const condition = definition.conditions[mode]
  const run = condition.run
  const maxStep = run.history.length - 1
  const step = Number.isInteger(state.step) && state.step >= 0 && state.step <= maxStep ? state.step : 0
  const currentStep = run.history[step]
  const previousLoss = step === 0 ? currentStep.loss : run.history[step - 1].loss
  const trend: AtlasTrend = step === 0 ? 'waiting' : currentStep.loss > previousLoss ? 'rising' : 'falling'

  return {
    definition,
    mode,
    condition,
    run,
    step,
    currentStep,
    maxStep,
    trend,
    activeSymptom: step === 0
      ? definition.diagnosis.initialSymptom
      : mode === 'stable'
        ? definition.diagnosis.stableSymptom
        : definition.diagnosis.unstableSymptom,
    readouts: createReadouts(run, currentStep),
  }
}
