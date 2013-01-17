T = require '..'

env = {type:"adsr", d:2000, s:0, r:800}
gen = T("OscGen", {wave:"tri(25)", env:env, mul:0.1, poly:8})

synth = T("delay", {time:"BPM60 L16", fb:0.8, wet:0.25}, gen).play()

mml = "t60 l4 q2 o3"
mml += "[ [g < b0<d0f+2>> d <a0<c+0f+2>>]8 ";
mml += "f+ <a0<c+0f+2>>> b<<b0<d0f+2>> e<g0b2> e<b0<d0g2>> d<f0a0<d2>>";
mml += ">a<<a0<c0e2>> d<g0b0<e2>> d<d0g0b0<e2>> d<c0e0a0<d2>> d<c0f+0a0<d2>>";
mml += "d<a0<c0f2>> d<a0<c0e2>> d<d0g0b0<e2>> d<c0e0a0<d2>> d<c0f+0a0<d2>>";
mml += "| e<b0<e0g2>> f+<a0<c+0f+2>>> b<<b0<d0f+2>> e<<c+0e0a2>> e<a0<c+0f+0a2>>";
mml += "eb0<a0<d>e0b0<d0g>> a0<g2.> d0a0<d2.> ]";

mml += "e<b0<e0g2>> e<a0<d0f0a2>> e<a0<c0f2>> e<<c0e0a2>> e<a0<c0f0a2>>";
mml += "eb0<a0<d>e0b0<d0g>> a0<g2.> d0a0<d2.>";

T("mml", {mml:mml}, gen).on("ended", ->
    @stop()
).start()

mml = "t60 l4 o6";
mml += "[ r2. r2. r2. r2.";
mml += "rf+a gf+c+ >b<c+d >a2. f+2.& f+2.& f+2.& f+2.< rf+a gf+c+ >b<c+d >a2.<";
mml += "c+2. f+2. >e2.&e2.&e2.";
mml += "ab<c ed>b< dc>b< d2.& d2d";
mml += "efg acd ed>b <d2.& d2d";
mml += "| g2. f+2.> bab< c+de c+de>";
mml += "f+2. c0e0a0<c2.> d0f+0a0<d2. ]";

mml += "g2. f2.> b<cf edc edc>";
mml += "f2. c0e0a0<c2.> d0f0a0<d2.";

T("mml", {mml:mml}, gen).on("ended", ->
    @stop()
    synth.pause()
).start()
