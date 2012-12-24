T("fft") / T("ifft") / T("spectrum")
====================================
Fast Fourier transform
{listener}

## Description ##

(canvas fft w:240 h:80)

フーリエ変換を行なうリスナーオブジェクトです。

(height 60)

```timbre
var saw = T("saw", {freq:440, mul:0.25}).play();

var fft = T("fft", saw).listen();

var canvas = window.getCanvasById("fft");
window.animate(function() {
    fft.plot({target:canvas});
});
```

変換結果は `real` と `imag` プロパティで取得でき、フーリエ逆変換を行なう `T("ifft")` オブジェクトの入力に使用できます。以下の例では矩形波をフーリエ変換をした結果のうち、実数部を加工してフーリエ逆変換オブジェクトの入力にしています。

```timbre
var synth = T("pulse", {freq:880, mul:0.25});

var fft  = T("fft", synth).listen();

var real = fft.real;
var imag = fft.imag;

real = T("*", real, T("sin", {freq:0.1}).kr());

T("ifft", {real:real, imag:imag}).play();
```

### T("spectrum") ###

(canvas spectrum w:240 h:80)

`T("ifft")` オブジェクトを用いたスペクトル合成を行なわずに解析の結果を表示することだけが目的の場合は `T("spectrum")` オブジェクトのほうが適しています。`T("spectrum")` は `interval` プロパティの間隔ごとに `size` プロパティの大きさのバッファを解析します。以下の例では 100ミリ秒ごとに FFTサイズ 512 の解析結果を表示しています。

(height 30)

```timbre
var saw = T("pink", {mul:0.15});

var canvas = window.getCanvasById("spectrum");
var fft = T("spectrum", {size:512, interval:100}, saw).on("fft", function() {
    fft.plot({target:canvas});
}).play();
```
