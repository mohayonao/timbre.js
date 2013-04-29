(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var FunctionWrapper = T(function(){}).constructor;

    function TaskNode(_args) {
        T.Object.call(this, 1, _args);
        fn.timer(this);

        var _ = this._;
        this.playbackState = fn.FINISHED_STATE;
        _.task = [];
        _.i     = 0;
        _.j     = 0;
        _.imax  = 0;
        _.jmax  = 0;
        _.wait  = 0;
        _.count = 0;
        _.args  = {};
        _.doNum = 1;
        _.initFunc = fn.nop;
        _.onended = make_onended(this);

        this.on("start", onstart);
    }
    fn.extend(TaskNode);

    var onstart = function() {
        var _ = this._, args;
        this.playbackState = fn.PLAYING_STATE;
        _.task = this.nodes.map(function(x) {
            return x instanceof FunctionWrapper ? x.func : false;
        }).filter(function(x) {
            return !!x;
        });
        _.i = _.j = 0;
        _.imax = _.doNum;
        _.jmax = _.task.length;
        args = _.initFunc();
        if (!fn.isDictionary(args)) {
            args = {param:args};
        }
        _.args = args;
    };

    var make_onended = function(self) {
        return function() {
            self.playbackState = fn.FINISHED_STATE;
            var _ = self._;
            var cell  = self.cells[0];
            var cellL = self.cells[1];
            var cellR = self.cells[2];
            var lastValue = _.args;
            if (typeof lastValue === "number") {
                for (var i = 0, imax = cellL.length; i < imax; ++i) {
                    cell[0] = cellL[i] = cellR[i] = lastValue;
                }
            }
            _.emit("ended", _.args);
        };
    };

    var $ = TaskNode.prototype;

    Object.defineProperties($, {
        "do": {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.doNum = value === Infinity ? Infinity : value|0;
                }
            },
            get: function() {
                return this._.doNum;
            }
        },
        init: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.initFunc = value;
                }
            },
            get: function() {
                return this._.initFunc;
            }
        }
    });

    $.bang = function() {
        var _ = this._;
        _.count  = 0;
        _.emit("bang");
        return this;
    };

    $.wait = function(time) {
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof time === "number" && time > 0) {
            this._.count += (this._.samplerate * time * 0.001)|0;
        }
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;
        var args, func;

        if (this.tickID !== tickID) {
            this.tickID = tickID;
            if (_.i < _.imax) {
                while (_.count <= 0) {
                    if (_.j >= _.jmax) {
                        ++_.i;
                        if (_.i >= _.imax) {
                            fn.nextTick(_.onended);
                            break;
                        }
                        _.j = 0;
                    }
                    func = _.task[_.j++];
                    if (func) {
                        func.call(this, _.i, _.args);
                    }
                }
                _.count -= cell.length;
            }
        }

        return this;
    };

    fn.register("task", TaskNode);

})(timbre);
