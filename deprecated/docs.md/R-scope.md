T("scope")
==========
{ar}{stereo}{listener} Signal oscilloscope

## Description ##

(canvas canvas w:240 h:80)

```timbre
var audio = T("audio", {load:"/timbre.js/misc/audio/guitar.wav", loop:true}).play();

T("scope", {interval:200}).on("data", function() {
  this.plot({target:canvas});
}).listen(audio);
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/scope.js
