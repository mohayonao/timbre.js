(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    
    function LineNode(_args) {
        timbre.Object.call(this, _args);

        var _ = this._;
        _.value = _.startValue = _.endValue = 0;
        _.duration = 0;
        _.count = 0;
        _.step  = 0;
        _.isEnded = true;
    }
    fn.extend(LineNode);
    
    var $ = LineNode.prototype;
    
    Object.defineProperties($, {
        value: {
            get: function() {
                return this._.value;
            }
        }
    });
    
    $.to = function(startValue, endValue, duration) {
        var _ = this._;
        if (typeof duration === "string") {
            duration = timevalue(duration);
        }
        _.duration = duration;
        var count = (duration * 0.001 * timbre.samplerate)|0;
        if (count < 1) {
            count = 1;
        }
        _.value = startValue;
        _.startValue = startValue;
        _.endValue   = endValue;
        _.count = count;
        _.step  = (endValue - startValue) / count;
        _.isEnded = false;
        return this;
    };

    $.bang = function() {
        var _ = this._;
        var count = (_.duration * 0.001 * timbre.samplerate)|0;
        if (count < 1) {
            count = 1;
        }
        _.value = _.startValue;
        _.count = count;
        _.step  = (_.endValue - _.startValue) / count;
        _.isEnded = false;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;

        if (_.isEnded) {
            return cell;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var value = _.value;
            var step  = _.step;
            var count = _.count;
            var isEnded = false;
            var i, imax = cell.length;
            var mul = _.mul, add = _.add;
            
            if (_.ar) {
                for (i = 0; i < imax; ++i) {
                    cell[i] = value * mul + add;
                    value += step;
                    count -= 1;
                    if (count <= 0) {
                        value = _.endValue;
                        count = Infinity;
                        step  = 0;
                        isEnded = true;
                    }
                }
            } else { // kr
                var x = value * mul + add;
                for (i = 0; i < imax; ++i) {
                    cell[i] = x;
                }
                value += step * imax;
                count -= imax;
                if (count <= 0) {
                    value = _.endValue;
                    count = Infinity;
                    step  = 0;
                    isEnded = true;
                }
            }
            _.value = value;
            _.step  = step;
            _.count = count;
            
            if (isEnded) {
                fn.nextTick(onended.bind(this));
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    var onended = function() {
        fn.onended(this);
    };
    
    fn.register("line", LineNode);
    
})();
