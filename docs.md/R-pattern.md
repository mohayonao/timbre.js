T("pattern")
============
{kr}{timer} Pattern Sequencer

## Description ##

```timbre
var synth = T("OscGen", {wave:"sin(15)", mul:0.25}).play();

var list = [60,62,64,65,64,62,60,60, 64,65,67,69,67,65,64,64 ];
T("p.seq", {list:list, length:list.length, seed:2}, function(noteNum) {
    synth.noteOn(noteNum, 64);
}).on("ended", function() {
    this.stop();
    synth.pause();
}).start();
```

## Properties ##
- `interval` _(T Object)_
  - パターンを進めるインターバル. デフォルト値は **500**ms

## Methods ##
- `next()`
  - ひとつ進める
  
## Events ##
- `ended`
  - 終端に逹っしたとき
  
## 便利なコンストラクタ ##
`T("pattern")` クラスには便利なコンストラクタが用意されています. それらを使えば, 最小限のパラメータでさまざまなパターンを作成することができます.

### T("p.seq") ###
`T("p.seq")` はリストを順番に読み込みます. 

- list
- length: 1
- offset: 0

```timbre
var synth = T("OscGen", {wave:"tri", mul:0.25}).play();

var list = [60,62,64,65,67,69,71,72];
T("p.seq", {list:list, length:Infinity}, function(noteNum) {
    synth.noteOn(noteNum, 64);
}).start();
```

### T("p.shuf") ###
`T("p.shuf")` はリストをランダムにソートしてから順番に読み込みます. 

- list
- length: 1
- seed

```timbre
var synth = T("OscGen", {wave:"tri", mul:0.25}).play();

var list = [60,62,64,65,67,69,71,72];
T("p.shuf", {list:list, length:Infinity}, function(noteNum) {
    synth.noteOn(noteNum, 64);
}).start();
```

### T("p.choose") ###
`T("p.choose")` はリストからランダムに抽出します. 

- list
- length: 1
- seed

```timbre
var synth = T("OscGen", {wave:"tri", mul:0.25}).play();

var list = [60,62,64,65,67,69,71,72];
T("p.choose", {list:list, length:Infinity}, function(noteNum) {
    synth.noteOn(noteNum, 64);
}).start();
```

### T("p.arith") ###
`T("p.arith")` は初期値からの等差数列を進めます.

- start: 0
- step: 1
- length: Infinity

```timbre
var synth = T("OscGen", {wave:"tri", mul:0.25}).play();

T("p.arith", {start:60, step:3, length:12}, function(noteNum) {
    synth.noteOn(noteNum, 64);
}).on("ended", function() {
    synth.pause();
    this.stop();
}).start();
```

### T("p.geom") ###
`T("p.geom")` は初期値からの等比数列を進めます.

- start: 0
- grow: 1
- length: Infinity

```timbre
var synth = T("OscGen", {wave:"tri", mul:0.25}).play();

T("p.geom", {start:220, grow:1.06, length:12}, function(freq) {
    synth.noteOnWithFreq(freq, 64);
}).on("ended", function() {
    synth.pause();
    this.stop();
}).start();
```

### T("p.drunk") ###
`T("p.drunk")` は初期値からの等比数列を進めます.

- start: 0
- step: 0
- length: Infinity
- min: -Infinity
- max: +Infinity
- seed:

```timbre
var synth = T("OscGen", {wave:"tri", mul:0.25}).play();

T("p.drunk", {start:60, step:8, length:12, seed:5}, function(freq) {
    synth.noteOn(freq|0, 64);
}).on("ended", function() {
    synth.pause();
    this.stop();
}).start();
```

## Alias ##
`T("p")`

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/pattern.js
