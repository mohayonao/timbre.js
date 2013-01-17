T("gate")
=========
Route a signal to one of several outlets

## Description ##
出力先を選択します.

```timbre
var audio = T("audio", {isLooped:true}).load("/timbre.js/misc/audio/amen.wav");

var gate  = T("gate", audio);

T("interval", {interval:2000}, function(count) {
    gate.selected = count % 2;
}).start();

T("efx.dist" , {preGain:-32, postGain:20 }, gate.at(0)).play();
T("delay", {time:250, fb:0.6, wet:0.5}, gate.at(1)).play();
```

## Properties ##
- `selected` _(Number)_
  - 出力先オブジェクトのインデックス. デフォルト値は **0**
  
## Methods ##
- `at(index)`
  - 出力オブジェクトを取得します
  
## See Also ##
- [`T("selector")`](./selector.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/gate.js
