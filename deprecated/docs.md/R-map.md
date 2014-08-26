T("map")
=========
{krar} Mapping

## Description ##
ja: 入力値を変換して出力します

```timbre
T("map", {map:Math.sin});
```

## Properties ##
- `input` _(Number)_
ja:  - 入力オブジェクトがない場合には, この値が入力値となる
- `map` _(Function)_
ja:  - マッピング関数
  
## Methods ##
- `bang()`
ja:  - 再計算

## See Also ##
- [`T("zmap")`](./zmap.html)
- [`T("ndict")`](./ndict.html)
- [`T("midicps")`](./midicps.html)
- [`T("midiratio")`](./midiratio.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/map.js
