import type { AtlasMode, ExperimentId } from '../experiments/types.ts'

export type { AtlasMode } from '../experiments/types.ts'

export interface AtlasState {
  experimentId: ExperimentId
  mode: AtlasMode
  step: number
}

type LegacyAtlasState = Omit<AtlasState, 'experimentId'>

export type MaxStepResolver = (experimentId: ExperimentId, mode: AtlasMode) => number

const defaultExperimentId: ExperimentId = 'learning-rate'

const defaultState: AtlasState = {
  experimentId: defaultExperimentId,
  mode: 'unstable',
  step: 0,
}

const experimentIds = new Set<ExperimentId>([
  'learning-rate',
  'feature-scale',
  'outlier-pull',
  'correlated-features',
  'initialization',
])

function parseExperimentId(value: string | null): ExperimentId {
  return value !== null && experimentIds.has(value as ExperimentId)
    ? (value as ExperimentId)
    : defaultState.experimentId
}

function parseMode(value: string | null): AtlasMode {
  return value === 'stable' || value === 'unstable' ? value : defaultState.mode
}

function parseStep(value: string | null, maxStep: number): number {
  if (value === null || !/^\d+$/.test(value)) {
    return defaultState.step
  }

  const step = Number(value)
  return Number.isSafeInteger(step) && Number.isSafeInteger(maxStep) && step <= maxStep
    ? step
    : defaultState.step
}

export function parseAtlasState(fragment: string, maxStep: number): AtlasState
export function parseAtlasState(fragment: string, maxStepFor: MaxStepResolver): AtlasState
export function parseAtlasState(
  fragment: string,
  maxStepOrResolver: number | MaxStepResolver,
): AtlasState {
  const searchParams = new URLSearchParams(fragment.replace(/^#/, ''))
  const experimentId =
    typeof maxStepOrResolver === 'number'
      ? defaultState.experimentId
      : parseExperimentId(searchParams.get('experiment'))
  const mode = parseMode(searchParams.get('mode'))
  const maxStep =
    typeof maxStepOrResolver === 'number'
      ? maxStepOrResolver
      : maxStepOrResolver(experimentId, mode)

  return {
    experimentId,
    mode,
    step: parseStep(searchParams.get('step'), maxStep),
  }
}

export function serializeAtlasState(state: AtlasState): string
export function serializeAtlasState(state: LegacyAtlasState): string
export function serializeAtlasState(state: AtlasState | LegacyAtlasState): string {
  const experimentId = 'experimentId' in state ? state.experimentId : defaultState.experimentId
  return `#experiment=${experimentId}&mode=${state.mode}&step=${state.step}`
}
