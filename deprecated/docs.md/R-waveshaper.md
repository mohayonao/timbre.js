T("waveshaper")
===============
{ar} Non-Linear Distortion Effects

## Description ##
Non-linear waveshaping distortion is commonly used for both subtle non-linear warming, or more obvious distortion effects. Arbitrary non-linear shaping curves may be specified.

```timbre
var audio = T("audio", {load:"/timbre.js/misc/audio/drum.wav", loop:true});

T("waveshaper", {curve:new Float32Array([-0.5,0,1])}, audio).play();
```

## Properties ##
- `curve` _(Float32Array)_
  - The shaping curve used for the waveshaping effect. The input signal is nominally within the range -1 -> +1. like as [WaveShaperNode](https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#WaveShaperNode) of Web Audio API.

## Sources ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/waveshaper.js
