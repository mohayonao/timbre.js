T("tape")
=========
{ar} Tape edit

## Description ##

磁気テープを切り貼りする要領で音声データを編集します。

```timbre
timbre.rec(function(output) {

    var gen = T("PluckGen");
    var mml = "o3 l8 d0grf0b-rg0<c4.> d0grf0b-ra-0<d->g0<c2> d0grf0b-rg0<c4.>f0b-rd0g2..";
    
    T("mml", {mml:mml}, gen).on("ended", function() {
        output.done();
    }).start();
    
    var synth = gen;
    synth = T("dist" , {pre:-60, post:12}, synth);
    
    output.send(synth);

}).then(function(buffer) {
   
    var tape = T("tape", {tape:buffer}).tape;
    
    var tapes = tape.split(32);
    
    tapes = tapes.map(function(t) {
        return t.loop(4);
    });
    
    tape = timbre.modules.scissor.join(tapes);
        
    T("tape", {tape:tape, isLooped:true}).play();
    
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
- **timbre.modules.scissor.join(tapes)**
- **timbre.modules.scissor.scilence(duration)**

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/tape.js
