T("PluckGen")
=============
{ar} Karplus–Strong string synthesis

## Description ##
ja: [`T("pluck")`](./pluck.html) と [`T("env")`](./env.html) を組み合わせた音源インターフェースです。

```timbre
var env = T("perc", {a:50, r:2500});
var pluck = T("PluckGen", {env:env, mul:0.5}).play();

T("interval", {interval:500}, function(count) {
  var noteNum  = 69 + [0, 2, 4, 5, 7, 9, 11, 12][count % 8];
  var velocity = 64 + (count % 64);
  pluck.noteOn(noteNum, velocity);
}).start();
```

## Properties ##
- `env`  
ja:  - エンベロープのパラメーター
- `poly`
ja:  - 同時発音数 (1から 64まで、デフォルトは 4)

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
- [`T("pluck")`](./pluck.html)
  - Karplus–Strong string synthesis
- [`T("env")`](./env.html)
  - Envelope
  
## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/synthdef.js
