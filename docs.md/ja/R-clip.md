T("clip")
==========
Limit signal amplitude

## Description ##

(canvas clip w:240 h:80)

クリップする

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

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/clip.js
