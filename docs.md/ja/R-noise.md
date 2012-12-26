T("noise")
==========
White Noise Generator

## Description ##

(canvas noise w:240 h:80)

ホワイトノイズを出力します。

(height 70)

```timbre
var noise = T("noise", {mul:0.15}).play();

var canvas = window.getCanvasById("noise");
var fft = T("spectrum", {size:512, interval:100}, noise).on("fft", function() {

    fft.plot({target:canvas});

}).listen(noise);
```

## Properties ##

## See Also ##
- [T("pink")](./pink.html)
  - Pink Noise Generator
- [T("fnoise")](./fnoise.html) 
  - Frequency Noise Generator
