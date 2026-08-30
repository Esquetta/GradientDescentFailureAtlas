import { describe, expect, it } from 'vitest'
import type { AtlasMode, ExperimentId } from '../src/experiments/types.ts'
import { parseAtlasState, serializeAtlasState } from '../src/core/url-state.ts'

const maxStepFor = (experimentId: ExperimentId, mode: AtlasMode): number => {
  const maxSteps: Record<ExperimentId, Record<AtlasMode, number>> = {
    'learning-rate': { stable: 7, unstable: 18 },
    'feature-scale': { stable: 9, unstable: 12 },
    'outlier-pull': { stable: 8, unstable: 10 },
    'correlated-features': { stable: 3, unstable: 11 },
    initialization: { stable: 6, unstable: 14 },
  }

  return maxSteps[experimentId][mode]
}

describe('parseAtlasState', () => {
  it('parses valid states for learning-rate and correlated-features', () => {
    expect(parseAtlasState('#experiment=learning-rate&mode=stable&step=7', maxStepFor)).toEqual({
      experimentId: 'learning-rate',
      mode: 'stable',
      step: 7,
    })
    expect(
      parseAtlasState('#experiment=correlated-features&mode=unstable&step=11', maxStepFor),
    ).toEqual({
      experimentId: 'correlated-features',
      mode: 'unstable',
      step: 11,
    })
  })

  it('preserves legacy learning-rate links', () => {
    expect(parseAtlasState('#mode=stable&step=7', maxStepFor)).toEqual({
      experimentId: 'learning-rate',
      mode: 'stable',
      step: 7,
    })
  })

  it('accepts the legacy numeric learning-rate step bound', () => {
    expect(parseAtlasState('#mode=stable&step=7', 18)).toEqual({
      experimentId: 'learning-rate',
      mode: 'stable',
      step: 7,
    })
  })

  it('defaults missing and unknown experiments to learning-rate', () => {
    expect(parseAtlasState('', maxStepFor)).toEqual({
      experimentId: 'learning-rate',
      mode: 'unstable',
      step: 0,
    })
    expect(parseAtlasState('#experiment=unknown&mode=stable&step=7', maxStepFor)).toEqual({
      experimentId: 'learning-rate',
      mode: 'stable',
      step: 7,
    })
  })

  it('defaults an invalid mode independently while preserving valid fields', () => {
    expect(
      parseAtlasState('#experiment=correlated-features&mode=fast&step=11&note=ignored', maxStepFor),
    ).toEqual({
      experimentId: 'correlated-features',
      mode: 'unstable',
      step: 11,
    })
  })

  it('defaults negative, fractional, non-numeric, and out-of-range steps', () => {
    for (const step of ['-1', '1.5', 'many', '4']) {
      expect(
        parseAtlasState(`#experiment=correlated-features&mode=stable&step=${step}`, maxStepFor),
      ).toEqual({
        experimentId: 'correlated-features',
        mode: 'stable',
        step: 0,
      })
    }
  })

  it('validates a step against the resolved experiment and mode', () => {
    expect(
      parseAtlasState('#experiment=correlated-features&mode=unstable&step=7', maxStepFor),
    ).toEqual({
      experimentId: 'correlated-features',
      mode: 'unstable',
      step: 7,
    })
    expect(
      parseAtlasState('#experiment=learning-rate&mode=stable&step=11', maxStepFor),
    ).toEqual({
      experimentId: 'learning-rate',
      mode: 'stable',
      step: 0,
    })
  })
})

describe('serializeAtlasState', () => {
  it('serializes each state in canonical deterministic order', () => {
    expect(
      serializeAtlasState({ experimentId: 'correlated-features', mode: 'stable', step: 3 }),
    ).toBe('#experiment=correlated-features&mode=stable&step=3')
  })

  it('drops unknown fields when canonicalizing a parsed state', () => {
    expect(
      serializeAtlasState(
        parseAtlasState('#experiment=correlated-features&mode=stable&step=3&note=ignored', maxStepFor),
      ),
    ).toBe('#experiment=correlated-features&mode=stable&step=3')
  })

  it('serializes legacy learning-rate state in canonical deterministic order', () => {
    expect(serializeAtlasState({ mode: 'stable', step: 7 })).toBe(
      '#experiment=learning-rate&mode=stable&step=7',
    )
  })
})
