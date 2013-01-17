Gymnopedie
==========

```timbre
var mml, env, gen;
env = {type:"adsr", d:1600, s:0, r:1600};
gen = T("OscGen", {wave:"tri(25)", env:env, mul:0.25, poly:8});
T("delay", {time:"BPM80 L16", fb:0.5, wet:0.4}, gen).play();

mml = "t80 l4 q7";
mml += "[g b0<d0f+2>> d <a0<c+0f+2>]8 ";
mml += "f+ <g0<c+0f+2>> b<a0<d0f+2> eg0b2 eb0<d0g2";
T("MML", {mml:mml}, gen).on("ended", function() {

}).start();

mml = "t80 l4 o6 q7 r2. r2. r2. r2.";
mml += "rf+a gf+c+ >b<c+d >a2. f+2.&f+2.&f+2.&f+2.<";
mml += "rf+a gf+c+ >b<c+d >a2. <c+2. f+2. >e2.&e2.&e2.";
T("MML", {mml:mml}, gen).on("ended", function() {

}).start();
```


gen.pause();

