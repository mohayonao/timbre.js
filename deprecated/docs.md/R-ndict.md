T("ndict")
==========
{krar} 

## Description ##
ja: 数値を別の数値に変換します。

```timbre
var dict = {0:440, 1:880, 2:1760, 3:660};
dict = T("ndict", {dict:dict});

T("tri", {freq:dict, mul:0.25}).play();

T("interval", {interval:500}, function(count) {
  dict.index = count % 4;
}).start();
```

## Properties ##
- `dict` _(Object of Function)_
ja:  - 変換用辞書。関数を指定した場合は 0 から 127 の計算結果で埋める。
- `defaultValue` _(Number)_
ja:  - 辞書に値がない場合は、この値が出力値となる。
- `index` _(Number)_
ja:  - 入力オブジェクトがない場合は、この値が入力値となる。

## Methods ##
- `at(index)`
ja:  - index の値を取得する
- `clear()`
ja:  - 変換用辞書をクリアする

## See Also ##
- [`T("map")`](./map.html)
- [`T("zmap")`](./zmap.html)

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/ndict.js
