T("timer")
==========
## タイマー ##

```timbre
var freqs = _.shuffle([220, 440, 660, 880]);

var func = T(function(count) {
    console.log(count);
    return freqs[count % freqs.length];
});
var osc = T("sin", {freq:func}).play();

var interval = T("param", {value:500}).lin(50, 20000);

T("timer", {delay:0,interval:interval}, func).start();
```
