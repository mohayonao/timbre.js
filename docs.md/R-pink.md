T("pink")
======================
Pink Noise Generator

## Description ##

(canvas noise w:240 h:80)

###### en ######
`T("pink")` generates pink noise.
###### ja ######
`T("pink")` はピンクノイズを出力します。
###### -- ######

```timbre
var noise = T("pink", {mul:0.15}).play();

var canvas = window.getCanvasById("noise");
var fft = T("spectrum", {size:512, interval:100}, noise).on("fft", function() {

    fft.plot({target:canvas});

}).listen(noise);
```

## Properties ##

## See Also ##
- [T("noise")](./noise.html)
  - White Noise Generator
- [T("fnoise")](./fnoise.html) 
  - Frequency Noise Generator

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/pink.js
