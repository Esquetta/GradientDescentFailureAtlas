import {
  meanSquaredError,
  runGradientDescent,
  type GradientDescentStep,
  type Parameters,
  type Point,
} from '../core/gradient-descent.ts'
import type { ExperimentDefinition } from './types.ts'

export interface OutlierPullExperiment {
  cleanPoints: Point[]
  affectedPoints: Point[]
  clean: GradientDescentStep[]
  affected: GradientDescentStep[]
  learningRate: number
  iterations: number
  evaluateCleanReferenceLoss: (parameters: Parameters) => number
}

export function createOutlierPullExperiment(): OutlierPullExperiment {
  const cleanPoints = [-3, -2, -1, 0, 1, 2, 3].map((x) => ({ x, y: 1.2 * x + 0.4 }))
  const affectedPoints = [...cleanPoints, { x: 0, y: 8.4 }]
  const learningRate = 0.08
  const iterations = 40
  const initialParameters = { slope: 0, intercept: 0 }

  return {
    cleanPoints,
    affectedPoints,
    clean: runGradientDescent(cleanPoints, initialParameters, { learningRate, iterations }),
    affected: runGradientDescent(affectedPoints, initialParameters, { learningRate, iterations }),
    learningRate,
    iterations,
    evaluateCleanReferenceLoss: (parameters) => meanSquaredError(cleanPoints, parameters),
  }
}

export function createOutlierPullDefinition(): ExperimentDefinition {
  const experiment = createOutlierPullExperiment()

  return {
    id: 'outlier-pull',
    order: 3,
    shortLabel: 'Outlier pull',
    eyebrow: 'Failure mode / residual influence',
    title: 'When one residual pulls the whole fit.',
    lede: 'Mean squared error gives a large residual quadratic influence, so one point can pull the fitted line away from the rest.',
    thesis: 'The objective decides how strongly each observation can move the fit.',
    conditions: {
      stable: {
        label: 'clean',
        value: '7 points',
        run: { kind: 'fit', points: experiment.cleanPoints, history: experiment.clean },
      },
      unstable: {
        label: 'outlier',
        value: '8 points',
        run: {
          kind: 'fit',
          points: experiment.affectedPoints,
          history: experiment.affected,
          highlightedPointIndex: 7,
        },
      },
    },
    diagnosis: {
      initialSymptom: 'The fitted intercept moves even though seven observations are unchanged.',
      stableSymptom: 'The clean fit stays near the shared linear pattern.',
      unstableSymptom: 'One high residual pulls the MSE optimum upward.',
      cause: 'Squaring residuals gives large errors disproportionate influence.',
      correction: 'Investigate the observation, then use a robust objective or segmentation when it is valid.',
      caveat: 'Do not presume an unusual observation is erroneous or deletable.',
    },
  }
}
