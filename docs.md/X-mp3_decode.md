mp3_decode
==========
Decode mp3s in the browser using jsmad

## Installation

Download 2 extra javascript files:

- [jsmad.js](/timbre.js/src/extras/jsmad.js)
- [mp3_decode.js](/timbre.js/src/extras/mp3_decode.js)


```html
<script src="timbre.js"></script>
<script src="jsmad.js"></script>
<script src="mp3_decode.js"></script>
```


## Description ##

(canvas canvas w:240 h:80)

You can now play mp3s in the browser the same way you would play a .wav file

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/note.mp3";

T("audio").loadthis(src, function () {
  this.plot({target:canvas}).play();
}).on("ended", function () {
  this.pause();
});
```


## See Also ##

- [jsmad Source Code](https://github.com/audiocogs/jsmad/)


## Source ##

https://github.com/mohayonao/timbre.js/blob/master/src/extras/jsmad.js
https://github.com/mohayonao/timbre.js/blob/master/src/extras/mp3_decode.js


<script src="/timbre.js/src/extras/min/jsmad.min.js"></script>
<script src="/timbre.js/src/extras/min/mp3_decode.min.js"></script>
