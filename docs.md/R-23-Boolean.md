T(Boolean)
===========
BooleanWrapper

## Description ##
ブール値を格納します。`true` のとき 1、 `false` のとき 0 を出力します。

```timbre
var bool = T(true);

T("*", T("sin", {mul:0.5}), bool).play();

T("interval", {interval:500}, function() {
    bool.value = !bool.value;
}).start();
```

## Properties ##
- `value` _(Boolean)_
  - 格納しているブール値

## See Also ##
- [T(Number)](./Number.html)
- [T(Function)](./Function.html)
