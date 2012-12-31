T("fft")
========
{ar}{listener} Fast Fourier transform

## Description ##

(canvas fft w:240 h:80)

フーリエ変換を行なうリスナーオブジェクトです。処理の結果は `real` と `imag` プロパティに格納されます。このプロパティ値は他の T オブジェクトの入力として使用することができ、逆変換オブジェク `T("ifft")` と合わせてスペクトル合成の用途に使えます。

```timbre
var saw = T("saw", {freq:440, mul:0.25}).play();

var fft = T("fft").listen(saw);

var canvas = window.getCanvasById("fft");
window.animate(function() {
    fft.plot({target:canvas});
});
```

## Properties ##
- `real` _(ReadOnly T Object)_
- `imag` _(ReadOnly T Object)_
- `window` _(String)_
- `spectrum` _(ReadOnly Float32Array)_

## Methods ##
- `plot(opts)`

## Note ##
スペクトルを表示することだけが目的の場合は `T("spectrum")` オブジェクトのほうが適しています。

## See Also ##
- [T("ifft")](./ifft.html)
  - Inverse Fast Fourier Transform
- [T("spectrum")](./spectrum.html)
  - Spectrum Viewer

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/fft.js
