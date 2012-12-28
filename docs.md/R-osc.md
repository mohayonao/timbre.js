T("osc")
========
Oscillator

## Description ##
基本的な波形を出力します。

```timbre
T("osc", {wave:"sin", freq:880}).play();
```

## Properties ##
- `wave` _(String or Function or Float32Array)_
  - 波形を設定します。詳細は **Wave Functions** の項目を参照してください
- `freq` _(T Object or timevalue)_
  - 周波数を設定します。

## Note ##
- 入力オブジェクトが指定されている場合はそれらを合成した後、オシレーターの値で積算します。以下の例では 440Hzのサイン波に 1秒ごとに on/off するパルス波を入力しています。
  
```timbre
T("sin", {freq:440, mul:0.5}, T("+pulse", {freq:"1sec"})).play();
```

## Wave Functions ##
`wave` プロパティで様々な波形を選択/作成することができます。

(canvas wave w:240 h:80)

まず基本の波形として **サイン波**、**のこぎり波**、**三角波**、**矩形波**、**ファミコン三角波** を選択できます。これらは良く使われるので `T("sin")` のように直接生成することもできます。

```timbre
var osc = T("osc", {mul:0.25}).play();
var canvas = window.getCanvasById("wave");

T("interval", {delay:0, interval:1000}, function(count) {
    var wave = ["sin", "saw", "tri", "pulse", "fami"][count % 5];
    osc.wave = wave;
    osc.plot({target:canvas});    
}).start();
```

- - -

(canvas wave-width w:240 h:80)

`基本波形名(整数)` と書くことで波形のデューティー比を指定できます。以下の例では矩形波を基本にデューティー比を変更することで音色を変更しています。

```timbre
var osc = T("osc", {mul:0.15}).play();
var canvas = window.getCanvasById("wave-width");

T("interval", {delay:0, interval:1000}, function(count) {
    var wave = "pulse(" + ((count % 19) * 5 + 5) + ")";
    osc.wave = wave;
    osc.plot({target:canvas});    
}).start();
```

- - -

(canvas wave-plus w:240 h:80)

`+基本波形名` と書くことで波形の形の範囲を 0-1 に矯正できます。`T("+sin")` のように生成した場合は自動的に Control Rateとなります。これはトレモロなどに使うときに便利です。

```timbre
var canvas = window.getCanvasById("wave-plus");

T("osc", {wave:"+sin"}).plot({target:canvas});
```

(canvas wave-minus w:240 h:80)

`-基本波形名` と書くことで波形の上下を反転することができます。

```timbre
var canvas = window.getCanvasById("wave-minus");

T("osc", {wave:"saw"}).plot({target:canvas, width:120});
T("osc", {wave:"-saw"}).plot({target:canvas, width:120, x:120, background:"#ededed"});
```

- - -

### SiON記法 ###
[SiON](http://mmltalks.appspot.com/document/siopm_mml_ref_05.html) のテーブル定義の書き方で波形を作成します。

(canvas wave-wavc w:240 h:80)

`wavc(0FFFFFFF)` と書くことで基音より整数倍のサイン波を合成した波形を作ることができます。値は下位から 4ビット単位で設定します。


```timbre
var canvas = window.getCanvasById("wave-wavc");

T("osc", {wave:"wavc(0200080f)", mul:0.15}).plot({target:canvas}).play();
```

- - -

(canvas wave-wavb w:240 h:80)

`wavb(00112233..)` と書くことで波形を 16進数で定義できます。

```timbre
var canvas = window.getCanvasById("wave-wavb");

var src = "wavb(36454d4b41362f303639332309efd9cc362f220df2d9c8c3c6cbccc6bab0aeb7)";
T("osc", {wave:src, mul:0.15}).plot({target:canvas}).play();
```

- - -

## See Also ##
- [`T("OscEnv")`](./OscEnv.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/osc.js
