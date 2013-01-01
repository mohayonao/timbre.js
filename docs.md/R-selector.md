T("selector")
=============
Assign one of several inputs to an outlet

## Description ##
処理を行う入力オブジェクトを選択します.

```timbre
var a = T("audio", {isLooped:true}).load("/timbre.js/misc/audio/amen.wav");
var b = T("sin", {freq:880, mul:0.1});

var selector = T("selector", a, b).play();

var t = T("interval", {delay:0, interval:1000}, function(count) {
    selector.selected = count % 2;
}).start();
```

## Properties ##
- `selected` _(Number)_
  - 処理を行う入力オブジェクトのインデックス. デフォルト値は **0**
- `background` _(Boolean)_
  - `true` のとき, 選択中でないオブジェクトも処理を行う. デフォルト値は **false**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/selector.js
