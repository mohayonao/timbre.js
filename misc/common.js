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
    
    $(".click-to-play").on("click", function(e) {
        playCode($(this).text());
    });
    
    $(".codemirror").each(function(i, e) {
        var textarea = $("<textarea>").val($(e).attr("source")).appendTo(e);
        
        var editor = CodeMirror.fromTextArea(textarea.get(0), {
            lineNumbers:true
        });
        $("<button>").on("click", function() {
            timbre.pause();
        }).addClass("btn pull-right").appendTo(e)
            .append($("<i>").addClass("icon-pause")).append(" Pause");
        
        $("<button>").on("click", function() {
            playCode(editor.getValue().trim());
        }).addClass("btn pull-right").appendTo(e)
            .append($("<i>").addClass("icon-play")).append(" Play");
    });
    
    prettyPrint();    
    
    timbre.amp = 0.4;
});
