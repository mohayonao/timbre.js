T("audio")
==========
## オーディオファイル ##

```timbre
var src = "/timbre.js/misc/audio/amen.wav";
T("audio", {isLooped:true}).load(src).then(function(res) {
    var count = 0;
    
    this.play().on("looped", function() {
        count += 1;
        
        if (count === 2) {
            this.reversed();
            this.isLooped = false;
        }
        
    }).on("ended", function() {
        console.log("ended");
        this.pause();
    });

});
```
