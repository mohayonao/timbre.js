T("tape")
=========

```timbre
T("audio").load("/timbre.js/misc/audio/amen.wav", function() {

    var tape = T("tape", {tape:this}).tape;
    
    var num = 400;
    var pitch = ((tape.duration() * (num - 1)) / (tape.duration() * num)) * 100;
    

    T("tape", {tape:tape.times(num-1).pitch(pitch).pan(100)}).play();

})
```
