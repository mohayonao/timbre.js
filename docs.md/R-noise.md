T("noise")
==========
{ar} White Noise Generator

## Description ##

(canvas canvas w:240 h:80)

en: `T("noise")` generates white noise.
ja: `T("noise")` はホワイトノイズを出力します。

```timbre
var noise = T("noise", {mul:0.15}).play();

var fft = T("spectrum", {size:512, interval:100}, noise).on("data", function() {

  fft.plot({target:canvas});

}).listen(noise);
```

## Properties ##

## See Also ##
- [T("pink")](./pink.html)
  - Pink Noise Generator
- [T("fnoise")](./fnoise.html) 
  - Frequency Noise Generator

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/noise.js
