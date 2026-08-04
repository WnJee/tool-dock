declare module 'sm-crypto/src/sm4/index.js' {
  interface Sm4Options {
    padding?: 'none' | 'pkcs#5' | 'pkcs#7'
    mode?: 'cbc'
    iv?: number[] | string
    output?: 'array' | 'string'
  }

  interface Sm4 {
    encrypt(input: number[] | string, key: number[] | string, options: Sm4Options & { output: 'array' }): number[]
    decrypt(input: number[] | string, key: number[] | string, options: Sm4Options & { output: 'array' }): number[]
  }

  const sm4: Sm4
  export default sm4
}
