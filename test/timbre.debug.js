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

function DummyPlayer(sys) {
    this.maxSamplerate     = 48000;
    this.defaultSamplerate = 44100;
    this.env = "node";

    var tid = 0;

    this.play = function() {
        if (tid) {
            clearInterval(tid);
        }
        
        tid = setInterval(function() {
            var n = sys.streamsize / sys.cellsize;
            while (n--) {
                sys.process();
            }
        }.bind(this), 5);
    };

    this.pause = function() {
        clearInterval(tid);
    };
}

timbre.bind(DummyPlayer);

module.exports = timbre;
