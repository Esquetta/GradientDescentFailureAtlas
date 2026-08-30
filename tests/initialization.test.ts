import { describe, expect, it } from 'vitest'
import * as experiment from '../src/experiments/initialization.ts'

describe('initialization experiment', () => {
  it('separates the visible fixed budget from the longer convergence check', () => {
    if (!('createInitializationExperiment' in experiment)) {
      expect(experiment).toHaveProperty('createInitializationExperiment')
      return
    }

    const result = experiment.createInitializationExperiment()
    const nearFinal = result.near.at(-1)!
    const farFinal = result.far.at(-1)!
    const nearConverged = result.convergence.near.at(-1)!
    const farConverged = result.convergence.far.at(-1)!

    expect(result.points).toHaveLength(7)
    expect(result.nearStart).toEqual({ slope: 0, intercept: 0 })
    expect(result.farStart).toEqual({ slope: 6, intercept: -4 })
    expect(result.learningRate).toBe(0.08)
    expect(result.iterations).toBe(18)
    expect(result.near).toHaveLength(19)
    expect(result.far).toHaveLength(19)
    for (const history of [result.near, result.far]) {
      for (let index = 1; index < history.length; index += 1) {
        expect(history[index - 1].loss).toBeGreaterThanOrEqual(history[index].loss)
      }
    }
    expect(farFinal.loss).toBeGreaterThan(nearFinal.loss * 100)
    expect(nearFinal.loss).toBeLessThan(result.near[0].loss)
    expect(farFinal.loss).toBeLessThan(result.far[0].loss)
    expect(result.convergence.iterations).toBe(120)
    expect(nearConverged.parameters.slope).toBeCloseTo(1.2, 6)
    expect(nearConverged.parameters.intercept).toBeCloseTo(0.4, 6)
    expect(farConverged.parameters.slope).toBeCloseTo(1.2, 6)
    expect(farConverged.parameters.intercept).toBeCloseTo(0.4, 6)
    expect(nearConverged.loss).toBeLessThan(1e-12)
    expect(farConverged.loss).toBeLessThan(1e-12)
  })
})
