(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    
    function MML(_args) {
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        this._.mml = "";
        this._.commands = [];
        
        this._.index = 0;
        
        this.on("start", onstart);
    }
    fn.extend(MML);
    
    var onstart = function() {
        this._.commands = compile(this._.mml);
    };
    Object.defineProperty(onstart, "unremoved", {
        value:true, writable:false
    });

    var $ = MML.prototype;

    Object.defineProperties($, {
        mml: {
            set: function(value) {
                if (typeof value === "string") {
                    this._.mml = value;
                }
            },
            get: function() {
                return this._.mml;
            }
        }
    });

    var compile = function(mml) {
        var def, re, m, cmd;
        var i, imax, j, jmax;
        var checked = new Array(mml.length);
        var commands = [];
        
        for (i = 0, imax = MMLCommands; i < imax; ++i) {
            def = MMLCommands[i];
            re  = def.re;
            while ((m = re.exec(mml))) {
                if (!checked[m.index]) {
                    for (j = 0, jmax = m[0].length; j < jmax; ++j) {
                        checked[m.index + j] = true;
                    }
                    cmd = def.func(m);
                    cmd.index = m.index;
                    cmd.origin = m[0];
                    commands.push(cmd);
                }
                while (re.lastIndex < mml.length) {
                    if (!checked[re.lastIndex]) {
                        break;
                    }
                    ++re.lastIndex;
                }
            }
        }
        commands.sort(function(a, b) {
            return a.index - b.index;
        });
        return commands;
    };

    var MMLCommands = [
        { re:/t(\d*)/g, func: function(m) {
            return {name:"t", val:m[1]|0};
        }}
    ];
    
    fn.register("mml", MML);
    
})(timbre);
