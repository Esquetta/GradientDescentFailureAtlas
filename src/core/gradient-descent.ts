export interface Point {
  x: number
  y: number
}

export interface Parameters {
  slope: number
  intercept: number
}

export interface Gradient {
  slope: number
  intercept: number
}

export interface GradientDescentOptions {
  learningRate: number
  iterations: number
}

export interface GradientDescentStep {
  iteration: number
  parameters: Parameters
  loss: number
}

export function meanSquaredError(points: Point[], parameters: Parameters): number {
  if (points.length === 0) {
    throw new Error('At least one point is required')
  }

  const squaredError = points.reduce((sum, point) => {
    const prediction = parameters.slope * point.x + parameters.intercept
    const error = prediction - point.y
    return sum + error * error
  }, 0)

  return squaredError / points.length
}

export function computeGradient(points: Point[], parameters: Parameters): Gradient {
  const totals = points.reduce(
    (gradient, point) => {
      const error = parameters.slope * point.x + parameters.intercept - point.y
      return {
        slope: gradient.slope + error * point.x,
        intercept: gradient.intercept + error,
      }
    },
    { slope: 0, intercept: 0 },
  )

  const scale = 2 / points.length
  return {
    slope: totals.slope * scale,
    intercept: totals.intercept * scale,
  }
}

export function runGradientDescent(
  points: Point[],
  initialParameters: Parameters,
  options: GradientDescentOptions,
): GradientDescentStep[] {
  const history: GradientDescentStep[] = []
  let parameters = { ...initialParameters }

  for (let iteration = 0; iteration <= options.iterations; iteration += 1) {
    history.push({
      iteration,
      parameters: { ...parameters },
      loss: meanSquaredError(points, parameters),
    })

    if (iteration === options.iterations) {
      break
    }

    const gradient = computeGradient(points, parameters)
    parameters = {
      slope: parameters.slope - options.learningRate * gradient.slope,
      intercept: parameters.intercept - options.learningRate * gradient.intercept,
    }
  }

  return history
}
