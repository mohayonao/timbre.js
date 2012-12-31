T("tape")
=========
{ar} Tape edit

## Description ##

磁気テープを切り貼りする要領で音声データを編集します。

```timbre
T("audio").load("/timbre.js/misc/audio/amen.wav").then(function() {

    var tape = T("tape", {tape:this}).tape;

    var tapes = tape.split(50);
    tapes.sort(function() {
        return Math.random() - 0.01;
    });
    tape = timbre.modules.scissor.join(tapes);
    tape = tape.pitch(90).loop(2);
        
    T("tape", {tape:tape}).on("ended", function() {
        this.pause();
    }).play();

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
