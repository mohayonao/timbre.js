T("+")
======
{arkr}{stereo} Add signals

## Description ##
en: `T("+")` is a signal add operator that outputs a signal which is the sum of the all inputs signals.
ja: `T("+")` はそれぞれのインプットの信号を加算して出力します。

```timbre
T("+", T("sin", {freq:523.35, mul:0.25}),
       T("sin", {freq:659.25, mul:0.25}),
       T("sin", {freq:783.99, mul:0.25})).play();
```

## Note ##
en: Any **T-Object** automatically uses the sum of all signals received in that inputs. Thus, the `T("+")` object is necessary only to show signal addition explicitly, or to add an offset to a signal.
ja: timbre.js のほとんどのオブジェクトは複数の入力を加算してから処理を行ないます。

```timbre
var chord = T("+", T("saw", {freq:523.35, mul:0.25}),
                   T("saw", {freq:659.25, mul:0.25}),
                   T("saw", {freq:783.99, mul:0.25}));
var cutoff = T("sin", {freq:"250ms", mul:800, add:1600}).kr();

T("lpf", {cutoff:cutoff}, chord).play();
```

en: The below example are the same as the above example.
ja: 以下のコードは上のコードと同じ動きをします。

```timbre
var cutoff = T("sin", {freq:"250ms", mul:800, add:1600}).kr();

T("lpf", {cutoff:cutoff}, 
  T("saw", {freq:523.35, mul:0.25}),
  T("saw", {freq:659.25, mul:0.25}),
  T("saw", {freq:783.99, mul:0.25})
).play();
```
