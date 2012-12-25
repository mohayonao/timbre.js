Getting Started
===============

## What is this? ##
timbre.js は lisp のような簡潔な記述をアイデアの出発点として [jQuery](http://jquery.com/) や [node.js](http://nodejs.org/) などの先進的なインターフェイスを参考に開発された [SuperCollider](http://supercollider.sourceforge.net/) のようにガリガリ書ける [Max/MSP](http://cycling74.com/) のようなオブジェクト指向サウンドプログラミング用の JavaScript ライブラリです。このプロジェクトは GitHub でホストされています。

## Supports ##
timbre.js は Chrome, Safari, Firefox, node.js, オプションとして Opera をサポートします。

開発は主に Mac版Chrome で行っています。バグや仕様上の不備を発見した場合 [twitter](http://twitter.com/mohayonao/) または [GitHub Issues](https://github.com/mohayonao/timbre.js/issues) で報告していただけると非常に助かります。

## Installation ##
ミニファイされた [timbre.js](/timbre.js/timbre.js) と開発用の [timbre.dev.js](/timbre.dev.js) があります。

```html
<script src="./timbre.js"></script>
```

多くのJavaScriptライブラリと同じようにたったこれだけで、 timbre.js を利用する準備が整います。timbre.js はグローバル変数 `timbre` と省略形の `T` を使用します。下のコードをクリックしてみてください。"nop" 以外が表示されるのなら使用中のブラウザで timbre.js の実行が可能です。

*このドキュメントでは `CLICK TO PLAY` の表示のあるコードはクリックすることで実行できます。*

```timbre
alert(timbre.env);
```

- - -

## Hello, sinetone!! ##
timbre.js のオブジェクトは **T 関数** で生成されます。最初の引数としてオブジェクトの種類を文字列で指定します。
まずは簡単な使い方としてサイン波を出力してみましょう。下記のプログラムコードをクリックすると音が鳴ります。再びクリックすると音が止まります。音量に注意して実行してみてください。

```timbre
T("sin").play();
```

二番目の引数にはプロパティを指定することができます。以下の例ではサイン波を出力するオシレーターのプロパティを 880(Hz) に設定して再生しています。

```timbre
T("sin", {freq:880}).play();
```

三番目以降には入力オブジェクトを記述します。
以下の例では減衰エンベロープにサイン波のオシレーターをインプットして起動/再生、エンベロープが終了したときに再生を停止しています。この例のように Tオブジェクトのだいたいの関数は自分自身を返すのでメソッドチェインを使ったり、そのまま別の Tオブジェクトの入力にすることができます。

```timbre
T("perc", {r:500}, T("sin", {freq:880})).on("ended", function() {
    this.pause();
}).bang().play();
```

こういう感じで timbre.js では様々な種類の Tオブジェクトを提供しており、それらを組み合せたり自分で作ったりしてサウンドプログラミングを行ないます。
