T("MoogFF")
===========
{ar} Moog VCF implementation, designed by Federico Fontana (from SuperCollider)

## Installation

Download an extra object: [MoogFF.js](http://mohayonao.github.com/timbre.js/src/extra/MoogFF.js)

```html
<script src="timbre.js"></script>
<script src="MoogFF.js"></script>
```

## Description ##
A digital implementation of the Moog VCF (filter). _1_ _2_

```timbre
var freqs = [440, 493, 523, 554, 587, 659, 698];
var vco = T("saw", {freq:T("param"), mul:0.8});
var vcf = T("MoogFF", {freq:T("param"), gain:2.1, mul:0.25}, vco).play();

T("interval", {interval:150}, function(count) {
  var f = freqs[(Math.random() * freqs.length)|0] * 0.5;
  vco.freq.linTo(f, "20ms");
  vcf.freq.sinTo(880 * 2, "60ms");
}).start();
```

## Properties ##
- `freq	`
  - the cutoff frequency.
- `gain`
  - the filter resonance gain, between zero and 4.

## Methods ##  
- `reset`
  - reset the state of the digital filters at the beginning of a computational block.

## Note ##
* 1 - The design of this filter is described in the conference paper Fontana, F. (2007) Preserving the Digital Structure of the Moog VCF. In Proc. ICMC07, Copenhagen, 25-31 August 2007.
* 2 - Original Java code created by F. Fontana - August 2007 - federico.fontana@univr.it Ported to C++ for SuperCollider by Dan Stowell

<script src="/timbre.js/src/extras/MoogFF.js"></script>
