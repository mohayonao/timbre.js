T("timeout")
============
{timer} Timeout

## Description ##
指定時間後に入力オブジェクトに対して `bang()` します。

```timbre
T("timeout", {timeout:1000}).on("ended", function() {
    this.stop();
}).start();
```

## Properties
- `timeout` _(Number or timevalue)_
  - タイムアウトの時間
- `currentTime` _(Number)_
  - 経過時間

## Method ##
- `bang()`
  - 動作を再開します。

## Events ##
- `ended` タイムアウト時に発生します。

## Note ##
オブジェクト生成時に `once` を設定すると Deferred オブジェクトとなり、各Deferredメソッドのサポートとタイムアウト時に resolve、タイムアウト前に停止した場合に reject されます。

```timbre
T("timeout", {timeout:1000, once:true}).then(function() {
    
}).start();
```

## See Also ##
- [T("interval")](./interval.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/timeout.js
