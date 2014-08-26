T("selector")
=============
{ar}{stereo} Assign one of several inputs to an outlet

## Description ##
ja: 処理を行う入力オブジェクトを選択します。

```timbre
var a = T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav");
var b = T("sin", {freq:880, mul:0.1});

var selector = T("selector", a, b).play();

var t = T("interval", {interval:1000}, function(count) {
  selector.selected = count % 2;
}).start();
```

## Properties ##
- `selected` _(Number)_
ja:  - 処理を行う入力オブジェクトのインデックス。 デフォルト値は **0**
- `background` _(Boolean)_
ja:  - `true` のとき、選択中でないオブジェクトも処理を行う。 デフォルト値は **false**

## See Also ##
- [`T("gate")`](./gate.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/selector.js
