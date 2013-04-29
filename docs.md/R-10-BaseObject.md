TimbreObject
======-=====
The Base Class of Timbre Objects

## Description ##
en: The base class of all timbre objects
ja: T-オブジェクトのベースとなるオブジェクト

## Properties ##
- `mul` _(Number)_
en:  - adjust the output _(lastout\[i\] = out\[i\] * mul + add)_
ja:  - 出力値を調整します。最終出力値は 出力値 * mul + add になります。

- `add` _(Number)_
en:  - adjust the output _(lastout\[i\] = out\[i\] * mul + add)_
ja:  - 出力値を調整します。最終出力値は 出力値 * mul + add になります。

- `buddies` _(list of TimbreObject)_
  - _todo_

- `isAr` _(ReadOnly Boolean)_
en:  - returns `true` if receiver is an **audio rate**
ja:  - **オーディオレート**のとき `true` を返す

- `isKr` _(ReadOnly Boolean)_
en:  - returns `true` if receiver is a **control rate**
ja:  - **コントロールレート**のとき `true` を返す

- `isEnded` _(ReadOnly boolean)_
  - _todo_

## Methods ##
- `play()`
en:  - Start processing
ja:  - 再生を開始します

- `pause()`
en:  - Stop processing
ja:  - 再生を停止します

- `bypass()`
en:  - The signal passes straight through receiver.
ja:  - エフェクト系オブジェクトで入力をそのまま出力します。

- `append(...)`  
en:  - Adds T-Objects to the end of the input array for receiver.
ja:  - 入力オブジェクトを追加します

- `appendTo(target)`
en:  - Adds receiver to the end of the input array for the target.
ja:  - targetの入力オブジェクトに自分自身を追加します

- `remove(...)`
en:  - Removes T-Objects from the input array for receiver.
ja:  - 入力オブジェクトを削除します

- `removeFrom(target)`
en:  - Removes receiver from the input array for target.
ja:  - targetの入力オブジェクトから自分自身を削除します

- `removeAll()`
en:  - Remove all input objects
ja:  - すべての入力オブジェクトを削除します

- `on(type, listener)`
en:  - Adds a listener to the end of the listeners array for the specified event.
ja:  - イベントリスナーを登録します

- `once(type, listener)`
en:  - Adds a one time listener for the event.
ja:  - 一度だけ実行するイベントリスナーを登録します

- `removeListener(type, listener)`
en:  - Remove a listener from the listener array for the specified event.
ja:  - イベントリスナーを削除します

- `removeAllListeners(type)`  
en:  - Removes all listeners, or those of the specified event.
ja:  - 指定した type のすべてのイベントリスナーを削除します

- `set(key, value)` / `set(dict)`
en:  - Set one or more attributes, or execute method with value as the first argument.
ja:  - プロパティをセットします。`key` がメソッド名のとき、`value` を引数にメソッドを呼び出します。

- `get(key)`
en:  - Get the value of an attribute
ja:  - プロパティをゲットする

- `bang(args...)`
en:  - Does something defined each object classes.
ja:  - オブジェクトごとに何らかの動作をします。詳細は各オブジェクトのドキュメントを参照してください。
  
- `ar()`
en:  - Switches **audio rate**.
ja:  - オーディオレートに切り換えします

- `kr()`
en:  - Switches **Control rate**.
ja:  - コントロールレートに切り換えします

- `plot(opts)`
en:  - Plots receiver's status.
ja:  - オブジェクトの状態を描画します

- `postMessage()`
  - _todo_

## Events ##
- `bang`
en:  - This event is emitted any time someone calls `bang()`.
ja:  - `bang()` が呼ばれたとき

- `message`
  - _todo_
