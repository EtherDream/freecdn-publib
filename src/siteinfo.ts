export const CDNJS_COMPLETE = [
  'https://ajax.cdnjs.com/ajax/libs/',
  'https://cdnjs.cloudflare.com/ajax/libs/',
  'https://cdn.jsdelivr.net/gh/cdnjs/cdnjs/ajax/libs/',
]

export const CDNJS_PARTIAL = [
  // #0
  {
    root: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-6-M/',
  },
  // #1
  {
    root: 'https://cdnjs.loli.net/ajax/libs/'
  },
  // #2
  {
    root: 'https://lib.baomitu.com/'
  },
  // #3
  {
    root: 'https://cdn.staticfile.org/'
  },
  // #4
  {
    root: 'https://cdn.bootcss.com/'
  },
  // #5
  {
    root: 'https://cdn.bootcdn.net/ajax/libs/'
  },
  // #6
  {
    root: 'https://unpkg.com/',
    rewrite: [
      {from: /(.+?)\/(.+?)\/(.+)/, to: '$1@$2/dist/$3'},
    ]
  },
  // #7
  {
    root: 'https://g.alicdn.com/code/lib/',
  },
  // #8
  {
    root: 'https://pagecdn.io/lib/',
  },
  // #9
  {
    root: 'https://ajax.aspnetcdn.com/ajax/',
    rewrite: [
      {from: /^jquery\/(.*)\/jquery/, to: 'jquery/jquery-$1'},
      {from: /^jquery-mobile\//, to: 'jquery.mobile/'},
      {from: /^jqueryui\//, to: 'jquery.ui/'},
      {from: /^jquery-migrate\/(.*)\/jquery-migrate(-\d\.\d\.\d)?/, to: 'jquery.migrate/jquery-migrate-$1'},
      {from: /^jquery-validate\//, to: 'jquery.validate/'},
      {from: /^datatables\//, to: 'jquery.dataTables/'},
      {from: /^modernizr\/(.*)\/modernizr/, to: 'modernizr/modernizr-$1'},
      {from: /^knockout\/(.*)\/knockout-\w+/, to: 'knockout/knockout-$1'},
      {from: /^signalr\.js\/(.*)\/jquery.signalR/, to: 'signalr/jquery.signalr-$1'},
      {from: /^respond\.js\//, to: 'respond/'},
      {from: /^twitter-bootstrap\//, to: 'bootstrap/'},
    ]
  },
  // #10
  {
    root: 'https://ajax.googleapis.com/ajax/libs/',
  },
  // #11
  {
    root: 'https://code.jquery.com/',
    rewrite: [
      {from: /^jquery\/(.*)\/jquery/, to: 'jquery-$1'},
      {from: /^jqueryui\//, to: 'ui/'},
      {from: /^jquery-color\//, to: 'color/'},
      {from: /^jquery-mobile\//, to: 'mobile/'},
      {from: /^jquery-migrate\/(.*)\/jquery-migrate(-\d\.\d\.\d)?/, to: 'jquery-migrate-$1'},
      {from: /^qunit\/(.*)\/qunit/, to: 'qunit/qunit-$1'},
    ]
  },
  // #12
  {
    root: 'https://stackpath.bootstrapcdn.com/',
    rewrite: [
      {from: /^twitter-bootstrap\//, to: 'bootstrap/'},
    ]
  },
  // #13
  {
    root: 'https://maxcdn.bootstrapcdn.com/',
    rewrite: [
      {from: /^twitter-bootstrap\//, to: 'bootstrap/'},
    ]
  },
  // #14
  {
    root: 'https://cdn.datatables.net/',
    rewrite: [
      {from: /^datatables\//, to: ''},
    ]
  },
  // #15
  {
    root: 'https://twemoji.maxcdn.com/v/',
    rewrite: [
      {from: /^twemoji\//, to: ''},
    ]
  },
]


export function decodeUrls(bits: number, path: string) {
  const urls = CDNJS_COMPLETE.map(v => v + path)

  CDNJS_PARTIAL.forEach((v, i) => {
    if ((bits & (1 << i)) === 0) {
      return
    }
    let newPath = path
    if (v.rewrite) {
      for (const re of v.rewrite) {
        newPath = path.replace(re.from, re.to)
        if (newPath !== path) {
          break
        }
      }
    }
    urls.push(v.root + newPath)
  })

  return urls
}