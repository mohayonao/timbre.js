T("clip")
==========
{arkr} Limit signal amplitude

## Description ##

(canvas canvas w:240 h:80)

###### en ######
`T("clip")` constrains input signals between two specified values.
###### ja ######
`T("clip")` は入力シグナルをクリップして出力します
###### -- ######

```timbre
var env  = T("env", {table:[0, [2, 2000], [0.2, 2000]], loopNode:1}).bang();
var osc  = T("osc", {freq:880}, env);
var clip = T("clip", {minmax:1, mul:0.5}, osc).play();

window.animate(function() {
  clip.plot({target:canvas});
}, 10);
```

## Properties ##
- `minmax` _(WriteOnly Number)_
  - 最小値と最小値をセットします
- `min` _(Number)_
  - 最小値. デファルト値は **0**
- `max` _(Number)_
  - 最大値. デファルト値は **1**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/clip.js
