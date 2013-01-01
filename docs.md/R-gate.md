T("gate")
=========
Route a signal to one of several outlets

## Description ##
出力先を選択します.

```timbre
var audio = T("audio", {isLooped:true}).load("/timbre.js/misc/audio/amen.wav");

var gate  = T("gate", audio);

T("interval", {delay:0, interval:2000}, function(count) {
    gate.selected = count % 2;
}).start();

T("efx.dist" , {preGain:-32, postGain:20 }, gate.at(0)).play();
T("efx.delay", {time:250   , feedback:0.6}, gate.at(1)).play();
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
