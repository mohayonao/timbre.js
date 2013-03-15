SoundBuffer
===========
SoundBuffer

en: `T("buffer")` and `T("tape")` use the data of `SoundBuffer` form.  
en: The below code defines a 1sec 44.1kHz `SoundBuffer`.
ja: `T("buffer")` や `T("tape")` では `SoundBuffer` 形式のデータを扱います。  
ja: 以下はサンプルレート 44.1KHzの 1秒間の `SoundBuffer` を表わします。

```js
var soundbuffer = {
  buffer    : new Float32Array(44100),
  samplerate: 44100
};
```

(canvas canvas w:240 h:80)

en: The following example sets `T("buffer").buffer` to the **SoundBuffer** generated from a code, and plays it.
ja: 以下の例は独自に生成したサウンドバッファーを `T("buffer")` にセットして再生しています。

```timbre
var len    = 44100;
var buffer = new Float32Array(len);

for (var i = 0; i < buffer.length; i++) {
  buffer[i] = Math.sin(Math.PI * 0.001 * i) * (i/len) * (1-(i/len)) * 2;
}

buffer = { buffer:buffer, samplerate:22050 };

T("buffer", {buffer:buffer, pitch:50, loop:true}).plot({target:canvas}).play();
```
