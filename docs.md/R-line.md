T("line")
=========
{arkr} Linear ramp generator

## Description ##

```timbre
T("audio").load("/timbre.js/misc/audio/amen.wav", function() {
  var duration = this.duration;
  var line = T("line").to(0, duration, duration * 0.8).on("ended", function() {
    this.bang();
  });
  this.append(line).play();
});
```

## Property ##
- `value` _(Readonly Number)_

## Methods ##
- `to(startValue, endValue, duration)`

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/line.js
