T("mono")
=========
{arkr} Mixdown in mono

## Description ##
en: `T("mono")` is same as `T("+")`, but mixdown in mono.
ja: `T("mono")` はモノラルミックスダウンします。

```timbre
var lfo = T("sin", {freq:0.5}).kr();
var synth = T("pan", {pos:lfo}, T("saw", {mul:0.25}));

T("mono", synth).play();
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/mono.js
