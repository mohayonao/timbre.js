(function(T) {
    "use strict";

    var fn = T.fn;
    var Oscillator = T.modules.Oscillator;

    function COscNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        _.freq = T(440);
        _.osc1 = new Oscillator(_.samplerate);
        _.osc2 = new Oscillator(_.samplerate);
        _.osc1.step = _.cellsize;
        _.osc2.step = _.cellsize;
        _.tmp = new fn.SignalArray(_.cellsize);
        _.beats = 0.5;

        this.once("init", oninit);
    }
    fn.extend(COscNode);

    var oninit = function() {
        if (!this.wave) {
            this.wave = "sin";
        }
    };

    var $ = COscNode.prototype;

    Object.defineProperties($, {
        wave: {
            set: function(value) {
                this._.osc1.setWave(value);
                this._.osc2.setWave(value);
            },
            get: function() {
                return this._.osc1.wave;
            }
        },
        freq: {
            set: function(value) {
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        beats: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.beats = value;
                }
            },
            get: function() {
                return this._.beats;
            }
        }
    });

    $.bang = function() {
        this._.osc1.reset();
        this._.osc2.reset();
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cells[0];

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var i, imax = cell.length;
            var freq = _.freq.process(tickID).cells[0][0];
            var osc1 = _.osc1, osc2 = _.osc2, tmp = _.tmp;

            osc1.frequency = freq - (_.beats * 0.5);
            osc1.process(tmp);
            for (i = 0; i < imax; ++i) {
                cell[i] = tmp[i] * 0.5;
            }

            osc2.frequency = freq + (_.beats * 0.5);
            osc2.process(tmp);
            for (i = 0; i < imax; ++i) {
                cell[i] += tmp[i] * 0.5;
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("cosc", COscNode);

})(timbre);
