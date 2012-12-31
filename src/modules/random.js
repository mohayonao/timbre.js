(function(timbre) {
    "use strict";

    function Random(seed) {
        var x = new Uint32Array(32);

        this.seed = function(seed) {
            if (typeof seed !== "number") {
                seed = (+new Date() * 100) * Math.random() * 100;
            }
            seed |= 0;
            x[0] = 3;
            x[1] = seed;

            var i;
            for (i = 2; i <= 31; ++i) {
                seed = (16807 * seed) & 0x7FFFFFFF;
                x[i] = seed;
            }
            for (i = 310; i--; ) {
                this.next();
            }
        };

        this.next = function() {
            var n = x[0];
            
            n = (n === 31) ? 1 : n + 1;
            
            x[0] = n;
            x[n] += (n > 3) ? x[n-3] : x[n+31-3];
            
            return (x[n] >>> 1) / 2147483647;
        };
        
        this.seed(seed);
    }
    
    timbre.modules.Random = Random;
    
})(timbre);
