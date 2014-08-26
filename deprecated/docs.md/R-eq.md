T("eq")
=======
{ar}{stereo} Equallizer

(canvas canvas w:240 h:80)

```timbre
T("audio", {loop:true}).load("/timbre.js/misc/audio/drum.wav", function() {
  T("eq", {
    params:{hpf:[50,1],lmf:[828,1.8,18.3],mf:[2400,2.2,-24,5],lpf:[5000,1.1]}
  }, this).plot({target:canvas, lineWidth:2}).play();
});
```

## Properties ##
- `params` _(Set-Only Dictionary)_
  - `hpf`, `lf`, `lmf`, `mf`, `hmf`, `hf`, `lpf`

## Methods ##
- `setParams(index, freq, Q, gain)`
- `getParams(index)`

## Source ##
https://github.com/mohayonao/timbre.js/blob/master/src/objects/eq.js
