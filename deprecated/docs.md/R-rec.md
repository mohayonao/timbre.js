T("rec")
========
{ar}{listener} Recorder

## Description ##
ja: 入力オブジェクトの値を記録します。以下の例では 1秒間のマウス操作を録音して繰り返し再生しています。

```timbre
var freq  = T("mouse.y", {min:220, max:1760});
var synth = T("saw", {freq:freq, mul:0.25});

T("rec", {timeout:1000}, synth).on("ended", function(buffer) {

  T("buffer", {buffer:buffer, loop:true}).play();
    
  this.pause();
    
}).start().play();

T("mouse").start();
```

## Properties ##
- `timeout` _(Number or timevalue)_
ja:  - 録音時間. デフォルト値は **5000ms**
- `samplerate` _(Number)_
- `currentTime` _(ReadOnly Number)_

## Methods ##
- `start()`
ja:  - 録音を開始します
- `stop()`  
ja:  - 録音を停止します
- `bang()`
ja:  - 録音開始/停止を切り換えます

## Events ##
- `ended`
ja:  - 録音停止時に発生します. `SoundBuffer` オブジェクトが戻ります
  
## Note ##
ja:- `T("rec")` での録音は実時間が必要です
ja:- 前処理として録音データを扱いたい場合は [`timbre.rec`](./RecordingMode.html) を使います

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/rec.js

<script src="/timbre.js/src/extras/mouse.js"></script>
