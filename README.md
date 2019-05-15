# `fast-on-load`

[![Build Status](https://travis-ci.org/hyperdivision/fast-on-load.svg?branch=master)](https://travis-ci.org/hyperdivision/fast-on-load)

> Faster and simplified version of [on-load](https://github.com/shama/on-load) without dom diffing support.

## Usage

``` js
const onload = require('fast-on-load')

onload(domElement, function () {
  console.log('element was mounted')
}, function () {
  console.log('element was unmounted')
})
```

Uses a MutationObserver and a generated class together with `getElementsByClassName()` to find DOM nodes that on-load is tracking, which performs
much faster (around 1000x in our machines) on bigger DOM trees that the tree traversal algo `on-load` uses.

## API

`const node = onload(node, [onload], [onunload])`

Watch `node`, optionally passing `onload` and `onunload` handler.
Returns the node itself.

## Install

```sh
npm install fast-on-load
```

## License

MIT
