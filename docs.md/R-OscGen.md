T("OscGen")
===========
{ar} Oscillator x Envelope

## Description ##
[`T("osc")`](./osc.html) と [`T("env")`](./env.html) を組み合わせた音源インターフェースです。

```timbre
var env = T("perc", {a:50, r:2500});
var oscenv = T("OscGen", {wave:"pulse", env:env, mul:0.15}).play();

T("interval", {interval:500}, function(count) {
  var noteNum  = 69 + [0, 2, 4, 5, 7, 9, 11, 12][count % 8];
  var velocity = 64 + (count % 64);
  oscenv.noteOn(noteNum, velocity);
}).start();
```

## Properties ##
- `wave`
  - 波形の種類
- `env`  
  - エンベロープのパラメーター
- `poly`
  - 同時発音数 (1から 64まで、デフォルトは 4)

## Methods ##
- `noteOn(noteNum, velocity, opts)`
- `noteOnWithFreq(freq, velocity, opts)`  
- `noteOff(noteNum)`
- `noteOffWithFreq(freq)`
- `allNoteOff()`
- `allSoundOff()`

## See Also ##
- [`T("SynthDef")`](./SynthDef.html)
  - Synth Definition
- [`T("osc")`](./osc.html)
  - Oscillator
- [`T("env")`](./env.html)
  - Envelope

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/synthdef.js
