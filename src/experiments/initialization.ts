import { runGradientDescent, type GradientDescentStep, type Parameters, type Point } from '../core/gradient-descent.ts'
import type { ExperimentDefinition } from './types.ts'

export interface InitializationExperiment {
  points: Point[]
  nearStart: Parameters
  farStart: Parameters
  near: GradientDescentStep[]
  far: GradientDescentStep[]
  learningRate: number
  iterations: number
  convergence: {
    iterations: number
    near: GradientDescentStep[]
    far: GradientDescentStep[]
  }
}

export function createInitializationExperiment(): InitializationExperiment {
  const points = [-3, -2, -1, 0, 1, 2, 3].map((x) => ({ x, y: 1.2 * x + 0.4 }))
  const nearStart = { slope: 0, intercept: 0 }
  const farStart = { slope: 6, intercept: -4 }
  const learningRate = 0.08
  const iterations = 18
  const convergenceIterations = 120

  return {
    points,
    nearStart,
    farStart,
    near: runGradientDescent(points, nearStart, { learningRate, iterations }),
    far: runGradientDescent(points, farStart, { learningRate, iterations }),
    learningRate,
    iterations,
    convergence: {
      iterations: convergenceIterations,
      near: runGradientDescent(points, nearStart, { learningRate, iterations: convergenceIterations }),
      far: runGradientDescent(points, farStart, { learningRate, iterations: convergenceIterations }),
    },
  }
}

export function createInitializationDefinition(): ExperimentDefinition {
  const experiment = createInitializationExperiment()

  return {
    id: 'initialization',
    order: 5,
    shortLabel: 'Initialization',
    eyebrow: 'Failure mode / fixed budget',
    title: 'When the starting point spends the budget.',
    lede: 'Both starts share the same convex optimum, but a fixed iteration budget gives them different paths and different time to reach it.',
    thesis: 'Initialization changes the path through a fixed budget, never the final optimum here.',
    conditions: {
      stable: {
        label: 'near start',
        value: '0, 0',
        run: { kind: 'fit', points: experiment.points, history: experiment.near },
      },
      unstable: {
        label: 'far start',
        value: '6, −4',
        run: { kind: 'fit', points: experiment.points, history: experiment.far },
      },
    },
    diagnosis: {
      initialSymptom: 'Two runs with the same objective look different at the same iteration.',
      stableSymptom: 'The near start reaches the shared optimum within the visible budget.',
      unstableSymptom: 'The far start is still spending visible steps traveling toward that same optimum.',
      cause: 'The fixed budget measures progress from the start, not a different destination.',
      correction: 'Choose and report a budget that fits the required tolerance, then inspect convergence.',
      caveat: 'This convex problem has one final optimum; initialization changes path and time, never that optimum.',
    },
  }
}
