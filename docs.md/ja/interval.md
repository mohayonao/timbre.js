T("interval")
=============
Interval {timer}

## Description ##

指定した間隔で入力オブジェクトに対して `bang()` する。

`delay` の設定が無い場合は `start()` の後、
JavaScript の setInterval と同じように `interval` と同じ時間の待機ののち動作を開始します。


```timbre
var freqs = T([220, 440, 660, 880]);

var osc = T("sin", {freq:freqs, mul:0.5});
var env = T("perc", {a:50, r:500}, osc).bang();

var i = T("param", {value:500}).lineTo(50, "30sec");

T("interval", {interval:i}, freqs, env).start();

env.play();
```

## Properties ##
- `interval` _(T Object or timevalue)_
  - 入力オブジェクトに対して `bang()` を呼び出す間隔を設定します
- `delay` _(Number or timevalue)_
  - 待機時間を設定します
- `count` _(Number)_
  - `bang` を送出した回数
- `timeout` _(Number or timevalue)_
  - タイムアウトの時間を設定します
- `currentTime` _(Number)_
  - 経過時間

## Methods ##
- `bang()`
  - 動作を再開します。

## Events ##
- `ended`
  - タイムアウト時に発生します。

## Alias ##
- `T("interval0")`
  - `delay` が 0 で初期化される `T("interval")` オブジェクト

## Note ##
同じような動作をするオブジェクトに [T("timer")](/timbre.js/docs/ja/timer.html) があります。

- `T("timer")` は Deferred オブジェクトで タイムアウト後に再起動しません。
- `T("interval")` は タイムアウト後も `start()` で再起動が出来ます。

## See Also ##
- [T("timer")](/timbre.js/docs.md/ja/timer.html)
- [T("timeout")](/timbre.js/docs.md/ja/timeout.html)
- [T("wait)](/timbre.js/docs.md/ja/wait.html)
