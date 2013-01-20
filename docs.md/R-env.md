T("env")
========
{kr} Envelope

## Description ##

エンベロープを定義し、`bang()`を受けて動作します。インプットがない場合はエンベロープ値のみを、インプットがある場合はインプットを加算したものにエンベロープ値を積算して出力します。

```timbre
var table = [0.8, [0, 1500]];
T("env", {table:table}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();
```

エンベロープの形状は `table` プロパティで指定します。`table` は `初期値` に続いて `[次の値, 時間(ms), カーブの種類]` の子配列を要素に持つ配列です。以下の例では 440Hzから 0.5秒かけて 880Hzに上昇し、0.25秒で 660Hzに遷移するエンベロープをオシレーターの周波数の入力として 3回動作させています。

```timbre
var table = [440, [880, 500], [660, 250]];
var env   = T("env", {table:table}).bang();
var synth = T("saw", {freq:env, mul:0.25}).play();

var i = T("interval", {interval:1000}, function(count) {
    if (count === 3) {
        synth.pause();
        i.stop();
    }
    env.bang();
}).start();
```

(canvas env-release w:240 h:80)

`releaseNode` プロパティを指定すると、 `release()` メソッドをトリガするまで持続するエンベロープを作成できます。以下の例では 3番目の要素をリリースノードとすることで直前の値 0.6 まで遷移した後、持続して `release()` がトリガされてから 1秒かけて 0 に遷移するエンベロープを動作させています。

```timbre
var table = [0, [1, 100], [0.6, 100], [0, 1000]];
var synth = T("saw", {mul:0.25});
var env   = T("env", {table:table, releaseNode:3}, synth).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-release");
env.plot({target:canvas});

var t = T("timeout", {timeout:2000}, function() {
    env.release();
    t.stop();
}).start();
```

(canvas env-loop w:240 h:80)

`loopNode` プロパティを指定すると、エンベロープの末尾まで到達した後、リリースノード以降を繰り返すエンベロープを作成できます。以下の例では 1番目の要素をループノードとすることで周期的に変化するエンベロープを作成して、オシレーターの周波数の入力とすることでビブラートを行っています。`releaseNode` と合わせて使用した場合、ループノードとリリースノードの間でループします。

```timbre
var table = [440, [460, 50], [430, 150]];
var env   = T("env", {table:table, loopNode:1}).bang();
var synth = T("tri", {freq:env, mul:0.25}).play();

var canvas = window.getCanvasById("env-loop");
env.plot({target:canvas});

var t = T("timeout", {timeout:2000}, function() {
    synth.pause();
    t.stop();
}).start();
```

## Properties ##
- `table` _(Array)_
- `curve` _(String "lin" or "exp")_
- `releaseNode` _(Number)_
- `loopNode` _(Number)_

## Methods ##
- `bang()`
  - エンベロープを起動します
- `release()`
  - リリースフェーズに移行します

## Events ##
- `sustained`
  - エンベロープが持続フェーズに入ったときに発生します
- `released`
  - リリースメソッドが呼ばれたときに発生します
- `ended`
  - エンベロープが終了したときに発生します

## Tips ##

(canvas env-plot w:240 h:80)

- カーブの種類は `"lin"` か `"exp"` を指定できます。
- `curve` プロパティでデフォルトのカーブの種類を設定できます。
- `plot()` メソッドでエンベロープの形状を描画します。
- 時間は **timevalue形式**の文字列でも指定できます。

```timbre
var table = [0, [0.8, "BPM120 L8"], [0.4, "BPM120 L16"],
                [0.5, 80], [0.4, 80], [0, "BPM120 L4", "lin"]];
var env = T("env", {table:table, loopNode:3, releaseNode:5, curve:"exp"});

var canvas = window.getCanvasById("env-plot");
env.plot({target:canvas});

env.append(T("pulse", {mul:0.25})).on("ended", function() {
    this.pause();
}).bang().play();

var t = T("timeout", {timeout:2000}, function() {
    env.release();
    t.stop();
}).start();
```


