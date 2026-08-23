import { describe, expect, it } from 'vitest'
import * as engine from '../src/core/gradient-descent.ts'

const points = [
  { x: 0, y: 1 },
  { x: 1, y: 3 },
  { x: 2, y: 5 },
]

describe('meanSquaredError', () => {
  it('returns zero for a perfect linear fit', () => {
    if (!('meanSquaredError' in engine)) {
      expect(engine).toHaveProperty('meanSquaredError')
      return
    }

    expect(engine.meanSquaredError(points, { slope: 2, intercept: 1 })).toBe(0)
  })

  it('rejects an empty dataset', () => {
    expect(() => engine.meanSquaredError([], { slope: 0, intercept: 0 })).toThrow(
      'At least one point is required',
    )
  })
})

describe('computeGradient', () => {
  it('calculates the analytical slope and intercept gradients', () => {
    if (!('computeGradient' in engine)) {
      expect(engine).toHaveProperty('computeGradient')
      return
    }

    const gradient = engine.computeGradient(points, { slope: 0, intercept: 0 })

    expect(gradient.slope).toBeCloseTo(-26 / 3)
    expect(gradient.intercept).toBeCloseTo(-6)
  })
})

describe('runGradientDescent', () => {
  it('records the initial state and reduces loss with a stable learning rate', () => {
    if (!('runGradientDescent' in engine)) {
      expect(engine).toHaveProperty('runGradientDescent')
      return
    }

    const history = engine.runGradientDescent(
      points,
      { slope: 0, intercept: 0 },
      { learningRate: 0.1, iterations: 25 },
    )

    expect(history).toHaveLength(26)
    expect(history[0].iteration).toBe(0)
    expect(history.at(-1)!.loss).toBeLessThan(history[0].loss)
  })
})
