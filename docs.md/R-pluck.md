T("pluck")
==========
{ar} Karplus–Strong string synthesis

## Description ##
ja: Karplus Strong方式による撥弦音

```timbre
T("pluck", {freq:500, mul:0.5}).bang().play();
```

## Properties ##
- `freq` _(Number)_
ja:  - 周波数をセットする。デフォルト値は **440**

## Methods ##
- `bang()`
ja:  - 撥弦を開始します
  
## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/pluck.js
