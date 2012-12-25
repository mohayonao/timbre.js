T("efx.dist")
=============
Distortion

```timbre
var src = "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {isLooped:true}).load(src, function(res) {
    
    T("efx.dist", {preGain:-30, postGain:12}, this).play();

});
```

## Properties ##
- `preGain` _(T Object)_
- `postGain` _(T Object)_
