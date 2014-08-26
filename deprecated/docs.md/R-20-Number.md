T(Number)
=========
{kr} NumberWrapper

## Description ##
en: `T(Number)` contains a number.
ja: `T(Number)` は数値を格納します。

```timbre
var freq = T(440);

T("sin", {freq:freq, mul:0.5}).play();
```

en: A property that accepts a **T-Object** as a `T("sin").freq` is casted to a T-Object from a received value, so you can write a number directly. The following examples are the same as the first example. 
ja: `T("sin").freq` のように T オブジェクトを受けつけるプロパティは、セット時に値をキャストするため、以下のように直接数値を書くこともできます。以下の例は最初の例と同じです。

```timbre
T("sin", {freq:440, mul:0.5}).play();
```

## Properties ##
- `value` _(Number)_
en:  - A number contained. Its default value is **0**.
ja:  - 格納している数値. デフォルト値は **0**

## See Also ##
- [T(Boolean)](./Boolean.html)
- [T(Function)](./Function.html)
