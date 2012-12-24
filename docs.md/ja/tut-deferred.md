deferred
========
Deferred {deferred}

`T("wait")` のようないくつかの Tオブジェクトは Deferred インターフェイスを持ちます。

## Methods ##
- `then(done, fail)`
  - 動作が成功したときと失敗したときのコールバック関数をそれぞれ登録します
- `done(...)`
  - 動作が成功したときのコールバックを登録します
- `fail(...)`
  - 動作が失敗したときのコールバックを登録します
- `pipe(done, fail)`  
  - Deferred をパイプします


## Note ##
Tオブジェクトの Deferredインターフェイスでは `then`, `done`, `fail` は Tオブジェクト自身を返します。
パイプ処理を行ないたい場合は `pipe` を使用してください。


## Examples ##
以下は有用な例ではありませんが Deferredのパイプでオシレーターの音程を変更しています。このように段階的な非同期処理をスマートに記述することが可能です。また、jQueryの Deferredオブジェクトを併用することも出来ます。

```timbre
var osc  = T("sin" , {freq:440}).play();
var wait = T("wait", {timeout:500});

wait.pipe(function() {
    osc.freq = 660;
    
    return T("wait", {timeout:500}).start();
    
}).pipe(function() {
    osc.freq = 880;
    
    var dfd = $.Deferred();
    setTimeout(function() {
        dfd.resolve();
    }, 1000);
    return dfd;
    
}).pipe(function() {
    osc.pause();
});

wait.start();
```

以下の例では jQueryの when を使用しています。

```timbre
var osc  = T("sin", {freq:440, mul:0.5}).play();

var wait = T("wait", {time:500});

wait.then(function() {
    osc.wave = "saw";
    osc.mul  = 0.25;
}).start();

var dfd0 = $.Deferred();
setTimeout(function() {
    dfd0.resolve();
}, 1000);

var dfd1 = $.Deferred();
setTimeout(function() {
    osc.freq = 880;
    dfd1.resolve();
}, 250);

$.when(dfd0, dfd1, wait).then(function() {
    osc.pause();
});
```

## Deferredオブジェクトの一覧 ##

- [`T("wait")`](/timbre.js/docs/ja/wait.html)
- [`T("timer")`](/timbre.js/docs/ja/timer.html)
- [`T("audio")`](/timbre.js/docs/ja/audio.html)
