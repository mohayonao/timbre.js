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
    
    $(".codemirror").each(function(i, e) {
        var textarea = $("<textarea>").val($(e).attr("source")).appendTo(e);
        
        var editor = CodeMirror.fromTextArea(textarea.get(0), {
            theme:"blackboard", lineNumbers:true
        });
        $("<button>").on("click", function() {
            timbre.pause();
        }).text("Pause").addClass("btn pull-right").appendTo(e);
        $("<button>").on("click", function() {
            var code = editor.getValue().trim();
            playCode(code);
        }).text("Play").addClass("btn pull-right").appendTo(e);
    });
    
    prettyPrint();    
    
    timbre.amp = 0.4;
});
