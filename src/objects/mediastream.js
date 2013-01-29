(function(T) {
    "use strict";

    if (T.envtype !== "browser") {
        return;
    }
    
    var fn = T.fn;
    var BUFFER_SIZE = 4096;
    var BUFFER_MASK = BUFFER_SIZE - 1;
    
    function MediaStreamNode(_args) {
        T.Object.call(this, _args);
        fn.fixAR(this);
        fn.stereo(this);
        
        var _ = this._;
        _.src = _.func = null;
        _.bufferL = new Float32Array(BUFFER_SIZE);
        _.bufferR = new Float32Array(BUFFER_SIZE);
        _.readIndex  = 0;
        _.writeIndex = 0;
        _.totalRead  = 0;
        _.totalWrite = 0;
    }
    fn.extend(MediaStreamNode);
    
    var $ = MediaStreamNode.prototype;
    
    Object.defineProperties($, {
        src: {
            set: function(value) {
                var _impl = impl[T.env];
                if (_impl) {
                    _impl.set.call(this, value);
                }
            }
        }
    });
    
    $.listen = function() {
        var _impl = impl[T.env];
        if (_impl) {
            _impl.listen.call(this);
        }
    };
    
    $.unlisten = function() {
        var _impl = impl[T.env];
        if (_impl) {
            _impl.unlisten.call(this);
        }
        var i;
        var cell = this.cell;
        var L = this.cellL, R = this.cellR;
        for (i = cell.length; i--; ) {
            cell[i] = L[i] = R[i] = 0;
        }
        var _ = this._;
        var bufferL = _.bufferL, bufferR = _.bufferR;
        for (i = bufferL.length; i--; ) {
            bufferL[i] = bufferR[i] = 0;
        }
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (_.src === null) {
            return cell;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var bufferL = _.bufferL;
            var bufferR = _.bufferR;
            var i, imax = cell.length;
            
            if (_.totalWrite > _.totalRead + cell.length) {
                var L = this.cellL, R = this.cellR;
                var readIndex = _.readIndex;
                for (i = 0; i < imax; ++i, ++readIndex) {
                    L[i] = bufferL[readIndex];
                    R[i] = bufferR[readIndex];
                    cell[i] = (L[i] + R[i]) * 0.5;
                }
                _.readIndex = readIndex & BUFFER_MASK;
                _.totalRead += cell.length;
            }
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    var impl = {};
    impl.webkit = {
        set: function(src) {
            var _ = this._;
            /*global HTMLMediaElement:true */
            if (src instanceof HTMLMediaElement) {
                var context = fn._audioContext;
                _.src = context.createMediaElementSource(src);
            }
            /*global HTMLMediaElement:false */
        },
        listen: function() {
            var _ = this._;
            var context = fn._audioContext;
            _.gain = context.createGainNode();
            _.gain.gain.value = 0;
            _.node = context.createJavaScriptNode(1024, 2, 1);
            _.node.onaudioprocess = onaudioprocess.bind(this);
            _.src.connect(_.node);
            _.node.connect(_.gain);
            _.gain.connect(context.destination);
        },
        unlisten: function() {
            var _ = this._;
            if (_.src) {
                _.src.disconnect();
            }
            if (_.gain) {
                _.gain.disconnect();
            }
            if (_.node) {
                _.node.disconnect();
            }
        }
    };
    var onaudioprocess = function(e) {
        var _ = this._;
        var i0 = e.inputBuffer.getChannelData(0);
        var i1 = e.inputBuffer.getChannelData(1);
        var o0 = _.bufferL;
        var o1 = _.bufferR;
        var writeIndex = _.writeIndex;
        var i, imax = i0.length;
        for (i = 0; i < imax; ++i, ++writeIndex) {
            o0[writeIndex] = i0[i];
            o1[writeIndex] = i1[i];
        }
        _.writeIndex = writeIndex & BUFFER_MASK;
        _.totalWrite += i0.length;
    };
    
    impl.moz = {
        set: function(src) {
            var _ = this._;
            /*global HTMLAudioElement:true */
            if (src instanceof HTMLAudioElement) {
                _.src = src;
                _.istep = T.samplerate / src.mozSampleRate;
            }
            /*global HTMLAudioElement:false */
        },
        listen: function() {
            var _ = this._;
            var o0 = _.bufferL;
            var o1 = _.bufferR;
            if (_.src.mozChannels === 2) {
                _.x = 0;
                _.func = function(e) {
                    var writeIndex = _.writeIndex;
                    var totalWrite = _.totalWrite;
                    var samples = e.frameBuffer;
                    var x, istep = _.istep;
                    var i, imax = samples.length;
                    x = _.x;
                    for (i = 0; i < imax; i+= 2) {
                        x += istep;
                        while (x > 0) {
                            o0[writeIndex] = samples[i];
                            o1[writeIndex] = samples[i+1];
                            writeIndex = (writeIndex + 1) & BUFFER_MASK;
                            ++totalWrite;
                            x -= 1;
                        }
                    }
                    _.x = x;
                    _.writeIndex = writeIndex;
                    _.totalWrite = totalWrite;
                };
            } else {
                _.x = 0;
                _.func = function(e) {
                    var writeIndex = _.writeIndex;
                    var totalWrite = _.totalWrite;
                    var samples = e.frameBuffer;
                    var x, istep = _.istep;
                    var i, imax = samples.length;
                    x = _.x;
                    for (i = 0; i < imax; ++i) {
                        x += istep;
                        while (x >= 0) {
                            o0[writeIndex] = o1[writeIndex] = samples[i];
                            writeIndex = (writeIndex + 1) & BUFFER_MASK;
                            ++totalWrite;
                            x -= 1;
                        }
                    }
                    _.x = x;
                    _.writeIndex = writeIndex;
                    _.totalWrite = totalWrite;
                };
            }
            _.src.addEventListener("MozAudioAvailable", _.func);
        },
        unlisten: function() {
            var _ = this._;
            if (_.func) {
                _.src.removeEventListener("MozAudioAvailable", _.func);
                _.func = null;
            }
        }
    };
    
    fn.register("mediastream", MediaStreamNode);
    
})(timbre);
