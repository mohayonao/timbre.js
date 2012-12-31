T(Number)
===========
{kr} NumberWrapper

## Description ##
数値を格納します。

```timbre
var freq = T(440);

T("sin", {freq:freq, mul:0.5}).play();
```

これはより一般的に以下のように書くこともできます。

```timbre
var freq = 440;

T("sin", {freq:freq, mul:0.5}).play();
```

## Properties ##
- `value` _(Number)_
  - 格納している数値

## See Also ##
- [T(Boolean)](./Boolean.html)
- [T(Function)](./Function.html)
