T("param")
==========
Parameter

## Description ##
時間変化する値を出力します。


```timbre
var freq  = T("param", {value:440}).lineTo(880, 10000);

T("tri", {freq:freq, mul:0.5}).play();
```

## Methods ##
### setValueAtTime / setAt ##
指定した時間が経過した後に値をセットします。

```timbre
var freq  = T("param", {value:440}).setAt(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();
```

### linearRampToValue / lineTo ###
指定した時間で値が線形に変化します。

```timbre
var freq  = T("param", {value:440}).lineTo(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();
```

### exponentialRampToValue / expTo ###
指定した時間で値が指数的に変化します。

```timbre
var freq  = T("param", {value:440}).expTo(880, "BPM120 L2");

T("tri", {freq:freq, mul:0.5}).play();
```

### cancelScheduledValues / cancel ##
指定した時間より後のイベントを削除します。


## Events ##
- `next`
  - 次のイベントに遷移したときに発生します
- `ended`  
  ` すべてのイベントが終了したときに発生します
