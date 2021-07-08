import * as fs from 'fs'
import * as zlib from 'zlib'
import {join as pathJoin} from 'path'
import {decodeUrls} from './siteinfo'


const enum SIZE {
  PREFIX = 4,
  SUFFIX = 28,
}

type record_t = {index: number, hash: Buffer}

let mHashPrefixes: Uint32Array
let mMainData: Buffer


function getAssetPath(file: string) {
  return pathJoin(__dirname, '../assets/', file)
}

function loadHashPrefixes() {
  if (mHashPrefixes) {
    return
  }
  const buf = zlib.brotliDecompressSync(
    fs.readFileSync(getAssetPath('hash-prefixes.br'))
  )
  const arr = new Uint32Array(buf.buffer)

  // delta encoding has better compression rate (-20% size)
  for (let i = 1; i < arr.length; i++) {
    arr[i] += arr[i - 1]
  }
  mHashPrefixes = arr
}

function loadMainData() {
  if (mMainData) {
    return
  }
  // ~60MB
  mMainData = zlib.brotliDecompressSync(
    fs.readFileSync(getAssetPath('data.br'))
  )
}

function binarySearchLeft(arr: Uint32Array, target: number) {
  let left = 0
  let right = arr.length - 1

  while (left < right) {
    const mid = (left + right) >> 1
    if (arr[mid] < target) {
      left = mid + 1
    } else {
      right = mid 
    }
  }
  if (arr[right] === target) {
    return right
  }
  return -1
}

function findHash(hashBin: Buffer) {
  const prefix = hashBin.readUInt32BE(0)
  return binarySearchLeft(mHashPrefixes, prefix)
}

function filterRecords(records: record_t[]) {
  const fd = fs.openSync(getAssetPath('hash-suffixes'), 'r')
  const suffix = Buffer.alloc(SIZE.SUFFIX)

  const result = records.filter(v => {
    for (;;) {
      fs.readSync(fd, suffix, 0, SIZE.SUFFIX, v.index * SIZE.SUFFIX)

      if (suffix.compare(v.hash, SIZE.PREFIX) === 0) {
        return true
      }
      if (mHashPrefixes[v.index] === mHashPrefixes[v.index + 1]) {
        // index collision (unlikely)
        v.index++
        continue
      }
      return false
    }
  })
  fs.closeSync(fd)
  return result
}

function fatal() {
  throw new Error('publib data is corrupted')
}

function readUrls(pos: number, len: number) {
  const bits = mMainData.readUInt16LE(pos + 1)
  const path = mMainData.toString('utf8', pos + 3, pos + len)
  const urls = decodeUrls(bits, path)
  return urls
}

export function findHashes(hashBins: Buffer[]) {
  loadHashPrefixes()

  let records: record_t[] = []

  for (const hash of hashBins) {
    const index = findHash(hash)
    if (index !== -1) {
      records.push({index, hash})
    }
  }
  if (records.length === 0) {
    return
  }

  // order by `index` asc
  records.sort((a, b) => a.index - b.index)

  records = filterRecords(records)
  if (records.length === 0) {
    return
  }

  loadMainData()

  const hashUrlsMap = new Map<string, string[]>()

  let recordPos = 0
  let {index: targetIndex, hash: targetHash} = records[0]

  let remain = mMainData.length
  let pos = 0
  let count = 0

  do {
    const itemLen = mMainData[pos] | 0
    if (itemLen > remain || itemLen === 0) {
      fatal()
    }
    if (targetIndex === count++) {
      const urls = readUrls(pos, itemLen)
      const hash = targetHash.toString('base64')

      hashUrlsMap.set(hash, urls)

      const next = records[++recordPos]
      if (!next) {
        break
      }
      targetIndex = next.index
      targetHash = next.hash
    }
    pos += itemLen
    remain -= itemLen
  } while (remain !== 0)

  return hashUrlsMap
}

export function dump() {
  loadHashPrefixes()
  loadMainData()

  const suffixesBuf = fs.readFileSync(getAssetPath('hash-suffixes'))
  const hashBuf = Buffer.alloc(SIZE.PREFIX + SIZE.SUFFIX)

  let remain = mMainData.length
  let pos = 0
  let count = 0

  function next() {
    let output = ''
    do {
      const itemLen = mMainData[pos] | 0
      if (itemLen > remain || itemLen === 0) {
        fatal()
      }
      // hashBuf = prefixes[i] .. suffixes[i]
      const prefix = mHashPrefixes[count]
      hashBuf.writeUInt32BE(prefix)
      suffixesBuf.copy(hashBuf, SIZE.PREFIX, count * SIZE.SUFFIX)

      const urls = readUrls(pos, itemLen)
      const hash = hashBuf.toString('base64')

      for (let i = 0; i < urls.length; i++) {
        output += hash + '\t' + urls[i] + '\n'
      }
      count++

      pos += itemLen
      remain -= itemLen

      if (output.length > 60000) {
        process.stdout.write(output, err => {
          err || next()
        })
        return
      }
    } while (remain !== 0)

    if (output.length > 0) {
      process.stdout.write(output)
    }
  }
  process.stdout.on('error', (err) => {
    /* do nothing */
  })
  next()
}

export function getInfo() {
  const info = require(getAssetPath('info.json'))
  info.ver = require('../package.json').version
  return info
}