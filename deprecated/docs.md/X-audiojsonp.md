T("audio.jsonp")
================
{ar}{stereo} Audio from jsonp

## Installation

Download an extra object: [audio-jsonp.js](/timbre.js/src/extras/audio-jsonp.js)

```html
<script src="timbre.js"></script>
<script src="audio-jsonp.js"></script>
```


## Description ##
en: `T("audio.jsonp")` is an instance of `T("buffer")` that reads an audio file via JSONP.
ja: JSONPで音声ファイルを読みこむ `T("buffer")` オブジェクトです。

```timbre
var url = "https://dl.dropbox.com/u/645229/tmp/timbre.js/base64_drum.js?_callback=drum";

T("audio.jsonp").load(url, function() {
  this.play();
});
```

en: `_callback` of the query string (begin with an underscore) in the URL is removed before sending request. It is useful when you want to use such as static files with Dropbox. For example, url `"../base64_drum.js?_callback=drum"` is converted `"../base64_drum.js"`, `_callback=drum` is used as a part of callback function name, (ex: `window.timbrejs_audiojsonp_drum` .)
ja: アンダースコア付きのURLのクエリ `_callback` はサーバーへのリクエスト時に削除されます。これはDropboxなど静的なファイルストレージを使う際に便利です。たとえば `"../base64_drum.js?_callback=drum"` は `"../base64_drum.js"` にアクセスして、`_callback=drum` の部分はコールバック関数名 (`window.timbrejs_audiojsonp_drum`) にのみ使用されます。

## Properties ##
- `isLoaded` _(ReadOnly Boolean)_
en:  - Returns `true` if the receiver have loaded an audio file.
ja:  - ロード済みかどうかを返します

## Methods ##
- {deferred} `load(url, [done], [fail])`
en:  - Loads an audio file and decodes it and returns a `promise` object as jQuery.
ja:  - オーディオファイルを読み込みます. `promise` オブジェクトが返ります
- `loadthis(src, [done], [fail])`
en:  - Same as `load()`, but returns `this`.
ja:  - `load()` と同じですが、 `this` が返ります

ja: `promise` は jQuery の Deferred.promise とほぼ同等なので jQuery.when の入力に使用できます。

## JSONP ##
```js
window.timbrejs_audiojsonp_CALLBACK(BASE64, EXTENSION_TYPE);
```

sample(large file): https://dl.dropbox.com/u/645229/tmp/timbre.js/base64_drum.js

## Tool ##
[convert an audio file to a JSONP script](http://127.0.0.1:3000/timbre.js/misc/audio-jsonp.js)

```sh
$ node ./audio-jsonp.js [-n CALLBACK] file > audio.js
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/extras/audio-jsonp.js

<script src="/timbre.js/src/extras/audio-jsonp.js"></script>
