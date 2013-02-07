(function() {
    "use strict";
    var swf, PlayerDivID = "TimbreFlashPlayerDiv";
    var isEnabled = getFlashPlayerVersion(0) >= 10;
    
    function TimbreFlashPlayer(sys, opts) {
        var timerId = 0;
        
        if (!document.getElementById(PlayerDivID)) {
            if (!isEnabled) {
                console.warn("TimbreFlashPlayer requires Flash Player 10.");
                return;
            }
            initialize(opts || {});
        }

        this.maxSamplerate     = 44100;
        this.defaultSamplerate = 44100;
        this.env = "flash";
        
        this.play = function() {
            var onaudioprocess;
            var interleaved = new Array(sys.streamsize * sys.channels);
            var written = 0;
            
            onaudioprocess = function() {
                var offset = swf.currentSampleOffset();
                var inL = sys.strmL, inR = sys.strmR;
                var i = interleaved.length, j = inL.length;
                
                if (written > offset + 16384) {
                    return;
                }
                sys.process();
                while (j--) {
                    interleaved[--i] = (inR[j] * 32768)|0;
                    interleaved[--i] = (inL[j] * 32768)|0;
                }
                written += swf.writeAudio(interleaved.join(" "));
            };
            
            swf.setup(sys.channels, sys.samplerate);
            timerId = setInterval(onaudioprocess, 20);
        };
        
        this.pause = function() {
            if (timerId !== 0) {
                swf.cancel();
                clearInterval(timerId);
                timerId = 0;
            }
        };
        
    }
    
    function initialize(opts) {
        var o, p;
        var swfSrc  = opts.src || "TimbreFlashPlayer.swf";
        var swfName = swfSrc + "?" + (+new Date());
        var swfId   = opts.id  || "TimbreFlashPlayer";
        var div = document.createElement("div");
        div.id = PlayerDivID;
        div.style.display = "inline";
        div.width  = 1;
        div.height = 1;
        document.body.appendChild(div);
        
        if (navigator.plugins && navigator.mimeTypes && navigator.mimeTypes.length) {
            // ns
            o = document.createElement("object");
            o.id = swfId;
            o.classid = "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000";
            o.width  = 1;
            o.height = 1;
            o.setAttribute("data", swfName);
            o.setAttribute("type", "application/x-shockwave-flash");
            p = document.createElement("param");
            p.setAttribute("name", "allowScriptAccess");
            p.setAttribute("value", "always");
            o.appendChild(p);
            div.appendChild(o);
        } else {
            // ie
            o = '<object id="' + swfId + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="1" height="1">';
            o += '<param name="movie" value="' + swfName + '" />';
            o += '<param name="bgcolor" value="#FFFFFF" />';
            o += '<param name="quality" value="high" />';
            o += '<param name="allowScriptAccess" value="always" />';
            o += '</object>';
            div.innerHTML = o;
        }
        swf = document[swfId];
    }
    
    // get Flash player version numbers. argument requires sub numbers.
    function getFlashPlayerVersion(subs) {
        try {
            return (navigator.plugins && navigator.mimeTypes && navigator.mimeTypes.length) ? 
                navigator.plugins["Shockwave Flash"].description.match(/([0-9]+)/)[subs] : 
                (new ActiveXObject("ShockwaveFlash.ShockwaveFlash")).GetVariable("$version").match(/([0-9]+)/)[subs];
        } catch (e) {
            return -1;
        }
    }
    
    Object.defineProperties(TimbreFlashPlayer, {
        isEnabled: {
            get: function() {
                return isEnabled;
            }
        }
    });
    
    if (window.timbre) {
        window.timbre.FlashPlayer = TimbreFlashPlayer;
    } else {
        window.TimbreFlashPlayer  = TimbreFlashPlayer;
    }
})();
