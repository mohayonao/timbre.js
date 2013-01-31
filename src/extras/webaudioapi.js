(function(T) {
    "use strict";
    
    if (T.env !== "webkit") {
        return;
    }
    
    var fn = T.fn;
    var context = fn._audioContext;
    var BUFFERSIZE = 1024;
    
    function WebAudioAPINode(_args) {
        T.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.mode = "";
        _.buffer = new Float32Array(BUFFERSIZE << 2);
        _.node   = null;
        _.script = context.createJavaScriptNode(BUFFERSIZE, 1, 1);
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
        var cell = this.cell;
        for (var i = cell.length; i--; ) {
            cell[i] = 0;
        }
        _.node = null;
    };
    
    (function() {
        function WebAudioAPIRecvNode(_args) {
            WebAudioAPINode.call(this, _args);
            
            var _ = this._;
            _.mode = "recv";
            _.script.onaudioprocess = recv_process.bind(this);
            _.gain = context.createGainNode();
            _.gain.gain.value = 0;
            _.script.connect(_.gain);
        }
        fn.extend(WebAudioAPIRecvNode, WebAudioAPINode);
        
        var recv_process = function(e) {
            var _ = this._;
            var input = e.inputBuffer.getChannelData(0);
            var buffer = _.buffer;
            var writeIndex = _.writeIndex;
            var i, imax = input.length;
            
            for (i = 0; i < imax; ++i) {
                buffer[writeIndex++] = input[i];
            }
            _.writeIndex = writeIndex & (buffer.length - 1);
            _.totalWrite += input.length;
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
            var cell = this.cell;
            var _ = this._;
            
            if (_.node === null) {
                return cell;
            }
            
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                
                var buffer = _.buffer;
                var i, imax = cell.length;
                
                if (_.totalWrite > _.totalRead + cell.length) {
                    var readIndex = _.readIndex;
                    for (i = 0; i < imax; ++i) {
                        cell[i] = buffer[readIndex++];
                    }
                    _.readIndex = readIndex & (buffer.length - 1);
                    _.totalRead += cell.length;
                }
                fn.outputSignalAR(this);
            }
            return cell;
        };
        
        fn.register("WebAudioAPI:recv", WebAudioAPIRecvNode);
    })();
    
    (function() {
        function WebAudioAPISendNode(_args) {
            WebAudioAPINode.call(this, _args);
            fn.listener(this);
            
            var _ = this._;
            _.mode = "send";
            _.script.onaudioprocess = send_process.bind(this);
            _.connectIndex = null;
        }
        fn.extend(WebAudioAPISendNode, WebAudioAPINode);
        
        var send_process = function(e) {
            var _ = this._;
            var output = e.outputBuffer.getChannelData(0);
            var buffer = _.buffer;
            var readIndex = _.readIndex;
            var i, imax = output.length;
            
            if (_.totalWrite > _.totalRead + output.length) {
                for (i = 0; i < imax; ++i) {
                    output[i] = buffer[readIndex++];
                }
                _.readIndex = readIndex & (buffer.length - 1);
                _.totalRead += output.length;
            }
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
            var cell = this.cell;
            var _ = this._;
            
            if (_.script === null) {
                return cell;
            }
            
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                
                var buffer = _.buffer;
                var i, imax = cell.length;
                
                var writeIndex = _.writeIndex;
                fn.inputSignalAR(this);
                for (i = 0; i < imax; ++i) {
                    buffer[writeIndex++] = cell[i];
                }
                _.writeIndex = writeIndex & (buffer.length - 1);
                _.totalWrite += cell.length;
                
                fn.outputSignalAR(this);
            }
            return cell;
        };
        
        fn.register("WebAudioAPI:send", WebAudioAPISendNode);
    })();
    
})(timbre);
