T("*")
======
{arkr}{stereo} Multiply signals

## Description ##
en: `T("*")` is a signal multiplier operator that outputs a signal which is the multiplication all input signals.
ja: `T("*")` はインプットの信号を積算して出力します。

```timbre
var param = T("param").linTo(1, "10sec").on("ended", function() {
    synth.pause();
});
var osc = T("osc", {wave:"saw", mul:0.25});

var synth = T("*", osc, param).play();
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/mul.js
