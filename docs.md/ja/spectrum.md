T("spectrum")
=============
Spectrum Viewer {listener}

(canvas spectrum w:240 h:80)

入力のスペクトルを表示します。`T("fft")` と異なり、FFTサイズの設定や解析の間隔の設定が行なえますが、解析の結果の `real`, `imag` プロパティを他の T オブジェクトに渡すことができません。表示が目的の場合は `T("spectrum")`、 スペクトル合成が目的の場合は `T("fft")` と使いわけします。
以下の例では 100ミリ秒ごとに FFTサイズ 512 の解析結果を表示しています。

```timbre
var saw = T("pink", {mul:0.15}).play();

var canvas = window.getCanvasById("spectrum");
var fft = T("spectrum", {size:512, interval:100}).on("fft", function() {
    fft.plot({target:canvas});
}).listen(saw);
```

## Properties ##
- `size` _(Number)_
- `window` _(String)_
- `interval` _(Number or timevalue)_
- `spectrum` _(Float32Array)_
- `real` _(Float32Array)_
- `imag` _(Float32Array)_

## Methods ##
- `plot(opts)`

## Events ##
- `fft`

## See Also ##
- [T("fft")](/timbre.js/docs/ja/fft.html)
  - Fast Fourier Transform
- [T("ifft")](/timbre.js/docs/ja/ifft.html)
  - Inverse Fast Fourier Transform
