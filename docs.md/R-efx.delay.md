T("efx.delay")
==============
{ar} Delay effector


```timbre
var src = "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {isLooped:true}).load(src, function(res) {
    
    T("efx.delay", {time:250, feedback:0.6, wet:0.4}, this).play();
    
});
```

## Properties ##
- `time` _(Number or timevalue)_
- `feedback` _(T Object)_
- `wet` _(T Object)_

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/efx.delay.js
