import { runGradientDescent, type GradientDescentStep, type Point } from '../core/gradient-descent.ts'
import type { ExperimentDefinition } from './types.ts'

export interface FeatureScaleExperiment {
  normalizedPoints: Point[]
  rawPoints: Point[]
  normalized: GradientDescentStep[]
  raw: GradientDescentStep[]
  learningRate: number
  iterations: number
}

export function createFeatureScaleExperiment(): FeatureScaleExperiment {
  const z = [-3, -2, -1, 0, 1, 2, 3]
  const normalizedPoints = z.map((x) => ({ x, y: 1.2 * x + 0.4 }))
  const rawPoints = z.map((x) => ({ x: 10 * x, y: 1.2 * x + 0.4 }))
  const learningRate = 0.08
  const iterations = 18
  const initialParameters = { slope: 0, intercept: 0 }

  return {
    normalizedPoints,
    rawPoints,
    normalized: runGradientDescent(normalizedPoints, initialParameters, { learningRate, iterations }),
    raw: runGradientDescent(rawPoints, initialParameters, { learningRate, iterations }),
    learningRate,
    iterations,
  }
}

export function createFeatureScaleDefinition(): ExperimentDefinition {
  const experiment = createFeatureScaleExperiment()

  return {
    id: 'feature-scale',
    order: 2,
    shortLabel: 'Feature scale',
    eyebrow: 'Failure mode / curvature',
    title: 'When one feature stretches the valley.',
    lede: 'The same learning rate can become unstable when a feature is scaled by 10, because the curvature grows by 100.',
    thesis: 'Feature scale changes the geometry seen by gradient descent.',
    conditions: {
      stable: {
        label: 'scaled',
        value: 'x × 1',
        run: { kind: 'fit', points: experiment.normalizedPoints, history: experiment.normalized },
      },
      unstable: {
        label: 'raw',
        value: 'x × 10',
        run: { kind: 'fit', points: experiment.rawPoints, history: experiment.raw },
      },
    },
    diagnosis: {
      initialSymptom: 'An unchanged η behaves differently after only rescaling x.',
      stableSymptom: 'The scaled feature gives a valley the step size can follow.',
      unstableSymptom: 'The raw feature makes the same step bounce across steep curvature.',
      cause: 'Multiplying a feature by 10 multiplies the relevant curvature by 100.',
      correction: 'Standardize features before choosing or comparing a learning rate.',
      caveat: 'Units are not truth: standardization aids optimization but does not decide what a feature means.',
    },
  }
}
