(function() {
    "use strict";
    
    if (timbre.envtype !== "browser") {
        return;
    }
    
    var fn = timbre.fn;
    var instance = null;
    
    function MouseListener(_args) {
        if (instance) {
            return instance;
        }
        instance = this;
        
        timbre.Object.call(this, _args);
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
        var x = (mouseX = e.pageX / window.innerWidth);
        var y = (mouseY = e.pageY / window.innerHeight);
        
        var cellL = instance.cellL;
        var cellR = instance.cellR;
        for (var i = cellL.length; i--; ) {
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
        timbre.Object.call(this, _args);
        if (!instance) {
            instance = new MouseListener([]);
        }
        fn.fixKR(this);
    }
    fn.extend(MouseXY, timbre.Object);
    
    Object.defineProperties(MouseXY.prototype, {
        min: {
            set: function(value) {
                this._.trans.outMin = value;
            },
            get: function() {
                return this._.trans.outMin;
            }
        },
        max: {
            set: function(value) {
                this._.trans.outMax = value;
            },
            get: function() {
                return this._.trans.outMax;
            }
        },
        warp: {
            set: function(value) {
                this._.trans.warp = value;
            },
            get: function() {
                return this._.trans.warp;
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
        return this._.trans.process(tickID);
    };
    
    fn.register("mouse.x", function(_args) {
        var self = new MouseXY(_args);
        self._.trans = timbre("trans", {inMin:1e-9}, instance.X);
        self.cell = self._.trans.cell;
        return self;
    });
    fn.register("mouse.y", function(_args) {
        var self = new MouseXY(_args);
        self._.trans = timbre("trans", {inMin:1e-9}, instance.Y);
        self.cell = self._.trans.cell;
        return self;
    });
})();
