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

function generate(buffer) {
    var items = [
        function_name, '(',
        '"' + buffer.toString("base64") + '"',
    ];
    if (opts.get("ext")) {
        items.push(',"' + opts.get("ext") + '"');
    }
    items.push(');');
    console.log(items.join(""));
}

var args = opts.args();

if (args.length) {
    fs.readFile(args[0], function(err, buffer) {
        if (!err) {
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
