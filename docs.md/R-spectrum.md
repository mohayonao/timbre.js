T("spectrum")
=============
{ar}{stereo}{listener} Spectrum Viewer

(canvas canvas w:240 h:80)

ja: 入力のスペクトルを表示します。`T("fft")` と異なり、FFTサイズの設定や解析の間隔の設定が行なえますが、解析の結果の `real`, `imag` プロパティを他の T オブジェクトに渡すことができません。表示が目的の場合は `T("spectrum")`、 スペクトル合成が目的の場合は `T("fft")` と使いわけします。
ja: 以下の例では 100ミリ秒ごとに FFTサイズ 512 の解析結果を表示しています。

```timbre
var saw = T("pink", {mul:0.15}).play();

var fft = T("spectrum", {size:512, interval:100}).on("data", function() {
  fft.plot({target:canvas});
}).listen(saw);
```

## Properties ##
- `size` _(Number)_
  - The size of the FFT. This must be a power of two. Default value is **512**.
- `interval` _(Number or timevalue)_
  - The interval to analyze. Default value is **500**msec.
- `spectrum` _(ReadOnly Float32Array)_
  - The frequency-domain data analyzed (dB).
- `real` _(ReadOnly Float32Array)_
  - The real part of the Fourier transform.
- `imag` _(ReadOnly Float32Array)_
  - The imaginary part of the Fourier transform.

## Methods ##
- `plot(opts)`

## Events ##
- `fft`

## See Also ##
- [T("fft")](./fft.html)
  - Fast Fourier Transform
- [T("ifft")](./ifft.html)
  - Inverse Fast Fourier Transform

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/spectrum.js
