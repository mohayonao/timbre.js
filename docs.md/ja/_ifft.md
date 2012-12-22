T("ifft")
=========
## Inverse fast Fourier transform ##

```timbre
var osc = T("saw");

var fft  = T("fft").listen(osc);
var real = T("sin", {freq:1}, fft.real);
var ifft = T("ifft", {real:real, imag:fft.imag}).play();
```
