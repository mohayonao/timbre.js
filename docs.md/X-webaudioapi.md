T("WebAudioAPI")
================
{ar}{stereo} Web Audio API binder

## Installation

Download an additional script: [webaudioapi.js](http://mohayonao.github.com/timbre.js/src/extra/webaudioapi.js)

```html
<script src="timbre.js"></script>
<script src="webaudioapi.js"></script>
```

## T("WebAudioAPI:recv") ##
ja: Web Audio API からデータを入力します。

### Properties ###
- `context` _(Readonly AudioContext)_
- `mode` _(Readonly string)_

### Methods ###
- `recv (AudioNode)`
ja:  - 引数に指定した `AudioNode` の出力を自身の出力とします。

```timbre
var api = T("WebAudioAPI:recv");
var context = api.context;

var osc = context.createOscillator();
osc.frequency.value = 880;
osc.noteOn(0);

api.recv(osc);

T("+sin", {freq:2}, api).play();
```

## T("WebAudioAPI:send") ##
ja: Web Audio API にデータを出力します。

### Properties ###
- `context` _(Readonly AudioContext)_
- `mode` _(Readonly string)_

### Methods ###
- `send (AudioNode)`
ja:  - 自身への入力を引数に指定した `AudioNode` に出力します。

```timbre
var api = T("WebAudioAPI:send");
var context = api.context;

var noise = T("audio", {load:"/timbre.js/misc/audio/guitar.wav", loop:true});
var synth = T("+", {mul:0.25}, noise).play();

api.append(noise).send(context.destination);

timbre.once("reset", function() {
  api.cancel();
});
```

<script src="/timbre.js/src/extras/webaudioapi.js"></script>

## Examples ##
Web Audio API -> timbre.js -> Web Audio API

```timbre
var api = T("WebAudioAPI:recv");
var context = api.context;

var osc = context.createOscillator();
osc.frequency.value = 880;
osc.noteOn(0);

api.recv(osc);

var synth = T("+sin", {freq:2, mul:0.5}, api);

var send = T("WebAudioAPI:send", synth).send(context.destination);

timbre.once("reset", function() {
  send.cancel();
});
```
