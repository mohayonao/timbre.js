(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function PicoBinder(_args) {
        T.Object.call(this, 2, _args);
        fn.stereo(this);
    }
    fn.extend(PicoBinder, T.Object);
    
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
                for (var i = 0, imax = cell.length; i < imax; ++i) {
                    cellL[i] = cellL[i] * mul + add;
                    cellR[i] = cellR[i] * mul + add;
                    cell[i]  = (cellL[i] + cellR[i]) * 0.5;
                }
            }
        }
        return this;
    };
    
    var pico;
    if (T.envtype === "browser") {
        if (!window.pico) {
            window.pico = {};
        }
        pico = window.pico;
    } else if(T.envtype === "node") {
        if (!global.pico) {
            global.pico = {};
        }
        pico = global.pico;
    }
    
    if (pico) {
        Object.defineProperties(pico, {
            env: {
                get: function() {
                    return T.env;
                }
            },
            samplerate: {
                get: function() {
                    return T.samplerate;
                }
            },
            channels: {
                get: function() {
                    return T.channels;
                }
            },
            cellsize: {
                get: function() {
                    return T.cellsize;
                }
            },
            isPlaying: {
                get: function() {
                    return T.isPlaying;
                }
            },
            DelayNode: {
                value: T.modules.EfxDelay
            }
        });
        
        fn.register("pico.js", PicoBinder);
    }
})(timbre);
