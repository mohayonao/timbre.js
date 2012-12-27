Root Object
===========
The Root Object of Timbre Objects

ベースオブジェクトのメソッドやプロパティは共通で使用できます。

## Methods ##
### play()  ###
再生を開始します。 `play()` を実行すると、その T オブジェクトがシステムに登録されて関連する他の T オブジェクトの実行を促して動作を開始します。以下の例では `freq` 自体は `play()` されていませんが `synth` に関連付いているため動作します。一方 `volume` は `play()` されておらず関連付いてもいないので動作しません。

```timbre
var freq   = T("param", {value:440}).linTo(880, "1sec");
var volume = T("perc" , {r:"5sec"});
var synth  = T("saw"  , {freq:freq, mul:0.20}).play();

setTimeout(function() {
    synth.pause();
}, 2000);
```

### pause() ###
再生を停止します。

- - -

### append(...) ###
入力オブジェクトを追加します。

ほとんどの T オブジェクトは入力オブジェクトの結果を加算してから自身の処理を行います。`append()`は 処理中に入力オブジェクトを追加するときに使えます。

```timbre
var a = T("sin", {freq:880, mul:0.25});
var b = T("sin", {freq:2}).append(a);

T("+", b).play();
```

主従が逆の `appendTo` もあります。 `a.append(b)` と `b.appendTo(a)` は同じです。

### remove(...) ###
入力オブジェクトを削除します。

主従が逆の `removeFrom` もあります。 `a.remove(b)` と `b.removeFrom(a)` は同じです。

### removeAll() ###
すべての入力オブジェクトを削除します。

*入力オブジェクトは `.inputs` プロパティで参照できる配列です。通常の JavaScript の配列と同じように indexOf したり splice の操作することができます。*

- - -

### on(type, listener) ###
イベントリスナーを登録します。以下の例では減衰エンベロープの `ended` イベントをトリガにして、自分自身の `bang()` を呼んで連続動作しています。

```timbre
T("perc", T("sin")).on("ended", function() {
    this.bang();
}).bang().play();
```

### once(type, listener) ###
一度だけ実行するイベントを登録します。

```timbre
T("perc", T("sin")).once("ended", function() {
    this.bang();
}).bang().play();
```

### removeListener(type, listener) ###
イベントリスナーを削除します。

### removeAllListeners(type) ###
指定した type のイベントリスナーをすべて削除します。

- - -

### set(key, value) / set(dict)###
プロパティをセットします。

例では T 関数でのプロパティのセット、Key-Value形式のセット、辞書形式のセットを行なっています。もちろん通常はこういう書き方はしません。 プロパティは直接アクセスすることも出来ます。パフォーマンスは以下の順番です。

- 直接アクセス > Key-Value形式のセット > 辞書形式のセット

T 関数の二番目の引数はオブジェクト初期化後に辞書形式のセットを呼び出します。

```timbre
var osc = T("osc", {wave:"tri"}).set("freq", 660).set({mul:0.25, phase:0.5});

osc.wave  = "tri";
osc.freq  = 660;
osc.mul   = 0.25;
osc.phase = 0.5;

osc.play();
```

### get(key) ###
プロパティ値をゲットします。

```timbre
var osc = T("osc");

console.log("get() ", osc.get("freq").value);
console.log("getter", osc.freq.value);
```

プロパティは直接アクセスすることが出来るため `get()` を使うことはないと思います。

- - -

### bang() ###
エンベロープなら動作のトリガ、タイマーならリセット、オシレーターなら位相のリセットなどオブジェクトごとに何らかの動作を行ないます。

```timbre
T("perc", T("sin")).bang().play();
```

- - -

### ar() / kr() ###
動作モードを切り換えします。

T オブジェクトは オシレーターなどの信号を扱う **オーディオレート** とエンベロープなどの信号を扱う **コントロールレート** の2つの動作モードがあります。だいたいのオブジェクトはどちらか一方のモードで固定されていますが、切り換え可能な場合 `ar()` と `kr()` で動作モードを変更できます。以下の例では 2つのオシレーターを使っていますが、中ほどのオシレーターは音量コントロールに使うだけで良いのでコントロールレートを使用しています。

```timbre
T("tri", {mul:0.5}, T("tri", {freq:1}).kr() ).play();
```

*デフォルトではオーディオレートは 1サンプル、コントロールレートは 128サンプルごとに処理を行います*

- - -

### plot(opts) ###

(canvas plot w:480 h:80)

オブジェクトの状態を図示します。たとえばオシレーターは自身の波形を、フィルターは自身の特性を描画します。

```timbre
var canvas = window.getCanvasById("plot");

T("cos").plot({
    target: canvas, 
    width : 240
});

T("LPF", {freq:4000}).plot({
    target: canvas, 
    width : 240, x: 240, 
    foreground: "lime", 
    background: "#666",
    lineWidth : 3
});
```

*node.js では plot() は動作しません*


### valueOf() ###
現在の値を返します。



## Properties ##
各 T オブジェクト共通のプロパティです。

### .mul / .add ###
出力値を調整します。各オブジェクトは自身の処理の後、mul値を積算、add値を加算して出力します。以下の例では add値を周波数のオフセット、mul値を深さとして 6Hz の LFO を、別のオシレーターの周波数にしています。

```timbre
var freq = T("sin", {freq:6, mul:20, add:880}).kr();

T("saw", {freq:freq, mul:0.25}).play();
```

### .isAr / .isKr ###
動作モードをチェックします。

### isUndefined ###
未定義オブジェクトかどうかチェックします。

```timbre
var key = ["osc", "HogeKujira"][(Math.random()*2)|0];

alert( key + " is " + (T(key).isUndefined ? "undefined" : "defined") );
```


## Events ##
イベントリスナーに登録できるイベントの種類。

### bang ###
`bang()` が呼ばれたとき

### append ###
入力オブジェクトが追加されたとき

### remove ###
入力オブジェクトが削除されたとき

### play ###
再生状態になったとき

### pause ###
停止状態になったとき

- - -
以下はよくあるタイプのイベントです

### ended ###
`T("env")`, `T("buffer")`などで動作が停止したとき

### looped ###
`T("env")`, `T("buffer")`などでループしたとき

### done ###
Deferredオブジェクトの処理が終了したとき
