(function(T) {
    "use strict";

    if (T.env !== "webkit") {
        return;
    }

    var fn = T.fn;
    var context = fn._audioContext;
    var BUFFERSIZE = 1024;

    function WebAudioAPINode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.mode = "";
        _.bufferL = new fn.SignalArray(BUFFERSIZE << 2);
        _.bufferR = new fn.SignalArray(BUFFERSIZE << 2);
        _.buffermask = _.bufferL.length - 1;
        _.node   = null;
        _.script = context.createScriptProcessor(BUFFERSIZE, 2, 2);
        _.writeIndex = 0;
        _.readIndex  = 0;
        _.totalRead  = 0;
        _.totalWrite = 0;
    }
    fn.extend(WebAudioAPINode);

    var $ = WebAudioAPINode.prototype;

    Object.defineProperties($, {
        context: {
            get: function() {
                return context;
            }
        },
        mode: {
            get: function() {
                return this._.mode;
            }
        }
    });

    $.cancel = function() {
        var _ = this._;
        var cell = this.cells[0];
        for (var i = 0, imax = cell.length; i < imax; ++i) {
            cell[i] = 0;
        }
        _.node = null;
    };

    (function() {
        function WebAudioAPIRecvNode(_args) {
            WebAudioAPINode.call(this, _args);

            var _ = this._;
            _.mode = "recv";
            _.script.onaudioprocess = make_recv_process(this);
            _.gain = context.createGain();
            _.gain.gain.value = 0;
            _.script.connect(_.gain);
        }
        fn.extend(WebAudioAPIRecvNode, WebAudioAPINode);

        var make_recv_process = function(self) {
            return function(e) {
                var _ = self._;
                var ins = e.inputBuffer;
                var inputL = ins.getChannelData(0);
                var inputR = ins.getChannelData(1);
                var length = ins.length;
                var writeIndex = _.writeIndex;
                _.bufferL.set(inputL, writeIndex);
                _.bufferR.set(inputR, writeIndex);
                _.writeIndex = (writeIndex + length) & _.buffermask;
                _.totalWrite += length;
            };
        };

        var $ = WebAudioAPIRecvNode.prototype;

        $.cancel = function() {
            WebAudioAPINode.prototype.cancel.call(this);
            this._.gain.disconnect();
            if(this._.node) {
                this._.node.disconnect();
            }
        };

        $.recv = function(node) {
            var _ = this._;
            try {
                _.node = node;
                _.node.connect(_.script);
                _.gain.connect(context.destination);
            } catch(e) {
                _.node = null;
            }
            _.writeIndex = 0;
            _.readIndex  = 0;
            _.totalWrite = 0;
            _.totalRead  = 0;
            return this;
        };

        $.process = function(tickID) {
            var _ = this._;

            if (_.node === null) {
                return this;
            }

            if (this.tickID !== tickID) {
                this.tickID = tickID;

                var cellsize = _.cellsize;
                var bufferL = _.bufferL;
                var bufferR = _.bufferR;

                if (_.totalWrite > _.totalRead + cellsize) {
                    var begin = _.readIndex;
                    var end = begin + cellsize;
                    this.cells[1].set(bufferL.subarray(begin, end));
                    this.cells[2].set(bufferR.subarray(begin, end));
                    _.readIndex = end & _.buffermask;
                    _.totalRead += cellsize;
                }
                fn.outputSignalAR(this);
            }
            return this;
        };

        fn.register("WebAudioAPI:recv", WebAudioAPIRecvNode);
    })();

    (function() {
        function WebAudioAPISendNode(_args) {
            WebAudioAPINode.call(this, _args);
            fn.listener(this);

            var _ = this._;
            _.mode = "send";
            _.script.onaudioprocess = make_send_process(this);
            _.connectIndex = null;
        }
        fn.extend(WebAudioAPISendNode, WebAudioAPINode);

        var make_send_process = function(self) {
            return function(e) {
                var _ = self._;
                var outs = e.outputBuffer;
                var length  = outs.length;

                if (_.totalWrite > _.totalRead + length) {
                    var begin = _.readIndex;
                    var end = begin + length;
                    outs.getChannelData(0).set(_.bufferL.subarray(begin, end));
                    outs.getChannelData(1).set(_.bufferR.subarray(begin, end));
                    _.readIndex = end & _.buffermask;
                    _.totalRead += length;
                }
            };
        };

        var $ = WebAudioAPISendNode.prototype;

        $.cancel = function() {
            WebAudioAPINode.prototype.cancel.call(this);
            var _ = this._;
            if (_.connectIndex !== null) {
                _.script.disconnect(_.connectIndex);
            } else {
                _.script.disconnect();
            }
            this.unlisten();
        };

        $.send = function(node, index) {
            var _ = this._;
            try {
                _.node = node;
                if (typeof index === "number") {
                    _.script.connect(_.node, index);
                    _.connectIndex = index;
                } else {
                    _.script.connect(_.node);
                    _.connectIndex = null;
                }
                this.listen();
            } catch(e) {
                _.node = null;
            }
            _.writeIndex = 0;
            _.readIndex  = 0;
            _.totalWrite = 0;
            _.totalRead  = 0;
            return this;
        };

        $.process = function(tickID) {
            var _ = this._;

            if (_.script === null) {
                return this;
            }

            if (this.tickID !== tickID) {
                this.tickID = tickID;

                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var cellsize = _.cellsize;
                var writeIndex = _.writeIndex;

                fn.inputSignalAR(this);

                _.bufferL.set(cellL, writeIndex);
                _.bufferR.set(cellR, writeIndex);
                _.writeIndex = (writeIndex + cellsize) & _.buffermask;
                _.totalWrite += cellsize;

                fn.outputSignalAR(this);
            }
            return this;
        };

        fn.register("WebAudioAPI:send", WebAudioAPISendNode);
    })();

})(timbre);
