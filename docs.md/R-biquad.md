T("biquad")
=========
{ar} Biquad Filter

## Description ##
フィルター

```timbre
var src = window.getDraggedFile() || "/timbre.js/misc/audio/amen.wav";

var audio = T("audio", {isLooped:true}).load(src, function(res) {
    
    T("biquad", {type:"lowpass", freq:800, Q:10}, this).play();
    
});
```

## Properties ##
- `type` _(String)_
- `freq` _(T object)_
- `Q` _(T object)_
- `gain` _(T object)_

## Methods ##
- `plot(opts)`
  - フィルタ特性を描画します

## Filter Types ##
### Low-Pass Filter ###

(canvas lowpass w:240 h:80)

```timbre
T("biquad", {type:"lowpass", freq:8000}).plot({target:lowpass, lineWidth:2});
```

alias: `LPF`

### High-Pass Filter ###

(canvas highpass w:240 h:80)

```timbre
T("biquad", {type:"highpass", freq:8000}).plot({target:highpass, lineWidth:2});
```

alias: `HPF`

### Band-Pass Filter ###

(canvas bandpass w:240 h:80)

```timbre
T("biquad", {type:"bandpass", freq:8000}).plot({target:bandpass, lineWidth:2});
```

alias: `BPF`

### LowShelf Filter ###

(canvas lowshelf w:240 h:80)

```timbre
T("biquad", {type:"lowshelf", freq:8000, gain:6}).plot({target:lowshelf, lineWidth:2});
```

### HighShelf Filter ###

(canvas highshelf w:240 h:80)

```timbre
T("biquad", {type:"highshelf", freq:8000, gain:6}).plot({target:highshelf, lineWidth:2});
```

### Peaking Filter ###

(canvas peaking w:240 h:80)

```timbre
T("biquad", {type:"peaking", freq:8000, gain:6}).plot({target:peaking, lineWidth:2});
```

### Notch Filter ###

(canvas notch w:240 h:80)

```timbre
T("biquad", {type:"notch", freq:8000}).plot({target:notch, lineWidth:2});
```

alias: `BEF`, `BRF`

### AllPass Filter ###

(canvas allpass w:240 h:80)

```timbre
T("biquad", {type:"allpass", freq:8000, gain:-6}).plot({target:allpass, lineWidth:2});
```

alias: `APF`

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/biquad.js
