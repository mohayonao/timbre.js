(function(T) {
    "use strict";

    function StereoDelay(samplerate) {
        this.samplerate = samplerate;

        var bits = Math.ceil(Math.log(samplerate * 1.5) * Math.LOG2E);

        this.buffersize = 1 << bits;
        this.buffermask = this.buffersize - 1;
        this.writeBufferL = new T.fn.SignalArray(this.buffersize);
        this.writeBufferR = new T.fn.SignalArray(this.buffersize);
        this.readBufferL = this.writeBufferL;
        this.readBufferR = this.writeBufferR;
        this.delaytime = null;
        this.feedback  = null;
        this.cross = null;
        this.mix   = null;
        this.prevL = 0;
        this.prevR = 0;

        this.readIndex  = 0;
        this.writeIndex = 0;

        this.setParams(125, 0.25, false, 0.45);
    }

    var $ = StereoDelay.prototype;

    $.setParams = function(delaytime, feedback, cross ,mix) {
        if (this.delaytime !== delaytime) {
            this.delaytime = delaytime;
            var offset = (delaytime * 0.001 * this.samplerate)|0;
            if (offset > this.buffermask) {
                offset = this.buffermask;
            }
            this.writeIndex = (this.readIndex + offset) & this.buffermask;
        }
        if (this.feedback !== feedback) {
            this.feedback = feedback;
        }
        if (this.cross !== cross) {
            this.cross = cross;
            if (cross) {
                this.readBufferL = this.writeBufferR;
                this.readBufferR = this.writeBufferL;
            } else {
                this.readBufferL = this.writeBufferL;
                this.readBufferR = this.writeBufferR;
            }
        }
        if (this.mix !== mix) {
            this.mix = mix;
        }
    };

    $.process = function(cellL, cellR) {
        var readBufferL = this.readBufferL;
        var readBufferR = this.readBufferR;
        var writeBufferL = this.writeBufferL;
        var writeBufferR = this.writeBufferR;
        var readIndex  = this.readIndex;
        var writeIndex = this.writeIndex;
        var mask = this.buffermask;
        var fb = this.feedback;
        var wet = this.mix, dry = 1 - wet;
        var prevL = this.prevL;
        var prevR = this.prevR;

        var x;
        var i, imax = cellL.length;

        for (i = 0; i < imax; ++i) {
            x = readBufferL[readIndex];
            writeBufferL[writeIndex] = cellL[i] - x * fb;
            cellL[i] = prevL = ((cellL[i] * dry) + (x * wet) + prevL) * 0.5;

            x = readBufferR[readIndex];
            writeBufferR[writeIndex] = cellR[i] - x * fb;
            cellR[i] = prevR = ((cellR[i] * dry) + (x * wet) + prevR) * 0.5;

            readIndex  += 1;
            writeIndex = (writeIndex + 1) & mask;
        }

        this.readIndex  = readIndex  & this.buffermask;
        this.writeIndex = writeIndex;
        this.prevL = prevL;
        this.prevR = prevR;
    };

    T.modules.StereoDelay = StereoDelay;

})(timbre);
