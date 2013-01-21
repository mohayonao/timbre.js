T("dist")
=========
{ar} Distortion

## Description ##
歪みエフェクター。 preGain -> highcut -> postGain と処理します。

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {loop:true}).load(src, function(res) {
  
  T("dist", {pre:40, post:-12, cutoff:800}, this).play();
  
});
```

## Properties ##
- `pre` _(T-Object)_
  - デフォルト値は **60** dB
- `post` _(T-Object)_
  - デフォルト値は **-18** dB
- `cutoff` _(Number)_
  - ハイカット周波数. 0 のときOFF. デフォルト値は **0**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/dist.js
