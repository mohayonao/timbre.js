T(Function)
===========
FunctionWrapper

## Description ##
関数を格納して `bang()` で実行します。関数の結果を自身値として出力します。

```timbre
var func = T(function(count) {
    return (count % 5) * 220 + 220;
});

var sin = T("sin", {freq:func}).play();

T("interval", {interval:100, timeout:1500}, func).start();
```

## Properties ##
- `func`
  - 格納している関数
- `args`
  - 関数に渡す引数

## Methods ##
- `bang(...)`
  - 関数を実行します。戻り値が数値の場合は自身の出力値を更新します。
  
## Note ##
- イベントのコールバックにも `T(Function)` オブジェクトを登録することができます。
- `bang()` に引数がある場合、 `bang()` の引数 + `.args` プロパティが関数に渡される引数となります。

```timbre
var func = function(x, y, z) {
    alert(x + y + z);
};

T(func, {args:["world", "!!"]}).bang("hello, ");
```

## See Also ##
- [T(Number)](./Number.html)
- [T(Boolean)](./Boolean.html)
