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

        T.Object.call(this, 1, _args);

        fn.fixKR(this);
    }
    fn.extend(KeyboardListener);

    var keyDown  = {};
    var shiftKey = false;
    var ctrlKey  = false;
    var altKey   = false;

    var onkeydown = function(e) {
        var _ = instance._;
        var cell = instance.cells[0];
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


    var NDictKey = {
        90 : 48, // Z -> C3
        83 : 49, // S -> C+3
        88 : 50, // X -> D3
        68 : 51, // D -> D+3
        67 : 52, // C -> E3
        86 : 53, // V -> F3
        71 : 54, // G -> F+3
        66 : 55, // B -> G3
        72 : 56, // H -> G+3
        78 : 57, // N -> A3
        74 : 58, // J -> A+3
        77 : 59, // M -> B3
        188: 60, // , -> C4
        76 : 61, // L -> C+4
        190: 62, // . -> D4
        186: 63, // ; -> D+4

        81 : 60, // Q -> C4
        50 : 61, // 2 -> C+4
        87 : 62, // W -> D4
        51 : 63, // 3 -> D+4
        69 : 64, // E -> E4
        82 : 65, // R -> F4
        53 : 66, // 5 -> F+4
        84 : 67, // T -> G4
        54 : 68, // 6 -> G+4
        89 : 69, // Y -> A4
        55 : 70, // 7 -> A+4
        85 : 71, // U -> B4
        73 : 72, // I -> C5
        57 : 73, // 9 -> C#5
        79 : 74, // O -> D5
        48 : 75, // 0 -> D+5
        80 : 76  // P -> E5
    };

    var NDictNode = fn.getClass("ndict");
    fn.register("ndict.key", function(_args) {
        var instance = new NDictNode(_args);
        instance.dict = NDictKey;
        return instance;
    });

})(timbre);
