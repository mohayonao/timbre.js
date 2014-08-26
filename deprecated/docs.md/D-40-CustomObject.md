Custom Object
=============
Customize timbre.js

## Description ##
ja: 自作のオブジェクトの作り方について解説します。  
ja: 標準の T オブジェクトもすべて同じように書かれているので、詳しくは[ソースコード](https://github.com/mohayonao/timbre.js/blob/master/src/objects/)を参照してください。

ja: 以下の例は入力値を 2乗して出力する _(line:16)_ カスタムオブジェクトです。

```timbre
// define
(function() {
  "use strict";
  
  function CustomObject(_args) {
    timbre.Object.call(this, 1, _args);
  }
  timbre.fn.extend(CustomObject);
  
  CustomObject.prototype.process = function(tickID) {
    if (this.tickID !== tickID) {
      this.tickID = tickID;
      
      timbre.fn.inputSignalAR(this);
      
      var cell = this.cells[0];
      
      for (var i = 0; i < cell.length; i++) {
        cell[i] = cell[i] * cell[i];
      }
      
      timbre.fn.outputSignalAR(this);
    }
    return this;
  };
  
  timbre.fn.register("custom-object", CustomObject);
})();

// usage
T("custom-object", 
    T("audio", {load:"/timbre.js/misc/audio/amen.wav", loop:true})
).play();
```

### Util functions ###
- `timbre.Object.call(this, channels, _args)` _(line:5)_
ja:  - インスタンスを T オブジェクト として初期化します
- `timbre.fn.extend(CustomObject)` _(line:7)_
ja:  - T オブジェクトクラス を継承します
- `CustomObject.prototype.process = function(tickID)` _(line:9)_
ja:  - 処理で呼ばれる関数です. 処理を行って `this.cell` を返します
- `timbre.fn.register("custom-object", CustomObject)` _(line:26)_
ja:  - クラスを登録する
- `timbre.fn.inputSignalAR(this)` _(line:13)_
ja:  - 入力オブジェクトの値を取得します ( `this.cell`を初期化して入力オブジェクトの値を加算します )
- `timbre.fn.outputSignalAR(this)` _(line:21)_
ja:  - 出力値を調整します ( output * mul + add します )
  
### tickID ###
ja: 通番をチェックすることで、ひとつのオブジェクトが複数のオブジェクトに入力されているときに起こる 二重処理を防止しています。
  
### Private members ###
ja: 歴史的な理由で `this._` 以下に設置しています。

```js
function CustomObject(_args) {
  timbre.Object.call(this, 1, _args);
  
  this._.private1 =  0;
  this._.private2 = 10;
}
```

### StereoObject ###
ja: ステレオ対応のオブジェクトを生成するには、`timbre.Object.call` の 2番目の引数を `2` にします。

```js
function CustomObject(_args) {
  timbre.Object.call(this, 2, _args);
  
  var cellL = this.cells[1]; // left channel
  var cellR = this.cells[2]; // right channel
}
```

### Properties ###
ja: `set()`, `get()` で扱えるプロパティを作成するときは `defineProperties` します。
```js
Object.defineProperties(CustomObject.prototype, {
  property: {
    set: function(value) {
      this._.property = timbre(value);
    },
    get: function() {
      return this._.property;
    }
  }
});

T("custom-object", {property:1});
```

### Case of Coffee-Script ###
```js
class CustomObject extends timbre.Object
  constructor: (_args)->
    @super 1, _args
      
  process: (tickID)->
    @
```
