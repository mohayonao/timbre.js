T("SynthDef")
=============
{ar} Synth Definition

## Description ##
音源インターフェース。音源定義を `noteOn`, `noteOff` で管理します。

```timbre
var synth = T("SynthDef").play();

synth.def = function(opts) {
    var osc1, osc2, env;
    osc1 = T("saw", {freq:opts.freq      , mul:0.25});
    osc2 = T("saw", {freq:opts.freq * 1.5, mul:0.20});
    env  = T("linen", {s:450, r:250, lv:0.5}, osc1, osc2);
    return env.on("ended", opts.doneAction).bang();
};

T("interval", {interval:500}, function(count) {
    var noteNum  = 69 + [0, 2, 4, 5, 7, 9, 11, 12][count % 8];
    var velocity = 64 + (count % 64);
    synth.noteOn(noteNum, velocity);
}).start();
```

## Properties ##
- `def` _(Function)_
  - 音源定義関数 (SynthDefFunction)
- `poly` _(Number)_
  - 同時発音数 (1から 64まで、デフォルトは 4)
  
## SynthDefFunction ##  
音源定義関数は `noteOn()` の時に呼ばれる関数です。引数は以下が定義された辞書オブジェクトです。  
引数を元に T オブジェクト を生成して返します。

- `opts.noteNum`
  - noteOn された MIDIノート番号 (0-127)
- `opts.freq`
  - noteOn された 音の周波数
- `opts.velocity`
  - noteOn された velocity (0-127)
- `opts.doneAction`
  - 開放関数です
- ohters
  - noteOn の第3引数で指定した値

## Methods ##
- `noteOn(noteNum, velocity, opts)`
- `noteOnWithFreq(freq, velocity, opts)`  
  - SynthDefFunction を呼び出して戻り値の T オブジェクトの管理を開始する
- `noteOff(noteNum)`
- `noteOffWithFreq(freq)`
  - noteOn で管理されている T オブジェクトの `release()` を呼び出す
- `allNoteOff()`
  - すべての音にノートオフする
- `allSoundOff()`
  - すべての音を停止する

## See Also ##
- [`T("OscGen")`](./OscGen.html)
- [`T("PluckGen")`](./PluckGen.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/synthdef.js
