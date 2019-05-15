const onload = require('fast-on-load')

const domElement = document.createElement('p')

onload(domElement, function () {
  console.log('element was mounted')
}, function () {
  console.log('element was unmounted')
})

setTimeout(function () {
  document.body.appendChild(domElement)

  setTimeout(function () {
    document.body.removeChild(domElement)
  }, 500)
}, 500)
