For Developers
==============
Your Contribution

ja: お願いします!!

ja: - コード書く
ja: - テストを書く
ja: - ドキュメント (英語のも) を書く
ja: - サンプルコードを書く

```sh
$ git clone git@github.com:mohayonao/timbre.js.git
```

### Dev Server ###
ja: timbre.js のプロジェクトページは GitHub Pages で提供されており、すべて静的ファイルで構成されています。効率よく開発できるようにそれらの静的ファイルの代わりに動的生成する開発用サーバーを使用します。  
ja: 開発用サーバーには以下の機能があります

ja:- 動的ビルド
ja:- ドキュメントの動的生成
ja:- テストの実行

```sh
$ PORT=3000 node-dev ./timbre.js/build/dev-server.coffee
```

### Documents ###
ja: ドキュメントは `./timbre.js/docs.md/` 以下にあります。 Markdown で書きます。特殊な記法として以下をサポートしています。

ja:- コード埋め込み
ja:  - ``````timbre``` でコードを書くと実行できるコードに変換されます

```timbre
T("sin").play();
```

(canvas id w:120 h:80)    

ja:- キャンバス埋め込み
ja:  - ```(canvas id w:120 h:80)``` は Canvasタグに変換されます
ja:- 言語切り換え
ja:  - `en`, `ja` で言語の切り換えができます

```html
共通する部分

 en: 英語のドキュメントを書く
 ja: 日本語のドキュメントを書く

共通する部分
```

### Tests ###
ja: テストは `./timbre.js/test/` 以下にあります。ライブラリとして [mocha](http://visionmedia.github.com/mocha/) と [chai](http://chaijs.com/) を使用しています。

ja:- ブラウザテスト
ja:  - `http://127.0.0.1:3000/test/(テスト名)`
ja:- node.js でのテスト
ja:  - `grunt test`
