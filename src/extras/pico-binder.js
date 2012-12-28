(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function PicoBinder(_args) {
        timbre.Object.call(this, _args);
        fn.stereo(this);
    }
    fn.extend(PicoBinder, timbre.Object);
    
    var $ = PicoBinder.prototype;
    
    Object.defineProperties($, {
        gen: {
            set: function(value) {
                if (typeof value === "object" && value.process) {
                    this._.gen = value;
                }
            },
            get: function() {
                return this._.gen;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            if (_.gen) {
                var cellL = this.cellL;
                var cellR = this.cellR;
                var mul = _.mul, add = _.add;
                this._.gen.process(cellL, cellR);
                for (var i = cell.length; i--; ) {
                    cellL[i] = cellL[i] * mul + add;
                    cellR[i] = cellR[i] * mul + add;
                    cell[i]  = (cellL[i] + cellR[i]) * 0.5;
                }
            }
        }
        return cell;
    };
    
    var pico;
    if (timbre.envtype === "browser") {
        if (!window.pico) {
            window.pico = {};
        }
        pico = window.pico;
    } else if(timbre.envtype === "node") {
        if (!global.pico) {
            global.pico = {};
        }
        pico = global.pico;
    }
    
    if (pico) {
        Object.defineProperties(pico, {
            env: {
                get: function() {
                    return timbre.env;
                }
            },
            samplerate: {
                get: function() {
                    return timbre.samplerate;
                }
            },
            channels: {
                get: function() {
                    return timbre.channels;
                }
            },
            cellsize: {
                get: function() {
                    return timbre.cellsize;
                }
            },
            isPlaying: {
                get: function() {
                    return timbre.isPlaying;
                }
            },
            DelayNode: {
                value: timbre.modules.EfxDelay
            }
        });
        
        fn.register("pico.js", PicoBinder);
    }
})();
