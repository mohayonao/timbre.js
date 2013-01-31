$(function() {
    "use strict";

    if (timbre.env === "nop") {
        timbre.bind(pico.FlashPlayer, {src:"/timbre.js/libs/PicoFlashPlayer.swf"});
    }
    
    var nowPlaying, animationId;
    var current;
    
    var onreset = function() {
        nowPlaying = null;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        animationId = null;
        $(window).off("keydown").off("keyup");
        $(".play-button").text("Play");
        $(".CodeMirror").css("border-color", "silver");
    };
    
    timbre.on("play", function() {
        if (current) {
            $(current.button).text("Pause");
            $(".CodeMirror", current.container).css("border-color", "#DF81A2");
        }
    }).on("pause", onreset).on("reset", onreset).amp = 0.6;
    
    function playCode(code) {
        if (timbre.isPlaying && nowPlaying === code) {
            timbre.reset();
            timbre.pause();
        } else {
            timbre.reset();
            eval(code);
            nowPlaying = code;
        }
    }
    
    $(".codemirror").each(function(i, e) {
        var container = $("<div>").addClass("editor").appendTo(e);
        var textarea = $("<textarea>").val($(e).attr("source")).appendTo(container);

        var lang = $(e).attr("lang");
        var mode = (lang === "timbre" || lang === "js") ? "javascript" : lang;
        
        var editor = CodeMirror.fromTextArea(textarea.get(0), {
            lineNumbers:true, readOnly:(lang !== "timbre"), mode:mode
        });
        
        if (lang === "timbre") {
            $("<button>").addClass("play-button").on("click", function() {
                current = {container:container, button:$(this)};
                playCode(editor.getValue().trim());
            }).append("Play").appendTo(container);
        }
    });
    
    $("canvas").each(function(i, e) {
        e.width  = $(e).width();
        e.height = $(e).height();
    });
    
    window.animate = function(fn, fps) {
        var lastTime = 0;
        var limit = 1 / (fps || 10) * 1000;
        var _animate = function(time) {
            if (time - lastTime > limit) {
                lastTime = time;
                fn();
            }
            animationId = requestAnimationFrame(_animate);
        };
        animationId = requestAnimationFrame(_animate);
    };
    
    window.getDraggedFile = function() {
        return draggedfile;
    };
    
    var draggedfile = null;
    
    $(document.body).on("dragover", function(e) {
        e.preventDefault();
        e.stopPropagation();
    }).on("drop", function(e) {
        e.preventDefault();
        e.stopPropagation();

        draggedfile = e.originalEvent.dataTransfer.files[0];
    });    
});
