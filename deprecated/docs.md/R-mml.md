T("mml")
========
{kr}{timer} MML Based Scheduler

## Description ##
ja: MMLスタイルのスケジューラ。  
ja: 入力オブジェクトには `T("OscGen")` などの音源オブジェクトか `T("env")` を指定します。`noteOn` 時に `noteOn()` か `bang()` が呼ばれ、`noteOff` 時に `noteOff()` か `release()` が呼ばれる。

```timbre
var mml = "l8 q7 $";
mml += "[d0f0<c> r d0f0<c> r r d0f0<c> d0f0<c4> d0f0b d0f0b r d0f0b r d0f0b d0f0b4";
mml += " c0e0b r c0e0b r r c0e0b c0e0b4 | c0e0a c0e0a r c0e0a r c0e0a c0e0a4]";
mml += " c0e0<c> c0e0<c> r c0e0<c> r c0e0<c> c0e0<c4>";

var gen = T("PluckGen", {env:{type:"perc", r:500, lv:0.4}}).play();

T("mml", {mml:mml}, gen).start();

var osc = T("pulse", {freq:T("midicps"), mul:0.15});
var env = T("asr", {a:20, r:150, lv:0.8}, osc);

T("delay", {time:250, fb:0.75, mix:0.4}, env).play();

T("mml", {mml:"o7 q2 l8 $ e>a<c>a< r2"}, osc, env).on("data", function(type, opts) {
  if (type === "noteOn") {
    osc.freq.midi = opts.noteNum;
  }
}).start();
```

## Properties ##
- `mml` _(String)_
- `currentTime` _(ReadOnly Number)_

## Events ##
- `data`
ja:  - MMLコマンドを実行したときに発生する。コールバック関数には `type, opts` が渡される。
- `ended`
ja:  - 終端に達したときに発生する。

## MML Commands Reference ##

### `cdefgab` ###
en: note
ja: **ノート** c-bがそれぞれド-シに対応。 `+` を続けるとシャープ, `-` でフラット。数字を続けると長さ指定。数字省略時は `l` コマンドの指定値を採用。

```timbre
var mml = "l8 c4c+d d+4ef f+4gg+ a4a+b <c>bb-aa-gg-fee-dd-c2.";

var gen = T("OscGen", {wave:"saw", env:{type:"perc"}, mul:0.25}).play();

T("mml", {mml:mml}, gen).on("ended", function() {
  gen.pause();
  this.stop();
}).start();
```

en: chord
ja: 長さを 0 にした場合は後に続く音の長さを基準に和音になる。

```timbre
var mml = "l2 g0<c0e> f0g0<d> e0g0<c1";

var gen = T("OscGen", {wave:"sin(10)", env:{type:"adsr"}, mul:0.2}).play();

T("mml", {mml:mml}, gen).on("ended", function() {
  gen.pause();
  this.stop();
}).start();
```

### `r` ###
en: rest
ja: **休符** 数値で音長指定

```timbre
var mml = "l16 o2 [ a r aa ]16";

var gen = T("OscGen", {wave:"pulse", env:{type:"adsr", r:150}, mul:0.25}).play();

T("mml", {mml:mml}, gen).on("ended", function() {
  gen.pause();
  this.stop();
}).start();
```

### `&` ###
en: tie
ja: **タイ** 直前の音とつなげる

```timbre
var mml = "l8 cc ee ff g&g ee dd c2";

var gen = T("OscGen", {wave:"pulse", env:{type:"adsr", d:500}, mul:0.25}).play();

T("mml", {mml:mml}, gen).on("ended", function() {
  gen.pause();
  this.stop();
}).start();
```

### `t` ###
en: tempo
ja: **テンポ** テンポを指定する。値を省略したときは `timbre.bpm` の値

### `l` ###
en: note length
ja: **音長** _(4)_ ノート/休符で音長を省略したときの値

### `o` ###
en: octave
ja: **オクターブ** _(4)_ 中央が 4。略記 `<>` で上下できる。

### `v` ###
en: velocity
ja: **ベロシティ** _(0-15)_ 略記 `()` で上下できる。

### `q` ###
en: quantize
ja: **クォンタイズ** _(0-8)_ キーオフのタイミング。0 だと即時キーオフ. 8 でキーオフなし。

### `[|]` ###
en: loop
ja: **ループ** _(2)_ 指定区間を繰り返す。末尾で繰り返し回数を指定できる。 `|` は最終ループ時に以降をスキップする。

### `$` ###
en: infinite loop
ja: **無限ループ** MMLの終端に達したとき、この位置に戻る。

```timbre
var mml = "$ cf+d+f";

var gen = T("OscGen", {wave:"saw", env:{type:"adsr", d:500}, mul:0.25}).play();

T("mml", {mml:mml}, gen).on("ended", function() {
  gen.pause();
  this.stop();
}).start();
```

## See Also ##
- [`T("OscGen")`](./OscGen.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/mml.js
