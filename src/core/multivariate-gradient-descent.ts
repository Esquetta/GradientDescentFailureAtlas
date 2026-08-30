export interface FeaturePoint {
  features: readonly number[]
  y: number
}

export interface VectorParameters {
  weights: number[]
  intercept: number
}

export interface VectorGradient {
  weights: number[]
  intercept: number
}

export interface MultivariateGradientDescentOptions {
  learningRate: number
  iterations: number
}

export interface MultivariateGradientDescentStep {
  iteration: number
  parameters: VectorParameters
  loss: number
}

function validateDimensions(points: FeaturePoint[], parameters: VectorParameters): void {
  if (points.length === 0) {
    throw new Error('At least one point is required')
  }

  if (points.some((point) => point.features.length !== parameters.weights.length)) {
    throw new Error('Feature dimensions must match weights')
  }
}

export function meanSquaredErrorMultivariate(
  points: FeaturePoint[],
  parameters: VectorParameters,
): number {
  validateDimensions(points, parameters)

  const squaredError = points.reduce((sum, point) => {
    const prediction = point.features.reduce(
      (value, feature, index) => value + parameters.weights[index] * feature,
      parameters.intercept,
    )
    const error = prediction - point.y
    return sum + error * error
  }, 0)

  return squaredError / points.length
}

export function computeMultivariateGradient(
  points: FeaturePoint[],
  parameters: VectorParameters,
): VectorGradient {
  validateDimensions(points, parameters)

  const totals = points.reduce(
    (gradient, point) => {
      const prediction = point.features.reduce(
        (value, feature, index) => value + parameters.weights[index] * feature,
        parameters.intercept,
      )
      const error = prediction - point.y

      return {
        weights: gradient.weights.map((weight, index) => weight + error * point.features[index]),
        intercept: gradient.intercept + error,
      }
    },
    { weights: parameters.weights.map(() => 0), intercept: 0 },
  )

  const scale = 2 / points.length
  return {
    weights: totals.weights.map((weight) => weight * scale),
    intercept: totals.intercept * scale,
  }
}

export function runMultivariateGradientDescent(
  points: FeaturePoint[],
  initialParameters: VectorParameters,
  options: MultivariateGradientDescentOptions,
): MultivariateGradientDescentStep[] {
  if (
    !Number.isFinite(options.iterations) ||
    !Number.isInteger(options.iterations) ||
    options.iterations < 0
  ) {
    throw new Error('Iterations must be a finite non-negative integer')
  }

  const history: MultivariateGradientDescentStep[] = []
  let parameters = {
    weights: [...initialParameters.weights],
    intercept: initialParameters.intercept,
  }

  for (let iteration = 0; iteration <= options.iterations; iteration += 1) {
    history.push({
      iteration,
      parameters: {
        weights: [...parameters.weights],
        intercept: parameters.intercept,
      },
      loss: meanSquaredErrorMultivariate(points, parameters),
    })

    if (iteration === options.iterations) {
      break
    }

    const gradient = computeMultivariateGradient(points, parameters)
    parameters = {
      weights: parameters.weights.map(
        (weight, index) => weight - options.learningRate * gradient.weights[index],
      ),
      intercept: parameters.intercept - options.learningRate * gradient.intercept,
    }
  }

  return history
}
