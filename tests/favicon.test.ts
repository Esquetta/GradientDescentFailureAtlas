import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const repositoryRoot = new URL('../', import.meta.url)

describe('favicon', () => {
  it('declares exactly one SVG favicon link', () => {
    const indexHtml = readFileSync(new URL('index.html', repositoryRoot), 'utf8')
    const faviconLink = '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />'

    expect(indexHtml.split(faviconLink)).toHaveLength(2)
  })

  it('uses the project brand tokens in the SVG favicon', () => {
    const faviconSvg = readFileSync(new URL('public/favicon.svg', repositoryRoot), 'utf8')

    expect(faviconSvg).toContain('#2b2922')
    expect(faviconSvg).toContain('#f6f0df')
    expect(faviconSvg).toMatch(/>GD</)
  })
})
