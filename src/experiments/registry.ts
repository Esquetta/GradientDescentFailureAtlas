import { createCorrelatedFeaturesDefinition } from './correlated-features.ts'
import { createFeatureScaleDefinition } from './feature-scale.ts'
import { createHighLearningRateDefinition } from './high-learning-rate.ts'
import { createInitializationDefinition } from './initialization.ts'
import { createOutlierPullDefinition } from './outlier-pull.ts'
import type { ExperimentDefinition } from './types.ts'

export const experimentRegistry: readonly ExperimentDefinition[] = [
  createHighLearningRateDefinition(),
  createFeatureScaleDefinition(),
  createOutlierPullDefinition(),
  createCorrelatedFeaturesDefinition(),
  createInitializationDefinition(),
]

export function getExperimentDefinition(id?: string | null): ExperimentDefinition {
  return experimentRegistry.find((definition) => definition.id === id) ?? experimentRegistry[0]
}
