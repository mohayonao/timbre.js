Autonomic Objects
=================
Time Based Processing Objects and Listener Objects

通常の T オブジェクトが動作するには `play()` で起動されるか、そのオブジェクトに関連づいている必要があります。その関係性を信号処理ネットワークと呼びます。ここでは信号処理ネットワークから外れていても動作するタイマーオブジェクトとリスナーオブジェクトについて説明します。

- - -

## TimerObject ##
タイマーオブジェクトはtimbre.js内部のカウンタで動作する高精度(3msec程度)なタイマーです。以下の例では `T("interval")` をトリガにして `T("sin")` を生成して再生しています。

```timbre
T("interval", {delay:0, interval:500, timeout:3000}, function(count) {
    T("sin", {freq:count * 440 + 440, mul:0.25}).play();
}).on("ended", function() {
    timbre.pause();
}).start();
```

### Note ###
timbre.jsの内部で高精度なだけで setInterval 等の既存のタイマーを置き換えるものではありません。

### Methods ###
- `start()`
  - 動作を開始します
- `stop()`
  - 動作を停止します
  
### Objects ###
リファレンスページで {timer} マークがあるのがリスナーオブジェクトです。

- [`T("interval")`](./interval.html)
  - 指定した間隔で処理を呼び出します
- [`T("timer")`](./timer.html)
  - 指定した間隔で処理を呼び出します (Deferredタイプ)
- [`T("timeout")`](./timeout.html)
  - 指定時間後に処理を呼び出します
- [`T("wait")`](./wait.html)
  -指定時間後に処理を呼び出します (Deferredタイプ)

- - -

## ListenerObject ##
信号処理ネットワークの外側から処理状態を監視できるオブジェクトです。

(canvas pink w:240 h:80)

たとえば `T("spectrum")` を使って、ピンクノイズの周波数特性を調べるコードは下記のように書けます。しかし `T("spectrum")` は解析が目的なだけで信号処理ネットワークに組み込むのは複雑さが増し、賢くありません。リスナーオブジェクトの `listen(...)` を使えば信号処理ネットワークに関係なく特定のオブジェクトの状態を取得できるので、コードが簡潔になります。

```timbre
var canvas = window.getCanvasById("pink");

var synth = T("pink", {mul:0.5});

T("spectrum", {interval:100}, synth).on("fft", function() {
    this.plot({target:canvas});
}).play();
```

```timbre
var canvas = window.getCanvasById("pink");

var synth = T("pink", {mul:0.5}).play();

T("spectrum", {interval:100}).on("fft", function() {
    this.plot({target:canvas});
}).listen(synth);
```

### Methods ###
- `listen(...)`
  - 引数を自身のインプットに追加してモニタリングを開始します
- `unlisten(...)`
  - 引数を自身のインプットから削除してモニタリングの対象外にします
  
### Objects ###
リファレンスページで {listener} マークがあるのがリスナーオブジェクトです。

- [`T("fft")`](./fft.html)
  - FFTを行い実部、虚部を出力します
- [`T("spectrum")`](./fft.html)
  - FFTを行い表示用のスペクトラムを作成します
- [`T("wave")`](./wave.html)
  - 表示用の波形を作成します
