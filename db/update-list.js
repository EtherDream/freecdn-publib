const fetch = require('node-fetch')
const fs = require('fs')

const FETCH_TIMEOUT = 1000 * 600
const MAX_RETRY = 100
const MAX_CONN = 20

const FETCH_OPT = {
  headers: {
    'accept-encoding': 'gzip, deflate, br',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36',
  }
}

const fd = fs.openSync('var/list.txt', 'w+')

let mLibs
let mCount = 0

function sleep(ms) {
  return new Promise(f => setTimeout(f, ms))
}

async function fetchJson(url) {
  for (let i = 1; i <= MAX_RETRY; i++) {
    const ctrl = new AbortController()
    const tid = setTimeout(() => {
      ctrl.abort()
    }, FETCH_TIMEOUT)

    try {
      FETCH_OPT.signal = ctrl.signal
      const res = await fetch(url, FETCH_OPT)
      const ret = await res.json()
      if (ret) {
        return ret
      }
    } catch (err) {
      console.warn('retry:', url, i, err.message)
      await sleep(1000 + i * 50)
    } finally {
      clearTimeout(tid)
    }
  }
}

function parseLib(info) {
  if (!Array.isArray(info.assets)) {
    console.error('invalid format:', info.assets)
    return
  }
  let fileNum = 0
  let lines = ''
  let ver = 0

  for (const asset of info.assets) {
    for (const file of asset.files) {
      const line = info.name + '/' + asset.version + '/' + file + '\t' + ver + '\n'
      lines += line
      if (lines.length > 60000) {
        fs.writeSync(fd, lines)
        lines = ''
      }
    }
    ver++
    fileNum += asset.files.length
  }
  if (lines.length > 0) {
    fs.writeSync(fd, lines)
  }
  console.log(
    ++mCount,
    info.name,
    'ver:', info.assets.length,
    'files:', fileNum
  )
}

async function task() {
  for (;;) {
    const lib = mLibs.pop()
    if (!lib) {
      break
    }
    const info = await fetchJson('https://api.cdnjs.com/libraries/' + lib.name)
    if (info) {
      parseLib(info)
    }
  }
}

async function main() {
  const json = await fetchJson('https://api.cdnjs.com/libraries')
  const {results} = json

  const libIdLines = results.map((v, i) => v.name + '\t' + i)
  fs.writeFileSync('var/lib-id.txt', libIdLines.join('\n'))

  mLibs = results.reverse()
  console.log('lib count:', mLibs.length)

  const tasks = []
  for (let i = 0; i < MAX_CONN; i++) {
    tasks[i] = task()
  }
  await Promise.all(tasks)
}
main()