Pragmatic Synth
===============
Make a Synthesizer

en: We make a simple synthesizer VCF - VCO - VCA models.
ja: VCO - VCA - VCF モデルの簡単なシンセサイザーを作ります。

## UI ##
en: The graphical UI omitted because the description is huge, use the following in a simple interface.
ja: グラフィカルな UI は説明が膨大になるため省略し、簡易的に以下の仕様のインターフェースを使用します。

- [`T("keyboard")`](./keyboard.html) gets input from the keyboard _(line:5)_ 
- [`T("ndict.key")`](./ndict.html) converts from a key code to a MIDI note number _(line:6)_
- [`T("midicps")`](./midicps.html) converts from a MIDI note number to a frequency _(line:8)_

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

## VCO (Voltage Controlled Oscillator) ## 

```timbre
var VCO = T("saw", {freq:880, mul:0.2}).play();
```

en: Frequency control by keyboard _(line:8)_
ja: キーボードによる周波数の制御 _(line:8)_

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

en: The property `T("osc").freq` can be enter the T-object in non-numeric _(line:2)_. In the following example, vibrato and portamento is performed by `.freq` that is the time-varying T-object.
ja: `T("osc").freq` は数値以外の T オブジェクトを入力することができます _(line:2)_。以下の例では時間変化する T オブジェクト を周波数プロパティの入力にしてビブラートやポルタメントを行なっています。

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
en: It is varied to smooth the frequency by using `T("param")` _(line:1,2,9)_
ja: `T("param")` を使用して周波数を滑かに変化させる _(line:1,2,9)_

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
en: It directly describes the change in frequency in the envelope object `T("env")`.
ja: エンベロープオブジェクト `T("env")` で周波数の変化を直接記述する。

```timbre
// Change from 1760Hz to 220Hz in 200ms.
var table = [1760, [110, "200ms"]];

var freq = T("env", {table:table}).on("bang", function() {
    VCO.mul = 0.2;
}).on("ended", function() {
    VCO.mul = 0;
});
var VCO = T("saw", {freq:freq, mul:0}).play();

var keydict = T("ndict.key");
var midicps = T("midicps");
T("keyboard").on("keydown", function(e) {
  freq.bang(); // Start the envelope
}).start();
```


## VCF ##
ja: **Voltage Controlled Filter**. timbre.js では [`T("biquad")`](./biquad.html) を使用します。

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
ja: エンベロープオブジェクト `T("env")` でカットオフ周波数を時間変化させる。

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
ja: LFOでカットオフ周波数を時間変化させる。

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
ja: **Voltage Controlled Amplifier**. timbre.js では [`T("env")`](./env.html) や [`T("param")`](./param.html) を使います。

### Amplitude Envelope ###

ja: 一般的な ADSRエンベロープ。
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

ja: LFOでトレモロ効果。
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

ja: 今までの例ではモノフォニックだったが、`T("SynthDef")` オブジェクトを使用すると最低限の記述でポリフォニックシンセを作成できる。

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
