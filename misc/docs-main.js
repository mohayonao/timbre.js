$(function() {
    "use strict";
    
    var nowPlaying;
    
    timbre.on("pause", function() {
        nowPlaying = null;
    });
    
    function playCode(code) {
        return function() {
            if (timbre.isPlaying && nowPlaying === code) {
                timbre.pause();
            } else {
                timbre.reset();
                eval(code);
                nowPlaying = code;
            }
        };
    }
    
    $(".lang-js").each(function(i, e) {
        $(e).parent()
            .addClass("lang-js prettyprint linenums")
            .text($(e).text());
    });
    
    $(".lang-timbre").each(function(i, e) {
        var txt = $(e).text();
        $(e).parent()
            .addClass("lang-js prettyprint linenums lang-timbre")
            .css({cursor:"pointer"})
            .text(txt).on("click", playCode(txt));
    });
    
    prettyPrint();
    
    timbre.amp = 0.4;
});
