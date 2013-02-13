Pragmatic Synth
===============
Make a Synthesizer

VCO - VCA - VCF モデルの簡単なアナログシンセサイザーを作ります。

## UI ##
グラフィカルな UI は説明が膨大になるため省略し、簡易的に以下の仕様のインターフェースを使用します。

- [`T("keyboard")`](./keyboard.html) でキーボードからの入力を取得 _(line:5)_ 
- [`T("ndict.key")`](./ndict.html) でMIDIノート番号に変換 _(line:6)_
- [`T("midicps")`](./midicps.html) でMIDIノート番号を周波数に変換 _(line:8)_

![Keymap](/timbre.js/misc/img/keymap.png)

```timbre
var synth = T("OscGen", {wave:"saw", mul:0.25}).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    var freq = midicps.at(midi);
    synth.noteOnWithFreq(freq, 100);
  }
}).on("keyup", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    synth.noteOff(midi, 100);
  }
}).start();
```

## VCO ##
**Voltage Controlled Oscillator**. timbre.js では [`T("osc")`](./osc.html) を使用します。

```timbre
var VCO = T("saw", {freq:880, mul:0.2}).play();
```

キーボードによる周波数の制御 _(line:8)_

```timbre
var VCO = T("saw", {freq:880, mul:0.2}).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    VCO.freq.value = midicps.at(midi);
  }
}).start();
```


`T("osc")` の周波数プロパティ ( `.freq` ) は数値以外の T オブジェクトを入力することができます。以下の例では時間変化する T オブジェクト を周波数プロパティの入力にしてビブラートやポルタメントを行なっています。


### Vibrato ###

```timbre
var LFO = T("sin", {freq:"250ms", mul:5, add:880}).kr();
var VCO = T("saw", {freq:LFO, mul:0.2}).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    LFO.add = midicps.at(midi);
  }
}).start();
```

### Portament ###

`T("param")` を使用して周波数を滑かに変化させる _(line:1,2,9)_  

```timbre
var glide = T("param", {value:880});
var VCO   = T("saw"  , {freq:glide, mul:0.2}).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    glide.linTo(midicps.at(midi), "100ms");
  }
}).start();
```

### Sound Effect ###

エンベロープオブジェクト `T("env")` で周波数の変化を直接記述する。

```timbre
var table = [1760, [110, "200ms"]];
var EG    = T("env", {table:table}).on("bang", function() {
    VCO.mul = 0.2;
}).on("ended", function() {
    VCO.mul = 0;
});
var VCO = T("saw", {freq:EG, mul:0}).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  EG.bang();
}).start();
```


## VCF ##
**Voltage Controlled Filter**. timbre.js では [`T("biquad")`](./biquad.html) を使用します。

```timbre
var VCO = T("saw", {mul:0.2});
var VCF = T("lpf", {cutoff:1600, Q:10}, VCO).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    VCO.freq.value = midicps.at(midi);
  }
}).start();
```

### Envelope Filtering ###

エンベロープオブジェクト `T("env")` でカットオフ周波数を時間変化させる。

_(line:1,2,12,13)_

```timbre
var table = [200, [4800, 150], [2400, 500]];
var cutoff = T("env", {table:table}).bang();

var VCO = T("saw", {mul:0.2});
var VCF = T("lpf", {cutoff:cutoff, Q:10}, VCO).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    VCO.freq.value = midicps.at(midi);
    cutoff.bang();
  }
}).start();
```

### Auto Wah ###

LFOでカットオフ周波数を時間変化させる。

_(line:1,13,14)_

```timbre
var cutoff = T("sin", {freq:"400ms", mul:300, add:1760}).kr();

var VCO = T("saw", {mul:0.2});
var VCF = T("lpf", {cutoff:cutoff, Q:20}, VCO).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    var freq = midicps.at(midi);
    VCO.freq.value   = freq;
    cutoff.add.value = freq * 2;
    cutoff.bang();
  }
}).start();
```

## VCA ##
**Voltage Controlled Amplifier**. timbre.js では [`T("env")`](./env.html) や [`T("param")`](./param.html) を使います。

### Amplitude Envelope ###

一般的な ADSRエンベロープ。
_(line:2,10,15)_

```timbre
var VCO = T("saw" , {mul:0.2});
var EG  = T("adsr", {a:100, d:1500, s:0.75, r:500}, VCO).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    VCO.freq.value = midicps.at(midi);
    EG.bang();
  }
}).on("keyup", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    EG.release();
  }
}).start();
```

### Tremolo ###

LFOでトレモロ効果。
_(line:2,3)_

```timbre
var VCO = T("saw" , {mul:0.5});
var EG  = T("+tri", {freq:"50ms", mul:0.2, add:0.5});
var synth = T("*", VCO, EG).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    VCO.freq.value = midicps.at(midi);
  }
}).start();
```

## Polyphonic ##

今までの例ではモノフォニックだったが、`T("SynthDef")` オブジェクトを使用すると最低限の記述でポリフォニックシンセを作成できる。

```timbre
var synth = T("SynthDef").play();

synth.def = function(opts) {
  var VCO = T("saw", {freq:opts.freq});
  
  var cutoff = T("env", {table:[8000, [opts.freq, 500]]}).bang();
  var VCF    = T("lpf", {cutoff:cutoff, Q:5}, VCO);
  
  var EG  = T("adsr", {a:150, d:500, s:0.45, r:1500, lv:0.6});
  var VCA = EG.append(VCF).bang();
  
  return VCA;
};

var keydict = T("ndict.key");
T("keyboard").on("keydown", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    synth.noteOn(midi);
  }
}).on("keyup", function(e) {
  var midi = keydict.at(e.keyCode);
  if (midi) {
    synth.noteOff(midi);
  }
}).start();
```

<script src="/timbre.js/src/extras/keyboard.js"></script>
