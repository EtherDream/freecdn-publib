const readline = require('readline')
const fs = require('fs')
const {decodeUrls} = require('../lib/siteinfo.js')
const pubLib = require('..')


function test1() {
  const rl = readline.createInterface({
    input: fs.createReadStream(__dirname + '/../db/var/gen.txt')
  })

  const srcHashes = []
  const srcUrlStrs = []
  let lineId = 0

  console.log('load data...')

  rl.on('line', line => {
    lineId++
    const [hashHex, path, bits] = line.split('\t')

    const hashBin = Buffer.from(hashHex, 'hex')
    srcHashes.push(hashBin)

    const url = decodeUrls(+bits, path).join('\t')
    srcUrlStrs.push(url)
  })

  rl.on('close', async () => {
    console.log('get result...')

    const map = await pubLib.findHashes(srcHashes)
    console.assert(map.size === srcHashes.length, 'map size incorrect')

    console.log('check result...')

    srcHashes.forEach((hashBin, i) => {
      const urls = map.get(hashBin.toString('base64'))
      if (!urls) {
        console.error('empty:', i)
        return
      }
      const urlStr = urls.join('\t')
      console.assert(urlStr === srcUrlStrs[i], 'invalid path')
    })

    console.log('ok')
  })
}

test1()