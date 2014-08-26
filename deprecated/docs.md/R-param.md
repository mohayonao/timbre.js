T("param")
==========
{krar} Parameter

## Description ##
ja: 時間変化する値を出力します。

```timbre
var freq  = T("param", {value:440}).to(880, 10000);

T("tri", {freq:freq, mul:0.5}).play();
```

## Methods ##
### setAt ##

(canvas setAt w:240 h:80)

```timbre
var freq  = T("param", {value:440}).setAt(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();

freq.plot({target:setAt});
```

### linTo ###

(canvas linTo w:240 h:80)

```timbre
var freq  = T("param", {value:440}).linTo(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();

freq.plot({target:linTo});
```

### expTo ###

(canvas expTo w:240 h:80)

```timbre
var freq  = T("param", {value:440}).expTo(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();

freq.plot({target:expTo});
```

### sinTo ###

(canvas sinTo w:240 h:80)

```timbre
var freq  = T("param", {value:440}).sinTo(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();

freq.plot({target:sinTo});
```

### welTo ###

(canvas welTo w:240 h:80)

```timbre
var freq  = T("param", {value:440}).welTo(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();

freq.plot({target:welTo});
```

### sqrTo ###

(canvas sqrTo w:240 h:80)

```timbre
var freq  = T("param", {value:440}).sqrTo(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();

freq.plot({target:sqrTo});
```

### cubTo ###

(canvas cubTo w:240 h:80)

```timbre
var freq  = T("param", {value:440}).cubTo(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();

freq.plot({target:cubTo});
```

### to ###

(canvas to w:240 h:80)

ja: 3番目の引数でカーブを指定できます。

- `lin`, `exp`, `sin`, `wel`, `sqr`, `cub`, `数値`

```timbre
var freq  = T("param", {value:440}).to(880, "BPM120 L2", -4);

T("tri", {freq:freq, mul:0.5}).play();

freq.plot({target:to});
```

### cancel ##

ja: 値の変化を停止します。


## Events ##
- `ended`  
ja:  目標の値に到達したときに発生します
  
## See Also ##
- [`T("env")`](./R-env.html)
  - Envelope

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/param.js
