T("audio")
==========
** オーディオファイル **

```timbre
var count;

T("audio", {isLooped:true}).on("ended", function() {
    console.log("end");
    this.pause();
}).on("looped", function() {
    count += 1;
    if (count === 5) {
        console.log("reverse");
        this.isReversed = true;
    } else if (count >= 10) {
        this.isLooped = false;
    }
}).on("loadstart", function() {
    count = 0;
    console.log("loadstart");
}).on("loadedmetadata", function() {
    console.log("loadmetadata", this.duration);
}).on("loadeddata", function() {
    console.log("loaddata");
    this.play();
}).load("../../misc/amen.wav");
```
