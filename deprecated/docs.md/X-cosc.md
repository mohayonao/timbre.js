T("cosc")
=========
{ar} Chorusing Wavetable Oscillator

## Description ##
en: `T("cosc")` is chorusing wavetable lookup oscillator.
ja: `T("cosc")` はコーラスつきオシレーターです。

```timbre
T("cosc", {wave:"saw", freq:440, beats:5, mul:0.25}).play();
```

## Properties ##
- `wave` _(String or Function or Float32Array)_
en:  - Sets a wavetable. See also [`T("osc")`](./osc.html).
ja:  - 波形を設定します。詳細は [`T("osc")`](./osc.html) を参照してください
- `freq` _(T-Object)_
en:  - Frequency in Hertz. Its default value is **440**Hz.
ja:  - 周波数。デフォルト値は **440**Hz
- `beats` _(Number)_
en:  - Beat frequency in Hertz. Its default value is **0.5**.
ja:  - ゆらぎの度合い。デフォルト値は **0.5**

## See Also ##
- [`T("osc")`](./osc.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/extras/cosc.js

<script src="/timbre.js/src/extras/cosc.js"></script>
