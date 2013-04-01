T("midicps")
============
{krar} Convert MIDI note to cycles per second

## Description ##
ja: 入力オブジェクト値の合計をMIDIノート番号として周波数に変換します。

```timbre
var midicps = T("midicps");

T("tri", {freq:midicps, mul:0.25}).play();

T("interval", {interval:500}, function(count) {
  midicps.midi = 69 + (count % 12);
}).start();
```

## Properties ##
- `midi` _(Number)_
ja:  - 入力オブジェクトがない場合には, この値が入力値となる
- `a4` _(Number)_  
ja:  - 中央 A4 の周波数。 デフォルトは **440Hz**

## Methods ##
- `at(midi)`
ja:  - midi の値を取得する

## See Also ##
- [`T("midiratio")`](./midiratio.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/midicps.js
