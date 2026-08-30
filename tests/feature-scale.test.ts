import { describe, expect, it } from 'vitest'
import * as experiment from '../src/experiments/feature-scale.ts'

describe('feature-scale experiment', () => {
  it('contrasts normalized convergence with raw-scale divergence', () => {
    if (!('createFeatureScaleExperiment' in experiment)) {
      expect(experiment).toHaveProperty('createFeatureScaleExperiment')
      return
    }

    const result = experiment.createFeatureScaleExperiment()

    expect(result.normalizedPoints.map((point) => point.y)).toEqual(result.rawPoints.map((point) => point.y))
    expect(result.normalizedPoints).toHaveLength(7)
    expect(result.rawPoints).toHaveLength(7)
    expect(result.normalizedPoints.map((point) => point.x)).toEqual([-3, -2, -1, 0, 1, 2, 3])
    expect(result.rawPoints.map((point) => point.x)).toEqual([-30, -20, -10, 0, 10, 20, 30])
    expect(result.learningRate).toBe(0.08)
    expect(result.iterations).toBe(18)
    expect(result.normalized.at(-1)!.loss).toBeLessThan(0.001)
    expect(result.raw[1].loss).toBeGreaterThan(result.raw[0].loss)
    expect(result.raw.at(-1)!.loss).toBeGreaterThan(1e20)
  })
})
