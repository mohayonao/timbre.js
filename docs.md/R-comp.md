T("comp")
=========
{ar}{stereo} Dynamic compressor

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/drum.wav";

var audio = T("audio", {loop:true}).load(src, function(res) {
    
  T("comp", {thresh:-48, knee:30, ratio:24}, this).play();
    
});
```

## Properties ##
- `thresh` _(Number)_
  - The decibel value above which the compression will start taking effect. Its default value is **-24**, with a nominal range of -100 to 0.
- `knee` _(T-Object)_
  - *not implemented*
- `ratio` _(T-Object)_
  - The amount of dB change in input for a 1 dB change in output. Its default value is **12**, with a nominal range of 1 to 20.

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/comp.js
