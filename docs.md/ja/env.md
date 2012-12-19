T("env")
========
## エンベロープ ##

```timbre
T("env", {table:[1,[0, 1500]]}, T("sin")).on("done", function() {
    console.log("done!");
    this.pause();
}).bang().play();
```


```timbre
var table = [220,[440,500],[110,2500],[1760,1000,"exp"],[440,10000]];
var env = T("env", {table:table}).bang();

T("saw", {freq:env, mul:0.25}).play();
```
