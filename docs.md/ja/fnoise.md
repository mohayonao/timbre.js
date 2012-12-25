T("fnoise")
==========
Frequency Noise Generator

## Description ##

(canvas noise w:240 h:80)

周期的ノイズを出力します。

(height 70)

```timbre
var freqs = T([220, 440, 880, 1760, 3520, 7040, 14080]);

var noise = T("fnoise", {freq:freqs, mul:0.15}).play();

var canvas = window.getCanvasById("noise");
var fft = T("spectrum", {size:512, interval:100}, noise).on("fft", function() {

    fft.plot({target:canvas});

}).listen(noise);

T("interval", {interval:1000}, freqs).start();
```

## Properties ##
- `freq` _(T Object)_

## See Also ##
- [T("noise")](/timbre.js/docs/ja/noise.html) 
  - White Noise Generator
- [T("pink")](/timbre.js/docs/ja/pink.html)
  - Pink Noise Generator
