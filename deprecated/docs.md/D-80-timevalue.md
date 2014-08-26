timevalue
=========
Time Value Syntax

en: Time representation in timbre.js uses a numeric value that indicates the milliseconds basically. `timbre.timevalue()` converts a string to milliseconds, like as [time value syntax of Max/MSP](http://www.cycling74.com/docs/max5/vignettes/core/maxtime_syntax.html).
ja: timbre.js での時間表現は基本的にミリ秒を示す数値を使用しています。`timbre.timevalue()`関数は直感的な[Max/MSPの時間構文](http://www.cycling74.com/docs/max5/vignettes/core/maxtime_syntax.html)のような文字列からミリ秒に変換する機能を提供します。

- **Frequency**
en:  - Frequency can be specified by a single number followed by `hz`, such as _"466.1637hz"_.
ja:  - 数値に続けて `hz` を記述すると周波数を表します。例: _"466.1637hz"_
- **Milliseconds**
en:  - Milliseconds can be specified by a single number followed by `ms`, such as _"250ms"_.
ja:  - 数値に続けて `ms` を記述するとミリ秒を表します。例: _"250ms"_
- **Seconds**
en:  - Seconds can be specified by a single number followed by `sec`, such as _"1.5sec"_.
ja:  - 数値に続けて `sec` を記述すると秒を表します。例: _"1.5sec"_
- **Minutes**
en:  - Seconds can be specified by a single number followed by `min`, such as _"10.5min"_.
ja:  - 数値に続けて `min` を記述すると分を表します。例: _"10.5min"_
- **Hours:minutes:seconds**
en:  - Hours:minutes:seconds are specified with numbers separated by colons, such as _"00:03:25"_, which means zero hours, 3 minutes, and 25 seconds. An optional millisecond value can be added after a period, for example: _"00:03:25.230"_. Hours/minutes/seconds can also specified by a list of three or four numbers followed by `hh:mm:ss`.
ja:  - コロンで区切った数値 (例えば_"00:03:25"_) は 0時間, 3分, 25秒を表します。オプションとしてピリオドに続けてミリ秒を指定できます。例: _"00:03:25.230"_
- **Samples** 
en:  - Samples can be specified by a single number followed by `samples`, such as _"1000samples"_. An optional samplerate value can be added with 'hz' keyword, for example: _"100samples/44100hz"_.
ja:  - 数値に続けて `samples` を記述するとサンプル数を表します。例: _"1000samples"_。オプションとして `hz` キーワードとともにサンプルレートを指定できます。例: _"100samples/44100hz"_
- **Note Length**
en:  - Note length can be specified by a single number followed by preceding `L`, such as _"L4"_, which means quarter note. An optional bpm value can be added with 'BPM' keyword, for example: _"BPM180 L16"_. If the bpm is omitted timevalue() will use the value of the `timbre.bpm`.
ja:  - `L` に続けて数値を記述すると音長を表します。例: _"L4"_。オプションとして `bpm` キーワードとともにテンポを指定できます。テンポを省略した場合は、`timbre.bpm` の値を使います。例:_"BPM180 L16"_
- **Bars.beats.units**
en:  - Bars.beats.units can be separated by periods, such as _"2.3.240"_, which is 2 measures (bars), 3 beats, and 240 ticks. An optional bpm value can be added with 'BPM' keyword, for example: _"bpm60 2.3.240"_. If the bpm is omitted timevalue() will use the value of the `timbre.bpm`.
ja:  - ピリオドで区切った数値 (例えば_"2.3.240"_) は 2小節, 3拍, 240ticks を表わします。オプションとして `bpm` キーワードとともにテンポを指定できます。テンポを省略した場合は、`timbre.bpm` の値を使います。例:_"bpm60 2.3.240"_
- **Ticks**
en:  - Ticks represent 1/480th of a quarter note, such as _"480ticks"_, An optional bpm value can be added with 'BPM' keyword, for example: _"bpm180 240ticks"_. If the bpm is omitted timevalue() will use the value of the _"timbre.bpm"_.
ja:  - 数値に続けて `ticks` を記述すると ticks を表わします。1 tick は 四分音符の 1/480 で、_"480ticks"_ は四分音符を表します。オプションとして `bpm` キーワードとともにテンポを指定できます。テンポを省略した場合は、`timbre.bpm` の値を使います。例:_"bpm180 240ticks"_
  
## Tips ##
en: Some properties, such as the `T("interval").interval`, can be got the time value syntax.
ja: `T("interval")` の `interval` などのプロパティは **timevalue形式** の時間指定が可能です。

###### -- ######

```timbre
timbre.bpm = 180;

var synth = T("OscGen", {wave:"tri", mul:0.2});

T("interval", {interval:"L4", timeout:"5sec"}, function() {
    synth.noteOn(69, 80);
}).on("ended", function() {
    this.stop();
}).set({buddies:synth}).start();
```
