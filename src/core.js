/**
 * timbre.js - A JavaScript library for objective sound programming
 */
(function() {
    "use strict";
    
    var exports = {};
    
    if (typeof module !== "undefined" && module.exports) {
        module.exports = global.timbre = exports;
    } else if (typeof window !== "undefined") {
        if (typeof window.Float32Array !== "undefined") {
            window.Float32Array = Array; // fake Float32Array (for IE9)
        }
        
        exports.noConflict = (function() {
           var _t = window.timbre, _T = window.T;
            return function(deep) {
                if (window.T === exports) {
                    window.T = _T;
                }
                if (deep && window.timbre === exports) {
                    window.timbre = _t;
                }
                return exports;
            };
        })();
        
        window.timbre = window.T = exports;
    }
})();
