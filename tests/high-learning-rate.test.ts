import { describe, expect, it } from 'vitest'
import * as experiment from '../src/experiments/high-learning-rate.ts'

describe('high learning-rate experiment', () => {
  it('contrasts stable convergence with an unstable run', () => {
    if (!('createHighLearningRateExperiment' in experiment)) {
      expect(experiment).toHaveProperty('createHighLearningRateExperiment')
      return
    }

    const result = experiment.createHighLearningRateExperiment()

    expect(result.points).toHaveLength(7)
    expect(result.stable.at(-1)!.loss).toBeLessThan(result.stable[0].loss)
    expect(result.unstable.at(-1)!.loss).toBeGreaterThan(result.unstable[0].loss)
  })
})
