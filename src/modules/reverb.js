/**
 * Port of the Freeverb Schrodoer/Moorer reverb model.
 * https://ccrma.stanford.edu/~jos/pasp/Freeverb.html
*/
(function(T) {
    "use strict";

    var CombParams    = [1116,1188,1277,1356,1422,1491,1557,1617];
    var AllpassParams = [225,556,441,341];

    function Reverb(samplerate, buffersize) {
        this.samplerate = samplerate;

        var i, imax;
        var k = samplerate / 44100;

        imax = CombParams.length * 2;
        this.comb = new Array(imax);
        this.combout = new Array(imax);
        for (i = 0; i < imax; ++i) {
            this.comb[i]    = new CombFilter(CombParams[i % CombParams.length] * k);
            this.combout[i] = new T.fn.SignalArray(buffersize);
        }

        imax = AllpassParams.length * 2;
        this.allpass = new Array(imax);
        for (i = 0; i < imax; ++i) {
            this.allpass[i] = new AllpassFilter(AllpassParams[i % AllpassParams.length] * k);
        }
        this.outputs = [ new T.fn.SignalArray(buffersize),
                         new T.fn.SignalArray(buffersize) ];
        this.damp = 0;
        this.wet  = 0.33;

        this.setRoomSize(0.5);
        this.setDamp(0.5);
    }

    var $ = Reverb.prototype;

    $.setRoomSize = function(roomsize) {
        var comb = this.comb;
        var value = (roomsize * 0.28) + 0.7;
        this.roomsize = roomsize;
        comb[0].feedback = comb[1].feedback = comb[2].feedback = comb[3].feedback = comb[4].feedback = comb[5].feedback = comb[6].feedback = comb[7].feedback = comb[8].feedback = comb[9].feedback = comb[10].feedback = comb[11].feedback = comb[12].feedback = comb[13].feedback = comb[14].feedback = comb[15].feedback = value;
    };
    $.setDamp = function(damp) {
        var comb = this.comb;
        var value = damp * 0.4;
        this.damp = damp;
        comb[0].damp = comb[1].damp = comb[2].damp = comb[3].damp = comb[4].damp = comb[5].damp = comb[6].damp = comb[7].damp = comb[8].damp = comb[9].damp = comb[10].damp = comb[11].damp = comb[12].damp = comb[13].damp = comb[14].damp = comb[15].damp = value;

    };
    $.process = function(cellL, cellR) {
        var comb = this.comb;
        var combout = this.combout;
        var allpass = this.allpass;
        var output0 = this.outputs[0];
        var output1 = this.outputs[1];
        var wet = this.wet, dry = 1 - wet;
        var i, imax = cellL.length;

        comb[0].process(cellL, combout[0]);
        comb[1].process(cellL, combout[1]);
        comb[2].process(cellL, combout[2]);
        comb[3].process(cellL, combout[3]);
        comb[4].process(cellL, combout[4]);
        comb[5].process(cellL, combout[5]);
        comb[6].process(cellL, combout[6]);
        comb[7].process(cellL, combout[7]);

        comb[ 8].process(cellR, combout[ 8]);
        comb[ 9].process(cellR, combout[ 9]);
        comb[10].process(cellR, combout[10]);
        comb[11].process(cellR, combout[11]);
        comb[12].process(cellR, combout[12]);
        comb[13].process(cellR, combout[13]);
        comb[14].process(cellR, combout[14]);
        comb[15].process(cellR, combout[15]);

        for (i = 0; i < imax; ++i) {
            output0[i] = combout[0][i] + combout[1][i] + combout[2][i] + combout[3][i] + combout[4][i] + combout[5][i] + combout[6][i] + combout[7][i];
            output1[i] = combout[8][i] + combout[9][i] + combout[10][i] + combout[11][i] + combout[12][i] + combout[13][i] + combout[14][i] + combout[15][i];
        }
        allpass[0].process(output0, output0);
        allpass[1].process(output0, output0);
        allpass[2].process(output0, output0);
        allpass[3].process(output0, output0);

        allpass[4].process(output1, output1);
        allpass[5].process(output1, output1);
        allpass[6].process(output1, output1);
        allpass[7].process(output1, output1);

        for (i = 0; i < imax; ++i) {
            cellL[i] = output0[i] * wet + cellL[i] * dry;
            cellR[i] = output1[i] * wet + cellR[i] * dry;
        }
    };

    function CombFilter(buffersize) {
        this.buffer = new T.fn.SignalArray(buffersize|0);
        this.buffersize = this.buffer.length;
        this.bufidx = 0;
        this.feedback =  0;
        this.filterstore = 0;
        this.damp = 0;
    }

    CombFilter.prototype.process = function(input, output) {
        var ins, outs;
        var buffer = this.buffer;
        var buffersize = this.buffersize;
        var bufidx = this.bufidx;
        var filterstore = this.filterstore;
        var feedback = this.feedback;
        var damp1 = this.damp, damp2 = 1 - damp1;
        var i, imax = input.length;

        for (i = 0; i < imax; ++i) {
            ins = input[i] * 0.015;
            outs = buffer[bufidx];

            filterstore = (outs * damp2) + (filterstore * damp1);

            buffer[bufidx] = ins + (filterstore * feedback);

            if (++bufidx >= buffersize) {
                bufidx = 0;
            }

            output[i] = outs;
        }

        this.bufidx = bufidx;
        this.filterstore = filterstore;
    };

    function AllpassFilter(buffersize) {
        this.buffer = new T.fn.SignalArray(buffersize|0);
        this.buffersize = this.buffer.length;
        this.bufidx = 0;
    }

    AllpassFilter.prototype.process = function(input, output) {
        var ins, outs, bufout;
        var buffer = this.buffer;
        var buffersize = this.buffersize;
        var bufidx = this.bufidx;
        var i, imax = input.length;

        for (i = 0; i < imax; ++i) {
            ins = input[i];

            bufout = buffer[bufidx];

            outs = -ins + bufout;
            buffer[bufidx] = ins + (bufout * 0.5);

            if (++bufidx >= buffersize) {
                bufidx = 0;
            }

            output[i] = outs;
        }

        this.bufidx = bufidx;
    };

    T.modules.Reverb = Reverb;

})(timbre);
