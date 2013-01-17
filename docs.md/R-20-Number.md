T(Number)
===========
{kr} NumberWrapper

## Description ##
###### en ######
`T(Number)` contains a number.
###### ja ######
`T(Number)` は数値を格納します。
###### -- ######

```timbre
var freq = T(440);

T("sin", {freq:freq, mul:0.5}).play();
```

`T("sin")` の `freq` のように T オブジェクトを受けつけるプロパティは、セット時に値をキャストするため、以下のように直接数値を書くこともできます。以下の例は最初の例と同じです。

```timbre
T("sin", {freq:440, mul:0.5}).play();
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
