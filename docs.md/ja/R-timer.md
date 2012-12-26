T("timer")
==========
{timer} Timer

指定した間隔で入力オブジェクトに対して `bang()` する Deferred オブジェクトです。

```timbre
var freqs = T([220, 440, 660, 880]);

var osc = T("sin", {freq:freqs}).play();

var i = T("param", {value:500}).linearRampToValueAtTime(50, 20000);

T("timer", {interval:i, timeout:"10sec"}, freqs).start();
```

## Attributes ##
- `interval`
  - 入力オブジェクトに対して `bang()` を呼び出す間隔を設定します
- `delay`
  - 待機時間を設定します
- `count`  
  - `bang` を送出した回数
- `timeout`
  - タイムアウトの時間を設定します
- `currentTime`  
  - 経過時間

## Events ##
- `ended` タイムアウト時に発生します。

## Note ##
同じような動作をするオブジェクトに [T("interval")](./interval.html) があります。

- `T("timer")` は Deferred オブジェクトで タイムアウト後に再起動しません。
- `T("interval")` は タイムアウト後も `start()` で再起動が出来ます。

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/timer.js
