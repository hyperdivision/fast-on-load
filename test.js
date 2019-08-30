var onload = require('./')
var test = require('tape')
var yo = require('yo-yo')

test('onload/onunload', function (t) {
  t.plan(2)
  var el = document.createElement('div')
  el.textContent = 'test'
  onload(el, function () {
    t.ok(true, 'onload called')
    document.body.removeChild(el)
  }, function () {
    t.ok(true, 'onunload called')
    document.body.innerHTML = ''
    t.end()
  })
  document.body.appendChild(el)
})

test('passed el reference', function (t) {
  t.plan(4)
  function page1 () {
    var tree = yo`<div>page1</div>`
    return onload(tree, function (el) {
      t.equal(el, tree, 'onload passed element reference for page1')
    }, function (el) {
      t.equal(el, tree, 'onunload passed element reference for page1')
    })
  }
  function page2 () {
    var tree = yo`<div>page2</div>`
    return onload(tree, function (el) {
      t.equal(el.textContent, 'page2', 'onload passed element reference for page2')
    }, function (el) {
      t.equal(el.textContent, 'page2', 'onunload passed element reference for page2')
    })
  }

  var root = page1()
  document.body.appendChild(root)
  runops([
    function () {
      root = update(root, page2())
    },
    function () {
      root.parentNode.removeChild(root)
    }
  ])
})

test('nested', function (t) {
  t.plan(2)
  var e1 = document.createElement('div')
  var e2 = document.createElement('div')
  e1.appendChild(e2)
  document.body.appendChild(e1)

  var e3 = document.createElement('div')
  onload(e3, function () {
    t.ok(true, 'onload called')
    e2.removeChild(e3)
  }, function () {
    t.ok(true, 'onunload called')
    document.body.innerHTML = ''
    t.end()
  })
  e2.appendChild(e3)
})

test('complex', function (t) {
  t.plan(3)
  var state = []

  function button () {
    var el = yo`<button>click</button>`
    onload(el, function () {
      state.push('on')
    }, function () {
      state.push('off')
    })
    return el
  }

  var root = yo`<div>
    ${button()}
  </div>`
  document.body.appendChild(root)

  runops([
    function () {
      t.deepEqual(state, ['on'], 'turn on')
      state = []
      root = update(root, yo`<p>removed</p>`)
    },
    function () {
      t.deepEqual(state, ['off'], 'turn off')
      state = []
      global.debug = true
      var btn = button()
      root = update(root, yo`<p><div>${btn}</div></p>`)
      root = update(root, yo`<p>
        <div>Updated</div>
        <div>${btn}</div>
      </p>`)
    },
    function () {
      t.deepEqual(state, ['on'], 'turn on')
      root.parentNode.removeChild(root)
    }
  ], function () {
    t.end()
  })
})

test('complex nested', function (t) {
  t.plan(7)
  var state = []
  function button () {
    var el = yo`<button>click</button>`
    onload(el, function () {
      state.push('on')
    }, function () {
      state.push('off')
    })
    return el
  }
  function app (page) {
    return yo`<div class="app">
      <h1>Hello</h1>
      ${page}
    </div>`
  }

  var root = app(yo`<div>Loading...</div>`)
  document.body.appendChild(root)

  var a = button()
  var b = button()

  runops([
    function () {
      t.deepEqual(state, [], 'did nothing')
      state = []
      root = update(root, app(yo`<div class="page">
        ${a}
      </div>`))
    },
    function () {
      t.deepEqual(state, ['on'], 'turn on')
      state = []
      root = update(root, app(yo`<div class="page">
        <h3>Another Page</h3>
      </div>`))
    },
    function () {
      t.deepEqual(state, ['off'], 'turn off')
      state = []
      root = update(root, app(yo`<div class="page">
        ${a}
        ${b}
      </div>`))
    },
    function () {
      t.deepEqual(state, ['on', 'on'], 'turn 2 on')
      state = []
      a.replaceWith(yo`<p>removed</p>`)
    },
    function () {
      t.deepEqual(state, ['off'], 'turn one off')
      state = []
      root = update(root, app(yo`Loading...`))
    },
    function () {
      t.deepEqual(state, ['off'], 'turn other off')
      state = []
      root = update(root, app(yo`<div>
        <ul>
          <li><div><p>${button()}</p></div></li>
        </ul>
      </div>`))
    },
    function () {
      t.deepEqual(state, ['on'], 'turn on')
      root.parentNode.removeChild(root)
    }
  ], function () {
    t.end()
  })
})

test('operates with memoized elements', function (t) {
  t.plan(1)
  var results = []
  function sub () {
    return onload(yo`<div>sub</div>`, function () {
      results.push('sub on')
    }, function () {
      results.push('sub off')
    })
  }
  var saved = null
  function parent () {
    saved = saved || onload(yo`<div>parent${sub()}</div>`, function () {
      results.push('parent on')
    }, function () {
      results.push('parent off')
    })
    return saved
  }
  function app () {
    return yo`<div>${parent()}</div>`
  }
  var root = app()
  document.body.appendChild(root)
  var interval = setInterval(function () {
    root = update(root, app())
  }, 10)
  setTimeout(function () {
    clearInterval(interval)
    t.deepEqual(results, ['parent on', 'sub on'])
    t.end()
  }, 100)
})

test('onload.delete works', function (t) {
  var el = document.createElement('div')
  el.textContent = 'test'
  function loadFunction () {
    t.pass('Load function should be called')
    onload.delete(el, loadFunction, unloadFunction)
    setTimeout(() => {
      t.end()
    }, 200)
    document.body.removeChild(el)
  }
  function unloadFunction () {
    t.fail('Unload function should not be called')
  }
  onload(el, loadFunction, unloadFunction)
  document.body.appendChild(el)
})

test('benchmark', function (t) {
  var fragment = document.createDocumentFragment()
  var container = document.createElement('div')
  container.id = 'benchmark container'
  // ~346ms Warm Chrome 76 macOS for 100000
  var nodesToOnload = 100000
  var loaded = 0
  var timeStart
  var timeEnd

  for (var i = 0; i < nodesToOnload; i++) {
    const el = document.createElement('div')
    el.textContent = `el ${i}`
    onload(el, () => {
      loaded++
      if (loaded === nodesToOnload) {
        document.body.removeChild(container)
      }
    }, () => {
      loaded--
      if (loaded === 0) {
        t.end()
        console.timeEnd('onload benchmark')
        timeEnd = window.performance.now()
        t.pass(`~${timeEnd - timeStart}ms`)
      }
    })
    fragment.appendChild(el)
  }

  timeStart = window.performance.now()
  document.body.appendChild(container)
  console.time('onload benchmark')
  container.appendChild(fragment)
})

function runops (ops, done) {
  function loop () {
    var next = ops.shift()
    if (next) {
      next()
      setTimeout(loop, 10)
    } else {
      if (done) done()
    }
  }
  setTimeout(loop, 10)
}

function update (root, n) {
  if (root === n) return root
  root.replaceWith(n)
  return n
}
