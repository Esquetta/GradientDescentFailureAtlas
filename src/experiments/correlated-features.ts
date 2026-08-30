import {
  runMultivariateGradientDescent,
  type FeaturePoint,
  type MultivariateGradientDescentStep,
} from '../core/multivariate-gradient-descent.ts'
import type { ExperimentDefinition } from './types.ts'

export interface CorrelatedFeaturesExperiment {
  z: number[]
  q: number[]
  epsilon: number
  independentPoints: FeaturePoint[]
  correlatedPoints: FeaturePoint[]
  learningRate: number
  iterations: number
  independent: MultivariateGradientDescentStep[]
  correlated: MultivariateGradientDescentStep[]
}

export function createCorrelatedFeaturesExperiment(): CorrelatedFeaturesExperiment {
  const z = [-3, -2, -1, 0, 1, 2, 3]
  const q = [1, -1, 0, 0, 0, -1, 1]
  const epsilon = 0.2
  const independentPoints = z.map((x1, index) => {
    const x2 = Math.sqrt(7) * q[index]
    return { features: [x1, x2], y: 1.2 * x1 - 0.8 * x2 }
  })
  const correlatedPoints = z.map((x1, index) => {
    const x2 = (x1 + epsilon * q[index]) / Math.sqrt(1 + epsilon ** 2 / 7)
    return { features: [x1, x2], y: 1.2 * x1 - 0.8 * x2 }
  })

  const learningRate = 0.08
  const iterations = 40
  const initialParameters = { weights: [0, 0], intercept: 0 }

  return {
    z,
    q,
    epsilon,
    independentPoints,
    correlatedPoints,
    learningRate,
    iterations,
    independent: runMultivariateGradientDescent(independentPoints, initialParameters, {
      learningRate,
      iterations,
    }),
    correlated: runMultivariateGradientDescent(correlatedPoints, initialParameters, {
      learningRate,
      iterations,
    }),
  }
}

export function createCorrelatedFeaturesDefinition(): ExperimentDefinition {
  const experiment = createCorrelatedFeaturesExperiment()

  return {
    id: 'correlated-features',
    order: 4,
    shortLabel: 'Correlated features',
    eyebrow: 'Failure mode / identifiability',
    title: 'When two features describe the same direction.',
    lede: 'Near-duplicate features create a narrow, ill-conditioned valley, making descent slow and individual coefficients unreliable.',
    thesis: 'Low loss does not guarantee that each coefficient is identified.',
    conditions: {
      stable: {
        label: 'independent',
        value: 'ρ 0.000',
        run: {
          kind: 'parameter-path',
          history: experiment.independent,
          optimumWeights: [1.2, -0.8],
        },
      },
      unstable: {
        label: 'correlated',
        value: 'ρ 0.997',
        run: {
          kind: 'parameter-path',
          history: experiment.correlated,
          optimumWeights: [1.2, -0.8],
        },
      },
    },
    diagnosis: {
      initialSymptom: 'Loss falls while the two weights remain slow and hard to interpret.',
      stableSymptom: 'Independent variation gives a broad path toward the two coefficients.',
      unstableSymptom: 'Correlation narrows the valley and leaves coefficients poorly determined.',
      cause: 'The data supplies little evidence for how to divide one shared direction between weights.',
      correction: 'Seek independent variation, drop redundancy, or use justified regularization.',
      caveat: 'Low in-sample loss does not identify coefficients, and scaling alone does not remove correlation.',
    },
  }
}
