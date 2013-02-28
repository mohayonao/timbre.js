timevalue
=========
Time Value Syntax

###### en ######
Time representation in timbre.js uses a numeric value that indicates the milliseconds basically. `timbre.timevalue()` converts a string to milliseconds, like as [time value syntax of Max/MSP](http://www.cycling74.com/docs/max5/vignettes/core/maxtime_syntax.html).

- **Frequency**
  - Frequency can be specified by a single number followed by `hz`, such as **466.1637hz**.
- **Milliseconds**
  - Milliseconds can be specified by a single number followed by `ms`, such as **250ms**.
- **Seconds**
  - Seconds can be specified by a single number followed by `sec`, such as **1.5sec**.
- **Minutes**
  - Seconds can be specified by a single number followed by `min`, such as **10.5min**.
- **Hours:minutes:seconds**
  - Hours:minutes:seconds are specified with numbers separated by colons, such as **00:03:25**, which means zero hours, 3 minutes, and 25 seconds. An optional millisecond value can be added after a period, for example: **00:03:25.230**. Hours/minutes/seconds can also specified by a list of three or four numbers followed by `hh:mm:ss`.
- **Samples** 
  - Samples can be specified by a single number followed by `samples`, such as **1000samples**. An optional samplerate value can be added with 'hz' keyword, for example: **100samples/44100hz**.
- **Note Length**
  - Note length can be specified by a single number followed by preceding `L`, such as **L4**, which means quarter note. An optional bpm value can be added with 'BPM' keyword, for example: **BPM180 L16**. If the bpm is omitted timevalue() will use the value of the **timbre.bpm**.
- **Bars.beats.units**
  - Bars.beats.units can be separated by periods, such as **2.3.240**, which is 2 measures (bars), 3 beats, and 240 ticks. An optional bpm value can be added with 'BPM' keyword, for example: **bpm60 2.3.240**. If the bpm is omitted timevalue() will use the value of the **timbre.bpm**.
- **Ticks**
  - Ticks represent 1/480th of a quarter note, such as **480ticks**, An optional bpm value can be added with 'BPM' keyword, for example: **bpm180 240ticks**. If the bpm is omitted timevalue() will use the value of the **timbre.bpm**.
  
## Tips ##
Some properties, such as the `T("interval").interval`, can be got the time value syntax.

###### ja ######
timbre.js での時間表現は基本的にミリ秒を示す数値を使用しています。`timbre.timevalue()`関数は直感的な[Max/MSPの時間構文](http://www.cycling74.com/docs/max5/vignettes/core/maxtime_syntax.html)のような文字列からミリ秒に変換する機能を提供します。

- **周波数**
  - 数値に続けて `hz` を記述すると周波数を表します。例: **466.1637hz**
- **ミリ秒**
  - 数値に続けて `ms` を記述するとミリ秒を表します。例: **250ms**
- **秒**
  - 数値に続けて `sec` を記述すると秒を表します。例: **1.5sec**
- **分**
  - 数値に続けて `min` を記述すると分を表します。例: **10.5min**
- **時:分:秒**
  - コロンで区切った数値 (例えば**00:03:25**) は 0時間, 3分, 25秒を表します。オプションとしてピリオドに続けてミリ秒を指定できます。例: **00:03:25.230**
- **サンプル** 
  - 数値に続けて `samples` を記述するとサンプル数を表します。例: **1000samples**。オプションとして `hz` キーワードとともにサンプルレートを指定できます。例: **100samples/44100hz**
- **音長**
  - `L` に続けて数値を記述すると音長を表します。例: **L4**。オプションとして `bpm` キーワードとともにテンポを指定できます。テンポを省略した場合は、`timbre.bpm` の値を使います。例:**BPM180 L16**
- **Bars.beats.units**
  - ピリオドで区切った数値 (例えば**2.3.240**) は 2小節, 3拍, 240ticks を表わします。オプションとして `bpm` キーワードとともにテンポを指定できます。テンポを省略した場合は、`timbre.bpm` の値を使います。例:**bpm60 2.3.240**
- **Ticks**
  - 数値に続けて `ticks` を記述すると ticks を表わします。1 tick は 四分音符の 1/480 で、**480ticks** は四分音符を表します。オプションとして `bpm` キーワードとともにテンポを指定できます。テンポを省略した場合は、`timbre.bpm` の値を使います。例:**bpm180 240ticks**

## Tips ##
`T("interval")` の `interval` などのプロパティは **timevalue形式** の時間指定が可能です。

###### -- ######

```timbre
timbre.bpm = 180;

var synth = T("OscGen", {wave:"tri", mul:0.2}).play();

T("interval", {interval:"L4", timeout:"5sec"}, function() {
    synth.noteOn(69, 80);
}).on("ended", function() {
    synth.pause();
    this.stop();
}).start();
```
