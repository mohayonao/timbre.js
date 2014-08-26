T("SynthDef")
=============
{ar}{stereo} Synth Definition

## Description ##
en: `T("SynthDef")` manages a **SynthDef** with `noteOn`, `noteOff`.
ja: 音源インターフェース。音源定義を `noteOn`, `noteOff` で管理します。

```timbre
var synth = T("SynthDef").play();

synth.def = function(opts) {
  var osc1, osc2, env;
  osc1 = T("saw", {freq:opts.freq         , mul:0.25});
  osc2 = T("saw", {freq:opts.freq * 1.6818, mul:0.20});
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
en:  - A **SynthDef** function that should return **T-Object**.
ja:  - 音源定義関数 (SynthDefFunction)

- `poly` _(Number)_
en:  - The maximum number of polyphony. Its default value is **4**, with a range between 1 to 64.
ja:  - 同時発音数 (1から 64まで、デフォルトは 4)

## SynthDefFunction ##  
ja: 音源定義関数は `noteOn()` の時に呼ばれる関数です。引数は以下が定義された辞書オブジェクトです。  
ja: 引数を元に T オブジェクト を生成して返します。

- `opts.noteNum`
en:  - The MIDI number of `noteOn()` or `noteOff()` with a range between 0 to 127.
ja:  - noteOn された MIDIノート番号 (0-127)
  
- `opts.freq`
en:  - The frequency of `noteOn()` or `noteOff()`.
ja:  - noteOn された 音の周波数
  
- `opts.velocity`
en:  - The velocity of `noteOn()` with a range between 0 to 127.
ja:  - noteOn された velocity (0-127)
  
- `opts.doneAction`
en:  - The function that free the enclosing synth.
ja:  - 開放関数です

- ohters
en:  - The 3rd argument of `noteOn()` or `noteOff()`.
ja:  - noteOn の第3引数で指定した値

## Methods ##
- `noteOn(noteNum, velocity, opts)`
- `noteOnWithFreq(freq, velocity, opts)`  
en:  - Call a **SynthDef** function and start management a returned **T-Object** with a MIDI note number.
ja:  - SynthDefFunction を呼び出して戻り値の T オブジェクトの管理を開始する

- `noteOff(noteNum)`
- `noteOffWithFreq(freq)`
en:  - Send `release()` to **T-Object** that managed with a MIDI note number.
ja:  - noteOn で管理されている T オブジェクトの `release()` を呼び出す

- `allNoteOff()`
en:  - Send `noteOff()` to all **T-Object** that manged by `noteOn()` or `noteOnWithFreq()`.
ja:  - すべての音にノートオフする

- `allSoundOff()`
en:  - Dispose all **T-Object** managed.
ja:  - すべての音を停止する

## See Also ##
- [`T("OscGen")`](./OscGen.html)
- [`T("PluckGen")`](./PluckGen.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/synthdef.js
