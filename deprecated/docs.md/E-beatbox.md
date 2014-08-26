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
  
  var drum = T("lowshelf", {freq:110, gain:8, mul:0.6}, BD, SD, HH1, HH2, CYM).play();
  var lead = T("saw", {freq:T("param")});
  var vcf  = T("MoogFF", {freq:2400, gain:6, mul:0.1}, lead);
  var env  = T("perc", {r:100});
  var arp  = T("OscGen", {wave:"sin(15)", env:env, mul:0.5});
  
  T("delay", {time:"BPM128 L4", fb:0.65, mix:0.35}, 
    T("pan", {pos:0.2}, vcf), 
    T("pan", {pos:T("tri", {freq:"BPM64 L1", mul:0.8}).kr()}, arp)
  ).play();
  
  T("interval", {interval:"BPM128 L16"}, function(count) {
    var i = count % P1.length;
    if (i === 0) CYM.bang();
    
    P1[i].forEach(function(p) { p.bang(); });
    
    if (Math.random() < 0.015) {
      var j = (Math.random() * P1.length)|0;
      P1.wrapSwap(i, j);
      P2.wrapSwap(i, j);
    }
    
    var noteNum = scale.wrapAt(P2.wrapAt(count)) + 60;
    if (i % 2 === 0) {
      lead.freq.linTo(noteNum.midicps() * 2, "100ms");
    }
    arp.noteOn(noteNum + 24, 60);
  }).start();
});
```

using: [subcollider.js](http://mohayonao.github.com/subcollider.js)

<script src="/timbre.js/src/extras/MoogFF.js"></script>
