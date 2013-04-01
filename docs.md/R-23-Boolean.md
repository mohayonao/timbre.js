T(Boolean)
==========
{kr} BooleanWrapper

## Description ##
en: `T(Boolean)` contains a boolean and outputs a 1 signal when the value is `true` and a 0 when the value is `false`.
ja: ブール値を格納します。`true` のとき 1、 `false` のとき 0 を出力します。

```timbre
var bool = T(false);

T("*", T("sin", {mul:0.5}), bool).play();

T("interval", {interval:500}, function() {
  bool.value = !bool.value;
}).start();
```

## Properties ##
- `value` _(Boolean)_
en:  - A boolean contained. Its default value is **false**.
ja:  - 格納しているブール値. デファルト値は **false**

## See Also ##
- [T(Number)](./Number.html)
- [T(Function)](./Function.html)
