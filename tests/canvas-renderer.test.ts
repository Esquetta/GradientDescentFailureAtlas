import { describe, expect, it } from 'vitest'
import { getExperimentDefinition } from '../src/experiments/registry.ts'
import {
  getFitBounds,
  getParameterPathBounds,
  prepareCanvas,
} from '../src/ui/canvas-renderer.ts'

describe('canvas renderer bounds', () => {
  it('preserves an unchanged canvas backing store while resetting its DPR transform', () => {
    let width = 0
    let height = 0
    let widthAssignments = 0
    let heightAssignments = 0
    const transforms: number[][] = []
    const context = {
      setTransform: (...values: number[]) => transforms.push(values),
      clearRect: () => undefined,
    }
    const canvas = {
      get width() { return width },
      set width(value: number) { widthAssignments += 1; width = value },
      get height() { return height },
      set height(value: number) { heightAssignments += 1; height = value },
      getBoundingClientRect: () => ({ width: 120, height: 80 }),
      getContext: () => context,
    } as unknown as HTMLCanvasElement

    prepareCanvas(canvas, 2)
    prepareCanvas(canvas, 2)

    expect({ widthAssignments, heightAssignments }).toEqual({ widthAssignments: 1, heightAssignments: 1 })
    expect(transforms).toEqual([[2, 0, 0, 2, 0, 0], [2, 0, 0, 2, 0, 0]])
  })

  it('keeps raw feature observations around plus and minus thirty in fit bounds', () => {
    const run = getExperimentDefinition('feature-scale').conditions.unstable.run

    expect(run.kind).toBe('fit')
    const bounds = getFitBounds(run.points)

    expect(bounds.x.min).toBeLessThanOrEqual(-30)
    expect(bounds.x.max).toBeGreaterThanOrEqual(30)
  })

  it('keeps the outlier observation at 8.4 in fit bounds', () => {
    const run = getExperimentDefinition('outlier-pull').conditions.unstable.run

    expect(run.kind).toBe('fit')
    const bounds = getFitBounds(run.points)

    expect(bounds.y.max).toBeGreaterThanOrEqual(8.4)
  })

  it('pads a zero-span axis into a usable range', () => {
    const bounds = getFitBounds([{ x: 4, y: 7 }])

    expect(bounds.x.min).toBeLessThan(4)
    expect(bounds.x.max).toBeGreaterThan(4)
    expect(bounds.y.min).toBeLessThan(7)
    expect(bounds.y.max).toBeGreaterThan(7)
  })

  it('shares correlated path bounds across both conditions and the known optimum', () => {
    const definition = getExperimentDefinition('correlated-features')
    const stable = definition.conditions.stable.run
    const unstable = definition.conditions.unstable.run

    expect(stable.kind).toBe('parameter-path')
    expect(unstable.kind).toBe('parameter-path')
    const bounds = getParameterPathBounds([stable, unstable])

    for (const run of [stable, unstable]) {
      for (const step of run.history) {
        expect(bounds.x.min).toBeLessThanOrEqual(step.parameters.weights[0])
        expect(bounds.x.max).toBeGreaterThanOrEqual(step.parameters.weights[0])
        expect(bounds.y.min).toBeLessThanOrEqual(step.parameters.weights[1])
        expect(bounds.y.max).toBeGreaterThanOrEqual(step.parameters.weights[1])
      }
      expect(bounds.x.min).toBeLessThanOrEqual(run.optimumWeights[0])
      expect(bounds.x.max).toBeGreaterThanOrEqual(run.optimumWeights[0])
      expect(bounds.y.min).toBeLessThanOrEqual(run.optimumWeights[1])
      expect(bounds.y.max).toBeGreaterThanOrEqual(run.optimumWeights[1])
    }
  })
})
