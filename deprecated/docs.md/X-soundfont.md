soundfont
=========
Play soundfonts from a "soundfont url" such as [free-midi](https://code.google.com/p/free-midi/)


## Installation

Download 4 extra javascript files:

- [audio-jsonp.js](/timbre.js/src/extras/audio-jsonp.js)
- [jsmad.js](/timbre.js/src/extras/jsmad.js)
- [mp3_decode.js](/timbre.js/src/extras/mp3_decode.js)
- [soundfont.js](/timbre.js/src/extras/soundfont.js)


```html
<script src="timbre.js"></script>
<script src="audio-jsonp.js"></script>
<script src="jsmad.js"></script>
<script src="mp3_decode.js"></script>
<script src="soundfont.js"></script>
```


## Description ##

T.soundfont is a singleton object that caches various soundfont notes, and
allows you to play them.

```timbre
// play note 64 using the current instrument
// NOTE: this will change whenever someone calls T.soundfont.setInstrument();
T.soundfont.play(64);
```

```timbre
// set instrument to a "cello", and play note 64
T.soundfont.setInstrument(42);
T.soundfont.play(64);
```

```timbre
// only play if this note has already been cached
T.soundfont.play(70, false);
```

## Methods ##

- `T.soundfont.emptyCache();`
- `T.soundfont.setUrlTemplate(newUrlTemplate);`
- `T.soundfont.setName(newName);`
- `T.soundfont.setChannel(newChannel);`
- `T.soundfont.setInstrument(newInstrument);`
- `T.soundfont.setLength(newLength);`
- `T.soundfont.setJsonp(newJsonp);`
- `T.soundfont.preload(noteArray);`
- `T.soundfont.play(note, playOnLoad, options);`


## See Also ##

- [free-midi](https://code.google.com/p/free-midi/)


## Source ##

https://github.com/mohayonao/timbre.js/blob/master/src/extras/audio-jsonp.js
https://github.com/mohayonao/timbre.js/blob/master/src/extras/jsmad.js
https://github.com/mohayonao/timbre.js/blob/master/src/extras/mp3_decode.js
https://github.com/mohayonao/timbre.js/blob/master/src/extras/soundfont.js


<script src="/timbre.js/src/extras/audio-jsonp.js"></script>
<script src="/timbre.js/src/extras/jsmad.js"></script>
<script src="/timbre.js/src/extras/mp3_decode.js"></script>
<script src="/timbre.js/src/extras/soundfont.js"></script>

