$(function() {
    "use strict";
    
    $("#list").load("/timbre.js/misc/index-"+(navigator.language==='ja'?'ja':'en')+".html");
    
    var $title = $("#title");
    var defaultColor = $title.css("color");
    
    var nowPlaying, animationId;
    timbre.on("play", function() {
        $title.css({color:"#25AA6E"});
    }).on("pause", function() {
        $title.css("color", defaultColor);
        nowPlaying = null;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        animationId = null;
        $(window).off("keydown").off("keyup");
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
