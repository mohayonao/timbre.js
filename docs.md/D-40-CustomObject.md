Custom Object
=============
Customize timbre.js

## Description ##
自作のオブジェクトの作り方について解説します。  
標準の T オブジェクトもすべて同じように書かれているので、詳しくは[ソースコード](https://github.com/mohayonao/timbre.js/blob/master/src/objects/)を参照してください。

以下の例は入力値を 2乗して出力する _(line:16)_ カスタムオブジェクトです。

```timbre
(function() {
  "use strict";
  
  function CustomObject(_args) {
    timbre.Object.call(this, _args);
  }
  timbre.fn.extend(CustomObject);
  
  CustomObject.prototype.process = function(tickID) {
    if (this.tickID !== tickID) {
      this.tickID = tickID;
      
      timbre.fn.inputSignalAR(this);
            
      for (var i = 0; i < this.cell.length; i++) {
        this.cell[i] = this.cell[i] * this.cell[i];
      }
      
      timbre.fn.outputSignalAR(this);
    }
    return this.cell;
  };
  
  timbre.fn.register("custom-object", CustomObject);
})();
 
T("custom-object", 
    T("audio", {load:"/timbre.js/misc/audio/amen.wav", loop:true})
).play();
```

### 必須 ###
- `timbre.Object.call(this, _args);` _(line:5)_
  - インスタンスを T オブジェクト として初期化します
- `timbre.fn.extend(CustomObject);` _(line:7)_
  - T オブジェクトクラス を継承します
- `CustomObject.prototype.process = function(tickID)` _(line:9)_
  - 処理で呼ばれる関数です. 処理を行って `this.cell` を返します
- `timbre.fn.register("custom-object", CustomObject);` _(line:24)_
  - クラスを登録する

### 便利関数 ###
- `timbre.fn.inputSignalAR(this);` _(line:13)_
  - 入力オブジェクトの値を取得します ( `this.cell`を初期化して入力オブジェクトの値を加算します )
- `timbre.fn.outputSignalAR(this);` _(line:19)_
  - 出力値を調整します ( output * mul + add します )
  
### tickID ###
通番をチェックすることで、ひとつのオブジェクトが複数のオブジェクトに入力されているときに起こる 二重処理を防止しています。
  
### プライベート変数 ###
歴史的な理由で `this._` 以下に設置しています。

```js
function CustomObject(_args) {
  timbre.Object.call(this, _args);
  
  this._.private1 =  0;
  this._.private2 = 10;
}
```

### プロパティ ###
`set()`, `get()` で扱えるプロパティを作成するときは `defineProperties` します。
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

###### en ######
### Case of Coffee-Script ###
like this.
###### ja ######
### Coffee-Scriptの場合 ###
同じように書けます。
###### -- ######
```js
class CustomObject extends timbre.Object
  constructor: (_args)->
    @super _args
      
  process: (tickID)->
    @cell
```
