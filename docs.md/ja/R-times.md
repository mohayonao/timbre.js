T("*")
======
Multiply signals

## Description ##
インプットの信号を積算して出力します。

```timbre
var param = T("param").linTo(1, 1000).on("ended", function() {
    synth.pause();
});

var synth = T("*", T("osc", {wave:"sin"}), param).play();
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/times.js
