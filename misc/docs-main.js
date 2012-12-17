$(function() {
    "use strict";
    
    var nowPlaying;
    
    timbre.on("pause", function() {
        nowPlaying = null;
    });
    
    function playCode(code) {
        if (timbre.isPlaying && nowPlaying === code) {
            timbre.pause();
        } else {
            timbre.reset();
            eval(code);
            nowPlaying = code;
        }
    }
    
    $(".timbre").on("click", function(e) {
        playCode($(this).text());
    });
    
    prettyPrint();
    
    timbre.amp = 0.4;
});
