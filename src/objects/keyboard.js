(function(T) {
    "use strict";

    if (T.envtype !== "browser") {
        return;
    }

    var fn = T.fn;
    var instance = null;

    function KeyboardListener(_args) {
        if (instance) {
            return instance;
        }
        instance = this;
        
        T.Object.call(this, _args);

        fn.fixKR(this);
    }
    fn.extend(KeyboardListener);
    
    var keyDown  = {};
    var shiftKey = false;
    var ctrlKey  = false;
    var altKey   = false;
    
    var onkeydown = function(e) {
        var _ = instance._;
        var cell = instance.cell;
        var value = e.keyCode * _.mul + _.add;
        
        for (var i = 0, imax = cell.length; i < imax; ++i) {
            cell[i] = value;
        }
        shiftKey = e.shiftKey;
        ctrlKey  = e.ctrlKey;
        altKey   = e.altKey;
        
        if (!keyDown[e.keyCode]) {
            keyDown[e.keyCode] = true;
            instance._.emit("keydown", e);
        }
    };
    
    var onkeyup = function(e) {
        delete keyDown[e.keyCode];
        instance._.emit("keyup", e);
    };
    
    var $ = KeyboardListener.prototype;
    
    Object.defineProperties($, {
        shiftKey: {
            get: function() {
                return shiftKey;
            }
        },
        ctrlKey: {
            get: function() {
                return ctrlKey;
            }
        },
        altKey: {
            get: function() {
                return altKey;
            }
        }
    });
    
    $.start = function() {
        window.addEventListener("keydown", onkeydown, true);
        window.addEventListener("keyup"  , onkeyup  , true);
        return this;
    };

    $.stop = function() {
        window.removeEventListener("keydown", onkeydown, true);
        window.removeEventListener("keyup"  , onkeyup  , true);
        return this;
    };

    $.play = $.pause = function() {
        return this;
    };
    
    fn.register("keyboard", KeyboardListener);
    
})(timbre);
