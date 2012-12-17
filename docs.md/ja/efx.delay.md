T("efx.delay")
==========
** ディレイ **

```timbre
var audio = T("audio", {src:"../../misc/amen.wav",isLooped:true}).load();

T("efx.delay", {time:250,feedback:0.6,wet:0.4}, audio).play();
```
