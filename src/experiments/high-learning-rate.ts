import { runGradientDescent, type GradientDescentStep, type Point } from '../core/gradient-descent.ts'

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
