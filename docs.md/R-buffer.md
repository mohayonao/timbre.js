T("buffer")
==========
{ar} SoundBuffer

## Description ##
[SoundBuffer](./soundbuffer.html)を格納し、再生します。

```timbre
T("audio", {load:"/timbre.js/misc/audio/amen.wav"}).on("ended", function() {
    this.pause();
}).play();
```

\* `T("audio")` はオーディオファイルのデコード機能がついた `T("buffer")` です。

## Properties ##
- `buffer`
  - SoundBuffer
- `pitch` _(T-Object)_
  - 再生ピッチ。デフォルト値は **1**
- `isLooped` _(Boolean)_
  - trueのときループ再生する
- `isReversed` _(Boolean)_
  - trueのとき逆再生する
- `isEnded` _(ReadOnly Boolean)_
  - 再生終了時に true になる
- `samplerate` _(ReadOnly Number)_
  - SoundBufferのサンプリングレート
- `duration` _(ReadOnly Number)_
  - 再生時間
- `currentTime` _(Number)_
  - 再生中の時間。値をセットするとその時間に飛ぶ。

## Methods ##
- `clone()`
  - クローンを返す。クローンのバッファは元オブジェクトと共有します。
- `slice(begin, end)`
  - 指定時間で切り出した `T("buffer")` を返す。msecで指定します。
- `loop(value)`
  - ループ再生する
- `reverse(value)`
  - 逆再生する
- `play(value)`
  - falseを与えた場合、再生するが開始しない。
- `bang(value)`
  - 最初から開始しなおす。falseを与えた場合、最初に戻るが開始しない。
- `plot(opts)`
  - バッファの内容を描画する
  
## See Also ##
- [T("audio")](./audio.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/buffer.js
