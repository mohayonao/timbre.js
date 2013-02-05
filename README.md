timbre.js
=========
JavaScript library for objective sound programming

Timbre.js provides a functional processing and synthesizing audio in your web apps with modern JavaScript's way like jQuery or node.js. It has many **T-Object** (formally: Timbre Object) that connected together to define the graph-based routing for overall audio rendering. It is a goal of this project to approach the next generation audio processing for web. 

## Project Page ##
[English](http://mohayonao.github.com/timbre.js/) | [日本語](http://mohayonao.github.com/timbre.js/ja/)

## Examples ##
[BeatBox](http://mohayonao.github.com/timbre.js/beatbox.html) | [Chords Work](http://mohayonao.github.com/timbre.js/chord.html) | [Gymnopedie](http://mohayonao.github.com/timbre.js/satie.html) | [Khoomii](http://mohayonao.github.com/timbre.js/koomii.html) | [Reich](http://mohayonao.github.com/timbre.js/reich.html)

## Supports ##
Timbre.js runs on a modern browser or node.js.

![Chrome 14.0-](http://mohayonao.github.com/timbre.js/misc/img/chrome.png)
![Safari 6.0-](http://mohayonao.github.com/timbre.js/misc/img/safari.png)
![Firefox 4.0-](http://mohayonao.github.com/timbre.js/misc/img/firefox.png)
![node.js 0.8-](http://mohayonao.github.com/timbre.js/misc/img/nodejs.png)

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

## License ##

MIT


## ChangeLog ##
**13.02.06** (337.50KB)
* Fixed: support iOS6.1, Android(Firefox)

**13.02.02** (335.97KB)
* Fixed: decoder for webkit

**13.02.01** (335.96KB)
* Added: `T("reverb")`
* Added: `T("chorus")`
* Added: `T("eq")`
* Added: `T("mediastream")`
* Added: `T("-")`, `T("/")`, `T("min")`, `T("max")`
* Added: `T("WebAudioAPI:recv")`, `T("WebAudioAPI:send")` at extras
* Added: `T("MoogFF")` at extras
* Renamed: `T("phaseshift")` to `T("phaser")`
* Renamed: event names `scope`, `fft` to `data` (`T("scope")`, `T("spectrum")`)
* Fixed: `T("osc").phase`, `T("osc").fb`
* Fixed: `T("biquad").plot()`
* Fixed: `T("mml").isEnded`

**13.01.20a** (294.82KB)
* Renamed: `T("comp").postGain` to `T("comp").gain`

**13.01.20** (294.83KB)
* Added: `T("adshr")`, `T("ahdsfr")`
* Added: `T("comp")`
* Added: `T("phaseshift")`

**13.01.18a** (268.71KB)
* new version (beta)
* [Overview of what's new and changed from old timbre.js v12.XX](https://github.com/mohayonao/timbre.js/wiki/Overview-of-what's-new-and-changed-from-old-timbre.js-v12.XX)
