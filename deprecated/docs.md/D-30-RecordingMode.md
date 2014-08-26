Recording Mode
===============
Recording Mode

ja: レコーディングモードの説明をします。  

ja: `timbre.rec` を使うと音声を出力せずに高速に実行して結果を記録できます。以下の例では 約8秒のフレーズを録音して逆再生しています。

```timbre
timbre.rec(function(output) {
  
  var gen = T("PluckGen", {env:T("adsr", {r:100})});
  var mml = "o3 l8 d0grf0b-rg0<c4.> d0grf0b-ra-0<d->g0<c2> d0grf0b-rg0<c4.>f0b-rd0g2..";
  
  T("mml", {mml:mml}, gen).on("ended", function() {
    output.done();
  }).start();
  
  var synth = gen;
  synth = T("dist" , {pre:60, post:-12}, synth);
  synth = T("delay", {fb :0.5, mix:0.2}, synth);
  
  output.send(synth);
  
}).then(function(buffer) {
  
  T("buffer", {buffer:buffer, loop:true, reverse:true}).play();
  
});
```

## Methods ##
- `output.send`
ja:  - 録音する T オブジェクト を指定します
- `output.done`
ja:  - 録音終了時に呼び出します

## Note ##
ja:- 再生しながら録音を行う場合は [`T("rec")`](./rec.html) を使用します。
