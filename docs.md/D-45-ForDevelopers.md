For Developers
==============
Your Contribution

お願いします!!

- コード書く
- テストを書く
- ドキュメント (英語のも) を書く
- サンプルコードを書く

```sh
$ git clone git@github.com:mohayonao/timbre.js.git
```

### 開発用サーバー ###
timbre.js のプロジェクトページは GitHub Pages で提供されており、すべて静的ファイルで構成されています。効率よく開発できるようにそれらの静的ファイルの代わりに動的生成する開発用サーバーを使用します。  
開発用サーバーには以下の機能があります

- 動的ビルド
- ドキュメントの動的生成
- テストの実行

```sh
$ PORT=3000 node-dev ./timbre.js/build/dev-server.coffee
```

### ドキュメントの書き方 ###
ドキュメントは `./timbre.js/docs.md/` 以下にあります。 Markdown で書きます。特殊な記法として以下をサポートしています。

- コード埋め込み
  - ``````timbre``` でコードを書くと実行できるコードに変換されます

```timbre
T("sin").play();
```

(canvas id w:120 h:80)    

- キャンバス埋め込み
  - ```(canvas id w:120 h:80)``` は Canvasタグに変換されます
- 言語切り換え
  - h6で言語の切り換えができます

```js
共通する部分

###### en ######

英語のドキュメントを書く

###### ja ######

日本語のドキュメントを書く

###### -- ######

共通する部分
```




### テストの実行 ###
テストは `./timbre.js/test/` 以下にあります。ライブラリとして [mocha](http://visionmedia.github.com/mocha/) と [chai](http://chaijs.com/) を使用しています。

- ブラウザテスト
  - `http://127.0.0.1:3000/test/(テスト名)`
- node.js でのテスト
  - `make test`
