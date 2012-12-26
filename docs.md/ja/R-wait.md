T("wait")
=========
Wait
{timer}{deferred}

## Description ##
指定時間後に入力オブジェクトに対して `bang()` する Deferredオブジェクトです。

```timbre
var osc = T("square", {freq:987.7666025122483, mul:0.25});
var env = T("env", {table:[1, [0, 800]]}, osc).on("ended", function() {
    this.pause();
}).bang().play();

T("wait", {timeout:80}).then(function() {
    osc.freq.value = 1318.5102276514797;
}).start();
```

## Methods ##
- `then()`
  - タイムアウト時に呼び出す関数を追加します。

## Events ##
- `ended` タイムアウト時に発生します。

## Note ##
同じような動作をするオブジェクトに [T("timeout")](./timeout.html) があります。

- `T("wait")` は Deferred オブジェクトで 1回しか作動しません。
- `T("timeout")` は `bang()` を呼ぶ度に動作を再開します。
