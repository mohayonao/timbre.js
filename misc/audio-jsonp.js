#!/usr/bin/env node

"use strict";

var fs   = require("fs");
var opts = require("opts");

opts.parse([
    { short: "n", long:"name", description: "callback name", value:true },
    { short: "e", long:"ext", description: "file extension", value:true },
]);

var function_name = "window.timbrejs_audiojsonp";
if (opts.get("name")) {
    function_name += "_" + opts.get("name");
}
var ext = opts.get("ext");

function generate(buffer) {
    var items = [
        function_name, '(',
        '"' + buffer.toString("base64") + '"',
    ];
    if (ext) {
        items.push(',"' + ext + '"');
    }
    items.push(');');
    console.log(items.join(""));
}

var args = opts.args();

if (args.length) {
    fs.readFile(args[0], function(err, buffer) {
        var m;
        if (!err) {
            if (!ext) {
                if ((m = /\.([\w\d]+)$/.exec(args[0])) !== null) {
                    ext = m[1];
                }
            }
            generate(buffer);
        }
    });
} else {
    process.stdin.resume();
    var list = [];
    process.stdin.on("data", function(chunk) {
        list.push(chunk);
    }).on("end", function() {
        generate(Buffer.concat(list));
    });
}
