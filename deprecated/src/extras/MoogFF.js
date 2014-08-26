/**
   "MoogFF" - Moog VCF digital implementation.
   As described in the paper entitled
   "Preserving the Digital Structure of the Moog VCF"
   by Federico Fontana
   appeared in the Proc. ICMC07, Copenhagen, 25-31 August 2007

   Original Java code Copyright F. Fontana - August 2007
   federico.fontana@univr.it

   Ported to C++ for SuperCollider by Dan Stowell - August 2007
   http://www.mcld.co.uk/
   
     This program is free software; you can redistribute it and/or modify
     it under the terms of the GNU General Public License as published by
     the Free Software Foundation; either version 2 of the License, or
     (at your option) any later version.
     
     This program is distributed in the hope that it will be useful,
     but WITHOUT ANY WARRANTY; without even the implied warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     GNU General Public License for more details.
     
     You should have received a copy of the GNU General Public License
     along with this program; if not, write to the Free Software
     Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
   
   
   SuperCollider/server/plugins/FilterUGens.cpp
*/

(function(T) {
    "use strict";

    var fn = T.fn;

    function MoogFFNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        _.freq = T(100);
        _.gain = T(2);

        _.sr = T.samplerate;
        _.t  = 1 / _.sr;
        _.b0 = _.a1 = _.wcD = 0;
        _.s1 = _.s2 = _.s3 = _.s4 = 0;
    }
    fn.extend(MoogFFNode);

    var $ = MoogFFNode.prototype;

    Object.defineProperties($, {
        freq: {
            set: function(value) {
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        gain: {
            set: function(value) {
                this._.gain = T(value);
            },
            get: function() {
                return this._.gain;
            }
        }
    });

    $.bang = function() {
        var _ = this._;
        _.s1 = _.s2 = _.s3 = _.s4 = 0;
        _.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var k = _.gain.process(tickID).cells[0][0]; // gain;
            k = (k > 4) ? 4 : (k < 0) ? 0 : k;

            var s1 = _.s1, s2 = _.s2, s3 = _.s3, s4 = _.s4;
            var freq = _.freq.process(tickID).cells[0][0];
            var t = _.t, wcD = _.wcD, a1 = _.a1, b0 = _.b0;
            var TwcD, o, u, past, future, ins, outs;
            var i, imax = cell.length;

            // Update filter coefficients,
            // but only if freq changes since it involves some expensive operations
            if (_.prevFreq !== freq) {
                _.prevFreq = freq;
                // calc
                wcD = 2 * Math.tan(t * Math.PI * freq) * _.sr;
                if (wcD < 0) {
                    wcD = 0; // Protect against negative cutoff freq
                }
                TwcD = t * wcD;
                b0 = TwcD / (TwcD + 2);
                a1 = (TwcD - 2) / (TwcD + 2);
                _.b0 = b0; _.a1 = a1; _.wcD = wcD;
            }

            for (i = 0; i < imax; ++i) {
                // compute loop values
                o = s4 + b0*(s3 + b0*(s2 + b0*s1));
                ins = cell[i];
                outs = (b0*b0*b0*b0*ins + o)/(1 + b0*b0*b0*b0*k);
                cell[i] = outs * 100;
                u = ins - k * outs;

                // update 1st order filter states
                past = u;
                future = b0*past + s1;
                s1 = b0*past - a1*future;

                future = b0*past + s2;
                s2 = b0*past - a1*future;

                past = future;
                future = b0*past + s3;
                s3 = b0*past - a1*future;

                s4 = b0*future - a1*outs;
            }
            _.s1 = s1; _.s2 = s2; _.s3 = s3; _.s4 = s4;

            for (i = 0; i < imax; ++i) {
                o = cell[i];
                cell[i] = (o < -1) ? -1 : (1 < o) ? 1 : o;
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("MoogFF", MoogFFNode);

})(timbre);
