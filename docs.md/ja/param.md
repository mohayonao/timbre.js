T("param")
==========
** パラメーター **

```timbre
var freq  = T("param", {value:440});

freq.lin(880, 5000).once("done", function() {
    freq.exp(440, timbre.currentTime + 1500).once("done", function() {
        synth.pause();
    });
});

var synth = T("tri", {freq:freq,mul:0.5}).play();
```
