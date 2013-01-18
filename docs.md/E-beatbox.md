BeatBox
=======

```timbre
T("audio").load("/timbre.js/misc/audio/drumkit.wav", function() {
    var BD  = this.slice(   0,  500).set({bang:false});
    var SD  = this.slice( 500, 1000).set({bang:false});
    var HH1 = this.slice(1000, 1500).set({bang:false, mul:0.2});
    var HH2 = this.slice(1500, 2000).set({bang:false, mul:0.2});
    var CYM = this.slice(2000).set({bang:false, mul:0.2});
    var scale = new sc.Scale([0,1,3,7,8], 12, "Pelog");
    
    var P1 = [
        [BD, HH1],
        [HH1],
        [HH2],
        [],
        [BD, SD, HH1],
        [HH1],
        [HH2],
        [SD],
    ].wrapExtend(128);
    
    var P2 = sc.series(16);
    
    var drum = T("lowshelf", {freq:110, gain:12, mul:0.6}, BD, SD, HH1, HH2, CYM).play();
    var gen  = T("OscGen", {wave:"sin(15)", mul:0.25});
    
    T("delay", {time:"BPM128 L4", fb:0.75, wet:0.35}, gen).play();
    
    T("interval", {interval:"BPM128 L16"}, function(count) {
        var i = count % P1.length;
        if (i === 0) CYM.bang();
    
        P1[i].forEach(function(p) { p.bang(); });
        
        if (Math.random() < 0.015) {
            var j = (Math.random() * P1.length)|0;
            P1.wrapSwap(i, j);
            P2.wrapSwap(i, j);
        }
        
        gen.noteOn(scale.wrapAt(P2.foldAt(count)) + 84 - ((i % 2) * 24), 80);
    }).start();
});
```

using: [subcollider.js](http://mohayonao.github.com/subcollider.js)
