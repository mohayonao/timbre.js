T("wait")
=========
## Wait ##

```timbre
var osc = T("square", {freq:987.7666025122483, mul:0.25});
var env = T("env", {table:[1, [0, 800]]}, osc).on("done", function() {
    this.pause();
}).bang().play();

T("wait", {time:80}).then(function() {
    osc.freq.value = 1318.5102276514797;
}).start();
```

### alias ###
`T("timeout")`
