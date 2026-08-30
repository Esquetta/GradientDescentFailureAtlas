import { describe, expect, it } from 'vitest'

async function loadExperiment() {
  return import('../src/experiments/correlated-features.ts').catch(() => undefined)
}

function squaredNorm(points: { features: readonly number[] }[], index: number): number {
  return points.reduce((sum, point) => sum + point.features[index] ** 2, 0)
}

function correlation(points: { features: readonly number[] }[]): number {
  const numerator = points.reduce((sum, point) => sum + point.features[0] * point.features[1], 0)
  return numerator / Math.sqrt(squaredNorm(points, 0) * squaredNorm(points, 1))
}

function isNonIncreasing(history: { loss: number }[]): boolean {
  const tolerance = Number.EPSILON * history[0].loss
  return history.every(
    (step, index) => index === 0 || step.loss <= history[index - 1].loss + tolerance,
  )
}

describe('correlated features experiment', () => {
  it('uses equal-norm independent and correlated feature columns', async () => {
    const experiment = await loadExperiment()

    expect(experiment).toBeDefined()
    if (!experiment) {
      return
    }

    expect(experiment).toHaveProperty('createCorrelatedFeaturesExperiment')

    const result = experiment.createCorrelatedFeaturesExperiment()

    expect(result.z).toEqual([-3, -2, -1, 0, 1, 2, 3])
    expect(result.q).toEqual([1, -1, 0, 0, 0, -1, 1])
    expect(result.epsilon).toBe(0.2)
    expect(result.learningRate).toBe(0.08)
    expect(result.iterations).toBe(40)
    expect(squaredNorm(result.independentPoints, 0)).toBeCloseTo(
      squaredNorm(result.independentPoints, 1),
    )
    expect(squaredNorm(result.correlatedPoints, 0)).toBeCloseTo(
      squaredNorm(result.correlatedPoints, 1),
    )
    expect(correlation(result.independentPoints)).toBeCloseTo(0)
    expect(correlation(result.correlatedPoints)).toBeCloseTo(0.997155, 5)
  })

  it('exposes the controlled descent histories and their divergent outcomes', async () => {
    const experiment = await loadExperiment()

    expect(experiment).toBeDefined()
    if (!experiment) {
      return
    }

    const result = experiment.createCorrelatedFeaturesExperiment()

    expect(result).toHaveProperty('independent')
    expect(result).toHaveProperty('correlated')
    expect(result.independent).toHaveLength(41)
    expect(result.correlated).toHaveLength(41)
    expect(result.independent.at(-1)!.loss).toBeLessThan(1e-10)
    expect(result.correlated.at(-1)!.loss).toBeGreaterThan(0.01)
    expect(
      Math.abs(
        result.correlated.at(-1)!.parameters.weights[0] -
          result.correlated.at(-1)!.parameters.weights[1] -
          2,
      ),
    ).toBeGreaterThan(1.5)
    expect(isNonIncreasing(result.independent)).toBe(true)
    expect(isNonIncreasing(result.correlated)).toBe(true)
  })
})
