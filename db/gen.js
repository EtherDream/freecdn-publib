const readline = require('readline')
const zlib = require('zlib')
const fs = require('fs')

const SITE_INFO = require('../lib/siteinfo.js')

// 官方站点列表
const SITES_1ST = SITE_INFO.CDNJS_COMPLETE.map(v => new URL(v).host)
// 第三方站点列表
const SITES_3RD = SITE_INFO.CDNJS_PARTIAL.map(v => new URL(v.root).host)

// 每个站点的记录数
const mSiteCountMap = {}
for (const site of SITES_3RD) {
  mSiteCountMap[site] = 0
}

// 记录总数
let mRecordCount = 0

const mDatas = []
const mIndices = []
let mHashSuffixes = ''

const HASH_PREFIX_LEN = 4
const HASH_SUFFIX_LEN = 28
const HEADER_LEN = 1 /*len*/ + 2 /*sites*/
const HEADER_PAD = '?'.repeat(HEADER_LEN)

let mPrevIndex = 0

const reader = readline.createInterface({
  input: fs.createReadStream('var/gen.txt')
})

console.log('parsing...')

reader.on('line', line => {
  if (!line) {
    return
  }
  const [hashHex, path, siteBits] = line.split('\t')
  if (!siteBits) {
    console.error('invalid line:', line)
    return
  }
  mRecordCount++

  // 统计每个站点的资源数量
  const nSiteBits = +siteBits

  SITES_3RD.forEach((site, i) => {
    if (nSiteBits & (1 << i)) {
      mSiteCountMap[site]++
    }
  })

  // hash 前 4 字节为索引，使用 u32 表示
  // 存储时增量编码（和前一个的差值），压缩率更高
  const currIndex = parseInt(hashHex.substr(0, 8), 16)
  mIndices.push(currIndex - mPrevIndex)
  mPrevIndex = currIndex

  // hash 后 28 字节为后缀，单独存储
  // 这里使用 hex 字符串拼接，最后一次性转 Buffer
  const hashSuffix = hashHex.substr(HASH_PREFIX_LEN * 2)
  mHashSuffixes += hashSuffix

  console.assert(hashSuffix.length === HASH_SUFFIX_LEN * 2)

  // 内容数据
  // 长度（1 字节）+ 站点 bits（2 字节）+ 路径
  const itemBuf = Buffer.from(HEADER_PAD + path)
  if (itemBuf.length > 255) {
    console.error('invalid path:', path)
    return
  }
  itemBuf[0] = itemBuf.length
  itemBuf.writeUInt16LE(nSiteBits, 1)

  mDatas.push(itemBuf)
})

reader.on('close', () => {
  // 官方站点的 URL 数量默认为完整数量
  for (const site of SITES_1ST) {
    mSiteCountMap[site] = mRecordCount
  }
  const sites = [...SITES_1ST, ...SITES_3RD]

  // 生成统计数据，执行 `freecdn lib` 时展示
  const info = {
    sites: [],
    total: 0,
    mtime: new Date().toISOString(),
  }
  for (const site of sites) {
    info.sites.push({
      site: site,
      hash: mSiteCountMap[site],
    })
    info.total += mSiteCountMap[site]
  }
  console.log(info)
  fs.writeFileSync('../assets/info.json', JSON.stringify(info, null, 2))

  // 生成数据库文件
  const indices = new Uint32Array(mIndices)
  save('hash-prefixes', Buffer.from(indices.buffer))

  // hash 后缀无需压缩
  const hashes = Buffer.from(mHashSuffixes, 'hex')
  save('hash-suffixes', hashes, false)

  const data = Buffer.concat(mDatas)
  save('data', data)
})

/**
 * @param {string} file 
 * @param {Buffer} data 
 * @param {boolean} compress 
 */
function save(file, data, compress = true) {
  if (compress) {
    const n0 = data.length
    console.log('compress:', file)
    console.log('  before:', n0.toLocaleString())

    const t0 = Date.now()
    data = zlib.brotliCompressSync(data)
    const t1 = Date.now()

    const n1 = data.length
    const r = (n1 / n0 * 100).toFixed(2) + '%'
    const t = ((t1 - t0) / 1000).toFixed(1) + 's'

    console.log('   after:', n1.toLocaleString(), 'ratio:', r, 'time:', t)
  }
  const path = `../assets/${file}` + (compress ? '.br' : '')
  fs.writeFileSync(path, data)
}