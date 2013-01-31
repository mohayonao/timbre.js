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
        
        imax = CombParams.length;
        this.comb = new Array(imax);
        this.combout = new Array(imax);
        for (i = imax; i--; ) {
            this.comb[i]    = new CombFilter(CombParams[i] * k);
            this.combout[i] = new Float32Array(buffersize);
        }
        
        imax = AllpassParams.length;
        this.allpass = new Array(imax);
        for (i = imax; i--; ) {
            this.allpass[i] = new AllpassFilter(AllpassParams[i] * k);
        }
        this.output = new Float32Array(buffersize);
        
        this.damp = 0;
        this.wet  = 0.33;
        
        this.setRoomSize(0.5);
        this.setDamp(0.5);
    }
    
    var $ = Reverb.prototype;
    
    $.setRoomSize = function(roomsize) {
        var comb = this.comb;
        this.roomsize = roomsize;
        comb[0].feedback = comb[1].feedback = comb[2].feedback = comb[3].feedback = comb[4].feedback = comb[5].feedback = comb[6].feedback = comb[7].feedback = (roomsize * 0.28) + 0.7;
    };
    $.setDamp = function(damp) {
        var comb = this.comb;
        this.damp = damp;
        comb[0].damp = comb[1].damp = comb[2].damp = comb[3].damp = comb[4].damp = comb[5].damp = comb[6].damp = comb[7].damp = damp * 0.4;
    };
    $.process = function(cell) {
        var comb = this.comb;
        var combout = this.combout;
        var allpass = this.allpass;
        var output  = this.output;
        var wet = this.wet, dry = 1 - wet;
        var i, imax = cell.length;
        
        comb[0].process(cell, combout[0]);
        comb[1].process(cell, combout[1]);
        comb[2].process(cell, combout[2]);
        comb[3].process(cell, combout[3]);
        comb[4].process(cell, combout[4]);
        comb[5].process(cell, combout[5]);
        comb[6].process(cell, combout[6]);
        comb[7].process(cell, combout[7]);

        for (i = imax; i--; ) {
            output[i] = combout[0][i] + combout[1][i] + combout[2][i] + combout[3][i] + combout[4][i] + combout[5][i] + combout[6][i] + combout[7][i];
        }
        
        allpass[0].process(output, output);
        allpass[1].process(output, output);
        allpass[2].process(output, output);
        allpass[3].process(output, output);
        
        for (i = imax; i--; ) {
            cell[i] = output[i] * wet + cell[i] * dry;
        }
    };
    
    function CombFilter(buffersize) {
        this.buffer = new Float32Array(buffersize|0);
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
        this.buffer = new Float32Array(buffersize|0);
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
