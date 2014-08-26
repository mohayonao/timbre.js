"use strict";

var fs = require("fs");

module.exports = function(grunt) {
    
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-watch");
    
    grunt.initConfig({
        jshint: {
            all: ["src/core.js", "src/modules/*.js", "src/objects/*.js"],
            options: {
                curly   : true,
                eqeqeq  : true,
                latedef : true,
                noarg   : true,
                noempty : true,
                quotmark: "double",
                undef   : true,
                strict  : true,
                trailing: true,
                newcap  : false,
                browser : true,
                node    : true,
                predef  : ["timbre"]
            }
        },
        uglify: {
            all: {
                options: { sourceMap: "timbre.js.map" },
                files: { "timbre.js": ["timbre.dev.js"] }
            },
            extras: {
    		    options: { preserveComments: 'some' },
    		    files: {
    		        "src/extras/min/audio-jsonp.min.js": ["src/extras/audio-jsonp.js"],
    		        "src/extras/min/cosc.min.js": ["src/extras/cosc.js"],
    		        "src/extras/min/keyboard.min.js": ["src/extras/keyboard.js"],
    		        "src/extras/min/MoogFF.min.js": ["src/extras/MoogFF.js"],
    		        "src/extras/min/mouse.min.js": ["src/extras/mouse.js"],
    		        "src/extras/min/mp3_decode.min.js": ["src/extras/mp3_decode.js"],
    		        "src/extras/min/pico-binder.min.js": ["src/extras/pico-binder.js"],
    		        "src/extras/min/soundfont.min.js": ["src/extras/soundfont.js"],
    		        "src/extras/min/webaudioapi.min.js": ["src/extras/webaudioapi.js"]
    		    }
            }
        },
        watch: {
            src: {
                files: ["src/core.js", "src/**/*.js"],
                tasks: ["jshint"]
            }
        },
        clean: ["timbre.js", "timbre.js.map", "*.html", "ja/*.html"]
    });
    
    grunt.registerTask("build", function() {
        var build_timbre = require("./build/timbre-builder");
        var opts = build_timbre.build();
        fs.writeFileSync("timbre.dev.js", opts.source, "utf-8")
        console.log("%s - %sKB", opts.version, (opts.size / 1024).toFixed(2));
    });

    grunt.registerTask("doc", function() {
        var DocFileBuilder = require("./build/html-builder").DocFileBuilder;
        DocFileBuilder.build_statics();
    });

    grunt.registerTask("gh-pages", ["clean", "uglify", "doc"]);

    grunt.registerTask("default", ["jshint"]);
    grunt.registerTask("all", ["default", "build"]);
};
