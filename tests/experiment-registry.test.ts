import { describe, expect, it } from 'vitest'
import { createHighLearningRateExperiment } from '../src/experiments/high-learning-rate.ts'
import { experimentRegistry, getExperimentDefinition } from '../src/experiments/registry.ts'

describe('experiment registry', () => {
  it('orders the five complete experiment definitions with approved conditions', () => {
    const expectedDefinitions = [
      { id: 'learning-rate', order: 1, stable: ['stable', 'η 0.08'], unstable: ['unstable', 'η 0.32'] },
      { id: 'feature-scale', order: 2, stable: ['scaled', 'x × 1'], unstable: ['raw', 'x × 10'] },
      { id: 'outlier-pull', order: 3, stable: ['clean', '7 points'], unstable: ['outlier', '8 points'] },
      { id: 'correlated-features', order: 4, stable: ['independent', 'ρ 0.000'], unstable: ['correlated', 'ρ 0.997'] },
      { id: 'initialization', order: 5, stable: ['near start', '0, 0'], unstable: ['far start', '6, −4'] },
    ] as const

    expect(experimentRegistry.map((definition) => definition.id)).toEqual(
      expectedDefinitions.map((definition) => definition.id),
    )
    expect(experimentRegistry.map((definition) => definition.order)).toEqual(
      expectedDefinitions.map((definition) => definition.order),
    )

    for (const definition of experimentRegistry) {
      const expected = expectedDefinitions.find((candidate) => candidate.id === definition.id)

      expect(expected).toBeDefined()
      if (!expected) {
        return
      }

      expect([definition.conditions.stable.label, definition.conditions.stable.value]).toEqual(
        expected.stable,
      )
      expect([definition.conditions.unstable.label, definition.conditions.unstable.value]).toEqual(
        expected.unstable,
      )
      expect(definition.shortLabel).not.toHaveLength(0)
      expect(definition.eyebrow).not.toHaveLength(0)
      expect(definition.title).not.toHaveLength(0)
      expect(definition.lede).not.toHaveLength(0)
      expect(definition.thesis).not.toHaveLength(0)
      expect(definition.diagnosis.initialSymptom).not.toHaveLength(0)
      expect(definition.diagnosis.stableSymptom).not.toHaveLength(0)
      expect(definition.diagnosis.unstableSymptom).not.toHaveLength(0)
      expect(definition.diagnosis.cause).not.toHaveLength(0)
      expect(definition.diagnosis.correction).not.toHaveLength(0)
      expect(definition.diagnosis.caveat).not.toHaveLength(0)
      expect(definition.conditions.stable.run.history.length).toBeGreaterThan(0)
      expect(definition.conditions.unstable.run.history.length).toBeGreaterThan(0)
    }
  })

  it('uses parameter paths only for correlated features', () => {
    for (const definition of experimentRegistry) {
      const runKind = definition.conditions.stable.run.kind

      if (definition.id === 'correlated-features') {
        expect(runKind).toBe('parameter-path')
        expect(definition.conditions.unstable.run.kind).toBe('parameter-path')
        if (
          definition.conditions.stable.run.kind === 'parameter-path' &&
          definition.conditions.unstable.run.kind === 'parameter-path'
        ) {
          expect(definition.conditions.stable.run.optimumWeights).toEqual([1.2, -0.8])
          expect(definition.conditions.unstable.run.optimumWeights).toEqual([1.2, -0.8])
        }
        continue
      }

      expect(runKind).toBe('fit')
      expect(definition.conditions.unstable.run.kind).toBe('fit')
    }
  })

  it('marks the outlier and keeps initialization histories within the visible budget', () => {
    const outlier = getExperimentDefinition('outlier-pull')
    const initialization = getExperimentDefinition('initialization')

    expect(outlier.conditions.unstable.run.kind).toBe('fit')
    if (outlier.conditions.unstable.run.kind === 'fit') {
      expect(outlier.conditions.unstable.run.highlightedPointIndex).toBe(7)
    }

    expect(initialization.conditions.stable.run.kind).toBe('fit')
    expect(initialization.conditions.unstable.run.kind).toBe('fit')
    if (
      initialization.conditions.stable.run.kind === 'fit' &&
      initialization.conditions.unstable.run.kind === 'fit'
    ) {
      expect(initialization.conditions.stable.run.history).toHaveLength(19)
      expect(initialization.conditions.unstable.run.history).toHaveLength(19)
    }
  })

  it('preserves the high learning-rate factory and safely falls back for unknown ids', () => {
    expect(createHighLearningRateExperiment().stableLearningRate).toBe(0.08)
    expect(getExperimentDefinition()).toBe(experimentRegistry[0])
    expect(getExperimentDefinition(null)).toBe(experimentRegistry[0])
    expect(getExperimentDefinition('not-an-experiment')).toBe(experimentRegistry[0])
  })
})
