(function(T) {
    "use strict";

    if (T.envtype !== "browser") {
        return;
    }

    var fn = T.fn;
    var BUFFER_SIZE = 4096;
    var BUFFER_MASK = BUFFER_SIZE - 1;

    function MediaStreamNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.src = _.func = null;
        _.bufferL = new fn.SignalArray(BUFFER_SIZE);
        _.bufferR = new fn.SignalArray(BUFFER_SIZE);
        _.readIndex  = 0;
        _.writeIndex = 0;
        _.totalRead  = 0;
        _.totalWrite = 0;
    }
    fn.extend(MediaStreamNode);

    var $ = MediaStreamNode.prototype;

    $.listen = function(audio) {
        var _impl = impl[T.env];
        if (_impl) {
            _impl.set.call(this, audio);
            _impl.listen.call(this);
        }
    };

    $.unlisten = function() {
        var _impl = impl[T.env];
        if (_impl) {
            _impl.unlisten.call(this);
        }

        this.cells[0].set(fn.emptycell);
        this.cells[1].set(fn.emptycell);
        this.cells[2].set(fn.emptycell);

        var _ = this._;
        var bufferL = _.bufferL, bufferR = _.bufferR;
        for (var i = 0, imax = bufferL.length; i < imax; ++i) {
            bufferL[i] = bufferR[i] = 0;
        }
    };

    $.process = function(tickID) {
        var _ = this._;

        if (_.src === null) {
            return this;
        }

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellsize = _.cellsize;
            if (_.totalWrite > _.totalRead + cellsize) {
                var begin = _.readIndex;
                var end   = begin + cellsize;
                this.cells[1].set(_.bufferL.subarray(begin, end));
                this.cells[2].set(_.bufferR.subarray(begin, end));
                _.readIndex = end & BUFFER_MASK;
                _.totalRead += cellsize;
            }

            fn.outputSignalAR(this);
        }

        return this;
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
            _.gain = context.createGain();
            _.gain.gain.value = 0;
            _.node = context.createScriptProcessorNode(1024, 2, 2);
            _.node.onaudioprocess = onaudioprocess(this);
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
    var onaudioprocess = function(self) {
        return function(e) {
            var _ = self._;
            var ins = e.inputBuffer;
            var length = ins.length;
            var writeIndex = _.writeIndex;

            _.bufferL.set(ins.getChannelData(0), writeIndex);
            _.bufferR.set(ins.getChannelData(1), writeIndex);
            _.writeIndex = (writeIndex + length) & BUFFER_MASK;
            _.totalWrite += length;
        };
    };

    impl.moz = {
        set: function(src) {
            var _ = this._;
            /*global HTMLAudioElement:true */
            if (src instanceof HTMLAudioElement) {
                _.src = src;
                _.istep = _.samplerate / src.mozSampleRate;
            }
            /*global HTMLAudioElement:false */
        },
        listen: function() {
            var _ = this._;
            var o0 = _.bufferL;
            var o1 = _.bufferR;
            var prev0 = 0, prev1 = 0;
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
                            o0[writeIndex] = (samples[i  ] + prev0) * 0.5;
                            o1[writeIndex] = (samples[i+1] + prev1) * 0.5;
                            writeIndex = (writeIndex + 1) & BUFFER_MASK;
                            ++totalWrite;
                            x -= 1;
                        }
                        prev0 = samples[i  ];
                        prev1 = samples[i+1];
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
                            o0[writeIndex] = o1[writeIndex] = (samples[i] + prev0) * 0.5;
                            writeIndex = (writeIndex + 1) & BUFFER_MASK;
                            ++totalWrite;
                            x -= 1;
                        }
                        prev0 = samples[i];
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
