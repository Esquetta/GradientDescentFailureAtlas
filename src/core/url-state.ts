export type AtlasMode = 'stable' | 'unstable'

export interface AtlasState {
  mode: AtlasMode
  step: number
}

const defaultState: AtlasState = {
  mode: 'unstable',
  step: 0,
}

function parseMode(value: string | null): AtlasMode {
  return value === 'stable' || value === 'unstable' ? value : defaultState.mode
}

function parseStep(value: string | null, maxStep: number): number {
  if (value === null || !/^\d+$/.test(value)) {
    return defaultState.step
  }

  const step = Number(value)
  return Number.isSafeInteger(step) && step <= maxStep ? step : defaultState.step
}

export function parseAtlasState(fragment: string, maxStep: number): AtlasState {
  const searchParams = new URLSearchParams(fragment.replace(/^#/, ''))

  return {
    mode: parseMode(searchParams.get('mode')),
    step: parseStep(searchParams.get('step'), maxStep),
  }
}

export function serializeAtlasState(state: AtlasState): string {
  return `#mode=${state.mode}&step=${state.step}`
}
