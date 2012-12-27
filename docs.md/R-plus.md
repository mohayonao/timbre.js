T("+")
======
Add signals

## Description ##
それぞれのインプットの信号を加算して出力します。

以下の例では 3つのサイン波を加算して和音を出力しています。

```timbre
T("+", T("sin", {freq:523.35, mul:0.25}),
       T("sin", {freq:659.25, mul:0.25}),
       T("sin", {freq:783.99, mul:0.25})).play();
```

## Note ##

timbre.js のほとんどのオブジェクトは複数の入力を加算してから処理を行ないます。たとえば上記のような和音にフィルターをかけたい場合は以下の二通りの書きかたが出来ます。

```timbre
var chord = T("+", T("saw", {freq:523.35, mul:0.25}),
                   T("saw", {freq:659.25, mul:0.25}),
                   T("saw", {freq:783.99, mul:0.25}));
var cutoff = T("sin", {freq:"250ms", mul:800, add:1600}).kr();

T("LPF", {freq:cutoff}, chord).play();
```

```timbre
var cutoff = T("sin", {freq:"250ms", mul:800, add:1600}).kr();

T("LPF", {freq:cutoff}, 
    T("saw", {freq:523.35, mul:0.25}),
    T("saw", {freq:659.25, mul:0.25}),
    T("saw", {freq:783.99, mul:0.25})
).play();
```


`T("+")` は明示的に加算を示したい場合や加算後に積算など簡単な演算を行い場合に有効です。

```timbre
var chord = T("+", T("saw", {freq:523.35}),
                   T("saw", {freq:659.25}),
                   T("saw", {freq:783.99})).set({mul:0.25});
var cutoff = T("sin", {freq:"250ms", mul:800, add:1600}).kr();

T("LPF", {freq:cutoff}, chord).play();
```

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/plus.js
