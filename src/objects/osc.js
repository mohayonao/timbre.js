(function(timbre) {
    "use strict";
    
    var timevalue = timbre.utils.timevalue;
    
    function Oscillator(_args) {
        timbre.Object.call(this, _args);
        
        this._.phase = 0;
        this._.x     = 0;
        this._.coeff = 1024 / timbre.samplerate;
        
        this.once("init", oninit);
    }
    timbre.fn.extend(Oscillator);
    
    var oninit = function() {
        var _ = this._;
        if (!_.wave) {
            this.wave = "sin";
        }
        if (!_.freq) {
            this.freq = 440;
        }
        this._.plotData = this._.wave;
        this._.plotLineWidth = 2;
        this._.plotCyclic = true;
        this._.plotBefore = plotBefore;
    };
    
    var $ = Oscillator.prototype;
    
    Object.defineProperties($, {
        wave: {
            set: function(value) {
                if (!this._.wave) {
                    this._.wave = new Float32Array(1024);
                }
                var dx, wave = this._.wave;
                var i;
                if (typeof value === "function") {
                    for (i = 0; i < 1024; ++i) {
                        wave[i] = value(i / 1024);
                    }
                } else if (value instanceof Float32Array) {
                    if (value.length === wave.length) {
                        wave.set(value);
                    } else {
                        dx = value.length / 1024;
                        for (i = 0; i < 1024; ++i) {
                            wave[i] = value[(i * dx)|0];
                        }
                    }
                } else if (typeof value === "string") {
                    if ((dx = this.getWavetable(value)) !== undefined) {
                        this._.wave = dx;
                    }
                }
            },
            get: function() {
                return this._.wave;
            }
        },
        freq: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        return;
                    }
                    value = 1000 / value;
                }
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        phase: {
            set: function(value) {
                if (typeof value === "number") {
                    while (value >= 1.0) {
                        value -= 1.0;
                    }
                    while (value <  0.0) {
                        value += 1.0;
                    }
                    this._.phase = value;
                    this._.x = 1024 * this._.phase;
                }
            },
            get: function() {
                return this._.phase;
            }
        }
    });
    
    $.bang = function() {
        this._.x = 1024 * this._.phase;
        this._.emit("bang");
        return this;
    };

    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;

            var inputs  = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp;
            
            if (inputs.length) {
                for (j = jmax; j--; ) {
                    cell[j] = 0;
                }
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
            } else {
                for (j = jmax; j--; ) {
                    cell[j] = 1;
                }
            }
            
            var freq = _.freq.seq(seq_id);
            var wave = _.wave, x   = _.x, coeff = _.coeff;
            var index, delta, x0, x1, xx, dx;
            
            if (_.ar) { // audio-rate
                if (_.freq.isAr) {
                    for (j = 0; j < jmax; ++j) {
                        index = x|0;
                        delta = x - index;
                        x0 = wave[index & 1023];
                        x1 = wave[(index+1) & 1023];
                        cell[j] *= ((1.0 - delta) * x0 + delta * x1);
                        x += freq[j] * coeff;
                    }
                } else { // _.freq.isKr
                    dx = freq[0] * coeff;
                    for (j = 0; j < jmax; ++j) {
                        index = x|0;
                        delta = x - index;
                        x0 = wave[index & 1023];
                        x1 = wave[(index+1) & 1023];
                        cell[j] *= ((1.0 - delta) * x0 + delta * x1);
                        x += dx;
                    }
                }
            } else {    // control-rate
                index = x|0;
                delta = x - index;
                x0 = wave[index & 1023];
                x1 = wave[(index+1) & 1023];
                xx = ((1.0 - delta) * x0 + delta * x1);
                for (j = jmax; j--; ) {
                    cell[j] *= xx;
                }
                x += freq[0] * coeff * jmax;
            }
            while (x > 1024) {
                x -= 1024;
            }
            _.x = x;
            
            for (j = jmax; j--; ) {
                cell[j] = cell[j] * mul + add;
            }
        }
        
        return cell;
    };

    var plotBefore;
    if (timbre.envtype === "browser") {
        plotBefore = function(context, offset_x, offset_y, width, height) {
            var y = (height >> 1) + 0.5;
            context.strokeStyle = "#ccc";
            context.lineWidth   = 1;
            context.beginPath();
            context.moveTo(offset_x, y + offset_y);
            context.lineTo(offset_x + width, y + offset_y);
            context.stroke();
        };
    }
    
    function waveshape(sign, name, shape, width) {
        var wave = Wavetables[name];
        var _wave;
        var i, imax, j, jmax;
        
        if (wave === undefined) {
            return;
        }
        
        if (typeof wave === "function") {
            wave = wave();
        }
        
        switch (shape) {
        case "@1":
            for (i = 512; i < 1024; ++i) {
                wave[i] = 0;
            }
            break;
        case "@2":
            for (i = 512; i < 1024; ++i) {
                wave[i] = Math.abs(wave[i]);
            }
            break;
        case "@3":
            for (i = 256; i <  512; ++i) {
                wave[i] = 0;
            }
            for (i = 512; i <  768; ++i) {
                wave[i] = Math.abs(wave[i]);
            }
            for (i = 768; i < 1024; ++i) {
                wave[i] = 0;
            }
            break;
        case "@4":
            _wave = new Float32Array(1024);
            for (i = 0; i < 512; ++i) {
                _wave[i] = wave[i<<1];
            }
            wave = _wave;
            break;
        case "@5":
            _wave = new Float32Array(1024);
            for (i = 0; i < 512; ++i) {
                _wave[i] = Math.abs(wave[i<<1]);
            }
            wave = _wave;
            break;
        }
        
        // duty-cycle
        if (width !== undefined) {
            width *= 0.01;
            width = (width < 0) ? 0 : (width > 1) ? 1 : width;
            
            _wave = new Float32Array(1024);
            imax = (1024 * width)|0;
            for (i = 0; i < imax; ++i) {
                _wave[i] = wave[(i / imax * 512)|0];
            }
            jmax = (1024 - imax);
            for (j = 0; i < 1024; ++i, ++j) {
                _wave[i] = wave[(j / jmax * 512 + 512)|0];
            }
            wave = _wave;
        }
        
        if (sign === "+") {
            for (i = 1024; i--; ) {
                wave[i] = wave[i] * 0.5 + 0.5;
            }
        } else if (sign === "-") {
            for (i = 1024; i--; ) {
                wave[i] *= -1;
            }
        }
        return wave;
    }
    
    function wavb(src) {
        var wave = new Float32Array(1024);
        var n = src.length >> 1;
        if ([2,4,8,16,32,64,128,256,512,1024].indexOf(n) !== -1) {
            
            for (var i = 0, k = 0; i < n; ++i) {
                var x = parseInt(src.substr(i * 2, 2), 16);
                
                x = (x & 0x80) ? (x-256) / 128.0 : x / 127.0;
                for (var j = 1024 / n; j--; ) {
                    wave[k++] = x;
                }
            }
        }
        return wave;
    }
    
    function wavc(src) {
        var wave = new Float32Array(1024);
            if (src.length === 8) {
            var color = parseInt(src, 16);
            var bar   = new Float32Array(8);
            var i, j;

            bar[0] = 1;
            for (i = 0; i < 7; ++i) {
                bar[i+1] = (color & 0x0f) * 0.0625; // 0.0625 = 1/16
                color >>= 4;
            }
            
            for (i = 0; i < 8; ++i) {
                var x = 0, dx = (i + 1) / 1024;
                for (j = 0; j < 1024; ++j) {
                    wave[j] += Math.sin(2 * Math.PI * x) * bar[i];
                    x += dx;
                }
            }
            
            var maxx = 0, absx;
            for (i = 1024; i--; ) {
                if (maxx < (absx = Math.abs(wave[i]))) {
                    maxx = absx;
                }
            }
            if (maxx > 0) {
                for (i = 1024; i--; ) {
                    wave[i] /= maxx;
                }
            }
        }
        return wave;
    }
    
    Oscillator.getWavetable = $.getWavetable = function(key) {
        var wave = Wavetables[key];
        if (wave !== undefined) {
            if (typeof wave === "function") {
                wave = wave();
            }
            return wave;
        }
        
        var m;
        // wave shaping
        m = /^([\-+]?)(\w+)(?:\((@[0-7])?:?(\d+)?\))?$/.exec(key);
        if (m !== null) {
            var sign = m[1], name = m[2], shape = m[3], width = m[4];
            wave = waveshape(sign, name, shape, width);
            if (wave !== undefined) {
                return Wavetables[key] = wave;
            }
        }
        
        // wave bytes
        m = /^wavb\(((?:[0-9a-fA-F][0-9a-fA-F])+)\)$/.exec(key);
        if (m !== null) {
            return wavb(m[1]);
        }
        
        // wave color
        m = /^wavc\(([0-9a-fA-F]{8})\)$/.exec(key);
        if (m !== null) {
            return wavc(m[1]);
        }
        
        // warn message
    };
    
    Oscillator.setWavetable = $.setWavetable = function(name, value) {
        var dx, wave = new Float32Array(1024);
        var i;
        if (typeof value === "function") {
            for (i = 0; i < 1024; ++i) {
                wave[i] = value(i / 1024);
            }
        } else if (value instanceof Float32Array) {
            if (value.length === wave.length) {
                wave.set(value);
            } else {
                dx = value.length / 1024;
                for (i = 0; i < 1024; ++i) {
                    wave[i] = value[(i * dx)|0];
                }
            }
        }
        Wavetables[name] = wave;
    };
    
    var Wavetables = Oscillator.Wavetables = {
        sin: function() {
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = Math.sin(2 * Math.PI * (i/1024));
            }
            return wave;
        },
        cos: function() {
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = Math.cos(2 * Math.PI * (i/1024));
            }
            return wave;
        },
        pulse: function() {
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = (i < 512) ? +1 : -1;
            }
            return wave;
        },
        tri: function() {
            var wave = new Float32Array(1024);
            for (var x, i = 1024; i--; ) {
                x = (i / 1024) - 0.25;
                wave[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
            }
            return wave;
        },
        saw: function() {
            var wave = new Float32Array(1024);
            for (var x, i = 1024; i--; ) {
                x = (i / 1024);
                wave[i] = +2.0 * (x - Math.round(x));
            }
            return wave;
        },
        fami: function() {
            var d = [ +0.000, +0.125, +0.250, +0.375, +0.500, +0.625, +0.750, +0.875,
                      +0.875, +0.750, +0.625, +0.500, +0.375, +0.250, +0.125, +0.000,
                      -0.125, -0.250, -0.375, -0.500, -0.625, -0.750, -0.875, -1.000,
                      -1.000, -0.875, -0.750, -0.625, -0.500, -0.375, -0.250, -0.125 ];
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = d[(i / 1024 * d.length)|0];
            }
            return wave;
        },
        konami: function() {
            var d = [-0.625, -0.875, -0.125, +0.750, + 0.500, +0.125, +0.500, +0.750,
                     +0.250, -0.125, +0.500, +0.875, + 0.625, +0.000, +0.250, +0.375,
                     -0.125, -0.750, +0.000, +0.625, + 0.125, -0.500, -0.375, -0.125,
                     -0.750, -1.000, -0.625, +0.000, - 0.375, -0.875, -0.625, -0.250 ];
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = d[(i / 1024 * d.length)|0];
            }
            return wave;
        }
    };
    
    timbre.fn.register("osc", Oscillator);
    
    timbre.fn.register("sin", function(_args) {
        return new Oscillator(_args).set("wave", "sin");
    });
    timbre.fn.register("cos", function(_args) {
        return new Oscillator(_args).set("wave", "cos");
    });
    timbre.fn.register("pulse", function(_args) {
        return new Oscillator(_args).set("wave", "pulse");
    });
    timbre.fn.register("tri", function(_args) {
        return new Oscillator(_args).set("wave", "tri");
    });
    timbre.fn.register("saw", function(_args) {
        return new Oscillator(_args).set("wave", "saw");
    });
    timbre.fn.register("fami", function(_args) {
        return new Oscillator(_args).set("wave", "fami");
    });
    timbre.fn.register("konami", function(_args) {
        return new Oscillator(_args).set("wave", "konami");
    });
    timbre.fn.register("+sin", function(_args) {
        return new Oscillator(_args).set("wave", "+sin");
    });
    timbre.fn.register("+pulse", function(_args) {
        return new Oscillator(_args).set("wave", "+pulse");
    });
    timbre.fn.register("+tri", function(_args) {
        return new Oscillator(_args).set("wave", "+tri");
    });
    timbre.fn.register("+saw", function(_args) {
        return new Oscillator(_args).set("wave", "+saw");
    });
    
    timbre.fn.alias("square", "pulse");
})(timbre);
