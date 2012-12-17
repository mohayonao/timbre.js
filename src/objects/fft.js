(function(timbre) {
    "use strict";

    function FFTListener(_args) {
        timbre.ListenerObject.call(this, _args);
        
        this._.status  = 0;
        this._.samples = 0;
        this._.samplesIncr = 0;
        this._.writeIndex  = 0;
        
        this._.plotFlush = true;
        this._.plotRange = [0, 0.5];
        this._.plotBarStyle = true;
        
        this.once("init", function() {
            var _ = this._;
            if (!_.fft) {
                this.size = 512;
            }
            if (!_.interval) {
                this.interval = 500;
            }
        });
        
        this.on("ar", function() { this._.ar = true; });
    }
    timbre.fn.extend(FFTListener, timbre.ListenerObject);
    
    var $ = FFTListener.prototype;
    
    Object.defineProperties($, {
        size: {
            set: function(value) {
                var _ = this._;
                if (!_.fft) {
                    if (typeof value === "number") {
                        var n = (value < 256) ? 256 : (value > 2048) ? 2048 : value;
                        _.fft    = new FFT(n);
                        _.buffer = new Float32Array(_.fft.length);
                        if (_.reservedwindow) {
                            _.fft.setWindow(_.reservedwindow);
                            _.reservedwindow = null;
                        }
                        if (_.reservedinterval) {
                            this.interval = _.reservedinterval;
                            _.reservedinterval = null;
                        }
                    }
                }
            },
            get: function() {
                return this._.buffer.length;
            }
        },
        window: {
            set: function(value) {
                if (!this._.fft) {
                    this._.reservedwindow = value;
                } else {
                   this._.fft.setWindow(value);
                }
            },
            get: function() {
                return this._.fft.windowName;
            }
        },
        interval: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number" && value > 0) {
                    if (!_.buffer) {
                        _.reservedinterval = value;
                    } else {
                        _.interval = value;
                        _.samplesIncr = (value * 0.001 * timbre.samplerate);
                        if (_.samplesIncr < _.buffer.length) {
                            _.samplesIncr = _.buffer.length;
                            _.interval = _.samplesIncr * 1000 / timbre.samplerate;
                        }
                    }
                }
            },
            get: function() {
                return this._.interval;
            }
        },
        spectrum: {
            get: function() {
                return this._.fft.spectrum;
            }
        },
        real: {
            get: function() {
                return this._.fft.real;
            }
        },
        imag: {
            get: function() {
                return this._.fft.imag;
            }
        }
    });
    
    $.create = function(n) {
        return new FFT(n);
    };
    
    $.bang = function() {
        this._.samples    = 0;
        this._.writeIndex = 0;
        this.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;

        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            var status  = _.status;
            var samples = _.samples;
            var samplesIncr = _.samplesIncr;
            var writeIndex  = _.writeIndex;
            var buffer = _.buffer;
            var bufferLength = buffer.length;
            var mul = _.mul, add = _.add;
            var emit;
            
            for (j = 0; j < jmax; ++j) {
                if (samples <= 0) {
                    if (status === 0) {
                        status = 1;
                        writeIndex  = 0;
                        samples += samplesIncr;
                    }
                }
                if (status === 1) {
                    buffer[writeIndex++] = cell[j];
                    if (bufferLength <= writeIndex) {
                        _.fft.forward(buffer);
                        emit = _.plotFlush = true;
                        status = 0;
                    }
                }
                cell[j] = cell[j] * mul + add;
                --samples;
            }
            
            _.samples = samples;
            _.status  = status;
            _.writeIndex = writeIndex;
            
            if (emit) {
                this.emit("fft");
            }
        }
        return cell;
    };
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var fft = this._.fft;
            
            var spectrum = fft.spectrum;
            var step     = fft.length >> 6;
            var istep    = 1 / step;
            var data    = new Float32Array(spectrum.length * istep);
            var i, imax = spectrum.length;
            var j, jmax = step;
            
            var v, k = 0;
            for (i = 0; i < imax; i += step) {
                v = 0;
                for (j = 0; j < jmax; ++j) {
                    v += spectrum[i + j];
                }
                data[k++] = v * istep;
            }
            
            this._.plotData  = data;
            this._.plotFlush = null;
        }
        return FFTListener.__super__.plot.call(this, opts);
    };
    
    
    function FFT(n) {
        n = (typeof n === "number") ? n : 512;
        n = 1 << Math.ceil(Math.log(n) * Math.LOG2E);
        
        this.length  = n;
        this.buffer  = new Float32Array(n);
        this.real    = new Float32Array(n);
        this.imag    = new Float32Array(n);
        this._real   = new Float32Array(n);
        this._imag   = new Float32Array(n);
        this.spectrum = new Float32Array(n>>1);
        
        var params = FFTParams.get(n);
        this._bitrev   = params.bitrev;
        this._sintable = params.sintable;
        this._costable = params.costable;
    }
    
    FFT.prototype.setWindow = function(key) {
        if (typeof key === "string") {
            var m = /([A-Za-z]+)(?:\(([01]\.?\d*)\))?/.exec(key);
            if (m !== null) {
                var name = m[1].toLowerCase(), a = m[2] !== undefined ? +m[2] : 0.25;
                var f = WindowFunctions[name];
                if (f) {
                    if (!this._window) {
                        this._window = new Float32Array(this.length);
                    }
                    var w = this._window, n = 0, N = this.length;
                    a = (a < 0) ? 0 : (a > 1) ? 1 : a;
                    for (; n < N; ++n) {
                        w[n] = f(n, N, a);
                    }
                    this.windowName = key;
                }
            }
        }
    };
    
    FFT.prototype.forward = function(_buffer) {
        var buffer = this.buffer;
        var real   = this.real;
        var imag   = this.imag;
        var window = this._window;
        var bitrev = this._bitrev;
        var sintable = this._sintable;
        var costable = this._costable;
        var n = buffer.length;
        var i, j, k, k2, h, d, c, s, ik, dx, dy;

        if (window) {
            for (i = n; i--; ) {
                buffer[i] = _buffer[i] * window[i];
            }
        } else {
            for (i = n; i--; ) {
                buffer[i] = _buffer[i];
            }
        }
        
        for (i = n; i--; ) {
            real[i] = buffer[bitrev[i]];
            imag[i] = 0.0;
        }
        
        for (k = 1; k < n; k = k2) {
            h = 0; k2 = k + k; d = n / k2;
            for (j = 0; j < k; j++) {
                c = costable[h];
                s = sintable[h];
                for (i = j; i < n; i += k2) {
                    ik = i + k;
                    dx = s * imag[ik] + c * real[ik];
                    dy = c * imag[ik] - s * real[ik];
                    real[ik] = real[i] - dx; real[i] += dx;
                    imag[ik] = imag[i] - dy; imag[i] += dy;
                }
                h += d;
            }
        }
        
        if (!this.noSpectrum) {
            var spectrum = this.spectrum;
            var rval, ival, mag;
            var max = 0;
            for (i = n; i--; ) {
                rval = real[i];
                ival = imag[i];
                mag  = n * Math.sqrt(rval * rval + ival * ival);
                spectrum[i] = mag;
                if (max < mag) {
                    max = mag;
                }
            }
            if (max > 0) {
                max = 1 / max;
                for (i = n; i--; ) {
                    spectrum[i] *= max;
                }
            }
        }
        
        return {real:real, imag:imag};
    };
    
    FFT.prototype.inverse = function(_real, _imag) {
        var buffer = this.buffer;
        var real   = this._real;
        var imag   = this._imag;
        var bitrev = this._bitrev;
        var sintable = this._sintable;
        var costable = this._costable;
        var n = buffer.length;
        var i, j, k, k2, h, d, c, s, ik, dx, dy;
        
        for (i = n; i--; ) {
            j = bitrev[i];
            real[i] = +_real[j];
            imag[i] = -_imag[j];
        }
        
        for (k = 1; k < n; k = k2) {
            h = 0; k2 = k + k; d = n / k2;
            for (j = 0; j < k; j++) {
                c = costable[h];
                s = sintable[h];
                for (i = j; i < n; i += k2) {
                    ik = i + k;
                    dx = s * imag[ik] + c * real[ik];
                    dy = c * imag[ik] - s * real[ik];
                    real[ik] = real[i] - dx; real[i] += dx;
                    imag[ik] = imag[i] - dy; imag[i] += dy;
                }
                h += d;
            }
        }
        
        for (i = n; i--; ) {
            buffer[i] = real[i] / n;
        }
        return buffer;
    };
    
    var FFTParams = {
        get: function(n) {
            return FFTParams[n] || (function() {
                var bitrev = (function() {
                    var x, i, j, k, n2;
                    x = new Int16Array(n);
                    n2 = n >> 1;
                    i = j = 0;
                    for (;;) {
                        x[i] = j;
                        if (++i >= n) {
                            break;
                        }
                        k = n2;
                        while (k <= j) {
                            j -= k;
                            k >>= 1;
                        }
                        j += k;
                    }
                    return x;
                }());
                var i, k = Math.floor(Math.log(n) / Math.LN2);
                var sintable = new Float32Array((1<<k)-1);
                var costable = new Float32Array((1<<k)-1);
                var PI2 = Math.PI * 2;
                
                for (i = sintable.length; i--; ) {
                    sintable[i] = Math.sin(PI2 * (i / n));
                    costable[i] = Math.cos(PI2 * (i / n));
                }
                return FFTParams[n] = {
                    bitrev: bitrev, sintable:sintable, costable:costable
                };
            }());
        }
    };
    
    var WindowFunctions = (function() {
        var PI   = Math.PI;
        var PI2  = Math.PI * 2;
        var abs  = Math.abs;
        var pow  = Math.pow;
        var cos  = Math.cos;
        var sin  = Math.sin;
        var sinc = function(x) { return sin(PI*x) / (PI*x); };
        var E    = Math.E;
        
        return {
            rectangular: function() {
                return 1;
            },
            hann: function(n, N) {
                return 0.5 * (1 - cos((PI2*n) / (N-1)));
            },
            hamming: function(n, N) {
                return 0.54 - 0.46 * cos((PI2*n) / (N-1));
            },
            tukery: function(n, N, a) {
                if ( n < (a * (N-1))/2 ) {
                    return 0.5 * ( 1 + cos(PI * (((2*n)/(a*(N-1))) - 1)) );
                } else if ( (N-1)*(1-(a/2)) < n ) {
                    return 0.5 * ( 1 + cos(PI * (((2*n)/(a*(N-1))) - (2/a) + 1)) );
                } else {
                    return 1;
                }
            },
            cosine: function(n, N) {
                return sin((PI*n) / (N-1));
            },
            lanczos: function(n, N) {
                return sinc(((2*n) / (N-1)) - 1);
            },
            triangular: function(n, N) {
                return (2/(N+1)) * (((N+1)/2) - abs(n - ((N-1)/2)));
            },
            bartlett: function(n, N) {
                return (2/(N-1)) * (((N-1)/2) - abs(n - ((N-1)/2)));
            },
            gaussian: function(n, N, a) {
                return pow(E, -0.5 * pow((n - (N-1) / 2) / (a * (N-1) / 2), 2));
            },
            bartlettHann: function(n, N) {
                return 0.62 - 0.48 * abs((n / (N-1)) - 0.5) - 0.38 * cos((PI2*n) / (N-1));
            },
            blackman: function(n, N, a) {
                var a0 = (1 - a) / 2, a1 = 0.5, a2 = a / 2;
                return a0 - a1 * cos((PI2*n) / (N-1)) + a2 * cos((4*PI*n) / (N-1));
            }
        };
    }());
    
    timbre.fn.register("fft", FFTListener);
})(timbre);
