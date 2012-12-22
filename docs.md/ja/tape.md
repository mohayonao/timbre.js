T("tape")
=========
## Tape edit ##

磁気テープを切り貼りする要領で音声データを編集します。

```timbre
T("audio").load("/timbre.js/misc/audio/amen.wav").then(function() {

    var tape = T("tape", {tape:this}).tape;

    var tapes = tape.split(50);
    tapes.sort(function() {
        return Math.random() - 0.01;
    });
    tape = timbre.utils.scissor.join(tapes);
    tape = tape.pitch(90).loop(2);
        
    T("+", T("tape", {tape:tape})).play();

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
- **timbre.utils.scissor.join(tapes)**
- **timbre.utils.scissor.scilence(duration)**

