$(function() {
    "use strict";
    
    sc.use("prototype");
    
    timbre.setup({f64:true});
    if (timbre.envmobile) {
        timbre.setup({samplerate:timbre.samplerate * 0.5});
    }
    
    var nowPlaying;
    var current;
    
    var onreset = function() {
        nowPlaying = null;
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
        code = code.split("\n").map(function(line) {
            return line.replace(/([\d\D])?\/\/[\d\D]*$/, function(m, a, b) {
                return (a === ":") ? m : ""; // url??
            });
        }).join("\n");
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
        
        if (mode === "html") mode = "htmlmixed";
        
        var editor = CodeMirror.fromTextArea(textarea.get(0), {
            lineNumbers:true, readOnly:(lang !== "timbre"), mode:mode
        });
        
        if (lang === "timbre") {
            $("<button>").addClass("play-button").on("click", function() {
                current = {container:container, button:$(this)};
                playCode(editor.getValue().trim());
            }).append("Play").appendTo(container);
            container.css("margin-bottom", "50px");
        }
    });
    
    $("canvas").each(function(i, e) {
        e.width  = $(e).width();
        e.height = $(e).height();
    });
    
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
