T("timeout")
============
{kr}{timer} Timeout

## Description ##
ja: 指定した時間後に入力オブジェクトに対して `bang()` します。

```timbre
var osc = T("sin", {freq:880, mul:0.5});

T("timeout", {timeout:1000}).on("ended", function() {
  this.stop();
}).set({buddies:osc}).start();
```

## Properties
- `timeout` _(Number or timevalue)_
ja:  - タイムアウトの時間
- `currentTime` _(ReadOnly Number)_
ja:  - 経過時間

## Method ##
- `bang()`
ja:  - 動作を再開します。

## Events ##
- `ended`
ja:  - タイムアウト時に発生します。

## See Also ##
- [T("interval")](./interval.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/timeout.js
