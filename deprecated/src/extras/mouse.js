(function(T) {
    "use strict";

    if (T.envtype !== "browser") {
        return;
    }

    var fn = T.fn;
    var instance = null;

    function MouseListener(_args) {
        if (instance) {
            return instance;
        }
        instance = this;

        T.Object.call(this, 1, _args);

        this.X = new T.ChannelObject(this);
        this.Y = new T.ChannelObject(this);
        this.cells[3] = this.X.cell;
        this.cells[4] = this.Y.cell;

        fn.fixKR(this);
    }
    fn.extend(MouseListener);

    var mouseX = 0;
    var mouseY = 0;

    var onclick = function(e) {
        instance._.emit("click", e);
    };
    var onmousedown = function(e) {
        instance._.emit("mousedown", e);
    };
    var onmousemove = function(e) {
        var x = (mouseX = (e.clientX / window.innerWidth));
        var y = (mouseY = (e.clientY / window.innerHeight));

        var cellX = instance.cells[3];
        var cellY = instance.cells[4];
        for (var i = 0, imax = cellX.length; i < imax; ++i) {
            cellX[i] = x;
            cellY[i] = y;
        }
    };
    var onmouseup = function(e) {
        instance._.emit("mouseup", e);
    };

    var $ = MouseListener.prototype;

    $.start = function() {
        window.addEventListener("click"    , onclick    , true);
        window.addEventListener("mousedown", onmousedown, true);
        window.addEventListener("mousemove", onmousemove, true);
        window.addEventListener("mouseup"  , onmouseup  , true);
        return this;
    };

    $.stop = function() {
        window.removeEventListener("click"    , onclick    , true);
        window.removeEventListener("mousedown", onmousedown, true);
        window.removeEventListener("mousemove", onmousemove, true);
        window.removeEventListener("mouseup"  , onmouseup  , true);
        return this;
    };

    $.play = $.pause = function() {
        return this;
    };

    fn.register("mouse", MouseListener);


    function MouseXY(_args) {
        T.Object.call(this, 1, _args);
        if (!instance) {
            instance = new MouseListener([]);
        }
        fn.fixKR(this);
    }
    fn.extend(MouseXY);

    Object.defineProperties(MouseXY.prototype, {
        min: {
            set: function(value) {
                var _ = this._;
                _.min = value;
                _.delta = _.max - _.min;
                _.map.bang();
            },
            get: function() {
                return this._.min;
            }
        },
        max: {
            set: function(value) {
                var _ = this._;
                _.max = value;
                _.delta = _.max - _.min;
                _.map.bang();
            },
            get: function() {
                return this._.max;
            }
        },
        curve: {
            set: function(value) {
                var _ = this._;
                if (Curves[value]) {
                    var f = Curves[value];
                    _.map.map = function(x) {
                        return f(_, x);
                    };
                    _.map.bang();
                    _.curveName = value;
                }
            },
            get: function() {
                return this._.curveName;
            }
        }
    });

    MouseXY.prototype.start = function() {
        instance.start();
        return this;
    };
    MouseXY.prototype.stop = function() {
        instance.stop();
        return this;
    };
    MouseXY.prototype.process = function(tickID) {
        this._.map.process(tickID);
        return this;
    };

    var Curves = {
        lin: function(_, input) {
            return input * _.delta + _.min;
        },
        exp: function(_, input) {
            var min = (_.min < 0) ? 1e-6 : _.min;
            return Math.pow(_.max/min, input) * min;
        },
        sqr: function(_, input) {
            return (input * input) * _.delta + _.min;
        },
        cub: function(_, input) {
            return (input * input * input) * _.delta + _.min;
        }
    };

    fn.register("mouse.x", function(_args) {
        var self = new MouseXY(_args);

        var _ = self._;
        _.min   = 0;
        _.max   = 1;
        _.delta = 1;
        _.curveName = "lin";

        var f = Curves.lin;
        _.map = T("map", {map:function(x) {
            return f(_, x);
        }}, instance.X);

        self.cells[0] = _.map.cells[0];

        return self;
    });
    fn.register("mouse.y", function(_args) {
        var self = new MouseXY(_args);

        var _ = self._;
        _.min   = 0;
        _.max   = 1;
        _.delta = 1;
        _.curveName = "lin";

        var f = Curves.lin;
        _.map = T("map", {map:function(x) {
            return f(_, x);
        }}, instance.Y);

        self.cells[0] = _.map.cells[0];

        return self;
    });
})(timbre);
