(function(timbre) {
    "use strict";

    function Random(seed) {
        var x, y, z, w;
        
        this.seed = function(seed) {
            if (typeof seed !== "number") {
                seed = +new Date();
            }
            seed |= 0;
            x = seed;
            y = 362436069;
            z = 521288629;
            w = 88675123;
        };
        
        this.next = function() {
            var t = x ^ (x << 11);
            x = y;
            y = z;
            z = w;
            w = (w ^ (w >> 19)) ^ (t ^ (t >> 8));
            return w / 2147483647;
        };
        
        this.seed(seed);
    }
    
    timbre.modules.Random = Random;
    
})(timbre);
