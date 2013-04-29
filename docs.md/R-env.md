T("env")
========
{krar} Envelope

## Description ##
ja: エンベロープを定義し、`bang()`を受けて動作します。インプットがない場合はエンベロープ値のみを、インプットがある場合はインプットを加算したものにエンベロープ値を積算して出力します。

```timbre
var table = [0.8, [0, 1500]];
T("env", {table:table}, T("sin")).on("ended", function() {
    this.pause();
}).bang().play();
```

ja: エンベロープの形状は `table` プロパティで指定します。`table` は `初期値` に続いて `[次の値, 時間(ms), カーブの種類]` の子配列を要素に持つ配列です。以下の例では 440Hzから 0.5秒かけて 880Hzに上昇し、0.25秒で 660Hzに遷移するエンベロープをオシレーターの周波数の入力として 3回動作させています。

```timbre
var table = [440, [880, 500], [660, 250]];
var env   = T("env", {table:table}).bang();
var synth = T("saw", {freq:env, mul:0.25});

var interval = T("interval", {interval:1000}, function(count) {
  if (count === 3) {
    interval.stop();
  }
  env.bang();
}).set({buddies:synth}).start();
```

(canvas releaseNode w:240 h:80)

ja: `releaseNode` プロパティを指定すると、 `release()` メソッドをトリガするまで持続するエンベロープを作成できます。以下の例では 3番目の要素をリリースノードとすることで直前の値 0.6 まで遷移した後、持続して `release()` がトリガされてから 1秒かけて 0 に遷移するエンベロープを動作させています。

```timbre
var table = [0, [1, 100], [0.6, 100], [0, 1000]];
var synth = T("saw", {mul:0.25});
var env   = T("env", {table:table, releaseNode:3}, synth).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:releaseNode});

var timeout = T("timeout", {timeout:2000}, function() {
  env.release();
  timeout.stop();
}).start();
```

(canvas loopNode w:240 h:80)

ja: `loopNode` プロパティを指定すると、エンベロープの末尾まで到達した後、リリースノード以降を繰り返すエンベロープを作成できます。以下の例では 1番目の要素をループノードとすることで周期的に変化するエンベロープを作成して、オシレーターの周波数の入力とすることでビブラートを行っています。`releaseNode` と合わせて使用した場合、ループノードとリリースノードの間でループします。

```timbre
var table = [440, [460, 50], [430, 150]];
var env   = T("env", {table:table, loopNode:1}).bang();
var synth = T("tri", {freq:env, mul:0.25});

env.plot({target:loopNode});

var timeout = T("timeout", {timeout:2000}, function() {
  timeout.stop();
}).set({buddies:synth}).start();
```

## Properties ##
- `table` _(Array)_
- `curve` _(String "lin" or "exp")_
- `releaseNode` _(Number)_
- `loopNode` _(Number)_

## Methods ##
- `bang()`
ja:  - エンベロープを起動します
- `release()`
ja:  - リリースフェーズに移行します

## Events ##
- `sustained`
ja:  - エンベロープが持続フェーズに入ったときに発生します
- `released`
ja:  - リリースメソッドが呼ばれたときに発生します
- `ended`
ja:  - エンベロープが終了したときに発生します

## Tips ##

(canvas plot w:240 h:80)

ja:- カーブの種類は `"lin"` か `"exp"` を指定できます。
ja:- `curve` プロパティでデフォルトのカーブの種類を設定できます。
ja:- `plot()` メソッドでエンベロープの形状を描画します。
ja:- 時間は **timevalue形式**の文字列でも指定できます。

```timbre
var table = [0, [0.8, "BPM120 L8"], [0.4, "BPM120 L16"],
                [0.5, 80], [0.4, 80], [0, "BPM120 L4", "lin"]];
var env = T("env", {table:table, loopNode:3, releaseNode:5, curve:"exp"});

env.plot({target:plot});

env.append(T("pulse", {mul:0.25})).on("ended", function() {
    this.pause();
}).bang().play();

var timeout = T("timeout", {timeout:2000}, function() {
  env.release();
  timeout.stop();
}).start();
```

## Constructors ##
ja: `T("env")` クラスには便利なコンストラクタが用意されています。それらを使えば、最小限のパラメータでエンベロープテーブルを作成することができます。

### T("perc") ###
(canvas perc w:240 h:80)

ja: `T("perc")` はパーカッシブなエンベロープを作ります。

- a, attackTime: 10
- r, releaseTime: 300
- lv, level: 0

```timbre
var env = T("perc", {r:500}, T("sin")).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:perc});
```

### T("adsr") ###
(canvas adsr w:240 h:80) 

ja: `T("adsr")` はADSRタイプの持続エンベロープを作ります。

- a, attackTime : 10
- d, decayTime : 300
- s, sustainLevel : 0.5
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("adsr", {a:100,d:250,s:0.6,r:500}, T("sin")).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:adsr});

var timeout = T("timeout", {timeout:1500}, function() {
  env.release();
  timeout.stop();
}).start();
```

### T("adshr") ###
(canvas adshr w:240 h:80) 

ja: `T("adshr")` はADSHRタイプのエンベロープを作ります。

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

env.plot({target:adshr});
```

### T("asr") ###
(canvas asr w:240 h:80) 

ja: `T("asr")` はASRタイプの持続エンベロープを作ります。

- a, attackTime : 10
- s, sustainLevel : 0.5
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("asr", {a:100,s:0.8,r:500}, T("sin")).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:asr});

var timeout = T("timeout", {timeout:1500}, function() {
  env.release();
  timeout.stop();
}).start();
```

### T("dadsr") ###
(canvas dadsr w:240 h:80) 

ja: `T("dadsr")` は DADSRタイプの持続エンベロープを作ります。

- dl, delayTime : 100
- a, attackTime : 10
- s, sustainLevel : 0.5
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("dadsr", {dl:500,r:500}, T("sin")).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:dadsr});

var timeout = T("timeout", {timeout:1500}, function() {
  env.release();
  timeout.stop();
}).start();
```

### T("ahdsfr") ###
(canvas ahdsfr w:240 h:80) 

ja: `T("ahdsfr")` は AHDSFRタイプの持続エンベロープを作ります。

- a, attackTime : 10
- h, holdTime : 10
- d, decayTime : 300
- s, sustainLevel : 0.5
- f, fadeTime : 5000
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("ahdsfr", {a:100, h:150, s:0.8, f:5000, r:500}, T("sin")).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:ahdsfr});

var timeout = T("timeout", {timeout:1500}, function() {
  env.release();
  timeout.stop();
}).start();
```

### T("linen") ###
(canvas linen w:240 h:80) 

ja: `T("linen")` は台形エンベロープを作ります。

- a, attackTime : 10
- s, sustainTime : 1000
- r, releaseTime : 1000
- lv, totalLevel : 1

```timbre
var env = T("linen", {a:200, lv:0.8}, T("sin")).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:linen});
```

### T("env.tri") ###
(canvas env_tri w:240 h:80) 

ja: `T("env.tri")` は三角エンベロープを作ります。

- dur, duration : 1000
- lv, totalLevel : 1

```timbre
var env = T("env.tri", {dur:1500}, T("sin")).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:env_tri});
```

### T("env.cutoff") ###
(canvas env_cutoff w:240 h:80) 

ja: `T("env.cutoff")` はカットオフエンベロープを作ります。

- r, releaseTime : 100
- lv, totalLevel : 1

```timbre
var env = T("env.cutoff", {r:"BPM120 4.0.0"}, T("sin")).on("ended", function() {
  this.pause();
}).bang().play();

env.plot({target:env_cutoff});
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/env.js
