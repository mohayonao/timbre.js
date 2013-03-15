T("osc")
========
{arkr} Interpolating wavetable oscillator

## Description ##
ja: 基本的な波形を出力します。

```timbre
T("osc", {wave:"sin", freq:880}).play();
```

## Properties ##
- `wave` _(String or Function or Float32Array)_
  - Wavetable.
- `freq` _(T-Object or timevalue)_
  - Frequency in Hertz.
- `phase` _(T-Object)_
  - Phase offset or modulator in radians.
- `fb` _(T-Object)_
  - Amplitude of phase feedback in radians.

## Note ##
ja:- 入力オブジェクトが指定されている場合はそれらを合成した後、オシレーターの値で積算します。以下の例では 440Hzのサイン波に 1秒ごとに on/off するパルス波を入力しています。
  
```timbre
T("sin", {freq:440, mul:0.5}, T("+pulse", {freq:"1sec"})).play();
```

## Modulate freq ##
```timbre
var xline = T("param", {value:1}).expTo(1000, "9sec");
var freq  = T("sin", {freq:xline, mul:200, add:800});

T("sin", {freq:freq, mul:0.25}).play();
```

## Modulate phase ##
```timbre
var xline = T("param", {value:1}).expTo(1000, "9sec");
var phase = T("sin", {freq:xline, mul:2 * Math.PI});

T("sin", {freq:800, phase:phase, mul:0.25}).play();
```

## Feedback ##
```timbre
var xline = T("param", {value:0.01}).expTo(5, "4sec");

T("sin", {freq:800, fb:xline, mul:0.25}).play();
```

## Wave Functions ##
ja: `wave` プロパティで様々な波形を選択/作成することができます。

(canvas wave w:240 h:80)

ja: まず基本の波形として **サイン波**、**のこぎり波**、**三角波**、**矩形波**、**ファミコン三角波** を選択できます。これらは良く使われるので `T("sin")` のように直接生成することもできます。

```timbre
var osc = T("osc", {mul:0.25}).play();

T("interval", {interval:1000}, function(count) {
  osc.wave = ["sin", "saw", "tri", "pulse", "fami"][count % 5];
  osc.plot({target:wave});
}).start();
```

- - -

(canvas width w:240 h:80)

ja: `基本波形名(整数)` と書くことで波形のデューティー比を指定できます。以下の例では矩形波を基本にデューティー比を変更することで音色を変更しています。

```timbre
var osc = T("osc", {mul:0.15}).play();

T("interval", {interval:1000}, function(count) {
  var wave = "pulse(" + ((count % 19) * 5 + 5) + ")";
  osc.wave = wave;
  osc.plot({target:width});
}).start();
```

- - -

(canvas plus w:240 h:80)

ja: `+基本波形名` と書くことで波形の形の範囲を 0-1 に矯正できます。`T("+sin")` のように生成した場合は自動的に Control Rateとなります。これはトレモロなどに使うときに便利です。

```timbre
T("osc", {wave:"+sin"}).plot({target:plus});
```

(canvas minus w:240 h:80)

ja: `-基本波形名` と書くことで波形の上下を反転することができます。

```timbre
T("osc", {wave:"saw"}).plot({target:minus, width:120});
T("osc", {wave:"-saw"}).plot({target:minus, width:120, x:120, background:"#ededed"});
```

- - -

### SiON記法 ###
ja: [SiON](http://mmltalks.appspot.com/document/siopm_mml_ref_05.html) のテーブル定義の書き方で波形を作成します。

(canvas wavc w:240 h:80)

ja: `wavc(0FFFFFFF)` と書くことで基音より整数倍のサイン波を合成した波形を作ることができます。値は下位から 4ビット単位で設定します。


```timbre
T("osc", {wave:"wavc(0200080f)", mul:0.15}).plot({target:wavc}).play();
```

- - -

(canvas wavb w:240 h:80)

ja: `wavb(00112233..)` と書くことで波形を 16進数で定義できます。

```timbre
var src = "wavb(36454d4b41362f303639332309efd9cc362f220df2d9c8c3c6cbccc6bab0aeb7)";
T("osc", {wave:src, mul:0.15}).plot({target:wavb}).play();
```

- - -

## See Also ##
- [`T("OscGen")`](./OscGen.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/osc.js
