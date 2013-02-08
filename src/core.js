/**
 * T("timbre.js") - A JavaScript library for objective sound programming
 */
(function(undefined) {
    "use strict";
    
    var slice = Array.prototype.slice;
    var isArray = Array.isArray;
    var isDictionary = function(object) {
        return typeof object === "object" && object.constructor === Object;
    };
    
    var STATUS_NONE = 0;
    var STATUS_PLAY = 1;
    var STATUS_REC  = 2;
    
    var _ver = "${VERSION}";
    var _sys = null;
    var _constructors = {};
    var _factories    = {};
    var _envtype = (function() {
        if (typeof module !== "undefined" && module.exports) {
            return "node";
        } else if (typeof window !== "undefined") {
            return "browser";
        }
        return "unknown";
    })();
    var _envmobile = (function() {
        if (_envtype === "browser") {
            if (/(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent)) {
                return true;
            }
        }
        return false;
    })();
    var _f64mode = false;
    var _usefunc = {};
    
    var T = function() {
        var args = slice.call(arguments);
        var key  = args[0];
        var instance;
        
        switch (typeof key) {
        case "string":
            if (_constructors[key]) {
                instance = new _constructors[key](args.slice(1));
            } else if (_factories[key]) {
                instance = _factories[key](args.slice(1));
            } else {
                /*jshint quotmark:single */
                console.warn('T("' + key + '") is not defined.');
                /*jshint quotmark:double */
            }
            break;
        case "number":
            instance = new NumberWrapper(args);
            break;
        case "boolean":
            instance = new BooleanWrapper(args);
            break;
        case "function":
            instance = new FunctionWrapper(args);
            break;
        case "object":
            if (key !== null) {
                if (key instanceof TimbreObject) {
                    return key;
                } else if (key.context instanceof TimbreObject) {
                    return key.context;
                } else if (key.constructor === Object) {
                    instance = new ObjectWrapper(args);
                } else if (isArray(key)) {
                    instance = new ArrayWrapper(args);
                }
            }
            break;
        }
        
        if (instance === undefined) {
            instance = new NumberWrapper([0]);
            instance._.isUndefined = true;
            //debug--
            throw new Error("T(\"" + key + "\") is an undefined object");
            //--debug
        } else {
            instance._.isUndefined = false;
        }
        
        instance._.originkey = key;
        instance._.meta = __buildMetaData(instance);
        instance._.emit("init");
        
        return instance;
    };
    var timbre = function() {
        return T.apply(null, arguments);
    };
    
    var __buildMetaData = function(instance) {
        var meta = instance._.meta;
        var names, desc;
        var p = instance;
        while (p !== null && p.constructor !== Object) {
            names = Object.getOwnPropertyNames(p);
            for (var i = 0, imax = names.length; i < imax; ++i) {
                if (meta[names[i]]) {
                    continue;
                }
                if (/^(constructor$|process$|_)/.test(names[i])) {
                    meta[names[i]] = "ignore";
                } else {
                    desc = Object.getOwnPropertyDescriptor(p, names[i]);
                    if (typeof desc.value === "function") {
                        meta[names[i]] = "function";
                    } else if (desc.get || desc.set) {
                        meta[names[i]] = "property";
                    }
                }
            }
            p = Object.getPrototypeOf(p);
        }
        return meta;
    };
    
    var fn      = timbre.fn    = {};
    var modules = timbre.modules = {};
    fn.SignalArray = Float32Array;
    
    (function() {
        var dict = {};
        modules.ready = function(type, fn) {
            dict[type] = fn;
        };
        modules.ready.done = function(type, res) {
            var fn = dict[type];
            if (fn) {
                fn(res);
            }
            delete dict[type];
        };
    })();
    
    // properties
    Object.defineProperties(timbre, {
        version: {
            get: function() {
                return _ver;
            }
        },
        envtype: {
            get: function() {
                return _envtype;
            }
        },
        envmobile: {
            get: function() {
                return _envmobile;
            }
        },
        env: {
            get: function() {
                return _sys.impl.env;
            }
        },
        samplerate: {
            get: function() {
                return _sys.samplerate;
            }
        },
        channels: {
            get: function() {
                return _sys.channels;
            }
        },
        cellsize: {
            get: function() {
                return _sys.cellsize;
            }
        },
        currentTime: {
            get: function() {
                return _sys.currentTime;
            }
        },
        isPlaying: {
            get: function() {
                return _sys.status === STATUS_PLAY;
            }
        },
        isRecording: {
            get: function() {
                return _sys.status === STATUS_REC;
            }
        },
        amp: {
            set: function(value) {
                if (typeof value === "number") {
                    _sys.amp = value;
                }
            },
            get: function() {
                return _sys.amp;
            }
        }
    });
    
    timbre.bind = function(Klass, opts) {
        _sys.bind(Klass, opts);
        return timbre;
    };

    timbre.setup = function(opts) {
        _sys.setup(opts);
        return timbre;
    };
    
    timbre.play = function() {
        _sys.play();
        return timbre;
    };
    
    timbre.pause = function() {
        _sys.pause();
        return timbre;
    };
    
    timbre.reset = function() {
        _sys.reset();
        _sys.events.emit("reset");
        return timbre;
    };
    
    timbre.on = function(type, listener) {
        _sys.on(type, listener);
        return timbre;
    };
    timbre.addListener = timbre.on;
    
    timbre.once = function(type, listener) {
        _sys.once(type, listener);
        return timbre;
    };
    
    timbre.off = function(type, listener) {
        _sys.removeListener(type, listener);
        return timbre;
    };
    timbre.removeListener = timbre.off;
    
    timbre.removeAllListeners = function(type) {
        _sys.removeAllListeners(type);
        return timbre;
    };
    
    timbre.listeners = function(type) {
        return _sys.listeners(type);
    };
    
    timbre.rec = function() {
        return _sys.rec.apply(_sys, arguments);
    };
    
    timbre.use = function(name) {
        if (isArray(_usefunc[name])) {
            _usefunc[name].forEach(function(func) {
                func();
            });
        }
        return this;
    };
    
    timbre.timevalue = function(str) {
        var m, bpm, ticks, x;
        m = /^(\d+(?:\.\d+)?)Hz$/i.exec(str);
        if (m) {
            var hz = +m[1];
            if (hz === 0) {
                return 0;
            }
            return 1000 / +m[1];
        }
        m = /^bpm(\d+(?:\.\d+)?)?\s*(?:l(\d+))?(\.*)$/i.exec(str);
        if (m) {
            bpm = m[1];
            if (bpm === undefined) {
                bpm = 120;
            } else {
                bpm = +m[1];
                if (bpm < 5 || 300 < bpm) {
                    bpm = 120;
                }
            }
            var len = m[2] ? m[2]|0 : 4;
            if (bpm === 0 || len === 0) {
                return 0;
            }
            var ms = 60 / bpm * (4 / len) * 1000;
            ms *= [1, 1.5, 1.75, 1.875][(m[3]||"").length] || 1;
            return ms;
        }
        m = /^bpm(\d+(?:\.\d+)?)?\s*(\d+)\.(\d+)\.(\d+)$/i.exec(str);
        if (m) {
            bpm = m[1];
            if (bpm === undefined) {
                bpm = 120;
            } else {
                bpm = +m[1];
                if (bpm < 5 || 300 < bpm) {
                    bpm = 120;
                }
            }
            var bars  = m[2]|0;
            var beats = m[3]|0;
            var units = m[4]|0;
            ticks = (bars * 4 * 480) + (beats * 480) + units;
            return 60 / bpm * (ticks / 480) * 1000;
        }
        m = /^(\d+(?:\.\d+)?)secs?$/i.exec(str);
        if (m) {
            return +m[1] * 1000;
        }
        m = /^(\d+(?:\.\d+)?)mins?$/i.exec(str);
        if (m) {
            return +m[1] * (60 * 1000);
        }
        m = /^(?:([0-5]?[0-9]):)?(?:([0-5]?[0-9]):)(?:([0-5]?[0-9]))(?:\.([0-9]{1,3}))?$/.exec(str);
        if (m) {
            x = (m[1]|0) * 3600 + (m[2]|0) * 60 + (m[3]|0);
            x = x * 1000 + ((((m[4]||"")+"00").substr(0, 3))|0);
            return x;
        }
        m = /^bpm(\d+(?:\.\d+)?)?\s*(?:(\d+)ticks)?$/i.exec(str);
        if (m) {
            bpm = m[1];
            if (bpm === undefined) {
                bpm = 120;
            } else {
                bpm = +m[1];
                if (bpm < 5 || 300 < bpm) {
                    bpm = 120;
                }
            }
            ticks = m[2] ? m[2]|0 : 480;
            if (bpm === 0) {
                return 0;
            }
            return 60 / bpm * (ticks / 480) * 1000;
        }
        m = /^(\d+)samples(?:\/(\d+)Hz)?$/i.exec(str);
        if (m) {
            var sr = m[2] ? m[2]|0 : timbre.samplerate;
            if (sr === 0) {
                return 0;
            }
            return (m[1]|0) / sr * 1000;
        }
        m = /^(\d+)(?:ms)?$/i.exec(str);
        if (m) {
            return m[1]|0;
        }
        return 0;
    };
    
    fn.use = function(name, func) {
        if (isArray(_usefunc[name])) {
            _usefunc[name].push(func);
        } else {
            _usefunc[name] = [func];
        }
    };
    
    fn.isDictionary = isDictionary;
    
    var __nop = function() {
        return this;
    };
    fn.nop = __nop;
    
    // borrowed from coffee-script
    var __extend = function(child, parent) {
        parent = parent || TimbreObject;
        
        for (var key in parent) {
            if (parent.hasOwnProperty(key)) {
                child[key] = parent[key];
            }
        }
        function Ctor() {
            this.constructor = child;
        }
        Ctor.prototype  = parent.prototype;
        child.prototype = new Ctor();
        child.__super__ = parent.prototype;
        return child;
    };
    fn.extend = __extend;

    var __constructorof = function(ctor, Klass) {
        var f = ctor && ctor.prototype;
        while (f) {
            if (f === Klass.prototype) {
                return true;
            }
            f = Object.getPrototypeOf(f);
        }
        return false;
    };
    fn.constructorof = __constructorof;
    
    var __register = function(key, ctor) {
        if (__constructorof(ctor, TimbreObject)) {
            _constructors[key] = ctor;
        } else {
            _factories[key] = ctor;
        }
    };
    fn.register = __register;

    var __alias = function(key, alias) {
        if (_constructors[alias]) {
            _constructors[key] = _constructors[alias];
        } else if (_factories[alias]) {
            _factories[key] = _factories[alias];
        }
        
    };
    fn.alias = __alias;
    
    var __getClass = function(key) {
        return _constructors[key];
    };
    fn.getClass = __getClass;
    
    var __nextTick = function(func) {
        _sys.nextTick(func);
        return timbre;
    };
    fn.nextTick = __nextTick;
    
    var __fixAR = function(self) {
        self._.ar = true;
        self._.aronly = true;
    };
    fn.fixAR = __fixAR;
    
    var __fixKR = function(self) {
        self._.ar = false;
        self._.kronly = true;
    };
    fn.fixKR = __fixKR;
    
    var __changeWithValue = function() {
        var _ = this._;
        var x = _.value * _.mul + _.add;
        if (isNaN(x)) {
            x = 0;
        }
        var cell = this.cells[0];
        for (var i = 0, imax = cell.length; i < imax; ++i) {
            cell[i] = x;
        }
    };
    Object.defineProperty(__changeWithValue, "unremovable", {
        value:true, writable:false
    });
    fn.changeWithValue = __changeWithValue;
    
    var __timer = (function() {
        var make_onstart = function(self) {
            return function() {
                if (_sys.timers.indexOf(self) === -1) {
                    _sys.timers.push(self);
                    _sys.events.emit("addObject");
                    self._.emit("start");
                }
            };
        };
        var make_onstop = function(self) {
            return function() {
                var i = _sys.timers.indexOf(self);
                if (i !== -1) {
                    _sys.timers.splice(i, 1);
                    self._.emit("stop");
                    _sys.events.emit("removeObject");
                }
            };
        };
        return function(self) {
            var onstart = make_onstart(self);
            var onstop  = make_onstop(self);
            self.start = function() {
                _sys.nextTick(onstart);
                return self;
            };
            self.stop = function() {
                _sys.nextTick(onstop);
                return self;
            };
            return self;
        };
    })();
    fn.timer = __timer;

    var __listener = (function() {
        var make_onlisten = function(self) {
            return function() {
                if (_sys.listeners.indexOf(self) === -1) {
                    _sys.listeners.push(self);
                    _sys.events.emit("addObject");
                    self._.emit("listen");
                }
            };
        };
        var make_onunlisten = function(self) {
            return function() {
                var i = _sys.listeners.indexOf(self);
                if (i !== -1) {
                    _sys.listeners.splice(i, 1);
                    self._.emit("unlisten");
                    _sys.events.emit("removeObject");
                }
            };
        };
        
        return function(self) {
            var onlisten = make_onlisten(self);
            var onunlisten = make_onunlisten(self);
            self.listen = function() {
                if (arguments.length) {
                    self.append.apply(self, arguments);
                }
                if (self.nodes.length) {
                    _sys.nextTick(onlisten);
                }
                return self;
            };
            self.unlisten = function() {
                if (arguments.length) {
                    self.remove.apply(self, arguments);
                }
                if (!self.nodes.length) {
                    _sys.nextTick(onunlisten);
                }
                return self;
            };
            return self;
        };
    })();
    fn.listener = __listener;
    
    var __make_onended = function(self, lastValue) {
        return function() {
            if (typeof lastValue === "number") {
                var cell  = self.cells[0];
                var cellL = self.cells[1];
                var cellR = self.cells[2];
                for (var i = 0, imax = cellL.length; i < imax; ++i) {
                    cell[0] = cellL[i] = cellR[i] = lastValue;
                }
            }
            self._.isEnded = true;
            self._.emit("ended");
        };
    };
    fn.make_onended = __make_onended;
    
    var __inputSignalAR = function(self) {
        var cell  = self.cells[0];
        var cellL = self.cells[1];
        var cellR = self.cells[2];
        var nodes = self.nodes;
        var i, imax = nodes.length;
        var j, jmax = cell.length;
        var tickID  = self.tickID;
        var tmp, tmpL, tmpR;
        
        if (self.numChannels === 2) {
            for (j = jmax; j; ) {
                j -= 8;
                cellL[j] = cellL[j+1] = cellL[j+2] = cellL[j+3] = cellL[j+4] = cellL[j+5] = cellL[j+6] = cellL[j+7] = cellR[j] = cellR[j+1] = cellR[j+2] = cellR[j+3] = cellR[j+4] = cellR[j+5] = cellR[j+6] = cellR[j+7] = 0;
            }
            for (i = 0; i < imax; ++i) {
                nodes[i].process(tickID);
                tmpL = nodes[i].cells[1];
                tmpR = nodes[i].cells[2];
                for (j = jmax; j; ) {
                    j -= 8;
                    cellL[j  ] += tmpL[j  ]; cellR[j  ] += tmpR[j  ];
                    cellL[j+1] += tmpL[j+1]; cellR[j+1] += tmpR[j+1];
                    cellL[j+2] += tmpL[j+2]; cellR[j+2] += tmpR[j+2];
                    cellL[j+3] += tmpL[j+3]; cellR[j+3] += tmpR[j+3];
                    cellL[j+4] += tmpL[j+4]; cellR[j+4] += tmpR[j+4];
                    cellL[j+5] += tmpL[j+5]; cellR[j+5] += tmpR[j+5];
                    cellL[j+6] += tmpL[j+6]; cellR[j+6] += tmpR[j+6];
                    cellL[j+7] += tmpL[j+7]; cellR[j+7] += tmpR[j+7];
                }
            }
        } else {
            for (j = jmax; j; ) {
                j -= 8;
                cell[j] = cell[j+1] = cell[j+2] = cell[j+3] = cell[j+4] = cell[j+5] = cell[j+6] = cell[j+7] = 0;
            }
            for (i = 0; i < imax; ++i) {
                tmp = nodes[i].process(tickID).cells[0];
                for (j = jmax; j; ) {
                    j -= 8;
                    cell[j  ] += tmp[j  ];
                    cell[j+1] += tmp[j+1];
                    cell[j+2] += tmp[j+2];
                    cell[j+3] += tmp[j+3];
                    cell[j+4] += tmp[j+4];
                    cell[j+5] += tmp[j+5];
                    cell[j+6] += tmp[j+6];
                    cell[j+7] += tmp[j+7];
                }
            }
        }
    };
    fn.inputSignalAR = __inputSignalAR;

    var __inputSignalKR = function(self) {
        var nodes = self.nodes;
        var i, imax = nodes.length;
        var tickID = self.tickID;
        var tmp = 0;
        for (i = 0; i < imax; ++i) {
            tmp += nodes[i].process(tickID).cells[0][0];
        }
        return tmp;
    };
    fn.inputSignalKR = __inputSignalKR;
    
    var __outputSignalAR = function(self) {
        var cell  = self.cells[0];
        var cellL = self.cells[1];
        var cellR = self.cells[2];
        var mul = self._.mul, add = self._.add;
        var i;
        
        if (self.numChannels === 2) {
            for (i = cell.length; i; ) {
                i -= 8;
                cellL[i  ] = cellL[i  ] * mul + add; cellR[i  ] = cellR[i  ] * mul + add;
                cellL[i+1] = cellL[i+1] * mul + add; cellR[i+1] = cellR[i+1] * mul + add;
                cellL[i+2] = cellL[i+2] * mul + add; cellR[i+2] = cellR[i+2] * mul + add;
                cellL[i+3] = cellL[i+3] * mul + add; cellR[i+3] = cellR[i+3] * mul + add;
                cellL[i+4] = cellL[i+4] * mul + add; cellR[i+4] = cellR[i+4] * mul + add;
                cellL[i+5] = cellL[i+5] * mul + add; cellR[i+5] = cellR[i+5] * mul + add;
                cellL[i+6] = cellL[i+6] * mul + add; cellR[i+6] = cellR[i+6] * mul + add;
                cellL[i+7] = cellL[i+7] * mul + add; cellR[i+7] = cellR[i+7] * mul + add;
                cell[i  ] = (cellL[i  ] + cellR[i  ]) * 0.5;
                cell[i+1] = (cellL[i+1] + cellR[i+1]) * 0.5;
                cell[i+2] = (cellL[i+2] + cellR[i+2]) * 0.5;
                cell[i+3] = (cellL[i+3] + cellR[i+3]) * 0.5;
                cell[i+4] = (cellL[i+4] + cellR[i+4]) * 0.5;
                cell[i+5] = (cellL[i+5] + cellR[i+5]) * 0.5;
                cell[i+6] = (cellL[i+6] + cellR[i+6]) * 0.5;
                cell[i+7] = (cellL[i+7] + cellR[i+7]) * 0.5;
            }
        } else {
            if (mul !== 1 || add !== 0) {
                for (i = cell.length; i; ) {
                    i -= 8;
                    cell[i  ] = cell[i  ] * mul + add;
                    cell[i+1] = cell[i+1] * mul + add;
                    cell[i+2] = cell[i+2] * mul + add;
                    cell[i+3] = cell[i+3] * mul + add;
                    cell[i+4] = cell[i+4] * mul + add;
                    cell[i+5] = cell[i+5] * mul + add;
                    cell[i+6] = cell[i+6] * mul + add;
                    cell[i+7] = cell[i+7] * mul + add;
                }
            }
        }
    };
    fn.outputSignalAR = __outputSignalAR;
    
    var __outputSignalKR = function(self) {
        var cell  = self.cells[0];
        var cellL = self.cells[1];
        var cellR = self.cells[2];
        var mul = self._.mul, add = self._.add;
        var value = cell[0] * mul + add;
        var i;

        if (self.numChannels === 2) {
            for (i = cell.length; i; ) {
                i -= 8;
                cell[i] = cell[i+1] = cell[i+2] = cell[i+3] = cell[i+4] = cell[i+5] = cell[i+6] = cell[i+7] = cellL[i] = cellL[i+1] = cellL[i+2] = cellL[i+3] = cellL[i+4] = cellL[i+5] = cellL[i+6] = cellL[i+7] = cellR[i] = cellR[i+1] = cellR[i+2] = cellR[i+3] = cellR[i+4] = cellR[i+5] = cellR[i+6] = cellR[i+7] = value;
            }
        } else {
            for (i = cell.length; i; ) {
                i -= 8;
                cell[i] = cell[i+1] = cell[i+2] = cell[i+3] = cell[i+4] = cell[i+5] = cell[i+6] = cell[i+7] = value;
            }
        }
    };
    fn.outputSignalKR = __outputSignalKR;
    
    fn.fix_iOS6_1_problem = function(flag) {
        _sys.fix_iOS6_1_problem(flag);
    };
    
    //debug--
    fn.debug = {};
    fn.debug.process = function(self) {
        var cell = self.process(+new Date()).cells[0];
        var min = +Infinity, max = -Infinity, nan = false;
        for (var i = 0, imax = cell.length; i < imax; ++i) {
            if (isNaN(cell[i])) {
                nan = true;
            }
            if (cell[i] < min) {
                min = cell[i];
            } else if (cell[i] > max) {
                max = cell[i];
            }
        }
        return { min:min, max:max, isNaN:nan };
    };
    //--debug
    
    // root object
    var TimbreObject = (function() {
        function TimbreObject(numChannels, _args) {
            this._ = {}; // private members
            var e = this._.events = new modules.EventEmitter(this);
            this._.emit   = function() {
                return e.emit.apply(e, arguments);
            };
            if (isDictionary(_args[0])) {
                var params = _args.shift();
                this.once("init", function() {
                    this.set(params);
                });
            }
            
            this.tickID = -1;
            this.nodes  = _args.map(timbre);
            this.cells  = [];
            this.numChannels = numChannels;
            switch (numChannels) {
            case 0:
                this.L = this.R = new ChannelObject(null);
                this.cells[0] = this.cells[1] = this.cells[2] = this.L.cell;
                break;
            case 1:
                this.L = this.R = new ChannelObject(this);
                this.cells[0] = this.cells[1] = this.cells[2] = this.L.cell;
                break;
            case 2:
                this.L = new ChannelObject(this);
                this.R = new ChannelObject(this);
                this.cells[0] = new fn.SignalArray(_sys.cellsize);
                this.cells[1] = this.L.cell;
                this.cells[2] = this.R.cell;
                break;
            }
            
            this._.ar  = true;
            this._.mul = 1;
            this._.add = 0;
            this._.dac = null;
            this._.bypassed = false;
            this._.meta = {};
        }
        
        var $ = TimbreObject.prototype;
        
        Object.defineProperties($, {
            isUndefined: {
                get: function() {
                    return this._.isUndefined;
                }
            },
            isAr: {
                get: function() {
                    return this._.ar;
                }
            },
            isKr: {
                get: function() {
                    return !this._.ar;
                }
            },
            isBypassed: {
                get: function() {
                    return this._.bypassed;
                }
            },
            mul: {
                set: function(value) {
                    if (typeof value === "number") {
                        this._.mul = value;
                        this._.emit("setMul", value);
                    }
                },
                get: function() {
                    return this._.mul;
                }
            },
            add: {
                set: function(value) {
                    if (typeof value === "number") {
                        this._.add = value;
                        this._.emit("setAdd", value);
                    }
                },
                get: function() {
                    return this._.add;
                }
            },
            dac: {
                set: function(value) {
                    var _ = this._;
                    if (value instanceof SystemInlet && _.dac !== value) {
                        if (_.dac) {
                            _.dac.remove(this);
                        }
                        value.append(this);
                    }
                },
                get: function() {
                    return this._.dac;
                }
            }
        });
        
        $.toString = function() {
            return this.constructor.name;
        };

        $.valueOf = function() {
            if (_sys.tickID !== this.tickID) {
                this.process(_sys.tickID);
            }
            return this.cells[0][0];
        };
        
        $.append = function() {
            if (arguments.length > 0) {
                var list = slice.call(arguments).map(timbre);
                this.nodes = this.nodes.concat(list);
                this._.emit("append", list);
            }
            return this;
        };
        
        $.appendTo = function(object) {
            object.append(this);
            return this;
        };
        
        $.remove = function() {
            if (arguments.length > 0) {
                var j, nodes = this.nodes, list = [];
                for (var i = 0, imax = arguments.length; i < imax; ++i) {
                    if ((j = nodes.indexOf(arguments[i])) !== -1) {
                        list.push(nodes[j]);
                        nodes.splice(j, 1);
                    }
                }
                if (list.length > 0) {
                    this._.emit("remove", list);
                }
            }
            return this;
        };

        $.removeFrom = function(object) {
            object.remove(this);
            return this;
        };

        $.removeAll = function() {
            var list = this.nodes.slice();
            this.nodes = [];
            if (list.length > 0) {
                this._.emit("remove", list);
            }
            return this;
        };

        $.removeAtIndex = function(index) {
            var item = this.nodes[index];
            if (item) {
                this.nodes.splice(index, 1);
                this._.emit("remove", [item]);
            }
            return this;
        };

        // EventEmitter
        $.on = $.addListener = function(type, listener) {
            this._.events.on(type, listener);
            return this;
        };
        
        $.once = function(type, listener) {
            this._.events.once(type, listener);
            return this;
        };
        
        $.off = $.removeListener = function(type, listener) {
            this._.events.removeListener(type, listener);
            return this;
        };
        
        $.removeAllListeners = function(type) {
            this._.events.removeAllListeners(type);
            return this;
        };
        
        $.listeners = function(type) {
            return this._.events.listeners(type);
        };
        
        $.set = function(key, value) {
            var x, desc, meta = this._.meta;
            switch (typeof key) {
            case "string":
                switch (meta[key]) {
                case "property":
                    this[key] = value;
                    break;
                case "function":
                    this[key](value);
                    break;
                default:
                    x = this;
                    while (x !== null) {
                        desc = Object.getOwnPropertyDescriptor(x, key);
                        if (desc) {
                            if (typeof desc.value === "function") {
                                meta[key] = "function";
                                this[key](value);
                            } else if (desc.get || desc.set) {
                                meta[key] = "property";
                                this[key] = value;
                            }
                        }
                        x = Object.getPrototypeOf(x);
                    }
                }
                break;
            case "object":
                for (x in key) {
                    this.set(x, key[x]);
                }
                break;
            }
            return this;
        };
        
        $.get = function(key) {
            if (this._.meta[key] === "property") {
                return this[key];
            }
        };
        
        $.bang = function() {
            this._.emit.apply(this, ["bang"].concat(slice.call(arguments)));
            return this;
        };
        
        $.process = __nop;
        
        $.bypass = function() {
            this._.bypassed = (arguments.length === 0) ? true : !!arguments[0];
            return this;
        };
        
        $.play = function() {
            var dac = this._.dac;
            var emit = false;
            if (dac === null) {
                dac = this._.dac = new SystemInlet(this);
                emit = true;
            } else if (dac.nodes.indexOf(this) === -1) {
                dac.append(this);
                emit = true;
            }
            dac.play();
            if (emit) {
                this._.emit.apply(this, ["play"].concat(slice.call(arguments)));
            }
            return this;
        };
        
        $.pause = function() {
            var dac = this._.dac;
            if (dac) {
                if (dac.nodes.indexOf(this) !== -1) {
                    this._.dac = null;
                    dac.remove(this);
                    this._.emit("pause");
                }
                if (dac.nodes.length === 0) {
                    dac.pause();
                }
            }
            return this;
        };
        
        $.start = $.stop = $.listen = $.unlisten = function() {
            return this;
        };
        
        $.ar = function() {
            if ((arguments.length === 0) ? true : !!arguments[0]) {
                if (!this._.kronly) {
                    this._.ar = true;
                    this._.emit("ar", true);
                }
            } else {
                this.kr(true);
            }
            return this;
        };
        
        $.kr = function() {
            if ((arguments.length === 0) ? true : !!arguments[0]) {
                if (!this._.aronly) {
                    this._.ar = false;
                    this._.emit("ar", false);
                }
            } else {
                this.ar(true);
            }
            return this;
        };
        
        if (_envtype === "browser") {
            $.plot = function(opts) {
                var _ = this._;
                var canvas = opts.target;
                
                if (!canvas) {
                    return this;
                }
                
                var width    = opts.width  || canvas.width  || 320;
                var height   = opts.height || canvas.height || 240;
                var offset_x = (opts.x || 0) + 0.5;
                var offset_y = (opts.y || 0);
                
                var context = canvas.getContext("2d");
                
                var foreground;
                if (opts.foreground !== undefined) {
                    foreground = opts.foreground;
                } else{
                    foreground = _.plotForeground || "rgb(  0, 128, 255)";
                }
                var background;
                if (opts.background !== undefined) {
                    background = opts.background;
                } else {
                    background = _.plotBackground || "rgb(255, 255, 255)";
                }
                var lineWidth  = opts.lineWidth  || _.plotLineWidth || 1;
                var cyclic     = !!_.plotCyclic;
                
                var data  = _.plotData || this.cells[0];
                var range = opts.range || _.plotRange || [-1.2, +1.2];
                var rangeMin   = range[0];
                var rangeDelta = height / (range[1] - rangeMin);
                
                var x, dx = (width / data.length);
                var y, dy, y0;
                var i, imax = data.length;
                
                context.save();
                
                context.rect(offset_x, offset_y, width, height);
                // context.clip();
                
                if (background !== null) {
                    context.fillStyle = background;
                    context.fillRect(offset_x, offset_y, width, height);
                }
                if (_.plotBefore) {
                    _.plotBefore.call(
                        this, context, offset_x, offset_y, width, height
                    );
                }
                
                if (_.plotBarStyle) {
                    context.fillStyle = foreground;
                    x = 0;
                    for (i = 0; i < imax; ++i) {
                        dy = (data[i] - rangeMin) * rangeDelta;
                        y  = height - dy;
                        context.fillRect(x + offset_x, y + offset_y, dx, dy);
                        x += dx;
                    }
                } else {
                    context.strokeStyle = foreground;
                    context.lineWidth   = lineWidth;
                    
                    context.beginPath();
                    
                    x  = 0;
                    y0 = height - (data[0] - rangeMin) * rangeDelta;
                    context.moveTo(x + offset_x, y0 + offset_y);
                    for (i = 1; i < imax; ++i) {
                        x += dx;
                        y = height - (data[i] - rangeMin) * rangeDelta;
                        context.lineTo(x + offset_x, y + offset_y);
                    }
                    if (cyclic) {
                        context.lineTo(x + dx + offset_x, y0 + offset_y);
                    } else {
                        context.lineTo(x + dx + offset_x, y  + offset_y);
                    }
                    context.stroke();
                }
                
                if (_.plotAfter) {
                    _.plotAfter.call(
                        this, context, offset_x, offset_y, width, height
                    );
                }
                var border = opts.border || _.plotBorder;
                if (border) {
                    context.strokeStyle =
                        (typeof border === "string") ? border : "#000";
                    context.lineWidth = 1;
                    context.strokeRect(offset_x, offset_y, width, height);
                }
                
                context.restore();
                
                return this;
            };
        } else {
            $.plot = __nop;
        }
        
        return TimbreObject;
    })();
    timbre.Object = TimbreObject;
    
    var ChannelObject = (function() {
        function ChannelObject(parent) {
            timbre.Object.call(this, -1, []);
            __fixAR(this);
            
            this._.parent = parent;
            this.cell = new fn.SignalArray(_sys.cellsize);
            this.cells[0] = this.cells[1] = this.cells[2] = this.cell;
        }
        __extend(ChannelObject);
        
        ChannelObject.prototype.process = function(tickID) {
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                if (this._.parent) {
                    this._.parent.process(tickID);
                }
            }
            return this;
        };
        
        return ChannelObject;
    })();
    timbre.ChannelObject = ChannelObject;
    
    var NumberWrapper = (function() {
        function NumberWrapper(_args) {
            TimbreObject.call(this, 1, []);
            __fixKR(this);
            
            this.value = _args[0];
            
            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
            
            this.on("setAdd", __changeWithValue);
            this.on("setMul", __changeWithValue);
        }
        __extend(NumberWrapper);
        
        var $ = NumberWrapper.prototype;
        
        Object.defineProperties($, {
            value: {
                set: function(value) {
                    if (typeof value === "number") {
                        this._.value = isNaN(value) ? 0 : value;
                        __changeWithValue.call(this);
                    }
                },
                get: function() {
                    return this._.value;
                }
            }
        });
        
        return NumberWrapper;
    })();
    
    var BooleanWrapper = (function() {
        function BooleanWrapper(_args) {
            TimbreObject.call(this, 1, []);
            __fixKR(this);
            
            this.value = _args[0];
            
            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
            
            this.on("setAdd", __changeWithValue);
            this.on("setMul", __changeWithValue);
        }
        __extend(BooleanWrapper);
        
        var $ = BooleanWrapper.prototype;
        
        Object.defineProperties($, {
            value: {
                set: function(value) {
                    this._.value = value ? 1 : 0;
                    __changeWithValue.call(this);
                },
                get: function() {
                    return !!this._.value;
                }
            }
        });
        
        return BooleanWrapper;
    })();
    
    var FunctionWrapper = (function() {
        function FunctionWrapper(_args) {
            TimbreObject.call(this, 1, []);
            __fixKR(this);
            
            this.func    = _args[0];
            this._.value = 0;
            
            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
            
            this.on("setAdd", __changeWithValue);
            this.on("setMul", __changeWithValue);
        }
        __extend(FunctionWrapper);
        
        var $ = FunctionWrapper.prototype;
        
        Object.defineProperties($, {
            func: {
                set: function(value) {
                    if (typeof value === "function") {
                        this._.func = value;
                    }
                },
                get: function() {
                    return this._.func;
                }
            },
            args: {
                set: function(value) {
                    if (isArray(value)) {
                        this._.args = value;
                    } else {
                        this._.args = [value];
                    }
                },
                get: function() {
                    return this._.args;
                }
            }
        });
        
        $.bang = function() {
            var _ = this._;
            var args = slice.call(arguments).concat(_.args);
            var x = _.func.apply(this, args);
            if (typeof x === "number") {
                _.value = x;
                __changeWithValue.call(this);
            }
            this._.emit("bang");
            return this;
        };
        
        return FunctionWrapper;
    })();
    
    var ArrayWrapper = (function() {
        function ArrayWrapper(_args) {
            TimbreObject.call(this, 1, []);
            __fixKR(this);
            
            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
        }
        __extend(ArrayWrapper);
        
        var $ = ArrayWrapper.prototype;
        
        Object.defineProperties($, {
            
        });
        
        return ArrayWrapper;
    })();
    
    var ObjectWrapper = (function() {
        function ObjectWrapper(_args) {
            TimbreObject.call(this, 1, []);
            __fixKR(this);

            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
        }
        __extend(ObjectWrapper);
        
        var $ = ObjectWrapper.prototype;
        
        Object.defineProperties($, {
            
        });
        
        return ObjectWrapper;
    })();
    
    var SystemInlet = (function() {
        function SystemInlet(object) {
            TimbreObject.call(this, 2, []);
            if (object instanceof TimbreObject) {
                this.nodes.push(object);
            }
            
            var _ = this._;
            _.isPlaying = false;
            _.onplay  = make_onplay(this);
            _.onpause = make_onpause(this);
            
            this.on("append", onappend);
        }
        __extend(SystemInlet);

        var make_onplay = function(self) {
            return function() {
                if (_sys.inlets.indexOf(self) === -1) {
                    _sys.inlets.push(self);
                    _sys.events.emit("addObject");
                    self._.isPlaying = true;
                    self._.emit("play");
                }
            };
        };
        
        var make_onpause = function(self) {
            return function() {
                var i = _sys.inlets.indexOf(self);
                if (i !== -1) {
                    _sys.inlets.splice(i, 1);
                    self._.isPlaying = false;
                    self._.emit("pause");
                    _sys.events.emit("removeObject");
                }
            };
        };
        
        var onappend = function(list) {
            for (var i = 0, imax = list.length; i < imax; ++i) {
                list[i]._.dac = this;
            }
        };
        Object.defineProperty(onappend, "unremovable", {
            value:true, writable:false
        });
        
        var $ = SystemInlet.prototype;
        
        Object.defineProperties($, {
            dac: {
                get: __nop
            },
            isPlaying: {
                get: function() {
                    return this._.isPlaying;
                }
            }
        });
        
        $.play = function() {
            _sys.nextTick(this._.onplay);
            return this;
        };
        
        $.pause = function() {
            _sys.nextTick(this._.onpause);
            return this;
        };
        
        $.process = function(tickID) {
            var _ = this._;
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var nodes = this.nodes;
            var i, imax = nodes.length;
            var j, jmax = cellL.length;
            var add = _.add, mul = _.mul;
            var tmp, tmpL, tmpR, x;
            
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                
                for (j = 0; j < jmax; ++j) {
                    cellL[j] = cellR[j] = 0;
                }
                
                for (i = 0; i < imax; ++i) {
                    tmp = nodes[i];
                    tmp.process(tickID);
                    tmpL = tmp.cells[1];
                    tmpR = tmp.cells[2];
                    for (j = 0; j < jmax; ++j) {
                        cellL[j] += tmpL[j];
                        cellR[j] += tmpR[j];
                    }
                }
                for (j = 0; j < jmax; ++j) {
                    x  = cellL[j] = cellL[j] * mul + add;
                    x += cellR[j] = cellR[j] * mul + add;
                }
            }
            
            return this;
        };
        
        return SystemInlet;
    })();
    
    var SoundSystem = (function() {
        
        function SoundSystem() {
            this._ = {};
            this.context = this;
            this.tickID = 0;
            this.impl = null;
            this.amp  = 0.8;
            this.status = STATUS_NONE;
            this.samplerate = 44100;
            this.channels   = 2;
            this.cellsize   = 128;
            this.streammsec = 20;
            this.streamsize = 0;
            this.currentTime = 0;
            this.currentTimeIncr = 0;
            this.nextTicks = [];
            this.inlets    = [];
            this.timers    = [];
            this.listeners = [];
            
            this._.deferred = null;
            this.recStart   = 0;
            this.recBuffers = null;
            this.delayProcess = make_delayProcess(this);

            var self = this;
            modules.ready("events", function() {
                self.events = new modules.EventEmitter(self);
                self.reset();
            });
        }

        var make_delayProcess = function(self) {
            return function() {
                self.recStart = +new Date();
                self.process();
            };
        };
        
        var ACCEPT_SAMPLERATES = [
            8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000
        ];
        var ACCEPT_CELLSIZES = [
            32,64,128,256
        ];
        
        var $ = SoundSystem.prototype;
        
        $.bind = function(Klass, opts) {
            if (typeof Klass === "function") {
                var player = new Klass(this, opts);
                if (typeof player.play  === "function" &&
                    typeof player.pause === "function")
                {
                    this.impl = player;
                    if (this.impl.defaultSamplerate) {
                        this.samplerate = this.impl.defaultSamplerate;
                    }
                }
                
            }
            return this;
        };
        
        $.setup = function(params) {
            if (typeof params === "object") {
                if (ACCEPT_SAMPLERATES.indexOf(params.samplerate) !== -1) {
                    if (params.samplerate <= this.impl.maxSamplerate) {
                        this.samplerate = params.samplerate;
                    } else {
                        this.samplerate = this.impl.maxSamplerate;
                    }
                }
                if (ACCEPT_CELLSIZES.indexOf(params.cellsize) !== -1) {
                    this.cellsize = params.cellsize;
                }
                if (typeof params.f64 !== "undefined") {
                    _f64mode = !!params.f64;
                    if (_f64mode) {
                        fn.SignalArray = Float64Array;
                    } else {
                        fn.SignalArray = Float32Array;
                    }
                }
            }
            return this;
        };
        
        $.getAdjustSamples = function(samplerate) {
            var samples, bits;
            samplerate = samplerate || this.samplerate;
            samples = this.streammsec / 1000 * samplerate;
            bits = Math.ceil(Math.log(samples) * Math.LOG2E);
            bits = (bits < 8) ? 8 : (bits > 14) ? 14 : bits;
            return 1 << bits;
        };
        
        $.play = function() {
            if (this.status === STATUS_NONE) {
                this.status = STATUS_PLAY;
                this.currentTimeIncr = this.cellsize * 1000 / this.samplerate;
                
                this.streamsize = this.getAdjustSamples();
                this.strmL = new fn.SignalArray(this.streamsize);
                this.strmR = new fn.SignalArray(this.streamsize);
                
                this.impl.play();
                this.events.emit("play");
            }
            return this;
        };
        
        $.pause = function() {
            if (this.status === STATUS_PLAY) {
                this.status = STATUS_NONE;
                this.impl.pause();
                this.events.emit("pause");
            }
            return this;
        };
        
        $.reset = function(deep) {
            if (deep) {
                this._.events = null;
            }
            this.currentTime = 0;
            this.nextTicks = [];
            this.inlets    = [];
            this.timers    = [];
            this.listeners = [];
            this.events.on("addObject", function() {
                if (this.status === STATUS_NONE) {
                    if (this.inlets.length > 0 || this.timers.length > 0 || this.listeners.length > 0) {
                        this.play();
                    }
                }
            });
            this.events.on("removeObject", function() {
                if (this.status === STATUS_PLAY) {
                    if (this.inlets.length === 0 && this.timers.length === 0 && this.listeners.length === 0) {
                        this.pause();
                    }
                }
            });
            return this;
        };
        
        $.process = function() {
            var tickID = this.tickID;
            var strmL = this.strmL, strmR = this.strmR;
            var amp = this.amp;
            var x, tmpL, tmpR;
            var i, imax = this.streamsize, saved_i = 0;
            var j, jmax;
            var k, kmax = this.cellsize;
            var n = this.streamsize / this.cellsize;
            var nextTicks;
            var timers    = this.timers;
            var inlets    = this.inlets;
            var listeners = this.listeners;
            var currentTimeIncr = this.currentTimeIncr;
            
            for (i = 0; i < imax; ++i) {
                strmL[i] = strmR[i] = 0;
            }
            
            while (n--) {
                ++tickID;
                
                for (j = 0, jmax = timers.length; j < jmax; ++j) {
                    timers[j].process(tickID);
                }
                
                for (j = 0, jmax = inlets.length; j < jmax; ++j) {
                    x = inlets[j];
                    x.process(tickID);
                    tmpL = x.cells[1];
                    tmpR = x.cells[2];
                    for (k = 0, i = saved_i; k < kmax; ++k, ++i) {
                        strmL[i] += tmpL[k];
                        strmR[i] += tmpR[k];
                    }
                }
                saved_i = i;
                
                for (j = 0, jmax = listeners.length; j < jmax; ++j) {
                    listeners[j].process(tickID);
                }
                
                this.currentTime += currentTimeIncr;
                
                nextTicks = this.nextTicks.splice(0);
                for (j = 0, jmax = nextTicks.length; j < jmax; ++j) {
                    nextTicks[j].call(null);
                }
            }
            
            for (i = 0; i < imax; ++i) {
                x = strmL[i] * amp;
                x = (x < -1) ? -1 : (x > 1) ? 1 : x;
                strmL[i] = x;
                x = strmR[i] * amp;
                x = (x < -1) ? -1 : (x > 1) ? 1 : x;
                strmR[i] = x;
            }
            
            this.tickID = tickID;
            
            var currentTime = this.currentTime;
            
            if (this.status === STATUS_REC) {
                if (this.recCh === 2) {
                    this.recBuffers.push(new fn.SignalArray(strmL));
                    this.recBuffers.push(new fn.SignalArray(strmR));
                } else {
                    var strm = new fn.SignalArray(strmL.length);
                    for (i = 0, imax = strm.length; i < imax; ++i) {
                        strm[i] = (strmL[i] + strmR[i]) * 0.5;
                    }
                    this.recBuffers.push(strm);
                }
                
                if (currentTime >= this.maxDuration) {
                    this._.deferred.sub.reject();
                } else if (currentTime >= this.recDuration) {
                    this._.deferred.sub.resolve();
                } else {
                    var now = +new Date();
                    if ((now - this.recStart) > 20) {
                        setTimeout(this.delayProcess, 10);
                    } else {
                        this.process();
                    }
                }
            }
        };
        
        $.nextTick = function(func) {
            if (this.status === STATUS_NONE) {
                func();
            } else {
                this.nextTicks.push(func);
            }
        };
        
        $.rec = function() {
            fn.fix_iOS6_1_problem(true);
            
            var dfd = new modules.Deferred(this);
            
            if (this._.deferred) {
                console.warn("rec deferred is exists??");
                return dfd.reject().promise();
            }
            
            if (this.status !== STATUS_NONE) {
                console.log("status is not none", this.status);
                return dfd.reject().promise();
            }
            
            var i = 0, args = arguments;
            var opts = isDictionary(args[i]) ? args[i++] : {};
            var func = args[i];
            
            if (typeof func !== "function") {
                // throw error??
                console.warn("no function");
                return dfd.reject().promise();
            }
            
            this._.deferred = dfd;
            this.status = STATUS_REC;
            this.reset();
            
            var rec_inlet = new SystemInlet();
            var inlet_dfd = new modules.Deferred(this);
            
            var outlet = {
                done: function() {
                    inlet_dfd.resolve.apply(inlet_dfd, slice.call(arguments));
                },
                send: function() {
                    rec_inlet.append.apply(rec_inlet, arguments);
                }
            };

            var self = this;
            inlet_dfd.then(recdone, function() {
                fn.fix_iOS6_1_problem(false);
                recdone.call(self, true);
            });
            
            this._.deferred.sub = inlet_dfd;
            
            this.savedSamplerate = this.samplerate;
            this.samplerate  = opts.samplerate  || this.samplerate;
            this.recDuration = opts.recDuration || Infinity;
            this.maxDuration = opts.maxDuration || 10 * 60 * 1000;
            this.recCh = opts.ch || 1;
            if (this.recCh !== 2) {
                this.recCh = 1;
            }
            this.recBuffers = [];
            
            this.currentTimeIncr = this.cellsize * 1000 / this.samplerate;
            
            this.streamsize = this.getAdjustSamples();
            this.strmL = new fn.SignalArray(this.streamsize);
            this.strmR = new fn.SignalArray(this.streamsize);
            
            this.inlets.push(rec_inlet);
            
            func(outlet);
            
            setTimeout(this.delayProcess, 10);
            
            return dfd.promise();
        };
        
        var recdone = function() {
            this.status = STATUS_NONE;
            this.reset();
            
            var recBuffers = this.recBuffers;
            var samplerate = this.samplerate;
            var streamsize = this.streamsize;
            var bufferLength;
            
            this.samplerate = this.savedSamplerate;
            
            if (this.recDuration !== Infinity) {
                bufferLength = (this.recDuration * samplerate * 0.001)|0;
            } else {
                bufferLength = (recBuffers.length >> (this.recCh-1)) * streamsize;
            }
            
            var result;
            var i, imax = (bufferLength / streamsize)|0;
            var j = 0, k = 0;
            var remaining = bufferLength;
            
            if (this.recCh === 2) {
                var L = new fn.SignalArray(bufferLength);
                var R = new fn.SignalArray(bufferLength);
                
                for (i = 0; i < imax; ++i) {
                    L.set(recBuffers[j++], k);
                    R.set(recBuffers[j++], k);
                    k += streamsize;
                    remaining -= streamsize;
                    if (remaining > 0 && remaining < streamsize) {
                        L.set(recBuffers[j++].subarray(0, remaining), k);
                        R.set(recBuffers[j++].subarray(0, remaining), k);
                        break;
                    }
                }
                result = {
                    L: { buffer:L, samplerate:samplerate },
                    R: { buffer:R, samplerate:samplerate },
                    samplerate:samplerate
                };
                
            } else {
                var buffer = new fn.SignalArray(bufferLength);
                for (i = 0; i < imax; ++i) {
                    buffer.set(recBuffers[j++], k);
                    k += streamsize;
                    remaining -= streamsize;
                    if (remaining > 0 && remaining < streamsize) {
                        buffer.set(recBuffers[j++].subarray(0, remaining), k);
                        break;
                    }
                }
                result = { buffer: buffer, samplerate:samplerate };
            }
            
            var args = [].concat.apply([result], arguments);
            this._.deferred.resolve.apply(this._.deferred, args);
            this._.deferred = null;
        };
        
        // EventEmitter
        $.on = function(type, listeners) {
            this.events.on(type, listeners);
        };
        $.addListener = $.on;
        $.once = function(type, listeners) {
            this.events.once(type, listeners);
        };
        $.removeListener = function(type, listener) {
            this.events.removeListener(type, listener);
        };
        $.removeAllListeners = function(type) {
            this.events.removeListeners(type);
        };
        $.listeners = function(type) {
            return this.events.listeners(type);
        };
        
        $.fix_iOS6_1_problem = function(flag) {
            if (this.impl.fix_iOS6_1_problem) {
                this.impl.fix_iOS6_1_problem(flag);
            }
        };
        
        return SoundSystem;
    })();
    
    // player (borrowed from pico.js)
    var ImplClass = null;
    /*global webkitAudioContext:true */
    if (typeof webkitAudioContext !== "undefined") {
        ImplClass = function(sys) {
            var context = new webkitAudioContext();
            var bufSrc, jsNode;
            
            fn._audioContext = context;
            
            this.maxSamplerate     = context.sampleRate;
            this.defaultSamplerate = context.sampleRate;
            this.env = "webkit";
            
            var ua = navigator.userAgent;
            if (ua.match(/linux/i)) {
                sys.streammsec *= 8;
            } else if (ua.match(/win(dows)?\s*(nt 5\.1|xp)/i)) {
                sys.streammsec *= 4;
            }
            
            this.play = function() {
                var onaudioprocess;
                var jsn_streamsize = sys.getAdjustSamples(context.sampleRate);
                var sys_streamsize;
                var x, dx;
                
                if (sys.samplerate === context.sampleRate) {
                    onaudioprocess = function(e) {
                        var inL = sys.strmL, inR = sys.strmR,
                            outL = e.outputBuffer.getChannelData(0),
                            outR = e.outputBuffer.getChannelData(1),
                            i = outL.length;
                        sys.process();
                        while (i--) {
                            outL[i] = inL[i];
                            outR[i] = inR[i];
                        }
                    };
                } else {
                    sys_streamsize = sys.streamsize;
                    x  = sys_streamsize;
                    dx = sys.samplerate / context.sampleRate;
                    onaudioprocess = function(e) {
                        var inL = sys.strmL, inR = sys.strmR,
                            outL = e.outputBuffer.getChannelData(0),
                            outR = e.outputBuffer.getChannelData(1),
                            i, imax = outL.length;
                        
                        for (i = 0; i < imax; ++i) {
                            if (x >= sys_streamsize) {
                                sys.process();
                                x -= sys_streamsize;
                            }
                            outL[i] = inL[x|0];
                            outR[i] = inR[x|0];
                            x += dx;
                        }
                    };
                }
                
                bufSrc = context.createBufferSource();
                jsNode = context.createJavaScriptNode(jsn_streamsize, 2, sys.channels);
                jsNode.onaudioprocess = onaudioprocess;
                bufSrc.noteOn(0);
                bufSrc.connect(jsNode);
                jsNode.connect(context.destination);
            };
            
            this.pause = function() {
                bufSrc.disconnect();
                jsNode.disconnect();
            };
            
            if (_envmobile) {
                var n   = 0;
                var buf = context.createBufferSource();
                this.fix_iOS6_1_problem = function(flag) {
                    n += flag ? 1 : -1;
                    if (n === 1) {
                        buf.noteOn(0);
                        buf.connect(context.destination);
                    } else if (n === 0) {
                        buf.disconnect();
                    }
                };
            }
        };
    } else if (typeof Audio === "function" &&
               typeof (new Audio()).mozSetup === "function") {
        ImplClass = function(sys) {
            /*global URL:true */
            var timer = (function() {
                var source = "var t=0;onmessage=function(e){if(t)t=clearInterval(t),0;if(typeof e.data=='number'&&e.data>0)t=setInterval(function(){postMessage(0);},e.data);};";
                var blob = new Blob([source], {type:"text/javascript"});
                var path = URL.createObjectURL(blob);
                return new Worker(path);
            })();
            /*global URL:false */
            
            this.maxSamplerate     = 48000;
            this.defaultSamplerate = 44100;
            this.env = "moz";
            
            this.play = function() {
                var audio = new Audio();
                var interleaved = new Float32Array(sys.streamsize * sys.channels);
                var streammsec  = sys.streammsec;
                var written     = 0;
                var writtenIncr = sys.streamsize / sys.samplerate * 1000;
                var start = Date.now();
                
                var onaudioprocess = function() {
                    if (written > Date.now() - start) {
                        return;
                    }
                    var inL = sys.strmL;
                    var inR = sys.strmR;
                    var i = interleaved.length;
                    var j = inL.length;
                    sys.process();
                    while (j--) {
                        interleaved[--i] = inR[j];
                        interleaved[--i] = inL[j];
                    }
                    audio.mozWriteAudio(interleaved);
                    written += writtenIncr;
                };
                
                audio.mozSetup(sys.channels, sys.samplerate);
                timer.onmessage = onaudioprocess;
                timer.postMessage(streammsec);
            };
            
            this.pause = function() {
                timer.postMessage(0);
            };
        };
    } else {
        ImplClass = function() {
            this.maxSamplerate     = 48000;
            this.defaultSamplerate =  8000;
            this.env = "nop";
            this.play  = __nop;
            this.pause = __nop;
        };
    }
    /*global webkitAudioContext:false */
    
    _sys = new SoundSystem().bind(ImplClass);
    
    var exports = timbre;
    
    if (_envtype === "node") {
        module.exports = global.timbre = exports;
    } else if (_envtype === "browser") {
        exports.noConflict = (function() {
           var _t = window.timbre, _T = window.T;
            return function(deep) {
                if (window.T === exports) {
                    window.T = _T;
                }
                if (deep && window.timbre === exports) {
                    window.timbre = _t;
                }
                return exports;
            };
        })();
        
        window.timbre = window.T = exports;
    }
})();
