T("ifft")
=========
{ar} Inverse Fast Fourier Transform

## Description ##

ja: `T("fft")` の `real` と `imag` プロパティを `T("ifft")` のプロパティに入力することで逆変換を行ないます。

```timbre
var saw = T("saw", {freq:880, mul:0.15});

var fft = T("fft").listen(saw);

var real = fft.real;
var imag = fft.imag;

T("ifft", {real:real, imag:imag}).play();
```

## Properties ##
- `real` _(T-Object)_
- `imag` _(T-Object)_

## See Also ##
- [T("fft")](./fft.html)
  - Fast Fourier Transform

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/ifft.js
