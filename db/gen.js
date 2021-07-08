const readline = require('readline')
const zlib = require('zlib')
const fs = require('fs')
const officialSites = require('../lib/siteinfo.js')
  .CDNJS_COMPLETE
  .map(v => new URL(v).host)


const mSiteArr = fs.readFileSync('sites.txt', 'utf8').split('\n')
const mSiteMap = {}
let mCount = 0

mSiteArr.forEach(v => {
  mSiteMap[v] = 0
})

const mIndices = []
let mHashSuffixes = ''
const mDatas = []

function save(file, data, compress = true) {
  if (compress) {
    console.log('compress start:', file)
    data = zlib.brotliCompressSync(data)
    console.log('compress end:', file)
  }
  const path = `../assets/${file}` + (compress ? '.br' : '')
  fs.writeFileSync(path, data) 
}

const HASH_PREFIX_LEN = 4
const HASH_SUFFIX_LEN = 28
const HEADER_LEN = 1 /*len*/ + 2 /*bits*/
const HEADER_PADDING = '0'.repeat(HEADER_LEN)

let mPrevIndex = 0

const rl = readline.createInterface({
  input: fs.createReadStream('var/gen.txt')
})

rl.on('line', line => {
  if (!line) {
    return
  }
  const [hashHex, path, siteBits] = line.split('\t')
  if (!siteBits) {
    console.error('invalid line:', line)
    return
  }
  mCount++

  // statistic
  let nSiteBits = +siteBits
  mSiteArr.forEach((v, i) => {
    if (nSiteBits & (1 << i)) {
      mSiteMap[mSiteArr[i]]++
    }
  })

  const currIndex = parseInt(hashHex.substr(0, 8), 16)
  mIndices.push(currIndex - mPrevIndex)
  mPrevIndex = currIndex

  const hashSuffix = hashHex.substr(HASH_PREFIX_LEN * 2)
  mHashSuffixes += hashSuffix

  const itemBuf = Buffer.from(HEADER_PADDING + path)
  if (itemBuf.length > 255) {
    console.error('path to long:', pathLen, path, 'line:', lineId)
    return
  }
  itemBuf[0] = itemBuf.length
  itemBuf.writeUInt16LE(nSiteBits, 1)
  mDatas.push(itemBuf)
})

rl.on('close', () => {
  officialSites.forEach(v => {
    mSiteMap[v] = mCount
    mSiteArr.unshift(v)
  })

  const json = {
    sites: [],
    total: 0,
    mtime: new Date().toISOString()
  }
  mSiteArr.forEach(v => {
    json.sites.push({
      site: v,
      hash: mSiteMap[v],
    })
    json.total += mSiteMap[v]
  })
  console.log(json)
  fs.writeFileSync('../assets/info.json', JSON.stringify(json, null, 2))


  const indices = new Uint32Array(mIndices)
  save('hash-prefixes', indices)

  const hashes = Buffer.from(mHashSuffixes, 'hex')
  save('hash-suffixes', hashes, false)

  const data = Buffer.concat(mDatas)
  save('data', data)
})