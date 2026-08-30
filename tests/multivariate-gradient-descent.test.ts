import { describe, expect, it } from 'vitest'

async function loadEngine() {
  return import('../src/core/multivariate-gradient-descent.ts').catch(() => undefined)
}

describe('multivariate gradient descent', () => {
  it('calculates analytical MSE gradients for two features', async () => {
    const engine = await loadEngine()

    expect(engine).toBeDefined()
    if (!engine) {
      return
    }

    expect(engine).toHaveProperty('meanSquaredErrorMultivariate')
    expect(engine).toHaveProperty('computeMultivariateGradient')

    const points = [
      { features: [1, 0], y: 2 },
      { features: [0, 1], y: -1 },
    ]
    const parameters = { weights: [0, 0], intercept: 0 }

    expect(engine.meanSquaredErrorMultivariate(points, parameters)).toBe(2.5)
    expect(engine.computeMultivariateGradient(points, parameters)).toEqual({
      weights: [-2, 1],
      intercept: -1,
    })
  })

  it('records iteration zero and reduces loss with a stable learning rate', async () => {
    const engine = await loadEngine()

    expect(engine).toBeDefined()
    if (!engine) {
      return
    }

    expect(engine).toHaveProperty('runMultivariateGradientDescent')

    const history = engine.runMultivariateGradientDescent(
      [
        { features: [1, 0], y: 2 },
        { features: [0, 1], y: -1 },
      ],
      { weights: [0, 0], intercept: 0 },
      { learningRate: 0.1, iterations: 25 },
    )

    expect(history).toHaveLength(26)
    expect(history[0].iteration).toBe(0)
    expect(history.at(-1)!.loss).toBeLessThan(history[0].loss)
  })

  it('rejects an empty dataset', async () => {
    const engine = await loadEngine()

    expect(engine).toBeDefined()
    if (!engine) {
      return
    }

    expect(() =>
      engine.meanSquaredErrorMultivariate([], { weights: [0, 0], intercept: 0 }),
    ).toThrow('At least one point is required')
  })

  it('rejects feature dimensions that do not match the weights', async () => {
    const engine = await loadEngine()

    expect(engine).toBeDefined()
    if (!engine) {
      return
    }

    const points = [{ features: [1], y: 2 }]
    const parameters = { weights: [0, 0], intercept: 0 }

    expect(() => engine.meanSquaredErrorMultivariate(points, parameters)).toThrow(
      'Feature dimensions must match weights',
    )
    expect(() => engine.computeMultivariateGradient(points, parameters)).toThrow(
      'Feature dimensions must match weights',
    )
  })

  it('rejects invalid iteration counts', async () => {
    const engine = await loadEngine()

    expect(engine).toBeDefined()
    if (!engine) {
      return
    }

    for (const iterations of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        engine.runMultivariateGradientDescent(
          [{ features: [1], y: 2 }],
          { weights: [0], intercept: 0 },
          { learningRate: 0.1, iterations },
        ),
      ).toThrow('Iterations must be a finite non-negative integer')
    }
  })
})
