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

## See Also ##
- [T("interval")](./interval.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/timeout.js
