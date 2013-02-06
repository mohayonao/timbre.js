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
        
        T.Object.call(this, _args);
        fn.stereo(this);
        
        this.X = this.L;
        this.Y = this.R;
        
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
        
        var cellL = instance.cellL;
        var cellR = instance.cellR;
        for (var i = 0, imax = cellL.length; i < imax; ++i) {
            cellL[i] = x;
            cellR[i] = y;
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
        T.Object.call(this, _args);
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
                    _.map.map = Curves[value].bind(_);
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
        return this._.map.process(tickID);
    };

    var Curves = {
        lin: function(input) {
            return input * this.delta + this.min;
        },
        exp: function(input) {
            var min = (this.min < 0) ? 1e-6 : this.min;
            return Math.pow(this.max/min, input) * min;
        },
        sqr: function(input) {
            return (input * input) * this.delta + this.min;
        },
        cub: function(input) {
            return (input * input * input) * this.delta + this.min;
        }
    };
    
    fn.register("mouse.x", function(_args) {
        var self = new MouseXY(_args);
        
        var _ = self._;
        _.min   = 0;
        _.max   = 1;
        _.delta = 1;
        _.curveName = "lin";
        
        _.map = T("map", {map:Curves.lin.bind(_)}, instance.X);
        
        self.cell = _.map.cell;
        
        return self;
    });
    fn.register("mouse.y", function(_args) {
        var self = new MouseXY(_args);
        
        var _ = self._;
        _.min   = 0;
        _.max   = 1;
        _.delta = 1;
        _.curveName = "lin";
        
        _.map = T("map", {map:Curves.lin.bind(_)}, instance.Y);
        
        self.cell = _.map.cell;
        return self;
    });
})(timbre);
