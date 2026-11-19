import { describe, expect, it } from 'vitest'
import { escapeJson, propertiesToYaml, transformFormat, unescapeJson, yamlToProperties } from './formatter'

describe('JSON string transforms', () => {
  it('escapes and unescapes JSON text', () => {
    const source = '{"message":"你好\\nToolDock"}'
    expect(unescapeJson(escapeJson(source))).toBe(source)
    expect(() => unescapeJson('\\x')).toThrow('无效的 JSON 转义文本')
  })
})

describe('code formatting', () => {
  it('formats HTML and JavaScript with syntax-aware parsers', async () => {
    await expect(transformFormat('html', '<main><h1>Hello</h1><p>World</p></main>', 'format')).resolves.toContain('\n  <h1>Hello</h1>')
    await expect(transformFormat('javascript', 'const add=(a,b)=>{return a+b}', 'format')).resolves.toContain('const add = (a, b) =>')
  })
})

describe('YAML and Properties conversion', () => {
  const yaml = 'server:\n  port: 8080\n  enabled: true\n  hosts:\n    - api.example.com\n    - backup.example.com\n'

  it('flattens nested YAML into property paths', () => {
    expect(yamlToProperties(yaml)).toBe(
      ['server.port=8080', 'server.enabled=true', 'server.hosts[0]=api.example.com', 'server.hosts[1]=backup.example.com'].join('\n'),
    )
  })

  it('reconstructs nested values and arrays from Properties', () => {
    const converted = propertiesToYaml(yamlToProperties(yaml))
    expect(converted).toContain('port: 8080')
    expect(converted).toContain('enabled: true')
    expect(converted).toContain('- api.example.com')
  })

  it('supports comments, escaped separators and continuation lines', () => {
    const converted = propertiesToYaml('# comment\napp.name=ToolDock\nmessage=hello\\\n  world\nlabels.a\\:b=value')
    expect(converted).toContain('name: ToolDock')
    expect(converted).toContain('message: helloworld')
    expect(converted).toContain('a:b: value')
  })
})
