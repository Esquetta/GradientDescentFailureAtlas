import { describe, expect, it } from 'vitest'
import {
  formatAtlasLiveAnnouncement,
  getAtlasFrame,
  getPlayButtonLabel,
  getRunMaxStep,
  restoreAtlasControllerState,
  selectExperiment,
  selectMode,
  selectStep,
} from '../src/core/atlas-controller.ts'
import { getExperimentDefinition } from '../src/experiments/registry.ts'

describe('atlas controller', () => {
  it('restores experiment-aware and legacy learning-rate fragments', () => {
    expect(
      restoreAtlasControllerState('#experiment=correlated-features&mode=stable&step=11'),
    ).toEqual({ experimentId: 'correlated-features', mode: 'stable', step: 11 })
    expect(restoreAtlasControllerState('#mode=stable&step=7')).toEqual({
      experimentId: 'learning-rate',
      mode: 'stable',
      step: 7,
    })
  })

  it('falls back safely for invalid experiment, mode, and step values', () => {
    expect(restoreAtlasControllerState('#experiment=unknown&mode=fast&step=500')).toEqual({
      experimentId: 'learning-rate',
      mode: 'unstable',
      step: 0,
    })
    expect(selectExperiment({ experimentId: 'learning-rate', mode: 'stable', step: 5 }, 'unknown')).toEqual({
      experimentId: 'learning-rate',
      mode: 'unstable',
      step: 0,
    })
    expect(selectStep({ experimentId: 'learning-rate', mode: 'stable', step: 5 }, 2.5)).toEqual({
      experimentId: 'learning-rate',
      mode: 'stable',
      step: 0,
    })
  })

  it('resets playback when selecting an experiment or mode', () => {
    expect(
      selectExperiment(
        { experimentId: 'learning-rate', mode: 'stable', step: 5 },
        'correlated-features',
      ),
    ).toEqual({ experimentId: 'correlated-features', mode: 'unstable', step: 0 })
    expect(
      selectMode({ experimentId: 'correlated-features', mode: 'unstable', step: 11 }, 'stable'),
    ).toEqual({ experimentId: 'correlated-features', mode: 'stable', step: 0 })
  })

  it('uses the selected registry run to determine the maximum selectable step', () => {
    const stable = getExperimentDefinition('correlated-features').conditions.stable.run
    expect(getRunMaxStep('correlated-features', 'stable')).toBe(stable.history.length - 1)
    expect(
      selectStep(
        { experimentId: 'correlated-features', mode: 'stable', step: 0 },
        stable.history.length,
      ),
    ).toEqual({ experimentId: 'correlated-features', mode: 'stable', step: 0 })
  })

  it('derives rising and falling trends from the active learning-rate run', () => {
    expect(
      getAtlasFrame({ experimentId: 'learning-rate', mode: 'unstable', step: 2 }).trend,
    ).toBe('rising')
    expect(
      getAtlasFrame({ experimentId: 'learning-rate', mode: 'stable', step: 2 }).trend,
    ).toBe('falling')
    expect(
      getAtlasFrame({ experimentId: 'learning-rate', mode: 'stable', step: 0 }).trend,
    ).toBe('waiting')
  })

  it('exposes the selected mode and history array index on the frame', () => {
    const frame = getAtlasFrame({ experimentId: 'feature-scale', mode: 'stable', step: 3 })

    expect(frame.mode).toBe('stable')
    expect(frame.step).toBe(3)
    expect(frame.currentStep).toBe(frame.run.history[3])
  })

  it('exposes parameter-path readouts and diagnosis for correlated features', () => {
    const frame = getAtlasFrame({ experimentId: 'correlated-features', mode: 'unstable', step: 1 })

    expect(frame.run.kind).toBe('parameter-path')
    expect(frame.readouts).toHaveLength(4)
    expect(frame.readouts.map((readout) => readout.label)).toEqual([
      'iteration',
      'weight 1 / w1',
      'weight 2 / w2',
      'mean squared error',
    ])
    expect(frame.activeSymptom).toBe(frame.definition.diagnosis.unstableSymptom)
  })

  it('uses the visible initialization budget without reading convergence history', () => {
    const frame = getAtlasFrame({ experimentId: 'initialization', mode: 'unstable', step: 0 })
    const definition = getExperimentDefinition('initialization')

    expect(frame.run).toBe(definition.conditions.unstable.run)
    expect(frame.maxStep).toBe(definition.conditions.unstable.run.history.length - 1)
    expect(frame.currentStep).toBe(definition.conditions.unstable.run.history[0])
  })

  it('formats concise distinct live announcements for running and paused playback', () => {
    const frame = getAtlasFrame({ experimentId: 'learning-rate', mode: 'stable', step: 2 })

    expect(formatAtlasLiveAnnouncement(frame, 'running')).toBe(
      'Learning rate, stable. Running from step 2 of 18.',
    )
    expect(formatAtlasLiveAnnouncement(frame, 'paused')).toBe(
      'Learning rate, stable. Paused at step 2 of 18. Loss 0.1764; falling.',
    )
  })

  it('derives the playback label from the selected frame and active timer state', () => {
    const start = getAtlasFrame({ experimentId: 'feature-scale', mode: 'unstable', step: 0 })
    const end = getAtlasFrame({
      experimentId: 'feature-scale',
      mode: 'unstable',
      step: start.maxStep,
    })

    expect(getPlayButtonLabel(start, true)).toBe('Pause')
    expect(getPlayButtonLabel(start, false)).toBe('Run experiment')
    expect(getPlayButtonLabel(end, false)).toBe('Run again')
  })
})
