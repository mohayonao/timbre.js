T("tape")
=========
{ar}{stereo} Tape edit

## Description ##
ja: 磁気テープを切り貼りする要領で音声データを編集します。

```timbre
timbre.rec(function(output) {
  
  var gen = T("PluckGen", {env:T("adsr", {r:100})});
  var mml = "o3 l8 d0grf0b-rg0<c4.> d0grf0b-ra-0<d->g0<c2> d0grf0b-rg0<c4.>f0b-rd0g2..";
  
  T("mml", {mml:mml}, gen).on("ended", function() {
    output.done();
  }).start();
  
  var synth = gen;
  synth = T("dist", {pre:60, post:-12}, synth);
  
  output.send(synth);
  
}).then(function(result) {
  
  var tape = T("tape", {tape:result}).tape;
  
  var tapes = tape.split(32);
  
  tapes = tapes.map(function(t) {
    return t.loop(4);
  });
  
  tape = timbre.modules.Scissor.join(tapes);
  
  T("tape", {tape:tape, loop:true}).play();
  
});
```

#### Tapeオブジェクト / scissor名前空間で可能な操作 ####

- **slice(start, length)** *(alias: cut)*
- **concat(other)**
- **loop(count)**  *(alias: times)*
- **split(count)**
- **fill(duration)**
- **replace(start, length, replaced)**
- **reverse()**
- **pitch(pitch)**
- **duration()**
- **timbre.modules.Scissor.join(tapes)**
- **timbre.modules.Scissor.scilence(duration)**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/tape.js
