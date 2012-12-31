T("efx.dist")
=============
{ar} Distortion

## Description ##
歪みエフェクター. preGain -> highcut -> postGain と処理します.

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {isLooped:true}).load(src, function(res) {
    
    T("efx.dist", {preGain:-30, postGain:12, cutoff:1600}, this).play();

});
```

## Properties ##
- `preGain` _(T Object)_
  - デフォルト値は **-60** dB
- `postGain` _(T Object)_
  - デフォルト値は **18** dB
- `cutoff` _(Number)_
  - ハイカット周波数. 0 のときOFF. デフォルト値は **0**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/efx.dist.js
