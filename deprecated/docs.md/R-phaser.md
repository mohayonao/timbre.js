T("phaser")
===========
{ar}{stereo} Phaser

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/guitar.wav";

var audio = T("audio", {loop:true}).load(src, function(res) {
  
  var freq = T("sin", {freq:5, add:2400, mul:800}).kr();
  T("phaser", {freq:freq, Q:1, steps:8}, this).play();
  
});
```

## Properties ##
- `freq` _(T-Object)_
- `Q` _(T-Object)_
- `steps` _(Number)_
  - **2**, 4, 8, 12

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/phaser.js
