$(function() {
    "use strict";
    
    $("#list").load("/timbre.js/misc/index.html");
    
    var nowPlaying, animationId;
    
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
    
    timbre.on("pause", onreset).on("reset", onreset).amp = 0.6;
    
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
                playCode(editor.getValue().trim());
                
                if (nowPlaying) {
                    $(this).text("Pause");
                    $(".CodeMirror", container).css("border-color", "#DF81A2");
                }
            }).append("Play").appendTo(container);
        }
    });
    
    window.getCanvasById = function(name) {
        var canvas = document.getElementById(name);
        canvas.width  = $(canvas).width();
        canvas.height = $(canvas).height();
        return canvas;
    }
    
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
    
});
