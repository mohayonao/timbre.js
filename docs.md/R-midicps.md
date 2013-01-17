T("midicps")
============
{kr} Convert MIDI note to cycles per second

## Description ##
入力オブジェクト値の合計をMIDIノート番号として周波数に変換します。

```timbre
var midicps = T("midicps");

T("tri", {freq:midicps, mul:0.25}).play();

T("interval", {interval:500}, function(count) {
    midicps.midi = 69 + (count % 12);
}).start();
```

## Properties ##
- `midi` _(Number)_
  - 入力オブジェクトがない場合には, この値が入力値となる
- `a4` _(Number)_  
  - 中央 A4 の周波数。 デフォルトは **440Hz**

## Methods ##
- `at(midi)`
  - midi の値を取得する

## See Also ##
- [`T("midiratio")`](./midiratio.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/midicps.js
