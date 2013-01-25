T("timbre.js")
==============
JavaScript Library for Objective Sound Programming

## What is timbre.js? ##
Timbre.js provides a functional processing and synthesizing audio in your web apps with modern JavaScript's way like jQuery or node.js. It has many **T-Object** (formally: Timbre Object) that connected together to define the graph-based routing for overall audio rendering. It is a goal of this project to approach the next generation audio processing for web.
- - -
This project is hosted on [GitHub](https://github.com/mohayonao/timbre.js/). You can report bugs and discuss features on the [issues page](https://github.com/mohayonao/timbre.js/issues), or send tweets to [@mohayonao](http://twitter.com/mohayonao). I develop on Mac, mainly for Google Chrome.
- - -
This documentation includes many executable and editable sample code, so you can try timbre.js and see how it works, easily.

## Downloads ##
Recently released: v**${VERSION}**

```table
md:**[Production Version](/timbre.js/timbre.js)**|${MINSIZE}kb, minified
md:**[Development Version](/timbre.js/timbre.dev.js)**|${DEVSIZE}kb, uncompressed
md:[Edge Version](https://raw.github.com/mohayonao/timbre.js/master/timbre.dev.js)|md:unreleased, current `master`, use at your own risk.
```

## Supports ##
Timbre.js runs on a modern browser or node.js.

![Chrome 14.0-](/timbre.js/misc/img/chrome.png)
![Safari 6.0-](/timbre.js/misc/img/safari.png)
![Firefox 4.0-](/timbre.js/misc/img/firefox.png)
![node.js 0.8-](/timbre.js/misc/img/nodejs.png)

## Installation ##
### browser
Include the `timbre.js` file. It will install itself as `timbre`, `T` under the global namespace.

```html
<script src="timbre.js"></script>
<script>
  T("sin", {freq:880, mul:0.5}).play();
</script>
```

### node.js
Install via npm: `npm install timbre`, you can require it as a standard node module.

```js
var T = require("timbre");

T("sin", {freq:880, mul:0.5}).play();
```

## Summary of what's new and changed from old timbre.js v12.XX ##

### using named parameters instead of an order of arguments

```js
// v12.XX
T("sin", 880, 0.5).play();

// v13.XX
T("sin", {freq:880, mul:0.5}).play();
```
### `.on()` / `.off()` methods have changed
`.on()` / `.off()` are used for dealing with events like jQuery or node.js.  

```js
// v13.XX
T("perc", {r:1000}).on("ended", function() {
  this.bang();
}).bang();
```

You can use `.bypass()` instead of old `.on()` / `.off()`.
