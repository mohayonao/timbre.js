T("noise") / T("pink")
======================
Noise generators

## T("noise") ##

(canvas noise w:240 h:80)

ホワイトノイズを出力します。

(height 70)

```timbre
var noise = T("noise", {mul:0.15});

var canvas = window.getCanvasById("noise");
var fft = T("spectrum", {size:512, interval:100}, noise).on("fft", function() {

    fft.plot({target:canvas});

}).play();
```

## T("pink") ##

(canvas pink w:240 h:80)

ピンクノイズを出力します。

(height 70)

```timbre
var noise = T("pink", {mul:0.15});

var canvas = window.getCanvasById("pink");
var fft = T("spectrum", {size:512, interval:100}, noise).on("fft", function() {

    fft.plot({target:canvas});

}).play();
```
