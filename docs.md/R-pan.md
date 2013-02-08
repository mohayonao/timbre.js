T("pan")
========
{ar}{stereo} Panner

## Description ##

```timbre
var pos = T("sin", {freq:T("param", {value:0.1}).expTo(100, "30sec"), kr:true});

T("pan", {pos:pos}, T("saw", {mul:0.5})).play();
```

## Properties ##
- pos _(T-Object)_
  - Pan position, -1 is left, +1 is right.

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/pan.js
