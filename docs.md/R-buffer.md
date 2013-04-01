T("buffer")
==========
{ar} SoundBuffer

## Description ##
en: `T("buffer")` contains [SoundBuffer](./soundbuffer.html) and plays it.
ja: `T("buffer")` は [SoundBuffer](./soundbuffer.html) を格納し、再生します。

```timbre
T("audio", {load:"/timbre.js/misc/audio/amen.wav"}).on("ended", function() {
  this.pause();
}).play();
```

```timbre
T("audio").load("/timbre.js/misc/audio/amen.wav", function() {
  var audio = this;
  var currentTime = T("param", {value:0.01, ar:true}).on("ended", function() {
    audio.pause();
  }).sinTo(audio.duration, audio.duration);
  audio.set({currentTime:currentTime}).play();
});
```

en: \* [`T("audio")`](./audio.html) is an instance of `T("buffer")` that can load an audio file and decode it.
ja: \* [`T("audio")`](./audio.html) はオーディオファイルのデコード機能がついた `T("buffer")` です。

## Properties ##
- `buffer`
  - SoundBuffer
- `pitch` _(T-Object)_
en:  - Its default value is **1**.
ja:  - 再生ピッチ。デフォルト値は **1**
- `duration` _(ReadOnly Number)_
en:  - The duration time of the contained sound buffer.
ja:  - 再生時間
- `currentTime` _(T-Object or Number)_
en:  - Sets or returns the current playback position in the receiver (in milliseconds)
ja:  - 再生中の時間。値をセットするとその時間に飛ぶ。
- `isLooped` _(ReadOnly Boolean)_
en:  - Returns `true` if the receiver should start over again when finished.
ja:  - ループ再生するとき true を返す
- `isReversed` _(ReadOnly Boolean)_
en:  - Returns `true` if the receiver should play in reverse.
ja:  - 逆再生するとき true を返す
- `isEnded` _(ReadOnly Boolean)_
en:  - Returns `true` if the playback of the receiver has ended.
ja:  - 再生終了時に true になる
- `samplerate` _(ReadOnly Number)_
en:  - Sample Rate of **SoundBuffer**
ja:  - SoundBufferのサンプリングレート

## Methods ##
- `clone()`
en:  - Returns a clone that share a buffer with an origin object.
ja:  - クローンを返す。クローンのバッファは元オブジェクトと共有します。
- `slice(begin, end)`
en:  - Returns a slice copied object between begin and end(milliseconds).
ja:  - 指定時間で切り出した `T("buffer")` を返す。msecで指定します。
- `loop(value)`
en:  - Loop.
ja:  - ループ再生する
- `reverse(value)`
en:  - Reverse.
ja:  - 逆再生する
- `bang(value)`
en:  - Reprocess from the beginning. When `false` is given, it does not start.
ja:  - 最初から開始しなおす。falseを与えた場合、最初に戻るが開始しない。

## See Also ##
- [T("audio")](./audio.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/buffer.js
