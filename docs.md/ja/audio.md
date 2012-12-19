T("audio")
==========
## オーディオファイル ##

```timbre
var src = "/timbre.js/misc/audio/amen.wav";
T("audio").load(src, function(res) {

    this.play().on("ended", function() {
        console.log("ended");
        this.pause();
    });

});
```
