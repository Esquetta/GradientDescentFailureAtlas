import { describe, expect, it } from 'vitest'
import * as experiment from '../src/experiments/outlier-pull.ts'

describe('outlier-pull experiment', () => {
  it('shows how one high residual shifts the fitted intercept', () => {
    if (!('createOutlierPullExperiment' in experiment)) {
      expect(experiment).toHaveProperty('createOutlierPullExperiment')
      return
    }

    const result = experiment.createOutlierPullExperiment()
    const affectedFinal = result.affected.at(-1)!

    expect(result.cleanPoints).toHaveLength(7)
    expect(result.affectedPoints).toHaveLength(8)
    expect(result.affectedPoints.slice(0, 7)).toEqual(result.cleanPoints)
    expect(result.affectedPoints.at(-1)).toEqual({ x: 0, y: 8.4 })
    expect(result.learningRate).toBe(0.08)
    expect(result.iterations).toBe(40)
    expect(affectedFinal.loss).toBeLessThan(result.affected[0].loss)
    expect(affectedFinal.parameters.slope).toBeCloseTo(1.2, 6)
    expect(affectedFinal.parameters.intercept).toBeCloseTo(1.4, 2)
    expect(result.evaluateCleanReferenceLoss(affectedFinal.parameters)).toBeGreaterThan(0.95)
    expect(result.clean.at(-1)!.loss).toBeLessThan(1e-6)
  })
})
