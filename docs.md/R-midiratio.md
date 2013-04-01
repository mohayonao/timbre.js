T("midiratio")
==============
{krar} Convert an interval in semitones to a ratio

## Description ##
ja: 入力オブジェクト値の合計をMIDIノート番号として比率に変換します。

```timbre
var midiratio = T("midiratio");
var freq = T("*", 440, midiratio).kr();

T("tri", {freq:freq, mul:0.25}).play();

T("interval", {interval:500}, function(count) {
  midiratio.midi = count % 12;
}).start();
```

## Properties ##
- `midi` _(Number)_
ja:  - 入力オブジェクトがない場合には、この値が入力値となる
- `range` _(Number)_
ja:  - 1オクターブの鍵盤数。デフォルトで **12**

## Methods ##
- `at(midi)`
ja:  - midi の値を取得する

## See Also ##
- [`T("midicps")`](./midicps.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/midiratio.js
