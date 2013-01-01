T("cosc")
=========
{ar} Chorusing Wavetable Oscillator

## Description ##
コーラスつきオシレーター

```timbre
T("cosc", {wave:"saw", freq:440, beats:0.5, mul:0.25}).play();
```

## Properties ##
- `wave` _(String or Function or Float32Array)_
  - 波形を設定します. 詳細は [`T("osc")`](./osc.html) を参照してください.
- `freq` _(T Object or timevalue)_
  - 周波数. デフォルト値は **440**Hz
- `beats` _(Number)_
  - ゆらぎの度合い. デフォルト値は **0.5**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/cosc.js
