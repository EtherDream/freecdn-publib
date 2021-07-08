const readline = require('readline')
const crypto = require('crypto')
const fs = require('fs')
const fetch = require('node-fetch')
const {
  CDNJS_COMPLETE,
  CDNJS_PARTIAL,
} = require('../lib/siteinfo.js')

const MAX_CONN = 100


let mBaseUrl = ''

async function* createLineReader(file, rewrite) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
  })
  L: for await (let line of rl) {
    line = line.match(/^\S+/)[0]
    if (!line) {
      continue
    }
    if (!rewrite) {
      yield [line, line]
      continue L
    }
    for (const re of rewrite) {
      if (re.from.test(line)) {
        const replaced = line.replace(re.from, re.to)
        yield [replaced, line]
        continue L
      }
    }
    yield [line, line]
  }
}

const FETCH_OPT = {
  headers: {
    'accept-encoding': 'gzip, deflate, br',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36',
  }
}

let mOkNum = 0
let nBadNum = 0

async function task(reader, writer) {
  for (;;) {
    const {done, value} = await reader.next()
    if (done) {
      break
    }
    const [path, rawPath] = value
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
    }, 1000 * 10)
    FETCH_OPT.signal = controller.signal

    const info = await request(path)
    if (info) {
      const [hash, size] = info
      const output = hash + '\t' + size + '\t' + rawPath + '\n'
      writer.write(output)
      mOkNum++
    }
    clearInterval(timer)
  }
}

async function request(path) {
  const url = mBaseUrl + path
  try {
    var res = await fetch(encodeURI(url), FETCH_OPT)
  } catch {
    nBadNum++
    return
  }
  if (res.status !== 200) {
    // console.log(url)
    nBadNum++
    return
  }
  const acao = res.headers['access-control-allow-origin']
  if (acao && acao.includes('*')) {
    nBadNum++
    return
  }
  const sha256 = crypto.createHash('sha256')
  let size = 0
  try {
    for await (const chunk of res.body) {
      sha256.update(chunk)
      size += chunk.length
    }
  } catch {
    sha256.end()
    nBadNum++
    return
  }
  const hash = sha256.digest().toString('hex')
  return [hash, size]
}


async function main(site, ifile, ofile) {
  if (!ofile) {
    console.error('useage: node . <site> <input> <output>')
    return
  }
  let rewrite

  mBaseUrl = CDNJS_COMPLETE.find(v => v.startsWith(`https://${site}/`))
  if (!mBaseUrl) {
    const info = CDNJS_PARTIAL.find(v => v.root.startsWith(`https://${site}/`))
    if (!info) {
      console.error('unknown site:', site)
      return
    }
    mBaseUrl = info.root
    rewrite = info.rewrite
  }

  const writer = fs.createWriteStream(ofile)
  const reader = createLineReader(ifile, rewrite)

  const tid = setInterval(() => {
    console.log('ok:', mOkNum, 'bad:', nBadNum)
  }, 1000)

  const tasks = []
  for (let i = 0; i < MAX_CONN; i++) {
    tasks[i] = task(reader, writer)
  }
  await Promise.all(tasks)

  console.log('done')
  clearTimeout(tid)
}

main(...process.argv.slice(2))