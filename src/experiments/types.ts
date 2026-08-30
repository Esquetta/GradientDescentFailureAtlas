import type { GradientDescentStep, Point } from '../core/gradient-descent.ts'
import type { MultivariateGradientDescentStep } from '../core/multivariate-gradient-descent.ts'

export type ExperimentId =
  | 'learning-rate'
  | 'feature-scale'
  | 'outlier-pull'
  | 'correlated-features'
  | 'initialization'

export type AtlasMode = 'stable' | 'unstable'

export interface FitRun {
  kind: 'fit'
  points: Point[]
  history: GradientDescentStep[]
  highlightedPointIndex?: number
}

export interface ParameterPathRun {
  kind: 'parameter-path'
  history: MultivariateGradientDescentStep[]
  optimumWeights: readonly [number, number]
}

export type ExperimentRun = FitRun | ParameterPathRun

export interface ExperimentCondition {
  label: string
  value: string
  run: ExperimentRun
}

export interface ExperimentDiagnosis {
  initialSymptom: string
  stableSymptom: string
  unstableSymptom: string
  cause: string
  correction: string
  caveat: string
}

export interface ExperimentDefinition {
  id: ExperimentId
  order: 1 | 2 | 3 | 4 | 5
  shortLabel: string
  eyebrow: string
  title: string
  lede: string
  thesis: string
  conditions: Record<AtlasMode, ExperimentCondition>
  diagnosis: ExperimentDiagnosis
}
