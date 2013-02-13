T("script")
===========
{ar}{stereo} Script Processor Node

## Description ##
`T("script")` can process audio directly using JavaScript as like as [ScriptProcessorNode](https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#ScriptProcessorNode) of Web Audio API.

```timbre
var osc = T("audio", {load:"/timbre.js/misc/audio/drum.wav", loop:true});

var script = T("script", osc);

var delay = new Float32Array(1024);
var writeIndex = 512;
var readIndex  = 0;

script.onaudioprocess = function(e) {
  var inp = e.inputBuffer.getChannelData(0);
  var out = e.outputBuffer.getChannelData(0);
  for (var i = 0, imax = inp.length; i < imax; ++i) {
    delay[writeIndex] = inp[i] + delay[writeIndex] * 0.75;
    out[i] = (inp[i] - delay[readIndex]) * 0.5;
    writeIndex = (writeIndex + 1) & 1023;
    readIndex  = (readIndex  + 1) & 1023;
  }
};
script.play();
```

## Properties ##
- `numberOfInputs` _(Number)_
  - The number of inputs feeding into the `T("script")`. This value is set by the constructor.
- `numberOfOutputs` _(Number)_
  - The number of outputs coming out of the `T("script")`. This value is set by the constructor.
- `bufferSize` _(Number)_
  - The size of the buffer (in sample-frames) which needs to be processed each time onprocessaudio is called. Legal values are (256, 512, 1024, 2048, 4096, 8192, 16384). This value is set by the constructor.
- `onaudioprocess` _(Function)_
  - An event listener which is called periodically for audio processing. An event of type [AudioProcessingEvent](https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#AudioProcessingEvent) will be passed to the event handler.

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/script.js
