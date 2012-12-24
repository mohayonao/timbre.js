T("audio")
==========
AudioFile
{deferred}

## Description ##
音声ファイルを読みこむ `T("buffer")` Deferred オブジェクトです。`load(src)` で音声ファイルを読み込んでデコードします。対応するコーデックはブラウザに依存します (node.jsの場合は wav と MP3 のみ対応)。Chrome または Safari の場合は瞬時にデコードできますが、Firefoxの場合は wav形式以外のファイルの場合、デコードに実時間が必要です。

```timbre
var src = "/timbre.js/misc/audio/amen.wav";

T("audio").load(src).then(function() {
    this.play();
}).on("ended", function() {
    this.pause();
});
```

## Tips ##
- ひとつの `T("audio")` オブジェクトは1回だけ `load()` メソッドが使えます。
- jQuery.when の入力に使用できます。
