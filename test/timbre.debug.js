var fs   = require("fs");
var path = require("path");

var SRC_DIR = path.normalize(__dirname + "/../src");

require.from = function(dirpath) {
    var list = fs.readdirSync(dirpath);
    list = list.filter(function(x) {
        return /.*\.js$/.test(x);
    });
    list.sort()

    for (var i = 0; i < list.length; i++) {
        var filepath = dirpath + "/" + list[i];
        require(filepath);
    }
};

require("../src/core.js");
require.from(SRC_DIR + "/modules");
require.from(SRC_DIR + "/objects");

timbre.bind(require("../libs/PicoNodePlayer"));

module.exports = timbre;
