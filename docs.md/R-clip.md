T("clip")
==========
Limit signal amplitude

## Description ##

(canvas clip w:240 h:80)

###### en ######
`T("clip")` constrains input signals between two specified values.
###### ja ######
`T("clip")` は入力シグナルをクリップして出力します
###### -- ######

```timbre
var env  = T("env", {table:[0, [2, 2000], [0.2, 2000]], loopNode:1}).bang();
var osc  = T("osc", {freq:880}, env);
var clip = T("clip", {lv:1, mul:0.5}, osc).play();

var canvas = window.getCanvasById("clip");

window.animate(function() {
    clip.plot({target:canvas});
}, 10);
```

## Properties ##
- `lv`
- `minlv`
- `maxlv`

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/clip.js
