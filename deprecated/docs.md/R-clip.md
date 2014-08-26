T("clip")
==========
{arkr}{stereo} Limit signal amplitude

## Description ##

(canvas canvas w:240 h:80)

en: `T("clip")` constrains input signals between two specified values.
ja: `T("clip")` は入力シグナルをクリップして出力します

```timbre
var env  = T("env", {table:[0, [2, 2000], [0.2, 2000]], loopNode:1}).bang();
var osc  = T("osc", {freq:440}, env);
var clip = T("clip", {minmax:0.5, mul:0.5}, osc).play();

T("scope", {interval:500, size:256}).on("data", function() {
  this.plot({target:canvas});
}).listen(clip);
```

## Properties ##
- `minmax` _(WriteOnly Number)_
en:  - Sets both a minimum and a maximum value.
ja:  - 最小値と最小値をセットします

- `min` _(Number)_
  - The low threshold of clipping. Its default value is **0**
- `max` _(Number)_
  - The high threshold of clipping. Its default value is **1**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/clip.js
