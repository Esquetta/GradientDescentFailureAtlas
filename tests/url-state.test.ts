import { describe, expect, it } from 'vitest'
import { parseAtlasState, serializeAtlasState } from '../src/core/url-state.ts'

describe('parseAtlasState', () => {
  it('parses stable and unstable states at valid steps', () => {
    expect(parseAtlasState('#mode=stable&step=7', 18)).toEqual({ mode: 'stable', step: 7 })
    expect(parseAtlasState('#mode=unstable&step=18', 18)).toEqual({
      mode: 'unstable',
      step: 18,
    })
  })

  it('defaults an empty fragment to the initial unstable state', () => {
    expect(parseAtlasState('', 18)).toEqual({ mode: 'unstable', step: 0 })
  })

  it('defaults an invalid mode while preserving a valid step', () => {
    expect(parseAtlasState('#mode=fast&step=4&note=ignored', 18)).toEqual({
      mode: 'unstable',
      step: 4,
    })
  })

  it('defaults invalid steps while preserving a valid mode', () => {
    for (const step of ['-1', '1.5', 'many', '19']) {
      expect(parseAtlasState(`#mode=stable&step=${step}`, 18)).toEqual({
        mode: 'stable',
        step: 0,
      })
    }
  })
})

describe('serializeAtlasState', () => {
  it('serializes state deterministically', () => {
    expect(serializeAtlasState({ mode: 'stable', step: 7 })).toBe('#mode=stable&step=7')
  })
})
