T("timeout")
============
{kr}{timer} Timeout

## Description ##
指定した時間後に入力オブジェクトに対して `bang()` します。

```timbre
var osc = T("sin", {freq:880, mul:0.5}).play();

T("timeout", {timeout:1000}).on("ended", function() {
    osc.pause();
    this.stop();
}).start();
```

## Properties
- `timeout` _(Number or timevalue)_
  - タイムアウトの時間
- `currentTime` _(ReadOnly Number)_
  - 経過時間

## Method ##
- `bang()`
  - 動作を再開します。

## Events ##
- `ended` タイムアウト時に発生します。

## Note ##
- オブジェクト生成時に `deferred` を設定すると Deferred オブジェクトとなり、各Deferredメソッドがサポートされ、タイムアウト時に `resolve`、タイムアウト前の停止時に `reject` されます。以下の例では Deferred な `T("timeout")` を jQuery の when で待機しています。

```timbre
var sin = T("sin", {mul:0.5}).play();

var timeout = T("timeout", {deferred:true}).set({timeout:500}).start();

$.when(timeout.promise()).then(function() {
    sin.pause();
});
```

## See Also ##
- [T("interval")](./interval.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/timeout.js
