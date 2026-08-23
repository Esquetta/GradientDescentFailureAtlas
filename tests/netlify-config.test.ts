import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const repositoryRoot = new URL('../', import.meta.url)

describe('Netlify deployment configuration', () => {
  it('configures the build command and publish directory', () => {
    const config = readFileSync(new URL('netlify.toml', repositoryRoot), 'utf8')

    expect(config).toMatch(/\[build\]/)
    expect(config).toMatch(/command\s*=\s*"npm run build"/)
    expect(config).toMatch(/publish\s*=\s*"dist"/)
  })

  it('ignores Netlify local state', () => {
    const ignoredEntries = readFileSync(new URL('.gitignore', repositoryRoot), 'utf8').split(/\r?\n/)

    expect(ignoredEntries).toContain('.netlify')
  })
})
