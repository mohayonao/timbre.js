T("OscGen")
===========
Oscillator x Envelope

## Description ##
[`T("osc")`](./osc.html) と [`T("env")`](./env.html) を組み合わせた音源インターフェースです。

```timbre
var env = {type:"perc", a:50, r:2500};
var oscenv = T("OscGen", {wave:"pulse", env:env, mul:0.15}).play();

T("interval", {delay:0, interval:500}, function(count) {
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
- `noteOn(noteNum, velocity)`
  - *noteNum は 音の高さを示す 0 - 127 までの数値です (69 で A4=440Hz になります)*
  - *velocity は 音の強度を示す 0 - 127 までの数値です (0 の場合、noteOffと同じになります)*
- `noteOff(noteNum)`

- `noteOnWithFreq(freq, velocity)`
- `noteOffWithFreq(freq)`

## See Also ##
- [`T("osc")`](./osc.html)
  - Oscillator
- [`T("env")`](./env.html)
  - Envelope

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/OscGen.js
