import { runGradientDescent, type GradientDescentStep, type Point } from '../core/gradient-descent.ts'
import type { ExperimentDefinition } from './types.ts'

export interface HighLearningRateExperiment {
  points: Point[]
  stable: GradientDescentStep[]
  unstable: GradientDescentStep[]
  stableLearningRate: number
  unstableLearningRate: number
}

export function createHighLearningRateExperiment(): HighLearningRateExperiment {
  const points = [-3, -2, -1, 0, 1, 2, 3].map((x) => ({
    x,
    y: 1.2 * x + 0.4,
  }))
  const initialParameters = { slope: 0, intercept: 0 }
  const iterations = 18
  const stableLearningRate = 0.08
  const unstableLearningRate = 0.32

  return {
    points,
    stable: runGradientDescent(points, initialParameters, {
      learningRate: stableLearningRate,
      iterations,
    }),
    unstable: runGradientDescent(points, initialParameters, {
      learningRate: unstableLearningRate,
      iterations,
    }),
    stableLearningRate,
    unstableLearningRate,
  }
}

export function createHighLearningRateDefinition(): ExperimentDefinition {
  const experiment = createHighLearningRateExperiment()

  return {
    id: 'learning-rate',
    order: 1,
    shortLabel: 'Learning rate',
    eyebrow: 'Failure mode / step size',
    title: 'When the step is larger than the valley.',
    lede: 'A high learning rate does not make learning faster. It can make each correction overshoot the solution until error grows instead of shrinking.',
    thesis: 'A useful step must be small enough to descend the valley instead of crossing it.',
    conditions: {
      stable: {
        label: 'stable',
        value: 'η 0.08',
        run: { kind: 'fit', points: experiment.points, history: experiment.stable },
      },
      unstable: {
        label: 'unstable',
        value: 'η 0.32',
        run: { kind: 'fit', points: experiment.points, history: experiment.unstable },
      },
    },
    diagnosis: {
      initialSymptom: 'Loss rises after the first update instead of settling.',
      stableSymptom: 'Each update shrinks the loss toward the fitted line.',
      unstableSymptom: 'Successive updates overshoot and amplify the error.',
      cause: 'The step is larger than the local curvature can tolerate.',
      correction: 'Lower the learning rate or use an adaptive schedule.',
      caveat: 'A smaller step is safer, but it can also make progress too slow.',
    },
  }
}