## 便利なコンストラクタ ##
`T("env")` クラスには便利なコンストラクタが用意されています。それらを使えば、最小限のパラメータでエンベロープテーブルを作成することができます。

### T("perc") ###
(canvas env-perc w:240 h:80)

`T("perc")` はパーカッシブなエンベロープを作ります。

- a, attackTime: 10
- d, decayTime: 300
- lv, level: 0

```timbre
var env = T("perc", {d:500}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-perc");
env.plot({target:canvas});
```

### T("adsr") ###
(canvas env-adsr w:240 h:80) 

`T("adsr")` はADSRタイプの持続エンベロープを作ります。

- a, attackTime : 10
- d, decayTime : 300
- s, sustainLevel : 0.5
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("adsr", {a:100,d:250,s:0.6,r:500}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-adsr");
env.plot({target:canvas, width:240, height:80});

var t = T("timeout", {timeout:1500}, function() {
    env.release();
    t.stop();
}).start();
```

### T("adshr") ###
(canvas env-adshr w:240 h:80) 

`T("adshr")` はADSHRタイプのエンベロープを作ります。

- a, attackTime : 10
- d, decayTime : 300
- s, sustainLevel : 0.5
- h, holdTime: 500
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("adshr", {a:100,d:250,s:0.6,r:500}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-adshr");
env.plot({target:canvas, width:240, height:80});
```

### T("asr") ###
(canvas env-asr w:240 h:80) 

`T("asr")` はASRタイプの持続エンベロープを作ります。

- a, attackTime : 10
- s, sustainLevel : 0.5
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("asr", {a:100,s:0.8,r:500}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-asr");
env.plot({target:canvas, width:240, height:80});

var t = T("timeout", {timeout:1500}, function() {
    env.release();
    t.stop();
}).start();
```

### T("dadsr") ###
(canvas env-dadsr w:240 h:80) 

`T("dadsr")` は DADSRタイプの持続エンベロープを作ります。

- dl, delayTime : 100
- a, attackTime : 10
- s, sustainLevel : 0.5
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("dadsr", {dl:500,r:500}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-dadsr");
env.plot({target:canvas, width:240, height:80});

var t = T("timeout", {timeout:1500}, function() {
    env.release();
    t.stop();
}).start();
```

### T("ahdsfr") ###
(canvas env-ahdsfr w:240 h:80) 

`T("ahdsfr")` は AHDSFRタイプの持続エンベロープを作ります。

- a, attackTime : 10
- h, holdTime : 10
- d, decayTime : 300
- s, sustainLevel : 0.5
- f, fadeTime : 5000
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("ahdsfr", {a:100, h:50, s:0.8, f:5000, r:500}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-ahdsfr");
env.plot({target:canvas, width:240, height:80});

var t = T("timeout", {timeout:1500}, function() {
    env.release();
    t.stop();
}).start();
```

### T("linen") ###
(canvas env-linen w:240 h:80) 

`T("linen")` は台形エンベロープを作ります。

- a, attackTime : 10
- s, sustainTime : 1000
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("linen", {a:200, lv:0.8}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-linen");
env.plot({target:canvas, width:240, height:80});
```

### T("env.tri") ###
(canvas env-tri w:240 h:80) 

`T("env.tri")` は三角エンベロープを作ります。

- dur, duration : 1000
- lv, totalLevel : 1

```timbre
var env = T("env.tri", {dur:1500}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-tri");
env.plot({target:canvas, width:240, height:80});
```

### T("env.cutoff") ###
(canvas env-cutoff w:240 h:80) 

`T("env.cutoff")` はカットオフエンベロープを作ります。

- r, releaseTime : 100
- lv, totalLevel : 1

```timbre
var env = T("env.cutoff", {r:"BPM120 4.0.0"}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();

var canvas = window.getCanvasById("env-cutoff");
env.plot({target:canvas, width:240, height:80});
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/env.js
