(function(T) {
    "use strict";
    
    var fn = T.fn;
    
    function MML(_args) {
        T.Object.call(this, 1, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.mml = "";
        _.status = {t:120, l:4, o:4, v:12, q:6, dot:0, tie:false};
        _.commands = [];
        _.index    = 0;
        _.queue    = [];
        _.currentTime     = 0;
        _.queueTime = 0;
        _.segnoIndex  = -1;
        _.loopStack   = [];
        _.prevNote = 0;
        _.remain   = Infinity;
        _.onended  = fn.make_onended(this);
        
        this.on("start", onstart);
    }
    fn.extend(MML);
    
    var onstart = function() {
        var _ = this._;
        this.playbackState = fn.PLAYING_STATE;
        _.commands = compile(_.mml);
        _.index    = 0;
        _.queue    = [];
        _.currentTime   = 0;
        _.queueTime = 0;
        _.segnoIndex  = -1;
        _.loopStack   = [];
        _.prevNote = 0;
        _.remain   = Infinity;
        
        sched(this);
    };
    Object.defineProperty(onstart, "unremoved", {
        value:true, writable:false
    });
    
    var $ = MML.prototype;
    
    Object.defineProperties($, {
        mml: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    _.mml = value;
                }
            },
            get: function() {
                return this._.mml;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var nodes = this.nodes;
            var queue  = _.queue;
            var gen, i, imax;
            
            if (queue.length) {
                while (queue[0][0] <= _.currentTime) {
                    var nextItem = _.queue.shift();
                    if (nextItem[1]) {
                        for (i = 0, imax = nodes.length; i < imax; ++i) {
                            gen = nodes[i];
                            if (gen.noteOn) {
                                gen.noteOn(nextItem[1], nextItem[3]);
                            } else {
                                gen.bang();
                            }
                        }
                        _.remain = nextItem[4];
                        _.emit("mml", "noteOn", {noteNum:nextItem[1], velocity:nextItem[3]});
                        sched(this);
                    } else {
                        for (i = 0, imax = nodes.length; i < imax; ++i) {
                            gen = nodes[i];
                            if (gen.noteOff) {
                                gen.noteOff(nextItem[2], nextItem[3]);
                            } else if (gen.release) {
                                gen.release();
                            }
                        }
                        _.emit("mml", "noteOff", {noteNum:nextItem[2], velocity:nextItem[3]});
                    }
                    if (queue.length === 0) {
                        break;
                    }
                }
            }
            _.remain -= fn.currentTimeIncr;
            if (queue.length === 0 && _.remain <= 0) {
                fn.nextTick(_.onended);
            }
            _.currentTime += fn.currentTimeIncr;
        }
        
        return this;
    };
    
    var sched = function(self) {
        var _ = self._;
        
        var cmd, commands = _.commands;
        var queue  = _.queue;
        var index  = _.index;
        var status = _.status;
        var queueTime = _.queueTime;
        var loopStack = _.loopStack;
        var tempo, val, len, dot, vel;
        var duration, quantize, pending, _queueTime;
        var peek;
        var i, imax;
        
        pending = [];
        
        outer:
        while (true) {
            if (commands.length <= index) {
                if (_.segnoIndex >= 0) {
                    index = _.segnoIndex;
                } else {
                    break;
                }
            }
            cmd = commands[index++];
            
            switch (cmd.name) {
            case "n":
                tempo = status.t || 120;
                if (cmd.len !== null) {
                    len = cmd.len;
                    dot = cmd.dot || 0;
                } else {
                    len = status.l;
                    dot = cmd.dot || status.dot;
                }
                duration = (60 / tempo) * (4 / len) * 1000;
                duration *= [1, 1.5, 1.75, 1.875][dot] || 1;
                
                vel = status.v << 3;
                if (status.tie) {
                    for (i = queue.length; i--; ) {
                        if (queue[i][2]) {
                            queue.splice(i, 1);
                            break;
                        }
                    }
                    val = _.prevNote;
                } else {
                    val = _.prevNote = (cmd.val) + (status.o + 1) * 12;
                    queue.push([queueTime, val, null, vel, duration]);
                }
                
                if (len > 0) {
                    quantize = status.q / 8;
                    // noteOff
                    if (quantize < 1) {
                        _queueTime = queueTime + (duration * quantize);
                        queue.push([_queueTime, null, val, vel]);
                        for (i = 0, imax = pending.length; i < imax; ++i) {
                            queue.push([_queueTime, null, pending[i], vel]);
                        }
                    }
                    pending = [];
                    queueTime += duration;
                    if (!status.tie) {
                        break outer;
                    }
                } else {
                    pending.push(val);
                }
                status.tie = false;
                break;
            case "r":
                tempo = status.t || 120;
                if (cmd.len !== null) {
                    len = cmd.len;
                    dot = cmd.dot || 0;
                } else {
                    len = status.l;
                    dot = cmd.dot || status.dot;
                }
                if (len > 0) {
                    duration = (60 / tempo) * (4 / len) * 1000;
                    duration *= [1, 1.5, 1.75, 1.875][dot] || 1;
                    queueTime += duration;
                }
                break;
            case "l":
                status.l   = cmd.val;
                status.dot = cmd.dot;
                break;
            case "o":
                status.o = cmd.val;
                break;
            case "<":
                if (status.o < 9) {
                    status.o += 1;
                }
                break;
            case ">":
                if (status.o > 0) {
                    status.o -= 1;
                }
                break;
            case "v":
                status.v = cmd.val;
                break;
            case "(":
                if (status.v < 15) {
                    status.v += 1;
                }
                break;
            case ")":
                if (status.v > 0) {
                    status.v -= 1;
                }
                break;
            case "q":
                status.q = cmd.val;
                break;
            case "&":
                status.tie = true;
                break;
            case "$":
                _.segnoIndex = index;
                break;
            case "[":
                loopStack.push([index, null, null]);
                break;
            case "|":
                peek = loopStack[loopStack.length - 1];
                if (peek) {
                    if (peek[1] === 1) {
                        loopStack.pop();
                        index = peek[2];
                    }
                }
                break;
            case "]":
                peek = loopStack[loopStack.length - 1];
                if (peek) {
                    if (peek[1] === null) {
                        peek[1] = cmd.count;
                        peek[2] = index;
                    }
                    peek[1] -= 1;
                    if (peek[1] === 0) {
                        loopStack.pop();
                    } else {
                        index = peek[0];
                    }
                }
                break;
            case "t":
                status.t = (cmd.val === null) ? 120 : cmd.val;
                break;
            }
        }
        _.index = index;
        _.queueTime = queueTime;
    };
    
    var compile = function(mml) {
        var def, re, m, cmd;
        var i, imax, j, jmax;
        var checked = new Array(mml.length);
        var commands = [];
        
        for (i = 0, imax = MMLCommands.length; i < imax; ++i) {
            def = MMLCommands[i];
            re  = def.re;
            while ((m = re.exec(mml))) {
                if (!checked[m.index]) {
                    for (j = 0, jmax = m[0].length; j < jmax; ++j) {
                        checked[m.index + j] = true;
                    }
                    if (def.func) {
                        cmd = def.func(m);
                    } else {
                        cmd = {name:m[0]};
                    }
                    if (cmd) {
                        cmd.index = m.index;
                        cmd.origin = m[0];
                        commands.push(cmd);
                    }
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
        { re:/([cdefgab])([\-+]?)(\d*)(\.*)/g, func: function(m) {
            return {
                name: "n",
                val : {c:0,d:2,e:4,f:5,g:7,a:9,b:11}[m[1]] + ({"-":-1,"+":+1}[m[2]]||0),
                len : (m[3] === "") ? null : Math.min(m[3]|0, 64),
                dot : m[4].length
            };
        }},
        { re:/r(\d*)(\.*)/g, func: function(m) {
            return {
                name: "r",
                len : (m[1] === "") ? null : Math.max(1, Math.min(m[1]|0, 64)),
                dot : m[2].length
            };
        }},
        { re:/&/g },
        { re:/l(\d*)(\.*)/g, func: function(m) {
            return {
                name: "l",
                val : (m[1] === "") ? 4 : Math.min(m[1]|0, 64),
                dot : m[2].length
            };
        }},
        { re:/o([0-9])/g, func: function(m) {
            return {
                name: "o",
                val : (m[1] === "") ? 4 : m[1]|0
            };
        }},
        { re:/[<>]/g },
        { re:/v(\d*)/g, func: function(m) {
            return {
                name: "v",
                val : (m[1] === "") ? 12 : Math.min(m[1]|0, 15)
            };
        }},
        { re:/[()]/g },
        { re:/q([0-8])/g, func: function(m) {
            return {
                name: "q",
                val : (m[1] === "") ? 6 : Math.min(m[1]|0, 8)
            };
        }},
        { re:/\[/g },
        { re:/\|/g },
        { re:/\](\d*)/g, func: function(m) {
            return {
                name: "]",
                count: (m[1]|0)||2
            };
        }},
        { re:/t(\d*)/g, func: function(m) {
            return {
                name: "t",
                val : (m[1] === "") ? null : Math.max(5, Math.min(m[1]|0, 300))
            };
        }},
        { re:/\$/g }
    ];
    
    fn.register("mml", MML);
    
})(timbre);
