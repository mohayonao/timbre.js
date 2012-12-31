T("efx.delay")
==============
{ar} Delay effector


```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {isLooped:true}).load(src, function(res) {
    
    T("efx.delay", {time:250, feedback:0.6, wet:0.4}, this).play();
    
});
```

## Properties ##
- `time` _(Number or timevalue)_
  - ディレイタイム. デフォルト値は **100** ms
- `feedback` _(T Object)_
  - フィードバッック. デフォルト値は **0.25**
- `wet` _(T Object)_
  - エフェクターの利き具合. デフォルト値は **0.2**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/efx.delay.js
