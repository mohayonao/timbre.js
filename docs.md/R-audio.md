T("audio")
==========
{ar} AudioFile

## Description ##

(canvas audio w:240 h:80)

音声ファイルを読みこむ `T("buffer")` オブジェクトです。以下の例では amen.wav か、このページにドラッグ & ドロップしたファイル(Chromeのみ) を読み込んで再生しています。

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/amen.wav";

var canvas = window.getCanvasById("audio");

T("audio").on("ended", function() {
    this.pause();
}).load(src).then(function() {
    this.plot({target:canvas}).play();
});
```

## Properties ##
- `isLoaded` _(ReadOnly Boolean)_
  - ロード済みかどうかを返します

## Methods ##
- {deferred} `load(src, done, fail)`
  - オーディオファイルを読み込みます. `promise` オブジェクトが返ります

`promise` は jQuery の Deferred.promise とほぼ同等なので jQuery.when の入力に使用できます。
  
```timbre

var audio1 = T("audio", {isLooped:true}).load("/timbre.js/misc/audio/drum.wav");
var audio2 = T("audio", {isLooped:true}).load("/timbre.js/misc/audio/guitar.wav");

$.when(audio1, audio2).then(function() {
  T("+", audio1, audio2).play();
});

```

## Events ##
- `load`
  - 読み込みを開始したとき
- `loadedmetadata`
  - メタデータを読み込んだとき (継続時間が確定します)
- `loadeddata`
  - データを読み込んでデーコードも終えたとき
- `done`
  - ロード処理を終えたとき
- `error`
  - ロード処理に失敗したとき

## Note ##
- 対応するコーデックはブラウザに依存します (node.jsの場合は wav と MP3 のみ対応)
- Chrome または Safari の場合は瞬時にデコードできます
- Firefoxの場合は wav形式以外のファイルの場合、デコードに実時間が必要です

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/audio.js
