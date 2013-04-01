T("gate")
=========
{ar}{stereo} Route a signal to one of several outlets

## Description ##
en: `T("gate")` will pass a given signal only through a specified outlet.
ja: 出力先を選択します。

```timbre
var audio = T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav");

var gate  = T("gate", audio);

T("interval", {interval:2000}, function(count) {
  gate.selected = count % 2;
}).start();

T("dist" , {pre:32, post:-20}, gate.at(0)).play();
T("delay", {time:250, fb:0.6, mix:0.5}, gate.at(1)).play();
```

## Properties ##
- `selected` _(Number)_
en:  - Specifies the index of outlets. Its default value is **0**.
ja:  - 出力先オブジェクトのインデックス. デフォルト値は **0**

## Methods ##
- `at(index)`
en:  - Gets the outlet object of the index.
ja:  - 出力オブジェクトを取得します
  
## See Also ##
- [`T("selector")`](./selector.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/gate.js
