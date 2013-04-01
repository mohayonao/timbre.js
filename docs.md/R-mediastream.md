T("mediastream")
================
{ar}{stereo} Media Stream

_* Browser Only_

<audio id="audio" src="/timbre.js/misc/audio/amen.wav" controls></audio>

## Description ##
ja: HTMLAudioElement (Chromeの場合は HTMLVideoElement も含む) の出力を自身の出力とします。

```timbre
var audio = document.getElementById("audio");
audio.volume = 0;

var media = T("mediastream");

T("dist", {pre:24, post:-4}, media).play();

audio.play();
media.listen(audio);

timbre.once("reset", function() {
  audio.pause();
  media.unlisten();
});
```

## Properties ##
- `src` _(HTMLMediaElement)_

## See Also ##
- [`T("audio")`](./audio.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/mediastream.js

