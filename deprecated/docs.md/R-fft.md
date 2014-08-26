T("fft")
========
{ar}{stereo}{listener} Fast Fourier transform

## Description ##

(canvas canvas w:240 h:80)

ja: フーリエ変換を行なうリスナーオブジェクトです。処理の結果は `real` と `imag` プロパティに格納されます。このプロパティ値は他の T オブジェクトの入力として使用することができ、逆変換オブジェク `T("ifft")` と合わせてスペクトル合成の用途に使えます。

```timbre
var saw = T("saw", {freq:440, mul:0.25}).play();

var fft = T("fft").listen(saw);

T("interval", {interval:100}, function() {
  fft.plot({target:canvas});    
}).start();
```

## Properties ##
- `real` _(ReadOnly T Object)_
  - The real part of the Fourier transform.
- `imag` _(ReadOnly T Object)_
  - The imaginary part of the Fourier transform.
- `spectrum` _(ReadOnly Float32Array)_
  - The frequency-domain data analyzed (dB).

## Methods ##
- `plot(opts)`

## Note ##
en: When it is the purpose to display a spectrum. `T("spectrum")` is suitable. 
ja: スペクトルを表示することが目的の場合は `T("spectrum")` オブジェクトのほうが適しています。

## See Also ##
- [T("ifft")](./ifft.html)
  - Inverse Fast Fourier Transform
- [T("spectrum")](./spectrum.html)
  - Spectrum Viewer

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/fft.js
