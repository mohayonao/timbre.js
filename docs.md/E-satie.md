Gymnopedie
==========

```timbre
var mml0, mml1;
var env   = T("adsr", {d:3000, s:0, r:600});
var synth = T("SynthDef", {mul:0.45, poly:8});

synth.def = function(opts) {
  var op1 = T("sin", {freq:opts.freq*6, fb:0.25, mul:0.4});
  var op2 = T("sin", {freq:opts.freq, phase:op1, mul:opts.velocity/128});
  return env.clone().append(op2).on("ended", opts.doneAction).bang();
};

var master = synth;
var mod    = T("sin", {freq:2, add:3200, mul:800, kr:1});
master = T("eq", {params:{lf:[800, 0.5, -2], mf:[6400, 0.5, 4]}}, master);
master = T("phaser", {freq:mod, Q:2, steps:4}, master);
master = T("delay", {time:"BPM60 L16", fb:0.65, mix:0.25}, master);

mml0 = "t60 l4 v6 q2 o3";
mml0 += "[ [g < b0<d0f+2>> d <a0<c+0f+2>>]8 ";
mml0 += "f+ <a0<c+0f+2>>> b<<b0<d0f+2>> e<g0b2> e<b0<d0g2>> d<f0a0<d2>>";
mml0 += ">a<<a0<c0e2>> d<g0b0<e2>> d<d0g0b0<e2>> d<c0e0a0<d2>> d<c0f+0a0<d2>>";
mml0 += "d<a0<c0f2>> d<a0<c0e2>> d<d0g0b0<e2>> d<c0e0a0<d2>> d<c0f+0a0<d2>>";
mml0 += "| e<b0<e0g2>> f+<a0<c+0f+2>>> b<<b0<d0f+2>> e<<c+0e0a2>> e<a0<c+0f+0a2>>";
mml0 += "eb0<a0<d>e0b0<d0g>> a0<g2.> d0a0<d2.> ]";
mml0 += "e<b0<e0g2>> e<a0<d0f0a2>> e<a0<c0f2>> e<<c0e0a2>> e<a0<c0f0a2>>";
mml0 += "eb0<a0<d>e0b0<d0g>> a0<g2.> d0a0<d2.>";

mml1 = "t60 v14 l4 o6";
mml1 += "[ r2. r2. r2. r2.";
mml1 += "rf+a gf+c+ >b<c+d >a2. f+2.& f+2.& f+2.& f+2.< rf+a gf+c+ >b<c+d >a2.<";
mml1 += "c+2. f+2. >e2.&e2.&e2.";
mml1 += "ab<c ed>b< dc>b< d2.& d2d";
mml1 += "efg acd ed>b <d2.& d2d";
mml1 += "| g2. f+2.> bab< c+de c+de>";
mml1 += "f+2. c0e0a0<c2.> d0f+0a0<d2. ]";
mml1 += "g2. f2.> b<cf edc edc>";
mml1 += "f2. c0e0a0<c2.> d0f0a0<d2.";

T("mml", {mml:[mml0, mml1]}, synth).on("ended", function() {
  this.stop();
}).set({buddies:master}).start();
```
