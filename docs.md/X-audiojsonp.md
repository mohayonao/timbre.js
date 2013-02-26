T("audio.jsonp")
================
{ar}{stereo} Audio from jsonp

## Description ##

###### en ######
`T("audio.jsonp")`
###### ja ######
JSONPで音声ファイルを読みこむ `T("buffer")` オブジェクトです。
###### -- ######

```timbre
var url = "https://dl.dropbox.com/u/645229/tmp/timbre.js/base64_drum.js?_callback=drum";

T("audio.jsonp").load(url, function() {
  this.play();
});
```

## Properties ##
- `isLoaded` _(ReadOnly Boolean)_
###### en ######
  - Returns `true` if the receiver have loaded an audio file.
###### ja ######
  - ロード済みかどうかを返します
###### -- ######

## Methods ##
- {deferred} `load(url, [done], [fail])`
###### en ######
  - Loads an audio file and decodes it and returns a `promise` object as jQuery.
###### ja ######
  - オーディオファイルを読み込みます. `promise` オブジェクトが返ります
###### -- ######

- `loadthis(src, [done], [fail])`
###### en ######
  - Same as `load()`, but returns `this`.
###### ja ######
  - `load()` と同じですが、 `this` が返ります
###### -- ######

`promise` は jQuery の Deferred.promise とほぼ同等なので jQuery.when の入力に使用できます。

## JSONP ##
```js
window.timbrejs_audiojsonp_CALLBACK(BASE64, extension_type);
```

sample(large file): https://dl.dropbox.com/u/645229/tmp/timbre.js/base64_drum.js

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/extras/audio-jsonp.js

<script src="/timbre.js/src/extras/audio-jsonp.js"></script>
