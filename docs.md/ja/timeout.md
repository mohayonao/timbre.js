T("timeout")
============
Timeout
{timer}

## Description ##
指定時間後に入力オブジェクトに対して `bang()` する。


```timbre
T("timeout", {timeout:1000}).on("ended", function() {
    console.log("ended");
    this.bang();
}).start();
```

## Method ##
- `bang()`
  - 動作を再開します。

## Events ##
- `ended` タイムアウト時に発生します。

## Note ##
同じような動作をするオブジェクトに [T("wait")](/timbre.js/docs/ja/wait.html) があります。

- `T("wait")` は Deferred オブジェクトで 1回しか作動しません。
- `T("timeout")` は `bang()` を呼ぶ度に動作を再開します。
