(function(T) {
    "use strict";

    function Chorus(samplerate) {
        this.samplerate = samplerate;

        var bits = Math.round(Math.log(samplerate * 0.1) * Math.LOG2E);
        this.buffersize = 1 << bits;
        this.bufferL = new T.fn.SignalArray(this.buffersize + 1);
        this.bufferR = new T.fn.SignalArray(this.buffersize + 1);

        this.wave       = null;
        this._wave      = null;
        this.writeIndex = this.buffersize >> 1;
        this.readIndex  = 0;
        this.delayTime  = 20;
        this.rate       = 4;
        this.depth      = 20;
        this.feedback   = 0.2;
        this.wet        = 0.5;
        this.phase      = 0;
        this.phaseIncr  = 0;
        this.phaseStep  = 4;

        this.setWaveType("sin");
        this.setDelayTime(this.delayTime);
        this.setRate(this.rate);
    }

    var $ = Chorus.prototype;

    var waves = [];
    waves[0] = (function() {
        var wave = new Float32Array(512);
        for (var i = 0; i < 512; ++i) {
            wave[i] = Math.sin(2 * Math.PI * (i/512));
        }
        return wave;
    })();
    waves[1] = (function() {
        var wave = new Float32Array(512);
        for (var x, i = 0; i < 512; ++i) {
            x = (i / 512) - 0.25;
            wave[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
        }
        return wave;
    })();

    $.setWaveType = function(waveType) {
        if (waveType === "sin") {
            this.wave = waveType;
            this._wave = waves[0];
        } else if (waveType === "tri") {
            this.wave = waveType;
            this._wave = waves[1];
        }
    };

    $.setDelayTime = function(delayTime) {
        this.delayTime = delayTime;
        var readIndex = this.writeIndex - ((delayTime * this.samplerate * 0.001)|0);
        while (readIndex < 0) {
            readIndex += this.buffersize;
        }
        this.readIndex = readIndex;
    };

    $.setRate = function(rate) {
        this.rate      = rate;
        this.phaseIncr = (512 * this.rate / this.samplerate) * this.phaseStep;
    };

    $.process = function(cellL, cellR) {
        var bufferL = this.bufferL;
        var bufferR = this.bufferR;
        var size = this.buffersize;
        var mask = size - 1;
        var wave       = this._wave;
        var phase      = this.phase;
        var phaseIncr  = this.phaseIncr;
        var writeIndex = this.writeIndex;
        var readIndex  = this.readIndex;
        var depth      = this.depth;
        var feedback   = this.feedback;
        var x, index, mod;
        var wet = this.wet, dry = 1 - wet;
        var i, imax = cellL.length;
        var j, jmax = this.phaseStep;

        for (i = 0; i < imax; ) {
            mod = wave[phase|0] * depth;
            phase += phaseIncr;
            while (phase > 512) {
                phase -= 512;
            }
            for (j = 0; j < jmax; ++j, ++i) {
                index = (readIndex + size + mod) & mask;

                x = (bufferL[index] + bufferL[index + 1]) * 0.5;
                bufferL[writeIndex] = cellL[i] - x * feedback;
                cellL[i] = (cellL[i] * dry) + (x * wet);

                x = (bufferR[index] + bufferR[index + 1]) * 0.5;
                bufferR[writeIndex] = cellR[i] - x * feedback;
                cellR[i] = (cellR[i] * dry) + (x * wet);

                writeIndex = (writeIndex + 1) & mask;
                readIndex  = (readIndex  + 1) & mask;
            }
        }

        this.phase = phase;
        this.writeIndex = writeIndex;
        this.readIndex  = readIndex;
    };

    T.modules.Chorus = Chorus;

})(timbre);
