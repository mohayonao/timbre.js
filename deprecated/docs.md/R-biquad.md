T("biquad")
=========
{ar}{stereo} Biquad Filter

## Description ##
`T("biquad")` is implements a two-pole, two-zero filter.

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/amen.wav";

T("audio", {loop:true}).load(src, function(res) {
    
  var biquad = T("biquad", {type:"lowpass", freq:800, Q:10}, this).play();
     
});
```

## Properties ##
- `type` _(String)_
  - The filter types are briefly described below.
- `freq`, `cutoff` _(T-Object)_
  - cutoff frequency (default: 350Hz, range 10 .. the Nyquist frequency)
- `res`, `Q`, `band` _(T-Object)_
  - resonance (default: 1, range: 0.0001 .. 1000)
- `gain` _(T-Object)_
  - gain (default: 0db, range -40 .. 40)

## Methods ##
- `plot(opts)`
  - Draw filter characteristics

## Filter Types ##
ja: `type` プロパティで指定できるフィルターの種類です。エイリアスが設定されているので `T("lowpass")` や `T("lpf")` のように直接生成することもできます。

### Low-Pass Filter ###

(canvas lowpass w:240 h:80)

A [lowpass filter](http://en.wikipedia.org/wiki/Low-pass_filter) allows frequencies below the cutoff frequency to pass through and attenuates frequencies above the cutoff.

- `cutoff` _(T-Object)_
  - The cutoff frequency
- `res` _(T-Object)_
  - Controls how peaked the response will be at the cutoff frequency.

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav", function(res) {
  T("lowpass", {cutoff:1200, res:2}, this).plot({target:lowpass, lineWidth:2}).play();
});
```

alias: `lpf`

### High-Pass Filter ###

A [highpass filter](http://en.wikipedia.org/wiki/High-pass_filter) is the opposite of a lowpass filter.

(canvas highpass w:240 h:80)

- `cutoff` _(T-Object)_
  - The cutoff frequency below which the frequencies are attenuated
- `res` _(T-Object)_
  - Controls how peaked the response will be at the cutoff frequency.

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav", function(res) {
  T("highpass", {cutoff:4800, res:2}, this).plot({target:highpass, lineWidth:2}).play();
});
```

alias: `hpf`

### Band-Pass Filter ###

A [bandpass filter](http://en.wikipedia.org/wiki/Band-pass_filter) allows a range of frequencies to pass through and attenuates the frequencies below and above this frequency range.

(canvas bandpass w:240 h:80)

- `freq` _(T-Object)_
  - The center of the frequency band
- `Q` _(T-Object)_
  - Controls the width of the band.
- `gain` _(T-Object)_
  - Not used in this filter type

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav", function(res) {
  T("bandpass", {freq:2400, Q:5}, this).plot({target:bandpass, lineWidth:2}).play();
});
```

alias: `bpf`

### LowShelf Filter ###

The lowshelf filter allows all frequencies through, but adds a boost (or attenuation) to the lower frequencies.

(canvas lowshelf w:240 h:80)

- `freq` _(T-Object)_
  - The upper limit of the frequences where the boost (or attenuation) is applied.
- `gain` _(T-Object)_
  - The boost, in dB, to be applied. If the value is negative, the frequencies are attenuated.

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav", function(res) {
  T("lowshelf", {freq:800, gain:18}, this).plot({target:lowshelf, lineWidth:2}).play();
});
```

### HighShelf Filter ###

The highshelf filter is the opposite of the lowshelf filter and allows all frequencies through, but adds a boost to the higher frequencies.

(canvas highshelf w:240 h:80)

- `freq` _(T-Object)_
  - The lower limit of the frequences where the boost (or attenuation) is applied.
- `gain` _(T-Object)_
  - The boost, in dB, to be applied. If the value is negative, the frequencies are attenuated.

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav", function(res) {
  T("highshelf", {freq:6400, gain:24}, this).plot({target:highshelf, lineWidth:2}).play();
});
```

### Peaking Filter ###

The peaking filter allows all frequencies through, but adds a boost (or attenuation) to a range of frequencies.

(canvas peaking w:240 h:80)

- `freq` _(T-Object)_
  - The center frequency of where the boost is applied.
- `Q` _(T-Object)_
  - Controls the width of the band of frequencies that are boosted. A large value implies a narrow width.
- `gain` _(T-Object)_
  - The boost, in dB, to be applied. If the value is negative, the frequencies are attenuated.

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav", function(res) {
  T("peaking", {freq:1800, Q:2, gain:6}, this).plot({target:peaking, lineWidth:2}).play();
});
```

### Notch Filter ###

The notch filter (also known as a [band-stop or band-rejection filter](http://en.wikipedia.org/wiki/Band-stop_filter)) is the opposite of a bandpass filter.

(canvas notch w:240 h:80)

- `freq` _(T-Object)_
  - The center frequency of where the notch is applied.
- `Q` _(T-Object)_
  - Controls the width of the band of frequencies that are attenuated. A large value implies a narrow width.

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav", function(res) {
  T("notch", {freq:4800, Q:2}, this).plot({target:notch, lineWidth:2}).play();
});
```

alias: `bef`, `brf`

### AllPass Filter ###

An [allpass filter](http://en.wikipedia.org/wiki/All-pass_filter#Digital_Implementation) allows all frequencies through, but changes the phase relationship between the various frequencies.

(canvas allpass w:240 h:80)

- `freq` _(T-Object)_
  - The frequency where the center of the phase transition occurs. 
- `Q` _(T-Object)_
  - Controls how sharp the phase transition is at the center frequency. A larger value implies a sharper transition and a larger group delay.

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/amen.wav", function(res) {
  T("allpass", {freq:2400, Q:6}, this).plot({target:allpass, lineWidth:2}).play();
});
```

alias: `apf`

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/biquad.js
