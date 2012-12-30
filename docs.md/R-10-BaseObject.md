Base Object
===========
The Base Object of Timbre Objects

## Description ##

T-オブジェクトのベースとなるオブジェクト


## Properties ##
- `mul` _(Number)_
  - 出力値を調整します
- `add` _(Number)_
  - 出力値を調整します
- `isAr` _(ReadOnly Boolean)_
  - オーディオレートのとき `true` が返ります
- `isKr` _(ReadOnly Boolean)_
  - コントロールレートのとき `true` が返ります

## Methods ##
- `play()`
  - 再生を開始します
- `pause()`  
  - 再生を停止します
- `append(...)`  
  - 入力オブジェクトを追加します
- `appendTo(target)`
  - targetの入力オブジェクトに自分自身を追加します
- `remove(...)`
  - 入力オブジェクトを削除します
- `removeFrom(target)`
  - targetの入力オブジェクトから自分自身を削除します
- `removeAll()`
  - すべての入力オブジェクトを削除します
- `on(type, listener)`
  - イベントリスナーを登録します
- `once(type, listener)`
  - 一度だけ実行するイベントリスナーを登録します
- `removeListener(type, listener)`
  - イベントリスナーを削除します
- `removeAllListeners(type)`  
  - 指定した type のすべてのイベントリスナーを削除します
- `set(key, value)` / `set(dict)`
  - プロパティをセットします
- `get(key)`
  - プロパティをゲットする
- `bang(args...)`
  - bangします
- `ar()`
  - オーディオレートに切り換えします
- `kr()`
  - コントロールレートに切り換えします
- `plot(opts)`
  - オブジェクトの状態を描画します

## Events ##
- `bang`
  - `bang()` が呼ばれたとき
- `append`
  - 入力オブジェクトが追加されたとき
- `remove`
  - 入力オブジェクトが削除されたとき
- `play`
  - 再生状態になったとき
- `pause`
  - 停止状態になったとき
