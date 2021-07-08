declare module 'freecdn-publib' {
  export function findHashes(hashBins: Buffer[]) : Map<string, string[]>
  export function dump() : void
  export function getInfo() : {
    ver: number,
    total: number,
    mtime: string,
    sites: {
      site: string,
      hash: number,
    }[]
  }
}