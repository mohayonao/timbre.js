T("chorus")
===========
Chorus

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/guitar.wav", function() {
  T("chorus", {delay:20, rate:4, depth:20, fb:0.5, wet:0.25}, this).play();
});
```

## Properties ##
- `type` _(String)_
  - Modulation waveshape. `"sin"` or `"tri"`
- `delay` _(Number)_
  - Delay time. Its default value is **20msec**, with a nominal range of 0.5 to 80.
- `rate` _(Number)_
  - Modulation rate. Its default value is **4hz**, with a nominal range of 0 to 10.
- `depth` _(Number)_
  - Modulation depth. Its default value is **20**, with a nominal range of 0 to 100.
- `fb` _(Number)_
  - Feedback. Its default value is **0.2**, with a nominal range of -1 to 1.
- `wet` _(Number)_
  - Its default value is **0.5**, with a nominal range of 0 to 1.

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/chorus.js
