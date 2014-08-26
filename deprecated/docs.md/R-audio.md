T("audio")
==========
{ar}{stereo} AudioFile

## Description ##

(canvas canvas w:240 h:80)

en: `T("audio")` is an instance of `T("buffer")` that can load an audio file and decode it. 
ja: 音声ファイルを読みこむ `T("buffer")` オブジェクトです。以下の例では amen.wav か、このページにドラッグ & ドロップしたファイル(Chromeのみ) を読み込んで再生しています。

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/amen.wav";

T("audio").loadthis(src, function() {
  this.plot({target:canvas}).play();
}).on("ended", function() {
  this.pause();
});
```

## Properties ##
- `isLoaded` _(ReadOnly Boolean)_
en:  - Returns `true` if the receiver have loaded an audio file.
ja:  - ロード済みかどうかを返します

## Methods ##
- {deferred} `load(src, [done], [fail])`
en:  - Loads an audio file and decodes it and returns a `promise` object as jQuery.
ja:  - オーディオファイルを読み込みます. `promise` オブジェクトが返ります

- `loadthis(src, [done], [fail])`
en:  - Same as `load()`, but returns `this`.
ja:  - `load()` と同じですが、 `this` が返ります

## jQuery ##
ja: `promise` は jQuery の Deferred.promise とほぼ同等なので jQuery.when の入力に使用できます。

```timbre
var audio1 = T("audio", {loop:true}).load("/timbre.js/misc/audio/drum.wav");
var audio2 = T("audio", {loop:true}).load("/timbre.js/misc/audio/guitar.wav");

$.when(audio1, audio2).then(function() {
  T("+", audio1, audio2).play();
});
```

## Events ##
- `load`
ja:  - 読み込みを開始したとき
- `loadedmetadata`
ja:  - メタデータを読み込んだとき (継続時間が確定します)
- `loadeddata`
ja:  - データを読み込んでデーコードも終えたとき
- `done`
ja:  - ロード処理を終えたとき
- `error`
ja:  - ロード処理に失敗したとき

## Note ##
en:- A correspondent codec is dependent on a browser (in node.js, only wav and MP3 correspond). 
ja:- 対応するコーデックはブラウザに依存します (node.jsの場合は wav と MP3 のみ対応)
ja:- Chrome または Safari の場合は瞬時にデコードできます
ja:- Firefoxの場合は wav形式以外のファイルの場合、デコードに実時間が必要です

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/audio.js
