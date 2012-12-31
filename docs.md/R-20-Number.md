T(Number)
===========
{kr} NumberWrapper

## Description ##
###### en ######
`T(Number)` contains a number.
###### ja ######
`T(Number)` は数値を格納します.
###### -- ######

```timbre
var freq = T(440);

T("sin", {freq:freq, mul:0.5}).play();
```

`T("sin")` の `freq` のように T オブジェクトを受けつけるプロパティはセット時に値をキャストするため, より一般的に書くこともできます.

```timbre
var freq = 440;

T("sin", {freq:freq, mul:0.5}).play();
```

## Properties ##
- `value` _(Number)_
###### en ######
  - A number contained. Default is **0**.
###### ja ######
  - 格納している数値. デフォルト値は **0**
###### -- ######

## See Also ##
- [T(Boolean)](./Boolean.html)
- [T(Function)](./Function.html)
