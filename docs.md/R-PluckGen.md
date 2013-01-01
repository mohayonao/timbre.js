T("PluckGen")
=============
{ar} Karplus–Strong string synthesis

## Description ##
[`T("pluck")`](./pluck.html) と [`T("env")`](./env.html) を組み合わせた音源インターフェースです。

```timbre
var env = {type:"perc", a:50, r:2500};
var pluck = T("PluckGen", {env:env, mul:0.15}).play();

T("interval", {delay:0, interval:500}, function(count) {
    var noteNum  = 69 + [0, 2, 4, 5, 7, 9, 11, 12][count % 8];
    var velocity = 64 + (count % 64);
    pluck.noteOn(noteNum, velocity);
}).start();
```

## Properties ##
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
- `allNoteOff()`

## See Also ##
- [`T("pluck")`](./pluck.html)
  - Karplus–Strong string synthesis
- [`T("env")`](./env.html)
  - Envelope
  
## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/PluckGen.js
