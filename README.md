# This repository is no longer maintained.

timbre.js
=========
JavaScript library for objective sound programming

Timbre.js provides a functional processing and synthesizing audio in your web apps with modern JavaScript's way like jQuery or node.js. It has many **T-Object** (Timbre-Object) that connected together to define the graph-based routing for overall audio rendering. It is a goal of this project to approach the next generation audio processing for web.

## Project Page ##
[English](http://mohayonao.github.com/timbre.js/) | [日本語](http://mohayonao.github.com/timbre.js/ja/)

## Examples ##
[BeatBox](http://mohayonao.github.com/timbre.js/beatbox.html) | [Chords Work](http://mohayonao.github.com/timbre.js/chord.html) | [Gymnopedie](http://mohayonao.github.com/timbre.js/satie.html) | [Khoomii](http://mohayonao.github.com/timbre.js/khoomii.html) | [Reich](http://mohayonao.github.com/timbre.js/reich.html)

## Supports ##
Timbre.js runs on modern browsers for Windows/Mac/Linux/iOS/Android or node.js.

![Chrome 14.0-](http://mohayonao.github.com/timbre.js/misc/img/chrome.png)
![Safari 6.0-](http://mohayonao.github.com/timbre.js/misc/img/safari.png)
![Firefox 4.0-](http://mohayonao.github.com/timbre.js/misc/img/firefox.png)
![Opera](http://mohayonao.github.com/timbre.js/misc/img/opera.png)
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

### Flash fallback (for Opera and IE10)
Download an additional file (Right-click and use "Save As")

- [timbre.swf](/timbre.js/timbre.swf)

`timbre.swf` must be set in the same folder as `timbre.js`.

### node.js
Install via npm: `npm install timbre`, you can require it as a standard node module.

```js
var T = require("timbre");

T("sin", {freq:880, mul:0.5}).play();
```

## License ##

MIT

## ChangeLog ##
**14.11.25** (356.27KB)
* Merge: [#33](https://github.com/mohayonao/timbre.js/pull/33) update of the note duration formula to handle more 3 dots
* Merge: [#36](https://github.com/mohayonao/timbre.js/pull/36) use latest Web Audio API interfaces

**14.10.12** (356.28KB)
* Fixed: Decoding wav file
* Fixed: Envelope release

**14.08.07** (356.19KB)
* Fixed: Export for CommonJS env [#19](https://github.com/mohayonao/timbre.js/issues/19)

**14.06.23** (356.14KB)
* Fixed: [#23](https://github.com/mohayonao/timbre.js/issues/23) fix to work on an iOS device
* Fixed: fix to work on node.js

**14.05.28** (355.91KB)
* Fixed: [#19](https://github.com/mohayonao/timbre.js/issues/19)

**14.05.15** (355.95KB)
* Fixed: [#15](https://github.com/mohayonao/timbre.js/issues/15)
* Excluded support of Audio Data API. use Web Audio API instead.

**13.08.03** (361.93KB)
* Adding Extra: mp3_decode. See [mp3_decode](http://mohayonao.github.io/timbre.js/mp3_decode.html)
* Adding Extra: soundfont. See [soundfont](http://mohayonao.github.io/timbre.js/soundfont.html)

**13.05.03** (361.93KB)
* Bugfix: wav decoder. See [#3](https://github.com/mohayonao/timbre.js/issues/3)

**13.05.01** (361.75KB)
* Added: `T("task")`
* Added: `TimbreObject.to()`
* Added: `TimbreObject.splice()`
* Added: `TimbreObject.postMessage()`
* Updated: `T("mml")` support multi tracks, command token
* Updated: `TimbreObject` support buddies interface
* Bugfix: `T("mouse.x")`, `T("mouse.y")`

**13.04.19** (346.63KB)
* Bugfix: end process of `T("params")`

**13.04.17** (344.94KB)
* Updated: readable stream api (node.js)

**13.04.06** (344.94KB)
* Fixed: `T("pluck)` buffer size

**13.04.01** (344.95KB)
* Bugfix: `T("buffer").slice()`
* Bugfix: `fn.pointer()` for Opera
* Fixed: Flash fallback

**13.03.10** (345.41KB)
* Fixed: Checking Float64Array support. See [#2](https://github.com/mohayonao/timbre.js/pull/2)
* Changed: `lame` support (default -> optional)
* updated dependencies in package.json

**13.03.01** (355.72KB)
* Added: `T("script")`
* Added: `T("waveshaper")`
* Added: `T("lag")`
* Added: `T("mono")`
* Added: `T("delay").cross`
* Added: `T("audio.jsonp")` to extras
* Moved: `T("keyboard")` to extras
* Moved: `T("mouse")` to extras
* Moved: `T("cosc)` to extras
* Renamed: `T("mml")`: `mml` event listener -> `data` event listener
* Fixed: Flash fallback support for Opera, IE9 (changing the installation)
* make it easier to make a stereo object

**13.02.07** (334.61KB)
* Added `T.setup({f64:true})` to use Float64Array instead of Float32Array
* Added Android/Firefox support
* Added Flash fallback support for Opera, IE9
* performance improvements

**13.02.06** (337.50KB)
* workadound for iOS6.1 bug (failure to start processing in a callback of XMLHttpRequest)

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
