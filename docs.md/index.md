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
Recently released: **${VERSION}**

```table
md:**[Production Version](/timbre.js/timbre.js)**|md: ${MINSIZE}kb, minified ([Source Maps](/timbre.js/timbre.js.map))
md:**[Development Version](/timbre.js/timbre.dev.js)**|md: ${DEVSIZE}kb, uncompressed
md:[Edge Version](https://raw.github.com/mohayonao/timbre.js/master/timbre.dev.js)|md: unreleased, current `master`, use at your own risk.
```

## Supports ##
Timbre.js runs on a modern browser for Windows/Mac/Linux/iOS/Android or node.js.

![Chrome 14.0-](/timbre.js/misc/img/chrome.png)
![Safari 6.0-](/timbre.js/misc/img/safari.png)
![Firefox 4.0-](/timbre.js/misc/img/firefox.png)
![Opera](/timbre.js/misc/img/opera.png)
![IE9](/timbre.js/misc/img/ie.png)
![node.js 0.8-](/timbre.js/misc/img/nodejs.png)

*IE support is only Internet Explorer 9.*  
*iOS support is only later iOS6.0*  
*Android support is only [Firefox](https://play.google.com/store/apps/details?id=org.mozilla.firefox) app.*

## Installation ##
### browser
Include the `timbre.js` file. It will install itself as `timbre`, `T` under the global namespace.

```html
<script src="timbre.js"></script>
<script>
  T("sin", {freq:880, mul:0.5}).play();
</script>
```

### Flash fallback (for Opera and IE9)
Download an additional file (Right-click and use "Save As")

- [timbre.swf](/timbre.js/timbre.swf)

`timbre.swf` must be set in the same folder as `timbre.js`.

### node.js
Install via npm.

```sh
$ npm install timbre
```

You can require it as a standard node module.
 
```js
var T = require("timbre");

T("sin", {freq:880, mul:0.5}).play();
```
