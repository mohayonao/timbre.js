T("interval")
=============
{kr}{timer} Interval

## Description ##
en: `T("interval")` sends `bang()` to the input objects at an interval as a metronome.
ja: 指定した間隔で入力オブジェクトに対して `bang()` します。

```timbre
var freqs = T(function(count) {
  return [220, 440, 660, 880][count % 4];
});

var osc = T("sin", {freq:freqs, mul:0.5});
var env = T("perc", {a:50, r:500}, osc).bang();

var interval = T("param", {value:500}).linTo(50, "30sec");

T("interval", {interval:interval}, freqs, env).start();

env.play();
```

## Properties ##
- `interval` _(T-Object or timevalue)_
en:  - The interval time (millisecond)
ja:  - 入力オブジェクトに対して `bang()` を呼び出す間隔を設定します。(ミリ秒)
- `delay` _(Number or timevalue)_
en:  - Delay time.
ja:  - 待機時間を設定します
- `count` _(Number)_
en:  - The count of calling `bang()`.
ja:  - `bang` を送出した回数
- `timeout` _(Number or timevalue)_
en:  - The time of timeout.
ja:  - タイムアウトの時間
- `currentTime` _(ReadOnly Number)_
en:  - Current time.
ja:  - 経過時間

## Methods ##
- `bang()`
  - 動作を再開します。

## Events ##
- `ended`
  - タイムアウト時に発生します。

## See Also ##
- [T("timeout")](./timeout.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/interval.js
