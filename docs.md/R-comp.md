T("compressor")
===============
{ar} Dynamic compressor


```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/drum.wav";

var audio = T("audio", {loop:true}).load(src, function(res) {
    
  T("comp", {thre:-48, knee:30, ratio:24, postGain:18}, this).play();
    
});
```

## Properties ##
- `thre` _(Number)_
  - The decibel value above which the compression will start taking effect. Its default value is **-24**, with a nominal range of -100 to 0.
- `knee` _(T-Object)_
  - A decibel value representing the range above the threshold where the curve smoothly transitions to the "ratio" portion. Its default value is **30**, with a nominal range of 0 to 40.
- `ratio` _(T-Object)_
  - The amount of dB change in input for a 1 dB change in output. Its default value is **12**, with a nominal range of 1 to 20.
- `postGain` _(Number)_
  - Its default value is **6**.
- `attack` _(Number)_
  - The amount of time (in msec) to reduce the gain by 10dB. Its default value is **3**, with a nominal range of 0 to 1000.
- `release` _(Number)_
  - The amount of time (in msec) to increase the gain by 10dB. Its default value is **250**, with a nominal range of 0 to 1000.
- `wet` _(Number)_
  - Its default value is **1**, with a nominal range of 0 to 1.
  
## Alias ##
- `T("comp")`

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/comp.js
