T("tape")
=========

```timbre
T("audio").load("../../misc/amen.wav", function() {

    var tape = T("tape").getInnerInstance({
        buffer:this.buffer, samplerate:this.samplerate
    });
    
    var num = 400;
    var pitch = ((tape.duration() * (num - 1)) / (tape.duration() * num)) * 100;
    

    T("tape", {tape:tape.times(num-1).pitch(pitch).pan(100)}).play();

})
```
    T("tape", {tape:tape}).on("ended", function() {
        console.log("end");
        this.pause();
    }).play();

