T("dist")
=========
{ar}{stereo} Distortion

## Description ##
preGain -> highcut -> postGain

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {loop:true}).load(src, function(res) {
  
  T("dist", {pre:40, post:-12, cutoff:800}, this).play();
  
});
```

## Properties ##
- `pre` _(T-Object)_
  - pre gain (default: 60dB)
- `post` _(T-Object)_
  - post gain (default:-18dB)
- `cutoff` _(Number)_
  - high cut frequency (default: 0)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/dist.js
