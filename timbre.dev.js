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
    
    var _ver = "13.01.20";
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
    var _usefunc = {};
    
    var timbre = function() {
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
            
        } else {
            instance._.isUndefined = false;
        }
        
        if (instance.isStereo === undefined) {
            Object.defineProperty(instance, "isStereo", {
                value:false, writable:false
            });
        }
        
        instance._.originkey = key;
        instance._.meta = __buildMetaData(instance);
        instance._.emit("init");
        
        return instance;
    }.bind(null);

    var __buildMetaData = function(instance) {
        var meta = instance._.meta;
        var names, desc;
        var p = instance;
        while (p !== null && p.constructor !== Object) {
            names = Object.getOwnPropertyNames(p);
            for (var i = names.length; i--; ) {
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
    
    timbre.removeListener = function(type, listener) {
        _sys.removeListener(type, listener);
        return timbre;
    };
    
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
    
    var __fixAR = function(object) {
        object._.ar = true;
        object._.aronly = true;
    };
    fn.fixAR = __fixAR;
    
    var __fixKR = function(object) {
        object._.ar = false;
        object._.kronly = true;
    };
    fn.fixKR = __fixKR;
    
    var __changeWithValue = function() {
        var _ = this._;
        var x = _.value * _.mul + _.add;
        if (isNaN(x)) {
            x = 0;
        }
        var cell = this.cell;
        for (var i = cell.length; i--; ) {
            cell[i] = x;
        }
    };
    Object.defineProperty(__changeWithValue, "unremovable", {
        value:true, writable:false
    });
    fn.changeWithValue = __changeWithValue;
    
    var __stereo = function(object) {
        object.L = new ChannelObject(object);
        object.R = new ChannelObject(object);
        object.cellL = object.L.cell;
        object.cellR = object.R.cell;
        Object.defineProperty(object, "isStereo", {
            value:true, writable:false
        });
    };
    fn.stereo = __stereo;
    
    var __timer = (function() {
        var start = function() {
            _sys.nextTick(onstart.bind(this));
            return this;
        };
        var onstart = function() {
            if (_sys.timers.indexOf(this) === -1) {
                _sys.timers.push(this);
                _sys.events.emit("addObject");
                this._.emit("start");
            }
        };
        var stop = function() {
            _sys.nextTick(onstop.bind(this));
            return this;
        };
        var onstop = function() {
            var i = _sys.timers.indexOf(this);
            if (i !== -1) {
                _sys.timers.splice(i, 1);
                this._.emit("stop");
                _sys.events.emit("removeObject");
            }
        };
        return function(object) {
            object.start = start;
            object.stop  = stop;
            return object;
        };
    })();
    fn.timer = __timer;

    var __listener = (function() {
        var listen = function() {
            if (arguments.length) {
                this.append.apply(this, arguments);
            }
            if (this.inputs.length) {
                _sys.nextTick(onlisten.bind(this));
            }
            return this;
        };
        var onlisten = function() {
            if (_sys.listeners.indexOf(this) === -1) {
                _sys.listeners.push(this);
                _sys.events.emit("addObject");
                this._.emit("listen");
            }
        };
        var unlisten = function() {
            if (arguments.length) {
                this.remove.apply(this, arguments);
            }
            if (!this.inputs.length) {
                _sys.nextTick(onunlisten.bind(this));
            }
            return this;
        };
        var onunlisten = function() {
            var i = _sys.listeners.indexOf(this);
            if (i !== -1) {
                _sys.listeners.splice(i, 1);
                this._.emit("unlisten");
                _sys.events.emit("removeObject");
            }
        };
        
        return function(object) {
            object.listen   = listen;
            object.unlisten = unlisten;
            return object;
        };
    })();
    fn.listener = __listener;
    
    var __onended = function(object, lastValue) {
        var cell = object.cell;
        var cellL, cellR;
        if (object.isStereo) {
            cellL = object.cellL;
            cellR = object.cellR;
        } else {
            cellL = cellR = cell;
        }
        if (typeof lastValue === "number") {
            for (var i = cell.length; i--; ) {
                cellL[i] = cellR[i] = cell[i] = lastValue;
            }
        }
        object._.isEnded = true;
        object._.emit("ended");
    };
    fn.onended = __onended;

    var __inputSignalAR = function(object) {
        var cell   = object.cell;
        var inputs = object.inputs;
        var i, imax = inputs.length;
        var j, jmax = cell.length;
        var tickID = object.tickID;
        var tmp;
        
        for (j = jmax; j--; ) {
            cell[j] = 0;
        }
        for (i = 0; i < imax; ++i) {
            tmp = inputs[i].process(tickID);
            for (j = jmax; j--; ) {
                cell[j] += tmp[j];
            }
        }
    };
    fn.inputSignalAR = __inputSignalAR;

    var __inputSignalKR = function(object) {
        var inputs = object.inputs;
        var i, imax = inputs.length;
        var tickID = object.tickID;
        var tmp = 0;
        for (i = 0; i < imax; ++i) {
            tmp += inputs[i].process(tickID)[0];
        }
        return tmp;
    };
    fn.inputSignalKR = __inputSignalKR;
    
    var __outputSignalAR = function(object) {
        var cell = object.cell;
        var mul = object._.mul, add = object._.add;
        for (var i = cell.length; i--; ) {
            cell[i] = cell[i] * mul + add;
        }
    };
    fn.outputSignalAR = __outputSignalAR;
    
    var __outputSignalKR = function(object) {
        var cell = object.cell;
        var mul = object._.mul, add = object._.add;
        var value = cell[0] * mul * add;
        for (var i = cell.length; i--; ) {
            cell[i] = value;
        }
    };
    fn.outputSignalKR = __outputSignalKR;
    
    
    
    // root object
    var TimbreObject = (function() {
        function TimbreObject(_args) {
            this._ = {}; // private members
            this._.events = new modules.EventEmitter(this);
            this._.emit   = this._.events.emit.bind(this._.events);
            
            if (isDictionary(_args[0])) {
                var params = _args.shift();
                this.once("init", function() {
                    this.set(params);
                });
            }
            
            this.tickID = -1;
            this.cell   = new Float32Array(_sys.cellsize);
            this.inputs = _args.map(timbre);
            
            this._.ar  = true;
            this._.mul = 1;
            this._.add = 0;
            this._.dac = null;
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
            return this.cell[0];
        };
        
        $.append = function() {
            if (arguments.length > 0) {
                var list = slice.call(arguments).map(timbre);
                this.inputs = this.inputs.concat(list);
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
                var j, inputs = this.inputs, list = [];
                for (var i = 0, imax = arguments.length; i < imax; ++i) {
                    if ((j = inputs.indexOf(arguments[i])) !== -1) {
                        list.push(inputs[j]);
                        inputs.splice(j, 1);
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
            var list = this.inputs.slice();
            this.inputs = [];
            if (list.length > 0) {
                this._.emit("remove", list);
            }
            return this;
        };

        $.removeAtIndex = function(index) {
            var item = this.inputs[index];
            if (item) {
                this.inputs.splice(index, 1);
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
        
        $.removeListener = function(type, listener) {
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
        
        $.process = function() {
            return this.cell;
        };
        
        $.play = function() {
            var dac = this._.dac;
            var emit = false;
            if (dac === null) {
                dac = this._.dac = new SystemInlet(this);
                emit = true;
            } else if (dac.inputs.indexOf(this) === -1) {
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
                if (dac.inputs.indexOf(this) !== -1) {
                    this._.dac = null;
                    dac.remove(this);
                    this._.emit("pause");
                }
                if (dac.inputs.length === 0) {
                    dac.pause();
                }
            }
            return this;
        };
        
        $.ar = function(value) {
            if (value === false) {
                this.kr(true);
            } else {
                if (!this._.kronly) {
                    this._.ar = true;
                    this._.emit("ar", true);
                }
            }
            return this;
        };
        
        $.kr = function(value) {
            if (value === false) {
                this.ar(true);
            } else {
                if (!this._.aronly) {
                    this._.ar = false;
                    this._.emit("ar", false);
                }
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
                
                var data  = _.plotData || this.cell;
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
            timbre.Object.call(this, []);
            __fixAR(this);
            
            this._.parent = parent;
        }
        __extend(ChannelObject);
        
        ChannelObject.prototype.process = function(tickID) {
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                this._.parent.process(tickID);
            }
            return this.cell;
        };
        
        return ChannelObject;
    })();
    timbre.ChannelObject = ChannelObject;
    
    var NumberWrapper = (function() {
        function NumberWrapper(_args) {
            TimbreObject.call(this, []);
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
            TimbreObject.call(this, []);
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
            TimbreObject.call(this, []);
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
            TimbreObject.call(this, []);
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
            TimbreObject.call(this, []);
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
            TimbreObject.call(this, []);
            if (object instanceof TimbreObject) {
                this.inputs.push(object);
            }
            __stereo(this);
            
            this._.isPlaying = false;
            
            this.on("append", onappend);
        }
        __extend(SystemInlet);
        
        var onappend = function(list) {
            for (var i = list.length; i--; ) {
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
            _sys.nextTick(onplay.bind(this));
            return this;
        };
        var onplay = function() {
            if (_sys.inlets.indexOf(this) === -1) {
                _sys.inlets.push(this);
                _sys.events.emit("addObject");
                this._.isPlaying = true;
                this._.emit("play");
            }
        };
        
        $.pause = function() {
            _sys.nextTick(onpause.bind(this));
            return this;
        };
        var onpause = function() {
            var i = _sys.inlets.indexOf(this);
            if (i !== -1) {
                _sys.inlets.splice(i, 1);
                this._.isPlaying = false;
                this._.emit("pause");
                _sys.events.emit("removeObject");
            }
        };
        
        $.process = function(tickID) {
            var _ = this._;
            var cell  = this.cell;
            var cellL = this.cellL;
            var cellR = this.cellR;
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var add = _.add, mul = _.mul;
            var tmp, tmpL, tmpR, x;
            
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                
                for (j = jmax; j--; ) {
                    cellL[j] = cellR[j] = cell[j] = 0;
                }
                
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i];
                    tmp.process(tickID);
                    if (tmp.isStereo) {
                        tmpL = tmp.cellL;
                        tmpR = tmp.cellR;
                    } else {
                        tmpL = tmpR = tmp.cell;
                    }
                    for (j = jmax; j--; ) {
                        cellL[j] += tmpL[j];
                        cellR[j] += tmpR[j];
                    }
                }
                for (j = jmax; j--; ) {
                    x  = cellL[j] = cellL[j] * mul + add;
                    x += cellR[j] = cellR[j] * mul + add;
                    cell[j] = x * 0.5;
                }
            }
            
            return cell;
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
            
            modules.ready("events", function() {
                this.events = new modules.EventEmitter(this);
                this.reset();
            }.bind(this));
        }
        
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
                this.strmL = new Float32Array(this.streamsize);
                this.strmR = new Float32Array(this.streamsize);
                
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
                    if (this.inlets.length > 0 || this.timers.length > 0) {
                        this.play();
                    }
                }
            });
            this.events.on("removeObject", function() {
                if (this.status === STATUS_PLAY) {
                    if (this.inlets.length === 0 && this.timers.length === 0) {
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
            
            for (i = imax; i--; ) {
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
                    tmpL = x.cellL;
                    tmpR = x.cellR;
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
            
            for (i = imax; i--; ) {
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
                    this.recBuffers.push(new Float32Array(strmL));
                    this.recBuffers.push(new Float32Array(strmR));
                } else {
                    var strm = new Float32Array(strmL.length);
                    for (i = strm.length; i--; ) {
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
                        setTimeout(delayProcess.bind(this), 10);
                    } else {
                        this.process();
                    }
                }
            }
        };
        
        var delayProcess = function() {
            this.recStart = +new Date();
            this.process();
        };
        
        $.nextTick = function(func) {
            if (this.status === STATUS_NONE) {
                func();
            } else {
                this.nextTicks.push(func);
            }
        };
        
        $.rec = function() {
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
            
            inlet_dfd.then(recdone, function() {
                recdone.call(this, true);
            }.bind(this));
            
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
            this.strmL = new Float32Array(this.streamsize);
            this.strmR = new Float32Array(this.streamsize);
            
            this.inlets.push(rec_inlet);
            
            func(outlet);
            
            setTimeout(delayProcess.bind(this), 10);
            
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
                var L = new Float32Array(bufferLength);
                var R = new Float32Array(bufferLength);
                
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
                var buffer = new Float32Array(bufferLength);
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
        
        return SoundSystem;
    })();
    
    // player (borrowed from pico.js)
    var ImplClass = null;
    if (typeof webkitAudioContext !== "undefined") {
        ImplClass = function(sys) {
            var context = new webkitAudioContext();
            var bufSrc, jsNode;
            
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
        };
    } else if (typeof Audio === "function" &&
               typeof (new Audio()).mozSetup === "function") {
        ImplClass = function(sys) {
            var timer = (function() {
                var source = "var t=0;onmessage=function(e){if(t)t=clearInterval(t),0;if(typeof e.data=='number'&&e.data>0)t=setInterval(function(){postMessage(0);},e.data);};";
                var blob = new Blob([source], {type:"text/javascript"});
                var path = URL.createObjectURL(blob);
                return new Worker(path);
            })();

            this.maxSamplerate     = 48000;
            this.defaultSamplerate = 44100;
            this.env = "moz";
            
            this.play = function() {
                var audio = new Audio();
                var onaudioprocess;
                var interleaved = new Float32Array(sys.streamsize * sys.channels);
                var interval = sys.streammsec;
                var written  = 0;
                var limit    = sys.streamsize << 4;
                
                if (navigator.userAgent.toLowerCase().indexOf("linux") !== -1) {
                    interval = sys.streamsize / sys.samplerate * 1000;
                    written  = -Infinity;
                }
                
                onaudioprocess = function() {
                    var offset = audio.mozCurrentSampleOffset();
                    if (written > offset + limit) {
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
                    written += audio.mozWriteAudio(interleaved);
                };
                
                audio.mozSetup(sys.channels, sys.samplerate);
                timer.onmessage = onaudioprocess;
                timer.postMessage(interval);
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
    
    _sys = new SoundSystem().bind(ImplClass);
    
    var exports = timbre;
    
    if (_envtype === "node") {
        module.exports = global.timbre = exports;
    } else if (_envtype === "browser") {
        if (typeof window.Float32Array === "undefined") {
            window.Float32Array = Array; // fake Float32Array (for IE9)
        }
        
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
(function() {
    "use strict";
    
    function EfxDelay(opts) {
        var bits = Math.ceil(Math.log(timbre.samplerate * 1.5) * Math.LOG2E);
        
        this.cell = new Float32Array(timbre.cellsize);
        
        this.time = 125;
        this.feedback  = 0.25;
        
        this.buffer = new Float32Array(1 << bits);
        this.mask   = (1 << bits) - 1;
        this.wet    = 0.45;
        
        this.readIndex  = 0;
        this.writeIndex = (this.time / 1000 * timbre.samplerate)|0;
        
        if (opts) {
            this.setParams(opts);
        }
    }

    var $ = EfxDelay.prototype;
    
    $.setParams = function(opts) {
        if (opts.time) {
            this.time = opts.time;
            this.writeIndex = this.readIndex + ((this.time * 0.001 * timbre.samplerate)|0);
        }
        if (opts.feedback) {
            this.feedback = opts.feedback;
        }
        if (opts.wet) {
            this.wet = opts.wet;
        }
        return this;
    };
    
    $.process = function(_cell, overwrite) {
        var cell;
        var buffer, writeIndex, readIndex, feedback;
        var value, wet, dry;
        var i, imax;

        cell   = this.cell;
        buffer = this.buffer;
        writeIndex = this.writeIndex;
        readIndex  = this.readIndex;
        feedback   = this.feedback;
        wet = this.wet;
        dry = 1 - this.wet;
        
        for (i = 0, imax = cell.length; i < imax; ++i) {
            value = buffer[readIndex];
            buffer[writeIndex] = _cell[i] - (value * feedback);
            cell[i] = (_cell[i] * dry) + (value * wet);
            writeIndex += 1;
            readIndex  += 1;
        }

        if (overwrite) {
            while (i--) {
                _cell[i] = cell[i];
            }
        }
        
        this.writeIndex = writeIndex & this.mask;
        this.readIndex  = readIndex  & this.mask;
        
        return cell;
    };
    
    timbre.modules.EfxDelay = EfxDelay;
    
})();
(function() {
    "use strict";
    
    function Biquad(samplerate) {
        this.samplerate = samplerate || 44100;
        this.frequency = 340;
        this.Q         = 1;
        this.gain      = 0;
        
        this.x1 = this.x2 = this.y1 = this.y2 = 0;
        this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
        
        this.setType("lpf");
    }
    
    var $ = Biquad.prototype;
    
    $.process = function(cell) {
        var x0, y0;
        var x1 = this.x1;
        var x2 = this.x2;
        var y1 = this.y1;
        var y2 = this.y2;
        
        var b0 = this.b0;
        var b1 = this.b1;
        var b2 = this.b2;
        var a1 = this.a1;
        var a2 = this.a2;
        
        for (var i = 0, imax = cell.length; i < imax; ++i) {
            x0 = cell[i];
            y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            cell[i] = (y0 < -1) ? -1 : (y0 > 1) ? 1 : y0;
            
            x2 = x1;
            x1 = x0;
            y2 = y1;
            y1 = y0;
        }
        
        // flushDenormalFloatToZero
        if ((x1 > 0 && x1 <  1e-4) || (x1 < 0 && x1 > -1e-4)) {
            x1 = 0;
        }
        if ((y1 > 0 && y1 <  1e-4) || (y1 < 0 && y1 > -1e-4)) {
            y1 = 0;
        }
        
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    };
    
    $.setType = function(type) {
        var f;
        if ((f = setParams[type])) {
            this.type = type;
            f.call(this, this.frequency, this.Q, this.gain);
        }
    };
    
    $.setParams = function(frequency, Q, dbGain) {
        this.frequency = frequency;
        this.Q = Q;
        this.gain = dbGain;
        
        var f = setParams[this.type];
        if (f) {
            f.call(this, frequency, Q, dbGain);
        }
        
        return this;
    };
    
    
    var setParams = {
        lowpass: function(cutoff, resonance) {
            cutoff /= (this.samplerate * 0.5);
            
            if (cutoff >= 1) {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else if (cutoff <= 0) {
                this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else {
                resonance = (resonance < 0) ? 0 : resonance;
                var g = Math.pow(10.0, 0.05 * resonance);
                var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) * 0.5);
                
                var theta = Math.PI * cutoff;
                var sn = 0.5 * d * Math.sin(theta);
                var beta = 0.5 * (1 - sn) / (1 + sn);
                var gamma = (0.5 + beta) * Math.cos(theta);
                var alpha = 0.25 * (0.5 + beta - gamma);
                
                this.b0 = 2 * alpha;
                this.b1 = 4 * alpha;
                this.b2 = this.b0; // 2 * alpha;
                this.a1 = 2 * -gamma;
                this.a2 = 2 * beta;
            }
        },
        highpass: function(cutoff, resonance) {
            cutoff /= (this.samplerate * 0.5);
            if (cutoff >= 1) {
                this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else if (cutoff <= 0) {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else {
                resonance = (resonance < 0) ? 0 : resonance;

                var g = Math.pow(10.0, 0.05 * resonance);
                var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) / 2);

                var theta = Math.PI * cutoff;
                var sn = 0.5 * d * Math.sin(theta);
                var beta = 0.5 * (1 - sn) / (1 + sn);
                var gamma = (0.5 + beta) * Math.cos(theta);
                var alpha = 0.25 * (0.5 + beta + gamma);
                
                this.b0 = 2 * alpha;
                this.b1 = -4 * alpha;
                this.b2 = this.b0; // 2 * alpha;
                this.a1 = 2 * -gamma;
                this.a2 = 2 * beta;
            }
        },
        bandpass: function(frequency, Q) {
            frequency /= (this.samplerate * 0.5);
            if (frequency > 0 && frequency < 1) {
                if (Q > 0) {
                    var w0 = Math.PI * frequency;
                    
                    var alpha = Math.sin(w0) / (2 * Q);
                    var k = Math.cos(w0);
                    
                    var ia0 = 1 / (1 + alpha);
                    
                    this.b0 = alpha * ia0;
                    this.b1 = 0;
                    this.b2 = -alpha * ia0;
                    this.a1 = -2 * k * ia0;
                    this.a2 = (1 - alpha) * ia0;
                } else {
                    this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
                }
            } else {
                this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
            }
        },
        lowshelf: function(frequency, _dummy_, dbGain) {
            frequency /= (this.samplerate * 0.5);

            var A = Math.pow(10.0, dbGain / 40);
            
            if (frequency >= 1) {
                this.b0 = A* A;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else if (frequency <= 0) {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else {
                var w0 = Math.PI * frequency;
                var S = 1; // filter slope (1 is max value)
                var alpha = 0.5 * Math.sin(w0) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
                var k = Math.cos(w0);
                var k2 = 2 * Math.sqrt(A) * alpha;
                var aPlusOne = A + 1;
                var aMinusOne = A - 1;
                
                var ia0 = 1 / (aPlusOne + aMinusOne * k + k2);
                
                this.b0 = (A * (aPlusOne - aMinusOne * k + k2)) * ia0;
                this.b1 = (2 * A * (aMinusOne - aPlusOne * k)) * ia0;
                this.b2 = (A * (aPlusOne - aMinusOne * k - k2)) * ia0;
                this.a1 = (-2 * (aMinusOne + aPlusOne * k)) * ia0;
                this.a2 = (aPlusOne + aMinusOne * k - k2) * ia0;
            }
        },
        highshelf: function(frequency, _dummy_, dbGain) {
            frequency /= (this.samplerate * 0.5);

            var A = Math.pow(10.0, dbGain / 40);

            if (frequency >= 1) {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else if (frequency <= 0) {
                this.b0 = A * A;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            } else {
                var w0 = Math.PI * frequency;
                var S = 1; // filter slope (1 is max value)
                var alpha = 0.5 * Math.sin(w0) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
                var k = Math.cos(w0);
                var k2 = 2 * Math.sqrt(A) * alpha;
                var aPlusOne = A + 1;
                var aMinusOne = A - 1;
                
                var ia0 = 1 / (aPlusOne - aMinusOne * k + k2);
                
                this.b0 = (A * (aPlusOne + aMinusOne * k + k2)) * ia0;
                this.b1 = (-2 * A * (aMinusOne + aPlusOne * k)) * ia0;
                this.b2 = (A * (aPlusOne + aMinusOne * k - k2)) * ia0;
                this.a1 = (2 * (aMinusOne - aPlusOne * k)) * ia0;
                this.a2 = (aPlusOne - aMinusOne * k - k2) * ia0;
            }
        },
        peaking: function(frequency, Q, dbGain) {
            frequency /= (this.samplerate * 0.5);

            if (frequency > 0 && frequency < 1) {
                var A = Math.pow(10.0, dbGain / 40);
                if (Q > 0) {
                    var w0 = Math.PI * frequency;
                    var alpha = Math.sin(w0) / (2 * Q);
                    var k = Math.cos(w0);
                    var ia0 = 1 / (1 + alpha / A);
                    
                    this.b0 = (1 + alpha * A) * ia0;
                    this.b1 = (-2 * k) * ia0;
                    this.b2 = (1 - alpha * A) * ia0;
                    this.a1 = this.b1; // (-2 * k) * ia0;
                    this.a2 = (1 - alpha / A) * ia0;
                } else {
                    this.b0 = A * A;
                    this.b1 = this.b2 = this.a1 = this.a2 = 0;
                }
            } else {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            }
        },
        notch: function(frequency, Q) {
            frequency /= (this.samplerate * 0.5);

            if (frequency > 0 && frequency < 1) {
                if (Q > 0) {
                    var w0 = Math.PI * frequency;
                    var alpha = Math.sin(w0) / (2 * Q);
                    var k = Math.cos(w0);
                    var ia0 = 1 / (1 + alpha);
                    
                    this.b0 = ia0;
                    this.b1 = (-2 * k) * ia0;
                    this.b2 = ia0;
                    this.a1 = this.b1; // (-2 * k) * ia0;
                    this.a2 = (1 - alpha) * ia0;
                } else {
                    this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
                }
            } else {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            }
        },
        allpass: function(frequency, Q) {
            frequency /= (this.samplerate * 0.5);

            if (frequency > 0 && frequency < 1) {
                if (Q > 0) {
                    var w0 = Math.PI * frequency;
                    var alpha = Math.sin(w0) / (2 * Q);
                    var k = Math.cos(w0);
                    var ia0 = 1 / (1 + alpha);
                    
                    this.b0 = (1 - alpha) * ia0;
                    this.b1 = (-2 * k) * ia0;
                    this.b2 = (1 + alpha) * ia0;
                    this.a1 = this.b1; // (-2 * k) * ia0;
                    this.a2 = this.b0; // (1 - alpha) * ia0;
                } else {
                    this.b0 = -1;
                    this.b1 = this.b2 = this.a1 = this.a2 = 0;
                }
            } else {
                this.b0 = 1;
                this.b1 = this.b2 = this.a1 = this.a2 = 0;
            }
        }
    };
    
    setParams.lpf = setParams.lowpass;
    setParams.hpf = setParams.highpass;
    setParams.bpf = setParams.bandpass;
    setParams.bef = setParams.notch;
    setParams.brf = setParams.notch;
    setParams.apf = setParams.allpass;
    
    timbre.modules.Biquad = Biquad;
    
})();
(function() {
    "use strict";
    
    var MaxPreDelayFrames     = 1024;
    var MaxPreDelayFramesMask = MaxPreDelayFrames - 1;
    var DefaultPreDelayFrames = 256;
    var kSpacingDb = 5;
    
    function Compressor(samplerate) {
        this.samplerate = samplerate || 44100;
        this.lastPreDelayFrames = 0;
        this.preDelayReadIndex  = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;
        this.ratio       = -1;
        this.slope       = -1;
        this.linearThreshold = -1;
        this.dbThreshold = -1;
        this.dbKnee      = -1;
        this.kneeThreshold    = -1;
        this.kneeThresholdDb  = -1;
        this.ykneeThresholdDb = -1;
        this.K = -1;
        
        this.attackTime  = 0.003;
        this.releaseTime = 0.25;
        
        this.preDelayTime = 0.006;
        this.dbPostGain   = 0;
        this.effectBlend  = 1;
        this.releaseZone1 = 0.09;
        this.releaseZone2 = 0.16;
        this.releaseZone3 = 0.42;
        this.releaseZone4 = 0.98;
        
        // Initializes most member variables
        
        this.detectorAverage = 0;
        this.compressorGain  = 1;
        this.meteringGain    = 1;
        
        // Predelay section.
        this.preDelayBuffer = new Float32Array(MaxPreDelayFrames);
        
        this.preDelayReadIndex = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;
        
        this.maxAttackCompressionDiffDb = -1; // uninitialized state
        
        this.meteringReleaseK = 1 - Math.exp(-1 / (this.samplerate * 0.325));
    }
    
    var $ = Compressor.prototype;
    
    $.setPreDelayTime = function(preDelayTime) {
        // Re-configure look-ahead section pre-delay if delay time has changed.
        var preDelayFrames = preDelayTime * this.samplerate;
        if (preDelayFrames > MaxPreDelayFrames - 1) {
            preDelayFrames = MaxPreDelayFrames - 1;
        }
        if (this.lastPreDelayFrames !== preDelayFrames) {
            this.lastPreDelayFrames = preDelayFrames;
            for (var i = this.preDelayBuffer.length; i--; ) {
                this.preDelayBuffer[i] = 0;
            }
            this.preDelayReadIndex = 0;
            this.preDelayWriteIndex = preDelayFrames;
        }
    };
    
    // Exponential curve for the knee.
    // It is 1st derivative matched at m_linearThreshold and asymptotically approaches the value m_linearThreshold + 1 / k.
    $.kneeCurve = function(x, k) {
    // Linear up to threshold.
        if (x < this.linearThreshold) {
            return x;
        }
        return this.linearThreshold + (1 - Math.exp(-k * (x - this.linearThreshold))) / k;
    };
    
    // Full compression curve with constant ratio after knee.
    $.saturate = function(x, k) {
        var y;
        
        if (x < this.kneeThreshold) {
            y = this.kneeCurve(x, k);
        } else {
            // Constant ratio after knee.
            // var xDb = linearToDecibels(x);
            var xDb = (x) ? 20 * Math.log(x) * Math.LOG10E : -1000;
            
            var yDb = this.ykneeThresholdDb + this.slope * (xDb - this.kneeThresholdDb);
            
            // y = decibelsToLinear(yDb);
            y = Math.pow(10, 0.05 * yDb);
        }
        
        return y;
    };
    
    // Approximate 1st derivative with input and output expressed in dB.
    // This slope is equal to the inverse of the compression "ratio".
    // In other words, a compression ratio of 20 would be a slope of 1/20.
    $.slopeAt = function(x, k) {
        if (x < this.linearThreshold) {
            return 1;
        }
        var x2 = x * 1.001;
        
        // var xDb  = linearToDecibels(x);
        var xDb  = (x ) ? 20 * Math.log(x ) * Math.LOG10E : -1000;
        // var xDb2 = linearToDecibels(x2);
        var x2Db = (x2) ? 20 * Math.log(x2) * Math.LOG10E : -1000;
        
        var y  = this.kneeCurve(x , k);
        var y2 = this.kneeCurve(x2, k);
        
        // var yDb  = linearToDecibels(y);
        var yDb  = (y ) ? 20 * Math.log(y ) * Math.LOG10E : -1000;
        // var yDb2 = linearToDecibels(y2);
        var y2Db = (y2) ? 20 * Math.log(y2) * Math.LOG10E : -1000;
        
        var m = (y2Db - yDb) / (x2Db - xDb);
        
        return m;
    };
    
    $.kAtSlope = function(desiredSlope) {
        var xDb = this.dbThreshold + this.dbKnee;
        // var x = decibelsToLinear(xDb);
        var x = Math.pow(10, 0.05 * xDb);
        
        // Approximate k given initial values.
        var minK = 0.1;
        var maxK = 10000;
        var k = 5;
        
        for (var i = 0; i < 15; ++i) {
            // A high value for k will more quickly asymptotically approach a slope of 0.
            var slope = this.slopeAt(x, k);
            
            if (slope < desiredSlope) {
                // k is too high.
                maxK = k;
            } else {
                // k is too low.
                minK = k;
            }
            
            // Re-calculate based on geometric mean.
            k = Math.sqrt(minK * maxK);
        }
        
        return k;
    };
    
    $.updateStaticCurveParameters = function(dbThreshold, dbKnee, ratio) {
        if (dbThreshold !== this.dbThreshold || dbKnee !== this.dbKnee || ratio !== this.ratio) {
            this.dbThreshold     = dbThreshold;
            // this.linearThreshold = decibelsToLinear(dbThreshold);
            this.linearThreshold = Math.pow(10, 0.05 * dbThreshold);
            this.dbKnee          = dbKnee;
            
            this.ratio = ratio;
            this.slope = 1 / this.ratio;
            
            var k = this.kAtSlope(1 / this.ratio);
            
            this.kneeThresholdDb = dbThreshold + dbKnee;
            // this.kneeThreshold = decibelsToLinear(this.kneeThresholdDb);
            this.kneeThreshold = Math.pow(10, 0.05 * this.kneeThresholdDb);
            
            var y = this.kneeCurve(this.kneeThreshold, k);
            // this.ykneeThresholdDb = linearToDecibels(y);
            this.ykneeThresholdDb = (y) ? 20 * Math.log(y ) * Math.LOG10E : -1000;
            
            this.K = k;
        }
        return this.K;
    };
    
    $.process = function(source, destination, dbThreshold, dbKnee, ratio) {
        var samplerate = this.samplerate;
        var dryMix = 1 - this.effectBlend;
        var wetMix = this.effectBlend;
        
        var k = this.updateStaticCurveParameters(dbThreshold, dbKnee, ratio);
        
        // Makeup gain.
        var fullRangeGain = this.saturate(1, k);
        var fullRangeMakeupGain = 1 / fullRangeGain;
        
        // Empirical/perceptual tuning.
        fullRangeMakeupGain = Math.pow(fullRangeMakeupGain, 0.6);
        
        // var masterLinearGain = decibelsToLinear(this.dbPostGain) * fullRangeMakeupGain;
        var masterLinearGain = Math.pow(10, 0.05 * this.dbPostGain) * fullRangeMakeupGain;
        
        // Attack parameters.
        var attackTime = Math.max(0.001, this.attackTime);
        var attackFrames = attackTime * samplerate;
        
        // Release parameters.
        var releaseFrames = samplerate * this.releaseTime;
        
        // Detector release time.
        var satReleaseTime = 0.0025;
        var satReleaseFrames = satReleaseTime * samplerate;
        
        // Create a smooth function which passes through four points.
        
        // Polynomial of the form
        // y = a + b*x + c*x^2 + d*x^3 + e*x^4;
        
        var y1 = releaseFrames * this.releaseZone1;
        var y2 = releaseFrames * this.releaseZone2;
        var y3 = releaseFrames * this.releaseZone3;
        var y4 = releaseFrames * this.releaseZone4;
        
        // All of these coefficients were derived for 4th order polynomial curve fitting where the y values
        // match the evenly spaced x values as follows: (y1 : x == 0, y2 : x == 1, y3 : x == 2, y4 : x == 3)
        var kA = 0.9999999999999998*y1 + 1.8432219684323923e-16*y2 - 1.9373394351676423e-16*y3 + 8.824516011816245e-18*y4;
        var kB = -1.5788320352845888*y1 + 2.3305837032074286*y2 - 0.9141194204840429*y3 + 0.1623677525612032*y4;
        var kC = 0.5334142869106424*y1 - 1.272736789213631*y2 + 0.9258856042207512*y3 - 0.18656310191776226*y4;
        var kD = 0.08783463138207234*y1 - 0.1694162967925622*y2 + 0.08588057951595272*y3 - 0.00429891410546283*y4;
        var kE = -0.042416883008123074*y1 + 0.1115693827987602*y2 - 0.09764676325265872*y3 + 0.028494263462021576*y4;
        
        // x ranges from 0 -> 3       0    1    2   3
        //                           -15  -10  -5   0db
        
        // y calculates adaptive release frames depending on the amount of compression.
        
        this.setPreDelayTime(this.preDelayTime);
        
        var nDivisionFrames = 64;
        
        var nDivisions = source.length / nDivisionFrames;
        
        var frameIndex = 0;
        for (var i = 0; i < nDivisions; ++i) {
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Calculate desired gain
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            
            // Fix gremlins.
            /*
            if (isNaN(this.detectorAverage)) {
                this.detectorAverage = 1;
            }
            if (this.detectorAverage === Infinity) {
                console.log("Infinity");
            }
            */
            var desiredGain = this.detectorAverage;
            
            // Pre-warp so we get desiredGain after sin() warp below.
            var scaledDesiredGain = Math.asin(desiredGain) / (0.5 * Math.PI);
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Deal with envelopes
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            
            // envelopeRate is the rate we slew from current compressor level to the desired level.
            // The exact rate depends on if we're attacking or releasing and by how much.
            var envelopeRate;
            
            var isReleasing = scaledDesiredGain > this.compressorGain;
            
            // compressionDiffDb is the difference between current compression level and the desired level.
            var x = this.compressorGain / scaledDesiredGain;
            
            // var compressionDiffDb = -linearToDecibels(x);
            var compressionDiffDb = (x) ? 20 * Math.log(x) * Math.LOG10E : -1000;
            
            if (isReleasing) {
                // Release mode - compressionDiffDb should be negative dB
                this.maxAttackCompressionDiffDb = -1;
                
                // Fix gremlins.
                /*
                if (isNaN(compressionDiffDb)) {
                    compressionDiffDb = -1;
                }
                if (compressionDiffDb === Infinity) {
                    compressionDiffDb = -1;
                }
                */
                
                // Adaptive release - higher compression (lower compressionDiffDb)  releases faster.
                
                // Contain within range: -12 -> 0 then scale to go from 0 -> 3
                x = compressionDiffDb;
                x = Math.max(-12.0, x);
                x = Math.min(0.0, x);
                x = 0.25 * (x + 12);
                
                // Compute adaptive release curve using 4th order polynomial.
                // Normal values for the polynomial coefficients would create a monotonically increasing function.
                var x2 = x * x;
                var x3 = x2 * x;
                var x4 = x2 * x2;
                var _releaseFrames = kA + kB * x + kC * x2 + kD * x3 + kE * x4;
                
                var _dbPerFrame = kSpacingDb / _releaseFrames;
                
                // envelopeRate = decibelsToLinear(_dbPerFrame);
                envelopeRate = Math.pow(10, 0.05 * _dbPerFrame);
            } else {
                // Attack mode - compressionDiffDb should be positive dB
                
                // Fix gremlins.
                /*
                if (isNaN(compressionDiffDb)) {
                    compressionDiffDb = 1;
                }
                if (compressionDiffDb === Infinity) {
                    compressionDiffDb = 1;
                }
                */
                // As long as we're still in attack mode, use a rate based off
                // the largest compressionDiffDb we've encountered so far.
                if (this.maxAttackCompressionDiffDb === -1 || this.maxAttackCompressionDiffDb < compressionDiffDb) {
                    this.maxAttackCompressionDiffDb = compressionDiffDb;
                }
                
                var effAttenDiffDb = Math.max(0.5, this.maxAttackCompressionDiffDb);
                
                x = 0.25 / effAttenDiffDb;
                envelopeRate = 1 - Math.pow(x, 1 / attackFrames);
            }
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Inner loop - calculate shaped power average - apply compression.
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            var preDelayReadIndex = this.preDelayReadIndex;
            var preDelayWriteIndex = this.preDelayWriteIndex;
            var detectorAverage = this.detectorAverage;
            var compressorGain = this.compressorGain;
            
            var loopFrames = nDivisionFrames;
            while (loopFrames--) {
                var compressorInput = 0;
                
                // Predelay signal, computing compression amount from un-delayed version.
                var delayBuffer = this.preDelayBuffer;
                var undelayedSource = source[frameIndex];
                delayBuffer[preDelayWriteIndex] = undelayedSource;
                
                var absUndelayedSource = undelayedSource > 0 ? undelayedSource : -undelayedSource;
                if (compressorInput < absUndelayedSource) {
                    compressorInput = absUndelayedSource;
                }
                
                // Calculate shaped power on undelayed input.

                var scaledInput = compressorInput;
                var absInput = scaledInput > 0 ? scaledInput : -scaledInput;
                
                // Put through shaping curve.
                // This is linear up to the threshold, then enters a "knee" portion followed by the "ratio" portion.
                // The transition from the threshold to the knee is smooth (1st derivative matched).
                // The transition from the knee to the ratio portion is smooth (1st derivative matched).
                var shapedInput = this.saturate(absInput, k);
                
                var attenuation = absInput <= 0.0001 ? 1 : shapedInput / absInput;
                
                var attenuationDb = (attenuation) ? -20 * Math.log(attenuation) * Math.LOG10E : 1000;
                attenuationDb = Math.max(2.0, attenuationDb);
                
                var dbPerFrame = attenuationDb / satReleaseFrames;
                
                // var satReleaseRate = decibelsToLinear(dbPerFrame) - 1;
                var satReleaseRate = Math.pow(10, 0.05 * dbPerFrame) - 1;
                
                var isRelease = (attenuation > detectorAverage);
                var rate = isRelease ? satReleaseRate : 1;
                
                detectorAverage += (attenuation - detectorAverage) * rate;
                detectorAverage = Math.min(1.0, detectorAverage);
                
                // Fix gremlins.
                /*
                if (isNaN(detectorAverage)) {
                    detectorAverage = 1;
                }
                if (detectorAverage === Infinity) {
                    detectorAverage = 1;
                }
                */
                // Exponential approach to desired gain.
                if (envelopeRate < 1) {
                    // Attack - reduce gain to desired.
                    compressorGain += (scaledDesiredGain - compressorGain) * envelopeRate;
                } else {
                    // Release - exponentially increase gain to 1.0
                    compressorGain *= envelopeRate;
                    compressorGain = Math.min(1.0, compressorGain);
                }
                
                // Warp pre-compression gain to smooth out sharp exponential transition points.
                var postWarpCompressorGain = Math.sin(0.5 * Math.PI * compressorGain);
                
                // Calculate total gain using master gain and effect blend.
                var totalGain = dryMix + wetMix * masterLinearGain * postWarpCompressorGain;
                
                // Calculate metering.
                var dbRealGain = 20 * Math.log(postWarpCompressorGain) * Math.LOG10E;
                if (dbRealGain < this.meteringGain)  {
                    this.meteringGain = dbRealGain;
                } else {
                    this.meteringGain += (dbRealGain - this.meteringGain) * this.meteringReleaseK;
                }
                // Apply final gain.
                delayBuffer = this.preDelayBuffer;
                destination[frameIndex] = delayBuffer[preDelayReadIndex] * totalGain;
                
                frameIndex++;
                preDelayReadIndex  = (preDelayReadIndex  + 1) & MaxPreDelayFramesMask;
                preDelayWriteIndex = (preDelayWriteIndex + 1) & MaxPreDelayFramesMask;
            }
            
            // Locals back to member variables.
            this.preDelayReadIndex = preDelayReadIndex;
            this.preDelayWriteIndex = preDelayWriteIndex;
            this.detectorAverage = (detectorAverage < 1e-6) ? 1e-6 : detectorAverage;
            this.compressorGain  = (compressorGain  < 1e-6) ? 1e-6 : compressorGain;
        }
    };
    
    $.reset = function() {
        this.detectorAverage = 0;
        this.compressorGain = 1;
        this.meteringGain = 1;
        
        // Predelay section.
        for (var i = this.preDelayBuffer.length; i--; ) {
            this.preDelayBuffer[i] = 0;
        }
        
        this.preDelayReadIndex = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;
        
        this.maxAttackCompressionDiffDb = -1; // uninitialized state
    };
    
    timbre.modules.Compressor = Compressor;
    
})();
(function() {
    "use strict";
    
    function Decoder() {}
    
    Decoder.prototype.decode = function(src, onloadedmetadata, onloadeddata) {
        if (timbre.envtype === "browser") {
            if (typeof src === "string") {
                if (/\.wav$/.test(src)) {
                    return wav_decoder(src, onloadedmetadata, onloadeddata);
                }
            }
            
            if (webkit_decoder) {
                return webkit_decoder(src, onloadedmetadata, onloadeddata);
            } else if (moz_decoder) {
                return moz_decoder(src, onloadedmetadata, onloadeddata);
            }
            
        } else if (timbre.envtype === "node") {
            if (typeof src === "string") {
                if (/\.wav$/.test(src)) {
                    return wav_decoder(src, onloadedmetadata, onloadeddata);
                } else if (/\.ogg$/.test(src)) {
                    return node_ogg_decoder(src, onloadedmetadata, onloadeddata);
                } else if (/\.mp3$/.test(src)) {
                    return node_mp3_decoder(src, onloadedmetadata, onloadeddata);
                }
            }
        }
        onloadedmetadata(false);
    };
    timbre.modules.Decoder = Decoder;
    
    var getBinaryWithPath = (timbre.envtype === "browser") ? function(path, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function() {
            if (xhr.status === 200) {
                callback(new Uint8Array(xhr.response));
            } else {
                callback(xhr.status + " " + xhr.statusText);
            }
        };
        xhr.send();
    }
    : (timbre.envtype === "node") ? function(path, callback) {
        var fs = require("fs");
        fs.readFile(path, function(err, data) {
            if (!err) {
                callback(new Uint8Array(data));
            } else {
                callback("can't read file");
            }
        });
    }
    : function(path, callback) {
        callback("no support");
    };
    
    
    var deinterleave = function(list) {
        var result = new list.constructor(list.length>>1);
        var i = list.length, j = result.length;
        if (i % 2) {
            i -= 1;
            j |= 0;
        }
        while (j) {
            result[--j] = (list[--i] + list[--i]) * 0.5;
        }
        return result;
    };
    
    var _24bit_to_32bit = function(uint8) {
        var b0, b1, b2, bb, x;
        var int32 = new Int32Array(uint8.length / 3);
        for (var i = 0, imax = uint8.length, j = 0; i < imax; ) {
            b0 = uint8[i++] ,b1 = uint8[i++], b2 = uint8[i++];
            bb = b0 + (b1 << 8) + (b2 << 16);
            x = (bb & 0x800000) ? -((bb^0xFFFFFF)+1) : bb;
            int32[j++] = x;
        }
        return int32;
    };
    
    var wav_decoder = function(src, onloadedmetadata, onloadeddata) {
        getBinaryWithPath(src, function(data) {
            if (data[0] !== 0x52 || data[1] !== 0x49 ||
                data[2] !== 0x46 || data[3] !== 0x46) { // 'RIFF'
                    // "HeaderError: not exists 'RIFF'"
                    return onloadedmetadata(false);
            }
            
            var l1 = data[4] + (data[5]<<8) + (data[6]<<16) + (data[7]<<24);
            if (l1 + 8 !== data.length) {
                // "HeaderError: invalid data size"
                return onloadedmetadata(false);
            }
            
            if (data[ 8] !== 0x57 || data[ 9] !== 0x41 ||
                data[10] !== 0x56 || data[11] !== 0x45) { // 'WAVE'
                    // "HeaderError: not exists 'WAVE'"
                    return onloadedmetadata(false);
            }
            
            if (data[12] !== 0x66 || data[13] !== 0x6D ||
                data[14] !== 0x74 || data[15] !== 0x20) { // 'fmt '
                    // "HeaderError: not exists 'fmt '"
                    return onloadedmetadata(false);
            }
            
            // var byteLength = data[16] + (data[17]<<8) + (data[18]<<16) + (data[19]<<24);
            // var linearPCM  = data[20] + (data[21]<<8);
            var channels   = data[22] + (data[23]<<8);
            var samplerate = data[24] + (data[25]<<8) + (data[26]<<16) + (data[27]<<24);
            // var dataSpeed  = data[28] + (data[29]<<8) + (data[30]<<16) + (data[31]<<24);
            // var blockSize  = data[32] + (data[33]<<8);
            var bitSize    = data[34] + (data[35]<<8);
            
            if (data[36] !== 0x64 || data[37] !== 0x61 ||
                data[38] !== 0x74 || data[39] !== 0x61) { // 'data'
                    // "HeaderError: not exists 'data'"
                    return onloadedmetadata(false);
            }
            
            var l2 = data[40] + (data[41]<<8) + (data[42]<<16) + (data[43]<<24);
            var duration = ((l2 / channels) >> 1) / samplerate;

            if (l2 > data.length - 44) {
                // "HeaderError: not exists data"
                return onloadedmetadata(false);
            }
            
            var buffer = new Float32Array((duration * samplerate)|0);
            
            onloadedmetadata({
                samplerate: samplerate,
                buffer    : buffer,
                duration  : duration
            });
            
            if (bitSize === 8) {
                data = new Int8Array(data.buffer, 44);
            } else if (bitSize === 16) {
                data = new Int16Array(data.buffer, 44);
            } else if (bitSize === 32) {
                data = new Int32Array(data.buffer, 44);
            } else if (bitSize === 24) {
                data = _24bit_to_32bit(new Uint8Array(data.buffer, 44));
            }
            
            if (channels === 2) {
                data = deinterleave(data);
            }
            
            var k = 1 / ((1 << (bitSize-1)) - 1);
            for (var i = buffer.length; i--; ) {
                buffer[i] = data[i] * k;
            }
            
            onloadeddata();
        });
    };
    
    
    var webkit_decoder = (function() {
        
        if (typeof webkitAudioContext !== "undefined") {
            var ctx = new webkitAudioContext();
            var _decode = function(data, onloadedmetadata, onloadeddata) {
                var samplerate, duration, buffer;
                if (typeof data === "string") {
                    return onloadeddata(false);
                }
                
                try {
                    buffer = ctx.createBuffer(data.buffer, true);
                } catch (e) {
                    return onloadedmetadata(false);
                }
                
                samplerate = ctx.sampleRate;
                buffer     = buffer.getChannelData(0);
                duration   = buffer.length / samplerate;
                
                onloadedmetadata({
                    samplerate: samplerate,
                    buffer    : buffer,
                    duration  : duration
                });
                
                onloadeddata();
            };
            
            return function(src, onloadedmetadata, onloadeddata) {
                if (src instanceof File) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        _decode(new Uint8Array(e.target.result),
                                onloadedmetadata, onloadeddata);
                    };
                    reader.readAsArrayBuffer(src);
                } else {
                    getBinaryWithPath(src, function(data) {
                        _decode(data,
                                onloadedmetadata, onloadeddata);
                    });
                }
            };
        }
    })();
    
    var moz_decoder = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(src, onloadedmetadata, onloadeddata) {
                var samplerate, duration, buffer;
                var writeIndex = 0;
                
                var audio = new Audio(src);
                audio.volume = 0.0;
                audio.speed  = 4;
                audio.addEventListener("loadedmetadata", function() {
                    samplerate = audio.mozSampleRate;
                    duration = audio.duration;
                    buffer = new Float32Array((audio.duration * samplerate)|0);
                    if (audio.mozChannels === 2) {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; i += 2) {
                                buffer[writeIndex++] = (samples[i] + samples[i+1]) * 0.5;
                            }
                        }, false);
                    } else {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; ++i) {
                                buffer[writeIndex++] = samples[i];
                            }
                        }, false);
                    }
                    audio.play();
                    setTimeout(function() {
                        onloadedmetadata({
                            samplerate: samplerate,
                            buffer    : buffer,
                            duration  : duration
                        });
                    }, 1000);
                }, false);
                audio.addEventListener("ended", function() {
                    onloadeddata();
                }, false);
                audio.load();
            };
        }
    })();
    
    var node_ogg_decoder = function(src, onloadedmetadata/*, onloadeddata*/) {
        onloadedmetadata(false);
    };
    
    var node_mp3_decoder = function(src, onloadedmetadata, onloadeddata) {
        var fs   = require("fs");
        var lame = require("lame");
        var decoder = new lame.Decoder();
        var bytes = [];
        var samplerate, duration, buffer;
        var channels, bitDepth;
        
        decoder.on("format", function(format) {
            // console.log("format", format);
            samplerate = format.sampleRate;
            channels   = format.channels;
            bitDepth   = format.bitDepth;
        });
        decoder.on("data", function(data) {
            for (var i = 0, imax = data.length; i < imax; ++i) {
                bytes.push(data[i]);
            }
        });
        decoder.on("end", function() {
            var length = bytes.length / channels / (bitDepth / 8);
            
            duration = length / samplerate;
            buffer = new Float32Array(length);
            
            var uint8 = new Uint8Array(bytes);
            var data;
            if (bitDepth === 16) {
                data = new Int16Array(uint8.buffer);
            } else if (bitDepth === 8) {
                data = new Int8Array(uint8.buffer);
            } else if (bitDepth === 24) {
                data = _24bit_to_32bit(uint8.buffer);
            }
            
            if (channels === 2) {
                data = deinterleave(data);
            }
            
            var k = 1 / ((1 << (bitDepth-1)) - 1);
            for (var i = buffer.length; i--; ) {
                buffer[i] = data[i] * k;
            }
            
            onloadedmetadata({
                samplerate: samplerate,
                buffer    : buffer,
                duration  : duration
            });

            
            onloadeddata();
        });
        fs.createReadStream(src).pipe(decoder);
    };
    
})();
(function() {
    "use strict";
    
    var slice = [].slice;
    var isDeferred = function(x) {
        return x && typeof x.promise === "function";
    };

    function Promise(object) {
        this.context = object.context;
        this.then = object.then;
        this.done = object.done.bind(object);
        this.fail = object.fail.bind(object);
        this.pipe = object.pipe.bind(object);
        this.always  = object.always.bind(object);
        this.promise = object.promise.bind(object);
        this.isResolved = object.isResolved.bind(object);
        this.isRejected = object.isRejected.bind(object);
    }
    
    function Deferred(context) {
        this.context = context || this;
        this._state = "pending";
        this._doneList = [];
        this._failList = [];
        
        this._promise = new Promise(this);
    }
    
    var $ = Deferred.prototype;
    
    var exec = function(statue, list, context, args) {
        if (this._state === "pending") {
            this._state = statue;
            for (var i = 0, imax = list.length; i < imax; ++i) {
                list[i].apply(context, args);
            }
            this._doneList = this._failList = null;
        }
    };
    
    $.resolve = function() {
        var args = slice.call(arguments, 0);
        exec.call(this, "resolved", this._doneList, this.context || this, args);
        return this;
    };
    $.resolveWith = function(context) {
        var args = slice.call(arguments, 1);
        exec.call(this, "resolved", this._doneList, context, args);
        return this;
    };
    $.reject = function() {
        var args = slice.call(arguments, 0);
        exec.call(this, "rejected", this._failList, this.context || this, args);
        return this;
    };
    $.rejectWith = function(context) {
        var args = slice.call(arguments, 1);
        exec.call(this, "rejected", this._failList, context, args);
        return this;
    };
    
    $.promise = function() {
        return this._promise;
    };
    $.done = function() {
        var args = slice.call(arguments);
        var isResolved = (this._state === "resolved");
        var isPending  = (this._state === "pending");
        var list = this._doneList;
        for (var i = 0, imax = args.length; i < imax; ++i) {
            if (typeof args[i] === "function") {
                if (isResolved) {
                    args[i]();
                } else if (isPending) {
                    list.push(args[i]);
                }
            }
        }
        return this;
    };
    $.fail = function() {
        var args = slice.call(arguments);
        var isRejected = (this._state === "rejected");
        var isPending  = (this._state === "pending");
        var list = this._failList;
        for (var i = 0, imax = args.length; i < imax; ++i) {
            if (typeof args[i] === "function") {
                if (isRejected) {
                    args[i]();
                } else if (isPending) {
                    list.push(args[i]);
                }
            }
        }
        return this;
    };
    $.always = function() {
        this.done.apply(this, arguments);
        this.fail.apply(this, arguments);
        return this;
    };
    $.then = function then(done, fail) {
        return this.done(done).fail(fail);
    };
    $.pipe = function(done, fail) {
        var dfd = new Deferred(this.context);
        
        this.done(function() {
            var res = done.apply(this.context, arguments);
            if (isDeferred(res)) {
                res.then(function() {
                    var args = slice.call(arguments);
                    dfd.resolveWith.apply(dfd, [res].concat(args));
                });
            } else {
                dfd.resolveWith(this, res);
            }
        }.bind(this));
        this.fail(function() {
            if (typeof fail === "function") {
                var res = fail.apply(this.context, arguments);
                if (isDeferred(res)) {
                    res.fail(function() {
                        var args = slice.call(arguments);
                        dfd.rejectWith.apply(dfd, [res].concat(args));
                    });
                }
            } else {
                dfd.reject.apply(dfd, arguments);
            }
        }.bind(this));
        
        return dfd.promise();
    };
    // $.then = $.pipe;

    $.isResolved = function() {
        return this._state === "resolved";
    };
    $.isRejected = function() {
        return this._state === "rejected";
    };
    $.state = function() {
        return this._state;
    };
    
    // TODO: test
    Deferred.when = function(subordinate) {
        var i = 0;
        var resolveValues = slice.call(arguments);
        var length    = resolveValues.length;
        var remaining = length;
        
        if (length === 1 && !isDeferred(subordinate)) {
            remaining = 0;
        }
        var deferred = (remaining === 1) ? subordinate : new Deferred();
        
        var updateFunc = function(i, results) {
            return function(value) {
                results[i] = arguments.length > 1 ? slice.call(arguments) : value;
                if (!(--remaining)) {
                    deferred.resolve.apply(deferred, results);
                }
            };
        };
        
        if (length > 1) {
            var resolveResults = new Array(length);
            for (; i < length; ++i) {
                if (resolveValues[i] && isDeferred(resolveValues[i])) {
                    resolveValues[i].promise().done(
                        updateFunc(i, resolveResults)
                    ).fail(deferred.reject.bind(deferred));
                } else {
                    resolveResults[i] = resolveValues[i];
                    --remaining;
                }
            }
        }
        
        if (!remaining) {
            deferred.resolve.apply(deferred, resolveValues);
        }
        
        return deferred.promise();
    };
    
    timbre.modules.Deferred = Deferred;
    
})();
(function() {
    "use strict";
    
    var timevalue = timbre.timevalue;
    
    function Envelope(samplerate) {
        this.samplerate = samplerate || 44100;
        this.table  = [];
        this.value  = ZERO;
        this.status = StatusWait;
        this.curve  = "linear";
        this.step   = 1;
        this.releaseNode = null;
        this.loopNode    = null;
        this.emit = null;
        
        this._endValue   = ZERO;
        this._initValue  = ZERO;
        this._curveType  = CurveTypeLin;
        this._curveValue = 0;
        this._defaultCurveType = CurveTypeLin;
        this._table      = [];
        this._index      = 0;
        this._counter    = 0;
        this._grow   = 0;
        
        this._a2 = 0;
        this._b1 = 0;
        this._y1 = 0;
        this._y2 = 0;
    }
    
    var ZERO           = Envelope.ZERO = 1e-6;
    var CurveTypeStep  = Envelope.CurveTypeStep  = 0;
    var CurveTypeLin   = Envelope.CurveTypeLin   = 1;
    var CurveTypeExp   = Envelope.CurveTypeExp   = 2;
    var CurveTypeSin   = Envelope.CurveTypeSin   = 3;
    var CurveTypeWel   = Envelope.CurveTypeWel   = 4;
    var CurveTypeCurve = Envelope.CurveTypeCurve = 5;
    var CurveTypeSqr   = Envelope.CurveTypeSqr   = 6;
    var CurveTypeCub   = Envelope.CurveTypeCub   = 7;
    
    var StatusWait    = Envelope.StatusWait    = 0;
    var StatusGate    = Envelope.StatusGate    = 1;
    var StatusSustain = Envelope.StatusSustain = 2;
    var StatusRelease = Envelope.StatusRelease = 3;
    var StatusEnd     = Envelope.StatusEnd     = 4;

    var CurveTypeDict = {
        lin:CurveTypeLin, linear     :CurveTypeLin,
        exp:CurveTypeExp, exponential:CurveTypeExp,
        sin:CurveTypeSin, sine       :CurveTypeSin,
        wel:CurveTypeWel, welch      :CurveTypeWel,
        sqr:CurveTypeSqr, squared    :CurveTypeSqr,
        cub:CurveTypeCub, cubed      :CurveTypeCub
    };
    
    var $ = Envelope.prototype;
    
    $.clone = function() {
        var new_instance = new Envelope(this.samplerate);
        new_instance.setTable(this.table);
        new_instance.setCurve(this.curve);
        if (this.releaseNode !== null) {
            new_instance.setReleaseNode(this.releaseNode + 1);
        }
        if (this.loopNode !== null) {
            new_instance.setLoopNode(this.loopNode + 1);
        }
        new_instance.step = this.step;
        return new_instance;
    };
    $.setTable = function(value) {
        if (Array.isArray(value)) {
            this.table = value;
            this._buildTable(value);
            this.value = this._initValue;
        }
    };
    $.setCurve = function(value) {
        if (typeof value === "number")  {
            this._defaultCurveType = CurveTypeCurve;
            this._curveValue = value;
            this.curve = value;
        } else {
            this._defaultCurveType = CurveTypeDict[value] || null;
            this.curve = value;
        }
    };
    $.setReleaseNode = function(value) {
        if (typeof value === "number" && value > 0) {
            this.releaseNode = value - 1;
        }
    };
    $.setLoopNode = function(value) {
        if (typeof value === "number" && value > 0) {
            this.loopNode = value - 1;
        }
    };
    $.reset = function() {
        this.value = this._initValue;
        this._index   = 0;
        this._counter = 0;
        this._curveType  = CurveTypeStep;
        this._grow   = 0;
        this.status = StatusWait;
    };
    $.release = function() {
        if (this.releaseNode !== null) {
            this._counter = 0;
            this.status = StatusRelease;
        }
    };
    $.getInfo = function(sustainTime) {
        var table = this._table;
        var i, imax;
        var totalDuration    = 0;
        var loopBeginTime    = Infinity;
        var releaseBeginTime = Infinity;
        var isEndlessLoop    = false;
        for (i = 0, imax = table.length; i < imax; ++i) {
            if (this.loopNode === i) {
                loopBeginTime = totalDuration;
            }
            if (this.releaseNode === i) {
                if (totalDuration < sustainTime) {
                    totalDuration += sustainTime;
                } else {
                    totalDuration  = sustainTime;
                }
                releaseBeginTime = totalDuration;
            }
            
            var items = table[i];
            if (Array.isArray(items)) {
                totalDuration += items[1];
            }
        }
        if (loopBeginTime !== Infinity && releaseBeginTime === Infinity) {
            totalDuration += sustainTime;
            isEndlessLoop = true;
        }
        
        return {
            totalDuration   : totalDuration,
            loopBeginTime   : loopBeginTime,
            releaseBeginTime: releaseBeginTime,
            isEndlessLoop   : isEndlessLoop
        };
    };
    $.next = function() {
        var n = this.step;
        var samplerate = this.samplerate;
        var status  = this.status;
        var index   = this._index;
        var table   = this._table;
        var endValue = this._endValue;
        var curveType   = this._curveType;
        var curveValue = this._curveValue;
        var defaultCurveType = this._defaultCurveType;
        var value   = this.value;
        var grow    = this._grow;
        var loopNode    = this.loopNode;
        var releaseNode = this.releaseNode;
        var counter = this._counter;
        var w, items, time;
        var a1;
        var a2 = this._a2;
        var b1 = this._b1;
        var y0;
        var y1 = this._y1;
        var y2 = this._y2;
        var emit = null;
        
        switch (status) {
        case StatusWait:
        case StatusEnd:
            break;
        case StatusGate:
        case StatusRelease:
            while (counter <= 0) {
                if (index >= table.length) {
                    if (status === StatusGate && loopNode !== null) {
                        index = loopNode;
                        continue;
                    }
                    status    = StatusEnd;
                    counter   = Infinity;
                    curveType = CurveTypeStep;
                    emit      = "ended";
                    continue;
                } else if (status === StatusGate && index === releaseNode) {
                    if (this.loopNode !== null && loopNode < releaseNode) {
                        index = loopNode;
                        continue;
                    }
                    status    = StatusSustain;
                    counter   = Infinity;
                    curveType = CurveTypeStep;
                    emit      = "sustained";
                    continue;
                }
                items = table[index++];
                
                endValue = items[0];
                if (items[2] === null) {
                    curveType = defaultCurveType;
                } else {
                    curveType = items[2];
                }
                if (curveType === CurveTypeCurve) {
                    curveValue = items[3];
                    if (Math.abs(curveValue) < 0.001) {
                        curveType = CurveTypeLin;
                    }
                }
                
                time = items[1];
                
                counter = ((time * 0.001 * samplerate) / n)|0;
                if (counter < 1) {
                    counter = 1;
                }
                
                switch (curveType) {
                case CurveTypeStep:
                    value = endValue;
                    break;
                case CurveTypeLin:
                    grow = (endValue - value) / counter;
                    break;
                case CurveTypeExp:
                    grow = Math.pow(
                        endValue / value, 1 / counter
                    );
                    break;
                case CurveTypeSin:
                    w = Math.PI / counter;
                    a2 = (endValue + value) * 0.5;
                    b1 = 2 * Math.cos(w);
                    y1 = (endValue - value) * 0.5;
                    y2 = y1 * Math.sin(Math.PI * 0.5 - w);
                    value = a2 - y1;
                    break;
                case CurveTypeWel:
                    w = (Math.PI * 0.5) / counter;
                    b1 = 2 * Math.cos(w);
                    if (endValue >= value) {
                        a2 = value;
                        y1 = 0;
                        y2 = -Math.sin(w) * (endValue - value);
                    } else {
                        a2 = endValue;
                        y1 = value - endValue;
                        y2 = Math.cos(w) * (value - endValue);
                    }
                    value = a2 + y1;
                    break;
                case CurveTypeCurve:
                    a1 = (endValue - value) / (1.0 - Math.exp(curveValue));
                    a2 = value + a1;
                    b1 = a1;
                    grow = Math.exp(curveValue / counter);
                    break;
                case CurveTypeSqr:
                    y1 = Math.sqrt(value);
                    y2 = Math.sqrt(endValue);
                    grow = (y2 - y1) / counter;
                    break;
                case CurveTypeCub:
                    y1 = Math.pow(value   , 0.33333333);
                    y2 = Math.pow(endValue, 0.33333333);
                    grow = (y2 - y1) / counter;
                    break;
                }
            }
            break;
        }
        
        switch (curveType) {
        case CurveTypeStep:
            value = endValue;
            break;
        case CurveTypeLin:
            value += grow;
            break;
        case CurveTypeExp:
            value *= grow;
            break;
        case CurveTypeSin:
            y0 = b1 * y1 - y2;
            value = a2 - y0;
            y2  = y1;
            y1  = y0;
            break;
        case CurveTypeWel:
            y0 = b1 * y1 - y2;
            value = a2 + y0;
            y2  = y1;
            y1  = y0;
            break;
        case CurveTypeCurve:
            b1 *= grow;
            value = a2 - b1;
            break;
        case CurveTypeSqr:
            y1 += grow;
            value = y1 * y1;
            break;
        case CurveTypeCub:
            y1 += grow;
            value = y1 * y1 * y1;
            break;
        }
        this.value = value || ZERO;
        
        this.status = status;
        this.emit   = emit;
        
        this._index = index;
        this._grow  = grow;
        this._endValue  = endValue;
        this._curveType = curveType;
        this._counter   = counter - 1;
        this._a2 = a2;
        this._b1 = b1;
        this._y1 = y1;
        this._y2 = y2;
        
        return this.value;
    };
    $._buildTable = function(list) {
        if (list.length === 0) {
            this._initValue = ZERO;
            this._table     = [];
            return;
        }
        
        this._initValue = list[0] || ZERO;
        this._table     = [];
        
        var table = this._table;
        var value, time, curveType, curveValue;
        for (var i = 1, imax = list.length; i < imax; ++i) {
            value = list[i][0] || ZERO;
            time  = list[i][1];
            curveType = list[i][2];
            
            if (typeof time !== "number") {
                if (typeof time === "string") {
                    time = timevalue(time);
                } else {
                    time = 10;
                }
            }
            if (time < 10) {
                time = 10;
            }
            
            if (typeof curveType === "number") {
                curveValue = curveType;
                curveType  = CurveTypeCurve;
            } else {
                curveType  = CurveTypeDict[curveType] || null;
                curveValue = 0;
            }
            table.push([value, time, curveType, curveValue]);
        }
    };
    
    timbre.modules.Envelope = Envelope;
    
})();
(function() {
    "use strict";
    
    var isArray = Array.isArray;
    var slice   = [].slice;
    
    function EventEmitter(context) {
        this.context = context;
        if (!this._) {
            this._ = {};
        }
    }
    
    var $ = EventEmitter.prototype;
    
    $.emit = function(type) {
        var _ = this._;
        
        if (!_.events) {
            return false;
        }
        
        var handler = _.events[type];
        if (!handler) {
            return false;
        }
        
        var args;
        
        if (typeof handler === "function") {
            switch (arguments.length) {
            case 1:
                handler.call(this.context);
                break;
            case 2:
                handler.call(this.context, arguments[1]);
                break;
            case 3:
                handler.call(this.context, arguments[1], arguments[2]);
                break;
            default:
                args = slice.call(arguments, 1);
                handler.apply(this.context, args);
            }
            return true;
        } else if (isArray(handler)) {
            args = slice.call(arguments, 1);
            var listeners = handler.slice();
            for (var i = 0, imax = listeners.length; i < imax; ++i) {
                if (listeners[i] instanceof timbre.Object) {
                    listeners[i].bang.apply(listeners[i], args);
                } else {
                    listeners[i].apply(this.context, args);
                }
            }
            return true;
        } else if (handler instanceof timbre.Object) {
            args = slice.call(arguments, 1);
            handler.bang.apply(handler, args);
        } else {
            return false;
        }
    };
    
    $.addListener = function(type, listener) {
        if (typeof listener !== "function" && !(listener instanceof timbre.Object)) {
            throw new Error("addListener takes instances of Function or timbre.Object");
        }
        var _ = this._;
        
        if (!_.events) {
            _.events = {};
        }
        
        if (!_.events[type]) {
            // Optimize the case of one listener. Don't need the extra array object.
            _.events[type] = listener;
        } else if (isArray(_.events[type])) {
            // If we've already got an array, just append.
            _.events[type].push(listener);
        } else {
            // Adding the second element, need to change to array.
            _.events[type] = [_.events[type], listener];
        }
        
        return this;
    };
    
    $.on = $.addListener;
    
    $.once = function(type, listener) {
        var self = this;
        var g;
        if (typeof listener === "function") {
            g = function () {
                self.removeListener(type, g);
                listener.apply(self.context, arguments);
            };
        } else if (listener instanceof timbre.Object) {
            g = function () {
                self.removeListener(type, g);
                listener.bang.apply(listener, arguments);
            };
        } else {
            throw new Error("once takes instances of Function or timbre.Object");
        }
        g.listener = listener;
        
        self.on(type, g);
        
        return this;
    };
    
    $.removeListener = function(type, listener) {
        if (typeof listener !== "function" && !(listener instanceof timbre.Object)) {
            throw new Error("removeListener takes instances of Function or timbre.Object");
        }
        var _ = this._;
        
        if (!_.events || !_.events[type]) {
            return this;
        }
        
        var list = _.events[type];
        
        if (isArray(list)) {
            var position = -1;
            for (var i = 0, imax = list.length; i < imax; ++i) {
                if (list[i] === listener ||
                    // once listener
                    (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }
            
            if (position < 0) {
                return this;
            }
            list.splice(position, 1);
            if (list.length === 0) {
                _.events[type] = null;
            }
        } else if (list === listener ||
                   // once listener
                   (list.listener && list.listener === listener)) {
            _.events[type] = null;
        }
        
        return this;
    };
    
    $.removeAllListeners = function(type) {
        var _ = this._;
        if (!_.events) {
            return this;
        }
        
        var remain = false;
        var listeners = _.events[type];
        if (isArray(listeners)) {
            for (var i = listeners.length; i--; ) {
                var listener = listeners[i];
                if (listener.unremovable) {
                    remain = true;
                    continue;
                }
                this.removeListener(type, listener);
            }
        } else if (listeners) {
            if (!listeners.unremovable) {
                this.removeListener(type, listeners);
            } else {
                remain = true;
            }
        }
        if (!remain) {
            _.events[type] = null;
        }
        
        return this;
    };
    
    $.listeners = function(type) {
        var _ = this._;
        if (!_.events || !_.events[type]) {
            return [];
        }
        var a, e = _.events[type];
        if (!isArray(e)) {
            return e.unremovable ? [] : [e];
        }
        e = e.slice();
        a = [];
        for (var i = 0, imax = e.length; i < imax; ++i) {
            if (!e[i].unremovable) {
                a.push(e[i]);
            }
        }
        return a;
    };
    
    timbre.modules.EventEmitter = EventEmitter;
    timbre.modules.ready.done("events");
    
})();
(function() {
    "use strict";
    
    function FFT(n) {
        n = (typeof n === "number") ? n : 512;
        n = 1 << Math.ceil(Math.log(n) * Math.LOG2E);
        
        this.length  = n;
        this.buffer  = new Float32Array(n);
        this.real    = new Float32Array(n);
        this.imag    = new Float32Array(n);
        this._real   = new Float32Array(n);
        this._imag   = new Float32Array(n);
        this.spectrum = new Float32Array(n>>1);
        
        var params = FFTParams.get(n);
        this._bitrev   = params.bitrev;
        this._sintable = params.sintable;
        this._costable = params.costable;
    }
    
    var $ = FFT.prototype;
    
    $.setWindow = function(key) {
        if (typeof key === "string") {
            var m = /([A-Za-z]+)(?:\(([01]\.?\d*)\))?/.exec(key);
            if (m !== null) {
                var name = m[1].toLowerCase(), a = m[2] !== undefined ? +m[2] : 0.25;
                var f = WindowFunctions[name];
                if (f) {
                    if (!this._window) {
                        this._window = new Float32Array(this.length);
                    }
                    var w = this._window, n = 0, N = this.length;
                    a = (a < 0) ? 0 : (a > 1) ? 1 : a;
                    for (; n < N; ++n) {
                        w[n] = f(n, N, a);
                    }
                    this.windowName = key;
                }
            }
        }
    };
    
    $.forward = function(_buffer) {
        var buffer = this.buffer;
        var real   = this.real;
        var imag   = this.imag;
        var window = this._window;
        var bitrev = this._bitrev;
        var sintable = this._sintable;
        var costable = this._costable;
        var n = buffer.length;
        var i, j, k, k2, h, d, c, s, ik, dx, dy;

        if (window) {
            for (i = n; i--; ) {
                buffer[i] = _buffer[i] * window[i];
            }
        } else {
            for (i = n; i--; ) {
                buffer[i] = _buffer[i];
            }
        }
        
        for (i = n; i--; ) {
            real[i] = buffer[bitrev[i]];
            imag[i] = 0.0;
        }
        
        for (k = 1; k < n; k = k2) {
            h = 0; k2 = k + k; d = n / k2;
            for (j = 0; j < k; j++) {
                c = costable[h];
                s = sintable[h];
                for (i = j; i < n; i += k2) {
                    ik = i + k;
                    dx = s * imag[ik] + c * real[ik];
                    dy = c * imag[ik] - s * real[ik];
                    real[ik] = real[i] - dx; real[i] += dx;
                    imag[ik] = imag[i] - dy; imag[i] += dy;
                }
                h += d;
            }
        }
        
        if (!this.noSpectrum) {
            var spectrum = this.spectrum;
            var rval, ival, mag;
            var max = 0;
            for (i = n; i--; ) {
                rval = real[i];
                ival = imag[i];
                mag  = n * Math.sqrt(rval * rval + ival * ival);
                spectrum[i] = mag;
                if (max < mag) {
                    max = mag;
                }
            }
            if (max > 0) {
                max = 1 / max;
                for (i = n; i--; ) {
                    spectrum[i] *= max;
                }
            }
        }
        
        return {real:real, imag:imag};
    };
    
    $.inverse = function(_real, _imag) {
        var buffer = this.buffer;
        var real   = this._real;
        var imag   = this._imag;
        var bitrev = this._bitrev;
        var sintable = this._sintable;
        var costable = this._costable;
        var n = buffer.length;
        var i, j, k, k2, h, d, c, s, ik, dx, dy;
        
        for (i = n; i--; ) {
            j = bitrev[i];
            real[i] = +_real[j];
            imag[i] = -_imag[j];
        }
        
        for (k = 1; k < n; k = k2) {
            h = 0; k2 = k + k; d = n / k2;
            for (j = 0; j < k; j++) {
                c = costable[h];
                s = sintable[h];
                for (i = j; i < n; i += k2) {
                    ik = i + k;
                    dx = s * imag[ik] + c * real[ik];
                    dy = c * imag[ik] - s * real[ik];
                    real[ik] = real[i] - dx; real[i] += dx;
                    imag[ik] = imag[i] - dy; imag[i] += dy;
                }
                h += d;
            }
        }
        
        for (i = n; i--; ) {
            buffer[i] = real[i] / n;
        }
        return buffer;
    };
    
    var FFTParams = {
        get: function(n) {
            return FFTParams[n] || (function() {
                var bitrev = (function() {
                    var x, i, j, k, n2;
                    x = new Int16Array(n);
                    n2 = n >> 1;
                    i = j = 0;
                    for (;;) {
                        x[i] = j;
                        if (++i >= n) {
                            break;
                        }
                        k = n2;
                        while (k <= j) {
                            j -= k;
                            k >>= 1;
                        }
                        j += k;
                    }
                    return x;
                }());
                var i, k = Math.floor(Math.log(n) / Math.LN2);
                var sintable = new Float32Array((1<<k)-1);
                var costable = new Float32Array((1<<k)-1);
                var PI2 = Math.PI * 2;
                
                for (i = sintable.length; i--; ) {
                    sintable[i] = Math.sin(PI2 * (i / n));
                    costable[i] = Math.cos(PI2 * (i / n));
                }
                return FFTParams[n] = {
                    bitrev: bitrev, sintable:sintable, costable:costable
                };
            }());
        }
    };
    
    var WindowFunctions = (function() {
        var PI   = Math.PI;
        var PI2  = Math.PI * 2;
        var abs  = Math.abs;
        var pow  = Math.pow;
        var cos  = Math.cos;
        var sin  = Math.sin;
        var sinc = function(x) { return sin(PI*x) / (PI*x); };
        var E    = Math.E;
        
        return {
            rectangular: function() {
                return 1;
            },
            hann: function(n, N) {
                return 0.5 * (1 - cos((PI2*n) / (N-1)));
            },
            hamming: function(n, N) {
                return 0.54 - 0.46 * cos((PI2*n) / (N-1));
            },
            tukery: function(n, N, a) {
                if ( n < (a * (N-1))/2 ) {
                    return 0.5 * ( 1 + cos(PI * (((2*n)/(a*(N-1))) - 1)) );
                } else if ( (N-1)*(1-(a/2)) < n ) {
                    return 0.5 * ( 1 + cos(PI * (((2*n)/(a*(N-1))) - (2/a) + 1)) );
                } else {
                    return 1;
                }
            },
            cosine: function(n, N) {
                return sin((PI*n) / (N-1));
            },
            lanczos: function(n, N) {
                return sinc(((2*n) / (N-1)) - 1);
            },
            triangular: function(n, N) {
                return (2/(N+1)) * (((N+1)/2) - abs(n - ((N-1)/2)));
            },
            bartlett: function(n, N) {
                return (2/(N-1)) * (((N-1)/2) - abs(n - ((N-1)/2)));
            },
            gaussian: function(n, N, a) {
                return pow(E, -0.5 * pow((n - (N-1) / 2) / (a * (N-1) / 2), 2));
            },
            bartlettHann: function(n, N) {
                return 0.62 - 0.48 * abs((n / (N-1)) - 0.5) - 0.38 * cos((PI2*n) / (N-1));
            },
            blackman: function(n, N, a) {
                var a0 = (1 - a) / 2, a1 = 0.5, a2 = a / 2;
                return a0 - a1 * cos((PI2*n) / (N-1)) + a2 * cos((4*PI*n) / (N-1));
            }
        };
    }());
    
    timbre.modules.FFT = FFT;
    
})();
(function() {
    "use strict";
    
    function Oscillator(samplerate) {
        this.samplerate = samplerate || 44100;
        
        this.wave = null;
        this.step = 1;
        this.frequency = 0;
        this.value = 0;
        
        this._phase = 0;
        this._coeff = TABLE_SIZE / this.samplerate;
    }
    
    var TABLE_SIZE = 1024;
    var TABLE_MASK = TABLE_SIZE - 1;
    
    var $ = Oscillator.prototype;
    
    $.setWave = function(value) {
        var i, dx, wave = this.wave;
        if (!this.wave) {
            this.wave = new Float32Array(TABLE_SIZE);
        }
        if (typeof value === "function") {
            for (i = 0; i < TABLE_SIZE; ++i) {
                wave[i] = value(i / TABLE_SIZE);
            }
        } else if (value instanceof Float32Array) {
            if (value.length === wave.length) {
                wave.set(value);
            } else {
                dx = value.length / TABLE_SIZE;
                for (i = 0; i < TABLE_SIZE; ++i) {
                    wave[i] = value[(i * dx)|0];
                }
            }
        } else if (typeof value === "string") {
            if ((dx = getWavetable(value)) !== undefined) {
                this.wave.set(dx);
                
            }
        }
    };
    
    $.reset = function() {
        this._phase = 0;
    };
    
    $.next = function() {
        var wave  = this.wave;
        var phase = this._phase;
        var coeff = this._coeff;
        var index = phase|0;
        this.value = wave[index & TABLE_MASK];
        phase += this.frequency * coeff * this.step;
        while (phase > TABLE_SIZE) {
            phase -= TABLE_SIZE;
        }
        this._phase = phase;
        return this.value;
    };
    
    $.process = function(cell) {
        var wave  = this.wave;
        var phase = this._phase;
        var index, delta, x0, x1, dx = this.frequency * this._coeff;
        for (var i = 0, imax = this.step; i < imax; ++i) {
            index = phase|0;
            delta = phase - index;
            x0 = wave[index & TABLE_MASK];
            x1 = wave[(index+1) & TABLE_MASK];
            cell[i] = ((1.0 - delta) * x0 + delta * x1);
            phase += dx;
        }
        while (phase > TABLE_SIZE) {
            phase -= TABLE_SIZE;
        }
        this._phase = phase;
        this.value = cell[cell.length - 1];
    };
    
    $.processWithFreqArray = function(cell, freqs) {
        var wave  = this.wave;
        var phase = this._phase;
        var coeff = this._coeff;
        var index, delta, x0, x1;
        for (var i = 0, imax = this.step; i < imax; ++i) {
            index = phase|0;
            delta = phase - index;
            x0 = wave[index & TABLE_MASK];
            x1 = wave[(index+1) & TABLE_MASK];
            cell[i] = ((1.0 - delta) * x0 + delta * x1);
            phase += freqs[i] * coeff;
        }
        while (phase > TABLE_SIZE) {
            phase -= TABLE_SIZE;
        }
        this._phase = phase;
        this.value = cell[cell.length - 1];
    };
    
    function waveshape(sign, name, shape, width) {
        var wave = Wavetables[name];
        var _wave;
        var i, imax, j, jmax;
        
        if (wave === undefined) {
            return;
        }
        
        if (typeof wave === "function") {
            wave = wave();
        }
        
        switch (shape) {
        case "@1":
            for (i = 512; i < 1024; ++i) {
                wave[i] = 0;
            }
            break;
        case "@2":
            for (i = 512; i < 1024; ++i) {
                wave[i] = Math.abs(wave[i]);
            }
            break;
        case "@3":
            for (i = 256; i <  512; ++i) {
                wave[i] = 0;
            }
            for (i = 512; i <  768; ++i) {
                wave[i] = Math.abs(wave[i]);
            }
            for (i = 768; i < 1024; ++i) {
                wave[i] = 0;
            }
            break;
        case "@4":
            _wave = new Float32Array(1024);
            for (i = 0; i < 512; ++i) {
                _wave[i] = wave[i<<1];
            }
            wave = _wave;
            break;
        case "@5":
            _wave = new Float32Array(1024);
            for (i = 0; i < 512; ++i) {
                _wave[i] = Math.abs(wave[i<<1]);
            }
            wave = _wave;
            break;
        }
        
        // duty-cycle
        if (width !== undefined && width !== 50) {
            width *= 0.01;
            width = (width < 0) ? 0 : (width > 1) ? 1 : width;
            
            _wave = new Float32Array(1024);
            imax = (1024 * width)|0;
            for (i = 0; i < imax; ++i) {
                _wave[i] = wave[(i / imax * 512)|0];
            }
            jmax = (1024 - imax);
            for (j = 0; i < 1024; ++i, ++j) {
                _wave[i] = wave[(j / jmax * 512 + 512)|0];
            }
            wave = _wave;
        }
        
        if (sign === "+") {
            for (i = 1024; i--; ) {
                wave[i] = wave[i] * 0.5 + 0.5;
            }
        } else if (sign === "-") {
            for (i = 1024; i--; ) {
                wave[i] *= -1;
            }
        }
        return wave;
    }
    
    function wavb(src) {
        var wave = new Float32Array(1024);
        var n = src.length >> 1;
        if ([2,4,8,16,32,64,128,256,512,1024].indexOf(n) !== -1) {
            
            for (var i = 0, k = 0; i < n; ++i) {
                var x = parseInt(src.substr(i * 2, 2), 16);
                
                x = (x & 0x80) ? (x-256) / 128.0 : x / 127.0;
                for (var j = 1024 / n; j--; ) {
                    wave[k++] = x;
                }
            }
        }
        return wave;
    }
    
    function wavc(src) {
        var wave = new Float32Array(1024);
            if (src.length === 8) {
            var color = parseInt(src, 16);
            var bar   = new Float32Array(8);
            var i, j;

            bar[0] = 1;
            for (i = 0; i < 7; ++i) {
                bar[i+1] = (color & 0x0f) * 0.0625; // 0.0625 = 1/16
                color >>= 4;
            }
            
            for (i = 0; i < 8; ++i) {
                var x = 0, dx = (i + 1) / 1024;
                for (j = 0; j < 1024; ++j) {
                    wave[j] += Math.sin(2 * Math.PI * x) * bar[i];
                    x += dx;
                }
            }
            
            var maxx = 0, absx;
            for (i = 1024; i--; ) {
                if (maxx < (absx = Math.abs(wave[i]))) {
                    maxx = absx;
                }
            }
            if (maxx > 0) {
                for (i = 1024; i--; ) {
                    wave[i] /= maxx;
                }
            }
        }
        return wave;
    }
    
    var getWavetable = function(key) {
        var wave = Wavetables[key];
        if (wave !== undefined) {
            if (typeof wave === "function") {
                wave = wave();
            }
            return wave;
        }
        
        var m;
        // wave shaping
        m = /^([\-+]?)(\w+)(?:\((@[0-7])?:?(\d+)?\))?$/.exec(key);
        if (m !== null) {
            var sign = m[1], name = m[2], shape = m[3], width = m[4];
            wave = waveshape(sign, name, shape, width);
            if (wave !== undefined) {
                return Wavetables[key] = wave;
            }
        }
        
        // wave bytes
        m = /^wavb\(((?:[0-9a-fA-F][0-9a-fA-F])+)\)$/.exec(key);
        if (m !== null) {
            return wavb(m[1]);
        }
        
        // wave color
        m = /^wavc\(([0-9a-fA-F]{8})\)$/.exec(key);
        if (m !== null) {
            return wavc(m[1]);
        }
        
        // warn message
    };
    Oscillator.getWavetable = getWavetable;
    
    var setWavetable = function(name, value) {
        var dx, wave = new Float32Array(1024);
        var i;
        if (typeof value === "function") {
            for (i = 0; i < 1024; ++i) {
                wave[i] = value(i / 1024);
            }
        } else if (value instanceof Float32Array) {
            if (value.length === wave.length) {
                wave.set(value);
            } else {
                dx = value.length / 1024;
                for (i = 0; i < 1024; ++i) {
                    wave[i] = value[(i * dx)|0];
                }
            }
        }
        Wavetables[name] = wave;
    };
    Oscillator.setWavetable = setWavetable;
    
    var Wavetables = {
        sin: function() {
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = Math.sin(2 * Math.PI * (i/1024));
            }
            return wave;
        },
        cos: function() {
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = Math.cos(2 * Math.PI * (i/1024));
            }
            return wave;
        },
        pulse: function() {
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = (i < 512) ? +1 : -1;
            }
            return wave;
        },
        tri: function() {
            var wave = new Float32Array(1024);
            for (var x, i = 1024; i--; ) {
                x = (i / 1024) - 0.25;
                wave[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
            }
            return wave;
        },
        saw: function() {
            var wave = new Float32Array(1024);
            for (var x, i = 1024; i--; ) {
                x = (i / 1024);
                wave[i] = +2.0 * (x - Math.round(x));
            }
            return wave;
        },
        fami: function() {
            var d = [ +0.000, +0.125, +0.250, +0.375, +0.500, +0.625, +0.750, +0.875,
                      +0.875, +0.750, +0.625, +0.500, +0.375, +0.250, +0.125, +0.000,
                      -0.125, -0.250, -0.375, -0.500, -0.625, -0.750, -0.875, -1.000,
                      -1.000, -0.875, -0.750, -0.625, -0.500, -0.375, -0.250, -0.125 ];
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = d[(i / 1024 * d.length)|0];
            }
            return wave;
        },
        konami: function() {
            var d = [-0.625, -0.875, -0.125, +0.750, + 0.500, +0.125, +0.500, +0.750,
                     +0.250, -0.125, +0.500, +0.875, + 0.625, +0.000, +0.250, +0.375,
                     -0.125, -0.750, +0.000, +0.625, + 0.125, -0.500, -0.375, -0.125,
                     -0.750, -1.000, -0.625, +0.000, - 0.375, -0.875, -0.625, -0.250 ];
            var wave = new Float32Array(1024);
            for (var i = 1024; i--; ) {
                wave[i] = d[(i / 1024 * d.length)|0];
            }
            return wave;
        }
    };
    
    timbre.modules.Oscillator = Oscillator;
    
})();
(function() {
    "use strict";
    
    var DummyBuffer = new Float32Array(60);
    
    function Scissor(soundbuffer) {
        return new Tape(soundbuffer);
    }
    
    var silencebuffer = {
        buffer:DummyBuffer, samplerate:1
    };
    
    Scissor.silence = function(duration) {
        return new Scissor(silencebuffer).slice(0, 1).fill(duration);
    };
    
    Scissor.join = function(tapes) {
        var new_instance = new Tape();
        
        for (var i = 0; i < tapes.length; i++) {
            if (tapes[i] instanceof Tape) {
                new_instance.add_fragments(tapes[i].fragments);
            }
        }
        
        return new_instance;
    };
    
    function Tape(soundbuffer) {
        this.fragments = [];
        if (soundbuffer) {
            var samplerate = soundbuffer.samplerate || 44100;
            var duration   = soundbuffer.buffer.length / samplerate;
            this.fragments.push(
                new Fragment(soundbuffer, 0, duration)
            );
        }
    }
    Scissor.Tape = Tape;
    
    Tape.prototype.add_fragment = function(fragment) {
        this.fragments.push(fragment);
        return this;
    };
    
    Tape.prototype.add_fragments = function(fragments) {
        for (var i = 0; i < fragments.length; i++) {
            this.fragments.push(fragments[i]);
        }
        return this;
    };

    Tape.prototype.duration = function() {
        var result = 0;
        for (var i = 0; i < this.fragments.length; i++) {
            result += this.fragments[i].duration();
        }
        return result;
    };
    
    Tape.prototype.slice = function(start, length) {
        var duration = this.duration();
        if (start + length > duration) {
            length = duration - start;
        }
        
        var new_instance  = new Tape();
        var remainingstart  = start;
        var remaininglength = length;
        
        for (var i = 0; i < this.fragments.length; i++) {
            var fragment = this.fragments[i];
            var items = fragment.create(remainingstart, remaininglength);
            var new_fragment = items[0];
            remainingstart  = items[1];
            remaininglength = items[2];
            if (new_fragment) {
                new_instance.add_fragment(new_fragment);
            }
            if (remaininglength === 0) {
                break;
            }
        }
        
        return new_instance;
    };
    Tape.prototype.cut = Tape.prototype.slice;
    
    Tape.prototype.concat = function(other) {
        var new_instance = new Tape();
        new_instance.add_fragments(this.fragments);
        new_instance.add_fragments(other.fragments);
        return new_instance;
    };
    
    Tape.prototype.loop = function(count) {
        var i;
        var orig_fragments = [];
        for (i = 0; i < this.fragments.length; i++) {
            orig_fragments.push(this.fragments[i].clone());
        }
        var new_instance = new Tape();
        for (i = 0; i < count; i++ ) {
            new_instance.add_fragments(orig_fragments);
        }
        return new_instance;
    };
    
    Tape.prototype.times = Tape.prototype.loop;

    Tape.prototype.split = function(count) {
        var splitted_duration = this.duration() / count;
        var results = [];
        for (var i = 0; i < count; i++) {
            results.push(this.slice(i * splitted_duration, splitted_duration));
        }
        return results;
    };
    
    Tape.prototype.fill = function(filled_duration) {
        var duration = this.duration();
        if (duration === 0) {
            throw "EmptyFragment";
        }
        var loop_count = (filled_duration / duration)|0;
        var remain = filled_duration % duration;
        
        return this.loop(loop_count).plus(this.slice(0, remain));
    };
    
    Tape.prototype.replace = function(start, length, replaced) {
        var new_instance = new Tape();
        var offset = start + length;

        new_instance = new_instance.plus(this.slice(0, start));

        var new_instance_duration = new_instance.duration();
        if (new_instance_duration < start) {
            new_instance = new_instance.plus(Scissor.silence(start-new_instance_duration));
        }
        
        new_instance = new_instance.plus(replaced);
        
        var duration = this.duration();
        if (duration > offset) {
            new_instance = new_instance.plus(this.slice(offset, duration - offset));
        }
        
        return new_instance;
    };

    Tape.prototype.reverse = function() {
        var new_instance = new Tape();

        for (var i = this.fragments.length; i--; ) {
            var fragment = this.fragments[i].clone();
            fragment.reverse = !fragment.isReversed();
            new_instance.add_fragment(fragment);
        }
        
        return new_instance;
    };
    
    Tape.prototype.pitch = function(pitch, stretch) {
        var new_instance = new Tape();
        
        stretch = stretch || false;
        for (var i = 0; i < this.fragments.length; i++) {
            var fragment = this.fragments[i].clone();
            fragment.pitch  *= pitch * 0.01;
            fragment.stretch = stretch;
            new_instance.add_fragment(fragment);
        }
        
        return new_instance;
    };

    Tape.prototype.stretch = function(factor) {
        var factor_for_pitch = 1 / (factor * 0.01) * 100;
        return this.pitch(factor_for_pitch, true);
    };

    Tape.prototype.pan = function(right_percent) {
        var new_instance = new Tape();

        for (var i = 0; i < this.fragments.length; i++) {
            var fragment = this.fragments[i].clone();
            fragment.pan = right_percent;
            new_instance.add_fragment(fragment);
        }
        
        return new_instance;
    };
    
    Tape.prototype.silence = function() {
        return Scissor.silence(this.duration());
    };
    
    Tape.prototype.join = function(tapes) {
        var new_instance = new Tape();
        
        for (var i = 0; i < tapes.length; i++) {
            if (tapes[i] instanceof Tape) {
                new_instance.add_fragments(tapes[i].fragments);
            }
        }
        
        return new_instance;
    };
    
    function Fragment(soundbuffer, start, duration, reverse, pitch, stretch, pan) {
        if (!soundbuffer) {
            soundbuffer = silencebuffer;
        }
        this.buffer     = soundbuffer.buffer;
        this.samplerate = soundbuffer.samplerate || 44100;
        this.start     = start;
        this._duration = duration;
        this.reverse = reverse || false;
        this.pitch   = pitch   || 100;
        this.stretch = stretch || false;
        this.pan     = pan     || 50;
    }
    
    Fragment.prototype.duration = function() {
        return this._duration * (100 / this.pitch);
    };
    Fragment.prototype.original_duration = function() {
        return this._duration;
    };
    Fragment.prototype.isReversed = function() {
        return this.reverse;
    };
    Fragment.prototype.isStretched = function() {
        return this.stretched;
    };
    Fragment.prototype.create = function(remaining_start, remaining_length) {
        var duration = this.duration();
        if (remaining_start >= duration) {
            return [null, remaining_start - duration, remaining_length];
        }
        
        var have_remain_to_retuen = (remaining_start + remaining_length) >= duration;
        
        var new_length;
        if (have_remain_to_retuen) {
            new_length = duration - remaining_start;
            remaining_length -= new_length;
        } else {
            new_length = remaining_length;
            remaining_length = 0;
        }
        
        var new_fragment = this.clone();
        new_fragment.start     = this.start + remaining_start * this.pitch * 0.01;
        new_fragment._duration = new_length * this.pitch * 0.01;
        new_fragment.reverse   = false;
        return [new_fragment, 0, remaining_length];
    };

    Fragment.prototype.clone = function() {
        var new_instance = new Fragment();
        new_instance.buffer     = this.buffer;
        new_instance.samplerate = this.samplerate;
        new_instance.start     = this.start;
        new_instance._duration = this._duration;
        new_instance.reverse   = this.reverse;
        new_instance.pitch     = this.pitch;
        new_instance.stretch   = this.stretch;
        new_instance.pan       = this.pan;
        return new_instance;
    };
    Scissor.Fragment = Fragment;
    
    
    function TapeStream(tape, samplerate) {
        this.tape = tape;
        this.fragments  = tape.fragments;
        this.samplerate = samplerate || 44100;
        
        this.isEnded = false;
        this.buffer  = null;
        this.bufferIndex = 0;
        this.bufferIndexIncr  = 0;
        this.bufferBeginIndex = 0;
        this.bufferEndIndex   = 0;
        this.fragment      = null;
        this.fragmentIndex = 0;
        this.panL = 0.7071067811865475;
        this.panR = 0.7071067811865475;
    }
    Scissor.TapeStream = TapeStream;
    
    TapeStream.prototype.reset = function() {
        this.isEnded = false;
        this.buffer  = null;
        this.bufferIndex = 0;
        this.bufferIndexIncr  = 0;
        this.bufferBeginIndex = 0;
        this.bufferEndIndex   = 0;
        this.fragment      = null;
        this.fragmentIndex = 0;
        this.panL = 0.7071067811865475;
        this.panR = 0.7071067811865475;
        this.isLooped = false;
        return this;
    };
    
    TapeStream.prototype.fetch = function(n) {
        var cellL = new Float32Array(n);
        var cellR = new Float32Array(n);
        var fragments     = this.fragments;
        
        if (fragments.length === 0) {
            return [cellL, cellR];
        }
        
        var samplerate  = this.samplerate * 100;
        var buffer      = this.buffer;
        var bufferIndex = this.bufferIndex;
        var bufferIndexIncr = this.bufferIndexIncr;
        var bufferBeginIndex = this.bufferBeginIndex;
        var bufferEndIndex   = this.bufferEndIndex;
        var fragment      = this.fragment;
        var fragmentIndex = this.fragmentIndex;
        var panL = this.panL;
        var panR = this.panR;
        
        for (var i = 0; i < n; i++) {
            while (!buffer ||
                   bufferIndex < bufferBeginIndex || bufferIndex >= bufferEndIndex) {
                if (!fragment || fragmentIndex < fragments.length) {
                    fragment = fragments[fragmentIndex++];
                    buffer   = fragment.buffer;
                    bufferIndexIncr = fragment.samplerate / samplerate * fragment.pitch;
                    bufferBeginIndex = fragment.start * fragment.samplerate;
                    bufferEndIndex   = bufferBeginIndex + fragment.original_duration() * fragment.samplerate;
                    
                    panL = Math.cos(0.005 * Math.PI * fragment.pan);
                    panR = Math.sin(0.005 * Math.PI * fragment.pan);
                    
                    if (fragment.reverse) {
                        bufferIndexIncr *= -1;
                        bufferIndex = bufferEndIndex + bufferIndexIncr;
                    } else {
                        bufferIndex = bufferBeginIndex;
                    }
                } else {
                    if (this.isLooped) {
                        buffer  = null;
                        bufferIndex = 0;
                        bufferIndexIncr  = 0;
                        bufferBeginIndex = 0;
                        bufferEndIndex   = 0;
                        fragment      = null;
                        fragmentIndex = 0;
                    } else {
                        this.isEnded = true;
                        buffer   = DummyBuffer;
                        bufferIndexIncr = 0;
                        bufferIndex = 0;
                        break;
                    }
                }
            }
            cellL[i] = buffer[bufferIndex|0] * panL;
            cellR[i] = buffer[bufferIndex|0] * panR;
            bufferIndex += bufferIndexIncr;
        }
        this.buffer      = buffer;
        this.bufferIndex = bufferIndex;
        this.bufferIndexIncr  = bufferIndexIncr;
        this.bufferBeginIndex = bufferBeginIndex;
        this.bufferEndIndex   = bufferEndIndex;
        this.fragment      = fragment;
        this.fragmentIndex = fragmentIndex;
        this.panL = panL;
        this.panR = panR;
        
        return [cellL, cellR];
    };
    
    timbre.modules.Scissor = Scissor;
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function PlusNode(_args) {
        timbre.Object.call(this, _args);
    }
    fn.extend(PlusNode);
    
    var $ = PlusNode.prototype;
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs = this.inputs;
            var mul = _.mul, add = _.add;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            if (_.ar) { // audio-rate
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].process(tickID);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                if (mul !== 1 || add !== 0) {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            } else {    // control-rate
                tmp = 0;
                for (i = 0; i < imax; ++i) {
                    tmp += inputs[i].process(tickID)[0];
                }
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    fn.register("+", PlusNode);
    
})();
(function() {
    "use strict";

    var fn = timbre.fn;
    var modules = timbre.modules;
    
    fn.register("audio", function(_args) {
        var BufferNode = fn.getClass("buffer");
        var instance = new BufferNode(_args);
        
        instance._.isLoaded = false;
        instance._.isEnded  = true;
        
        Object.defineProperties(instance, {
            isLoaded: {
                get: function() {
                    return this._.isLoaded;
                }
            }
        });
        
        instance.load     = load;
        instance.loadthis = loadthis;
        
        return instance;
    });
    
    var load = function(src) {
        var self = this, _ = this._;
        var dfd = new modules.Deferred(this);
        
        var args = arguments, i = 1;
        
        dfd.done(function() {
            this._.emit("done");
        }.bind(this));
        
        if (typeof args[i] === "function") {
            dfd.done(args[i++]);
            if (typeof args[i] === "function") {
                dfd.fail(args[i++]);
            }
        }
        
        _.loadedTime = 0;
        
        var onloadedmetadata = function(result, msg) {
            var _ = self._;
            if (result) {
                _.samplerate = result.samplerate;
                _.buffer     = result.buffer;
                _.phase      = 0;
                _.phaseIncr  = result.samplerate / timbre.samplerate;
                _.duration   = result.duration * 1000;
                _.isEnded    = false;
                _.currentTime = 0;
                if (_.isReversed) {
                    _.phaseIncr *= -1;
                    _.phase = result.buffer.length + _.phaseIncr;
                }
                self._.emit("loadedmetadata");
            } else {
                dfd.reject(msg);
            }
        };
        
        var onloadeddata = function() {
            self._.isLoaded  = true;
            self._.plotFlush = true;
            self._.emit("loadeddata");
            dfd.resolveWith(self);
        };
        
        new modules.Decoder().decode(src, onloadedmetadata, onloadeddata);
        
        return dfd.promise();
    };
    
    var loadthis = function() {
        load.apply(this, arguments);
        return this;
    };
    
})();
(function() {
    "use strict";
    
    var fn  = timbre.fn;
    var FFT = timbre.modules.FFT;
    var Biquad = timbre.modules.Biquad;
    
    function BiquadNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.biquad = new Biquad(timbre.samplerate);
        _.freq = timbre(340);
        _.band = timbre(1);
        _.gain = timbre(0);
        
        _.plotRange = [0, 1.2];
        _.plotFlush = true;
    }
    fn.extend(BiquadNode);
    
    var $ = BiquadNode.prototype;
    
    Object.defineProperties($, {
        type: {
            set: function(value) {
                var _ = this._;
                if (value !== _.biquad.type) {
                    _.biquad.setType(value);
                    _.plotFlush = true;
                }
            },
            get: function() {
                return this._.biquad.type;
            }
        },
        freq: {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        cutoff: {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        band: {
            set: function(value) {
                this._.band = timbre(value);
            },
            get: function() {
                return this._.band;
            }
        },
        Q: {
            set: function(value) {
                this._.band = timbre(value);
            },
            get: function() {
                return this._.band;
            }
        },
        gain: {
            set: function(value) {
                this._.gain = timbre(value);
            },
            get: function() {
                return this._.gain;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var changed = false;
            
            var freq = _.freq.process(tickID)[0];
            if (_.prevFreq !== freq) {
                _.prevFreq = freq;
                changed = true;
            }
            var band = _.band.process(tickID)[0];
            if (_.prevband !== band) {
                _.prevband = band;
                changed = true;
            }
            var gain = _.gain.process(tickID)[0];
            if (_.prevGain !== gain) {
                _.prevGain = gain;
                changed = true;
            }
            if (changed) {
                _.biquad.setParams(freq, band, gain);
                _.plotFlush = true;
            }
            
            _.biquad.process(cell);
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    var fft = new FFT(256);
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var biquad = new Biquad(timbre.samplerate);
            biquad.setType(this.type);
            biquad.setParams(this.freq.valueOf(), this.band.valueOf(), this.gain.valueOf());
            
            var impluse = new Float32Array(256);
            impluse[0] = 1;
            
            biquad.process(impluse);
            fft.forward(impluse);
            
            this._.plotData  = fft.spectrum;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    fn.register("biquad", BiquadNode);
    
    fn.register("lowpass", function(_args) {
        return new BiquadNode(_args).set("type", "lowpass");
    });
    fn.register("highpass", function(_args) {
        return new BiquadNode(_args).set("type", "highpass");
    });
    fn.register("bandpass", function(_args) {
        return new BiquadNode(_args).set("type", "bandpass");
    });
    fn.register("lowshelf", function(_args) {
        return new BiquadNode(_args).set("type", "lowshelf");
    });
    fn.register("highshelf", function(_args) {
        return new BiquadNode(_args).set("type", "highshelf");
    });
    fn.register("peaking", function(_args) {
        return new BiquadNode(_args).set("type", "peaking");
    });
    fn.register("notch", function(_args) {
        return new BiquadNode(_args).set("type", "notch");
    });
    fn.register("allpass", function(_args) {
        return new BiquadNode(_args).set("type", "allpass");
    });
    
    fn.alias("lpf", "lowpass");
    fn.alias("hpf", "highpass");
    fn.alias("bpf", "bandpass");
    fn.alias("bef", "notch");
    fn.alias("brf", "notch");
    fn.alias("apf", "allpass");

})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function BufferNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.pitch      = timbre(1);
        _.buffer     = new Float32Array(0);
        _.isLooped   = false;
        _.isReversed = false;
        _.duration    = 0;
        _.currentTime = 0;
        _.currentTimeIncr = this.cell.length * 1000 / timbre.samplerate;
        _.samplerate  = 44100;
        _.phase = 0;
        _.phaseIncr = 0;
        
        this.on("play", onplay);
    }
    fn.extend(BufferNode);
    
    var onplay = function(value) {
        this._.isEnded = (value === false);
    };
    
    var $ = BufferNode.prototype;
    
    var setBuffer = function(value) {
        var _ = this._;
        if (typeof value === "object") {
            var buffer, samplerate;
            if (value instanceof Float32Array) {
                buffer = value;
            } else if (value.buffer instanceof Float32Array) {
                buffer = value.buffer;
                if (typeof value.samplerate === "number") {
                    samplerate = value.samplerate;
                }
            }
            if (buffer) {
                if (samplerate > 0) {
                    _.samplerate = value.samplerate;
                }
                _.buffer = buffer;
                _.phase     = 0;
                _.phaseIncr = _.samplerate / timbre.samplerate;
                _.duration  = _.buffer.length * 1000 / _.samplerate;
                _.currentTime = 0;
                _.plotFlush = true;
                this.isReversed = _.isReversed;
            }
        }
    };
    
    Object.defineProperties($, {
        buffer: {
            set: setBuffer,
            get: function() {
                return this._.buffer;
            }
        },
        pitch: {
            set: function(value) {
                this._.pitch = timbre(value);
            },
            get: function() {
                return this._.pitch;
            }
        },
        isLooped: {
            set: function(value) {
                this.loop(value);
            },
            get: function() {
                return this._.isLooped;
            }
        },
        isReversed: {
            set: function(value) {
                this.reverse(value);
            },
            get: function() {
                return this._.isReversed;
            }
        },
        isEnded: {
            get: function() {
                return this._.isEnded;
            }
        },
        samplerate: {
            get: function() {
                return this._.samplerate;
            }
        },
        duration: {
            get: function() {
                return this._.duration;
            }
        },
        currentTime: {
            set: function(value) {
                if (typeof value === "number") {
                    var _ = this._;
                    if (0 <= value && value <= _.duration) {
                        _.phase = (value / 1000) * _.samplerate;
                        _.currentTime = value;
                    }
                }
            },
            get: function() {
                return this._.currentTime;
            }
        }
    });

    $.clone = function() {
        var _ = this._;
        var instance = timbre("buffer");
        
        if (_.buffer) {
            setBuffer.call(instance, {
                buffer    : _.buffer,
                samplerate: _.samplerate
            });
        }
        instance.isLooped   = this.isLooped;
        instance.isReversed = this.isReversed;
        
        return instance;
    };
    
    $.slice = function(begin, end) {
        var _ = this._;
        var instance = timbre(_.originkey);
        
        var isReversed = _.isReversed;
        if (typeof begin === "number" ){
            begin = (begin * 0.001 * _.samplerate)|0;
        } else {
            begin = 0;
        }
        if (typeof end === "number") {
            end   = (end   * 0.001 * _.samplerate)|0;
        } else {
            end = _.buffer.length;
        }
        if (begin > end) {
            var tmp = begin;
            begin = end;
            end   = tmp;
            isReversed = !isReversed;
        }
        
        if (_.buffer) {
            setBuffer.call(instance, {
                buffer    : _.buffer.subarray(begin, end),
                samplerate: _.samplerate
            });
            instance._.isEnded = false;
        }
        instance.isLooped   = this.isLooped;
        instance.isReversed = this.isReversed;
        
        return instance;
    };
    
    $.reverse = function(value) {
        var _ = this._;
        
        _.isReversed = !!value;
        if (_.isReversed) {
            if (_.phaseIncr > 0) {
                _.phaseIncr *= -1;
            }
            if (_.phase === 0 && _.buffer) {
                _.phase = _.buffer.length + _.phaseIncr;
            }
        } else {
            if (_.phaseIncr < 0) {
                _.phaseIncr *= -1;
            }
        }
        
        return this;
    };

    $.loop = function(value) {
        this._.isLooped = !!value;
        return this;
    };
    
    $.bang = function(value) {
        this._.phase   = 0;
        this._.isEnded = (value === false);
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (!_.isEnded && _.buffer) {
                var pitch  = _.pitch.process(tickID)[0];
                var buffer = _.buffer;
                var phase  = _.phase;
                var phaseIncr = _.phaseIncr * pitch;
                var mul = _.mul, add = _.add;
                
                for (var i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (buffer[phase|0] || 0) * mul + add;
                    phase += phaseIncr;
                }
                
                if (phase >= buffer.length) {
                    if (_.isLooped) {
                        fn.nextTick(onlooped.bind(this));
                    } else {
                        fn.nextTick(onended.bind(this));
                    }
                } else if (phase < 0) {
                    if (_.isLooped) {
                        fn.nextTick(onlooped.bind(this));
                    } else {
                        fn.nextTick(onended.bind(this));
                    }
                }
                _.phase = phase;
                _.currentTime += _.currentTimeIncr;
            }
        }
        
        return cell;
    };
    
    var onlooped = function() {
        var _ = this._;
        if (_.phase >= _.buffer.length) {
            _.phase = 0;
        } else if (_.phase < 0) {
            _.phase = _.buffer.length + _.phaseIncr;
        }
        this._.emit("looped");
    };
    
    var onended = function() {
        fn.onended(this, 0);
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        var _ = this._;
        var buffer = _.buffer;
        if (_.plotFlush) {
            var data = new Float32Array(2048);
            var x = 0, xIncr = buffer.length / 2048;
            for (var i = 0; i < 2048; i++) {
                data[i] = buffer[x|0];
                x += xIncr;
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    fn.register("buffer", BufferNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function ClipNode(_args) {
        timbre.Object.call(this, _args);
        
        var _ = this._;
        _.min = -0.8;
        _.max = +0.8;
    }
    fn.extend(ClipNode);
    
    var $ = ClipNode.prototype;
    
    Object.defineProperties($, {
        minmax: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.min = -Math.abs(value);
                    _.max = -_.min;
                }
            },
            get: function() {
                return this._.max;
            }
        },
        min: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    if (_.max < value) {
                        _.max = value;
                    } else {
                        _.min = value;
                    }
                }
            },
            get: function() {
                return this._.min;
            }
        },
        max: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    if (value < _.min) {
                        _.min = value;
                    } else {
                        _.max = value;
                    }
                }
            },
            get: function() {
                return this._.max;
            }
        }
    });
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs = this.inputs;
            var mul = _.mul, add = _.add;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var min = _.min, max = _.max;
            var tmp, x;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            if (_.ar) { // audio-rate
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].process(tickID);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                for (j = jmax; j--; ) {
                    x = cell[j];
                    x = (x < min) ? min : (x > max) ? max : x;
                    cell[j] = x;
                }
                
                if (mul !== 1 || add !== 0) {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            } else {    // control-rate
                tmp = 0;
                for (i = 0; i < imax; ++i) {
                    tmp += inputs[i].process(tickID)[0];
                }
                tmp = (tmp < min) ? min : (tmp > max) ? max : tmp;
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    fn.register("clip", ClipNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue  = timbre.timevalue;
    var Compressor = timbre.modules.Compressor;
    
    function CompressorNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.thresh = timbre(-24);
        _.knee   = timbre(30);
        _.ratio  = timbre(12);
        _.postGain  =   6;
        _.attack    =   3;
        _.release   = 250;
        _.reduction =   0;
        
        _.comp = new Compressor(timbre.samplerate);
        _.comp.dbPostGain  = _.postGain;
        _.comp.attackTime  = _.attack  * 0.001;
        _.comp.releaseTime = _.release * 0.001;
    }
    fn.extend(CompressorNode);
    
    var $ = CompressorNode.prototype;
    
    Object.defineProperties($, {
        thresh: {
            set: function(value) {
                this._.thresh = timbre(value);
            },
            get: function() {
                return this._.thresh;
            }
        },
        knee: {
            set: function(value) {
                this._.kne = timbre(value);
            },
            get: function() {
                return this._.knee;
            }
        },
        ratio: {
            set: function(value) {
                this._.ratio = timbre(value);
            },
            get: function() {
                return this._.ratio;
            }
        },
        postGain: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.postGain = value;
                    this._.comp.dbPostGain = value;
                }
            },
            get: function() {
                return this._.postGain;
            }
        },
        attack: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number") {
                    value = (value < 0) ? 0 : (1000 < value) ? 1000 : value;
                    this._.attack = value;
                    this._.comp.attackTime = value * 0.001;
                }
            },
            get: function() {
                return this._.attack;
            }
        },
        release: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        value = 0;
                    }
                }
                if (typeof value === "number") {
                    value = (value < 0) ? 0 : (1000 < value) ? 1000 : value;
                    this._.release = value;
                    this._.comp.releaseTime = value * 0.001;
                }
            },
            get: function() {
                return this._.release;
            }
        },
        reduction: {
            get: function() {
                return this._.reduction;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var thresh = _.thresh.process(tickID)[0];
            var knee   = _.knee.process(tickID)[0];
            var ratio  = _.ratio.process(tickID)[0];
            
            _.comp.process(cell, cell, thresh, knee, ratio);
            
            _.reduction = _.comp.meteringGain;
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("comp", CompressorNode);
    fn.alias("compressor", "comp");
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var Oscillator = timbre.modules.Oscillator;
    
    function COscNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.freq = timbre(440);
        _.osc1 = new Oscillator(timbre.samplerate);
        _.osc2 = new Oscillator(timbre.samplerate);
        _.osc1.step = this.cell.length;
        _.osc2.step = this.cell.length;
        _.tmp = new Float32Array(this.cell.length);
        _.beats = 0.5;
        
        this.once("init", oninit);
    }
    fn.extend(COscNode);
    
    var oninit = function() {
        if (!this.wave) {
            this.wave = "sin";
        }
    };
    
    var $ = COscNode.prototype;
    
    Object.defineProperties($, {
        wave: {
            set: function(value) {
                this._.osc1.setWave(value);
                this._.osc2.setWave(value);
            },
            get: function() {
                return this._.osc1.wave;
            }
        },
        freq: {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        beats: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.beats = value;
                }
            },
            get: function() {
                return this._.beats;
            }
        }
    });
    
    $.bang = function() {
        this._.osc1.reset();
        this._.osc2.reset();
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var i, imax = cell.length;
            var freq = _.freq.process(tickID)[0];
            var osc1 = _.osc1, osc2 = _.osc2, tmp = _.tmp;
            
            osc1.frequency = freq - (_.beats * 0.5);
            osc1.process(tmp);
            for (i = imax; i--; ) {
                cell[i] = tmp[i] * 0.5;
            }
            
            osc2.frequency = freq + (_.beats * 0.5);
            osc2.process(tmp);
            for (i = imax; i--; ) {
                cell[i] += tmp[i] * 0.5;
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("cosc", COscNode);
    
})();
(function() {
    "use strict";

    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    var EfxDelay  = timbre.modules.EfxDelay;
    
    function DelayNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.fb    = timbre(0);
        _.wet   = timbre(1);
        _.delay = new EfxDelay();
        
        this.once("init", oninit);
    }
    fn.extend(DelayNode);
    
    var oninit = function() {
        if (!this._.time) {
            this.time = 100;
        }
    };
    
    var $ = DelayNode.prototype;
    
    Object.defineProperties($, {
        time: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number") {
                    if (0 < value && value < 15000) {
                        this._.time = value;
                        this._.delay.setParams({time:value});
                    }
                }
            },
            get: function() {
                return this._.time;
            }
        },
        fb: {
            set: function(value) {
                this._.fb = timbre(value);
            },
            get: function() {
                return this._.fb;
            }
        },
        wet: {
            set: function(value) {
                this._.wet = timbre(value);
            },
            get: function() {
                return this._.wet;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var changed = false;
            var feedback = _.fb.process(tickID)[0];
            if (_.prevFeedback !== feedback) {
                _.prevFeedback = feedback;
                changed = true;
            }
            var wet = _.wet.process(tickID)[0];
            if (_.prevWet !== wet) {
                _.prevWet = wet;
                changed = true;
            }
            if (changed) {
                _.delay.setParams({feedback:feedback, wet:wet});
            }
            
            _.delay.process(cell, true);
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("delay", DelayNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function DistNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.pre  = timbre( 60);
        _.post = timbre(-18);
        _.samplerate = timbre.samplerate;
        _.x1 = _.x2 = _.y1 = _.y2 = 0;
        _.b0 = _.b1 = _.b2 = _.a1 = _.a2 = 0;
        _.cutoff = 0;
    }
    fn.extend(DistNode);
    
    var $ = DistNode.prototype;
    
    Object.defineProperties($, {
        cutoff: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.cutoff = value;
                }
            },
            get: function() {
                return this._.cutoff;
            }
        },
        pre: {
            set: function(value) {
                this._.pre = timbre(value);
            },
            get: function() {
                return this._.pre;
            }
        },
        post: {
            set: function(value) {
                this._.post = timbre(value);
            },
            get: function() {
                return this._.post;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var changed = false;
            
            var preGain = -_.pre.process(tickID)[0];
            if (_.prevPreGain !== preGain) {
                _.prevPreGain = preGain;
                changed = true;
            }
            var postGain = -_.post.process(tickID)[0];
            if (_.prevPostGain !== postGain) {
                _.prevPostGain = postGain;
                changed = true;
            }
            if (changed) {
                var postScale = Math.pow(2, -postGain * 0.166666666);
                _.preScale = Math.pow(2, -preGain * 0.166666666) * postScale;
                _.limit = postScale;
            }
            
            var preScale = _.preScale;
            var limit    = _.limit;
            var mul = _.mul, add = _.add;
            var i, imax;
            var x0, y0;
            
            if (_.cutoff) {
                if (_.prevCutoff !== _.cutoff) {
                    _.prevCutoff = _.cutoff;
                    lowpass_params(_);
                }
                
                var x1 = _.x1;
                var x2 = _.x2;
                var y1 = _.y1;
                var y2 = _.y2;
                
                var b0 = _.b0;
                var b1 = _.b1;
                var b2 = _.b2;
                var a1 = _.a1;
                var a2 = _.a2;
                
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    x0 = cell[i] * preScale;
                    y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                    
                    y0 = (y0 > limit) ? limit : (y0 < -limit) ? -limit : y0;
                    
                    cell[i] = y0 * mul + add;
                    
                    x2 = x1;
                    x1 = x0;
                    y2 = y1;
                    y1 = y0;
                }
                
                // flushDenormalFloatToZero
                if ((x1 > 0 && x1 <  1e-4) || (x1 < 0 && x1 > -1e-4)) {
                    x1 = 0;
                }
                if ((y1 > 0 && y1 <  1e-4) || (y1 < 0 && y1 > -1e-4)) {
                    y1 = 0;
                }
                
                _.x1 = x1;
                _.x2 = x2;
                _.y1 = y1;
                _.y2 = y2;
            } else {
                for (i = cell.length; i--; ) {
                    x0 = cell[i] * preScale;
                    x0 = (x0 > limit) ? limit : (x0 < -limit) ? -limit : x0;
                    cell[i] = x0 * mul + add;
                }
            }
        }
        
        return cell;
    };

    var lowpass_params = function(_) {
        var cutoff = _.cutoff / (_.samplerate * 0.5);
        
        if (cutoff >= 1) {
            _.b0 = 1;
            _.b1 = _.b2 = _.a1 = _.a2 = 0;
        } else if (cutoff <= 0) {
            _.b0 = _.b1 = _.b2 = _.a1 = _.a2 = 0;
        } else {
            var resonance = 1;
            var g = Math.pow(10.0, 0.05 * resonance);
            var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) * 0.5);
            
            var theta = Math.PI * cutoff;
            var sn = 0.5 * d * Math.sin(theta);
            var beta = 0.5 * (1 - sn) / (1 + sn);
            var gamma = (0.5 + beta) * Math.cos(theta);
            var alpha = 0.25 * (0.5 + beta - gamma);
            
            _.b0 = 2 * alpha;
            _.b1 = 4 * alpha;
            _.b2 = _.b0;
            _.a1 = 2 * -gamma;
            _.a2 = 2 * beta;
        }
    };

    fn.register("distortion", DistNode);
    fn.alias("dist", "distortion");
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    var Envelope  = timbre.modules.Envelope;
    var isDictionary = fn.isDictionary;
    
    function EnvNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.env = new Envelope(timbre.samplerate);
        _.env.step = this.cell.length;
        _.kr = true;
        _.plotFlush = true;
    }
    fn.extend(EnvNode);
    
    var $ = EnvNode.prototype;
    
    Object.defineProperties($, {
        table: {
            set: function(value) {
                if (Array.isArray(value)) {
                    this._.env.setTable(value);
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.env.table;
            }
        },
        curve: {
            set: function(value) {
                this._.env.setCurve(value);
            },
            get: function() {
                return this._.env.curve;
            }
        },
        releaseNode: {
            set: function(value) {
                this._.env.setReleaseNode(value);
                this._.plotFlush = true;
            },
            get: function() {
                return this._.env.releaseNode + 1;
            }
        },
        loopNode: {
            set: function(value) {
                this._.env.setLoopNode(value);
                this._.plotFlush = true;
            },
            get: function() {
                return this._.env.loopNode + 1;
            }
        }
    });

    $.clone = function() {
        var instance = new EnvNode([]);
        instance._.env = this._.env.clone();
        return instance;
    };
    
    $.reset = function() {
        this._.env.reset();
        return this;
    };
    
    $.release = function() {
        var _ = this._;
        _.env.release();
        _.emit("released");
        return this;
    };
    
    $.bang = function() {
        var _ = this._;
        _.env.reset();
        _.env.status = Envelope.StatusGate;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs  = this.inputs;
            var i, imax = cell.length;
            var mul = _.mul, add = _.add;
            
            if (inputs.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = imax; i--; ) {
                    cell[i] = 1;
                }
            }
            
            var value = _.env.next();
            
            for (i = imax; i--; ) {
                cell[i] = (cell[i] * value) * mul + add;
            }
            
            var emit = _.env.emit;
            if (emit) {
                if (emit === "ended") {
                    fn.nextTick(onended.bind(this));
                } else {
                    this._.emit(emit, _.value);
                }
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        fn.onended(this, 0);
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var env = this._.env.clone();
            var info = env.getInfo(1000);
            
            var totalDuration    = info.totalDuration;
            var loopBeginTime    = info.loopBeginTime;
            var releaseBeginTime = info.releaseBeginTime;
            var data = new Float32Array(256);
            var duration = 0;
            var durationIncr = totalDuration / data.length;
            var isReleased   = false;
            var samples = (totalDuration * 0.001 * timbre.samplerate)|0;
            var i, imax;
            
            samples /= data.length;
            env.step = samples;
            env.status = Envelope.StatusGate;
            for (i = 0, imax = data.length; i < imax; ++i) {
                data[i] = env.next();
                duration += durationIncr;
                if (!isReleased && duration >= releaseBeginTime) {
                    env.release();
                    isReleased = true;
                }
            }
            this._.plotData = data;
            
            this._.plotBefore = function(context, x, y, width, height) {
                var x1, w;
                if (loopBeginTime !== Infinity && releaseBeginTime !== Infinity) {
                    x1 = x + (width * (loopBeginTime    / totalDuration));
                    w  = x + (width * (releaseBeginTime / totalDuration));
                    w  = w - x1;
                    context.fillStyle = "rgba(224, 224, 224, 0.8)";
                    context.fillRect(x1, 0, w, height);
                }
                if (releaseBeginTime !== Infinity) {
                    x1 = x + (width * (releaseBeginTime / totalDuration));
                    w  = width - x1;
                    context.fillStyle = "rgba(212, 212, 212, 0.8)";
                    context.fillRect(x1, 0, w, height);
                }
            };
            
            // y-range
            var minValue = Infinity, maxValue = -Infinity;
            for (i = 0; i < imax; ++i) {
                if (data[i] < minValue) {
                    minValue = data[i];
                } else if (data[i] > maxValue) {
                    maxValue = data[i];
                }
            }
            if (maxValue < 1) {
                maxValue = 1;
            }
            this._.plotRange = [minValue, maxValue];
            
            this._.plotData  = data;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    fn.register("env", EnvNode);
    
    
    function envValue(opts, min, def, name1, name2, func) {
        var x = def;
        if (typeof opts[name1] === "number") {
            x = opts[name1];
        } else if (typeof opts[name2] === "number") {
            x = opts[name2];
        } else if (func) {
            if (typeof opts[name1] === "string") {
                x = func(opts[name1]);
            } else if (typeof opts[name2] === "string") {
                x = func(opts[name2]);
            }
        }
        if (x < min) {
            x = min;
        }
        return x;
    }
    
    var ZERO = Envelope.ZERO;
    
    fn.register("perc", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime", timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "decayTime" , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"     );
        
        opts.table = [ZERO, [lv, a], [ZERO, r]];
        
        return new EnvNode(_args);
    });
    
    fn.register("adsr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  , timevalue);
        var d  = envValue(opts,   10,  300, "d" , "decayTime"   , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var r  = envValue(opts,   10, 1000, "r" , "decayTime"   , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"       );
        
        opts.table = [ZERO, [lv, a], [s, d], [ZERO, r]];
        opts.releaseNode = 3;
        
        return new EnvNode(_args);
    });
    
    fn.register("adshr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  , timevalue);
        var d  = envValue(opts,   10,  300, "d" , "decayTime"   , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var h  = envValue(opts,   10,  500, "h" , "holdTime"    , timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "decayTime"   , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"       );
        
        opts.table = [ZERO, [lv, a], [s, d], [s, h], [ZERO, r]];
        
        return new EnvNode(_args);
    });
    
    fn.register("asr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var r  = envValue(opts,   10, 1000, "r" , "releaseTime" , timevalue);
        
        opts.table = [ZERO, [s, a], [ZERO, r]];
        opts.releaseNode = 2;
        
        return new EnvNode(_args);
    });
    
    fn.register("dadsr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var dl = envValue(opts,   10,  100, "dl", "delayTime"   , timevalue);
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  , timevalue);
        var d  = envValue(opts,   10,  300, "d" , "decayTime"   , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var r  = envValue(opts,   10, 1000, "r" , "relaseTime"  , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"       );
        
        opts.table = [ZERO, [ZERO, dl], [lv, a], [s, d], [ZERO, r]];
        opts.releaseNode = 4;
        
        return new EnvNode(_args);
    });
    
    fn.register("ahdsfr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  , timevalue);
        var h  = envValue(opts,   10,   10, "h" , "holdTime"    , timevalue);
        var d  = envValue(opts,   10,  300, "d" , "decayTime"   , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var f  = envValue(opts,   10, 5000, "f" , "fadeTime"    , timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "relaseTime"  , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"       );
        
        opts.table = [ZERO, [lv, a], [lv, h], [s, d], [ZERO, f], [ZERO, r]];
        opts.releaseNode = 5;
        
        return new EnvNode(_args);
    });
    
    fn.register("linen", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime" , timevalue);
        var s  = envValue(opts,   10, 1000, "s" , "sustainTime", timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "releaseTime", timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"      );
        
        opts.table = [ZERO, [lv, a], [lv, s], [ZERO, r]];
        
        return new EnvNode(_args);
    });
    
    fn.register("env.tri", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var dur = envValue(opts,   20, 1000, "dur", "duration", timevalue);
        var lv  = envValue(opts, ZERO,    1, "lv" , "level"   );
        
        dur *= 0.5;
        opts.table = [ZERO, [lv, dur], [ZERO, dur]];
        
        return new EnvNode(_args);
    });
    
    fn.register("env.cutoff", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var r  = envValue(opts,   10, 100, "r" , "relaseTime", timevalue);
        var lv = envValue(opts, ZERO,   1, "lv", "level"    );
        
        opts.table = [lv, [ZERO, r]];
        
        return new EnvNode(_args);
    });
    
})();
(function() {
    "use strict";
    
    var fn  = timbre.fn;
    var FFT = timbre.modules.FFT;
    
    function FFTNode(_args) {
        timbre.Object.call(this, _args);
        fn.listener(this);
        fn.stereo(this);
        fn.fixAR(this);
        
        this.real = this.L;
        this.imag = this.R;
        
        this._.fft = new FFT(timbre.cellsize * 2);
        this._.fftCell  = new Float32Array(this._.fft.length);
        this._.prevCell = new Float32Array(timbre.cellsize);
        
        this._.plotFlush = true;
        this._.plotRange = [0, 0.5];
        this._.plotBarStyle = true;
    }
    fn.extend(FFTNode);
    
    var $ = FFTNode.prototype;
    
    Object.defineProperties($, {
        window: {
            set: function(value) {
                this._.fft.setWindow(value);
            },
            get: function() {
                return this._.fft.windowName;
            }
        },
        spectrum: {
            get: function() {
                return this._.fft.spectrum;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;

        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            _.fftCell.set(_.prevCell);
            _.fftCell.set(cell, cell.length);
            _.fft.forward(_.fftCell);
            _.prevCell.set(cell);
            
            var real = this.cellL;
            var imag = this.cellR;
            var _real = _.fft.real;
            var _imag = _.fft.imag;
            
            for (var i = cell.length; i--; ) {
                real[i] = _real[i];
                imag[i] = _imag[i];
            }
            
            this._.plotFlush = true;
        }
        return cell;
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var fft = this._.fft;
            
            var spectrum = fft.spectrum;
            var step     = fft.length >> 6;
            var istep    = 1 / step;
            var data    = new Float32Array(spectrum.length * istep);
            var i, imax = spectrum.length;
            var j, jmax = step;
            
            var v, k = 0;
            for (i = 0; i < imax; i += step) {
                v = 0;
                for (j = 0; j < jmax; ++j) {
                    v += spectrum[i + j];
                }
                data[k++] = v * istep;
            }
            
            this._.plotData  = data;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    fn.register("fft", FFTNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function FNoiseNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.freq = timbre(440);
        _.samplerate = timbre.samplerate;
        _.reg = 0x8000;
        _.shortFlag = false;
        _.phase     = 0;
        _.lastValue = 0;
    }
    fn.extend(FNoiseNode);
    
    var $ = FNoiseNode.prototype;
    
    Object.defineProperties($, {
        shortFlag: {
            set: function(value) {
                this._.shortFlag = !!value;
            },
            get: function() {
                return this._.shortFlag;
            }
        },
        freq: {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var lastValue = _.lastValue;
            var phase     = _.phase;
            var phaseStep = _.freq.process(tickID)[0] / _.samplerate;
            var reg = _.reg;
            var mul = _.mul, add = _.add;
            var i, imax;
            
            if (_.shortFlag) {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    if (phase >= 1) {
                        reg >>= 1;
                        reg |= ((reg ^ (reg >> 6)) & 1) << 15;
                        lastValue = ((reg & 1) - 0.5);
                        phase -= 1;
                    }
                    cell[i] = lastValue * mul + add;
                    phase += phaseStep;
                }
            } else {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    if (phase >= 1) {
                        reg >>= 1;
                        reg |= ((reg ^ (reg >> 1)) & 1) << 15;
                        lastValue = ((reg & 1) - 0.5);
                        phase -= 1;
                    }
                    cell[i] = lastValue * mul + add;
                    phase += phaseStep;
                }
            }
            _.reg       = reg;
            _.phase     = phase;
            _.lastValue = lastValue;
        }
        
        return cell;
    };
    
    fn.register("fnoise", FNoiseNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var ChannelObject = timbre.ChannelObject;
    var empty;
    
    function GateNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        this._.selected = 0;
        this._.outputs  = [];
        
        empty = new Float32Array(this.cell.length);
    }
    fn.extend(GateNode);
    
    var $ = GateNode.prototype;

    Object.defineProperties($, {
        selected: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.selected = value;
                    var outputs = _.outputs;
                    for (var i = outputs.length; i--; ) {
                        if (outputs[i]) {
                            outputs[i].cell.set(empty);
                        }
                    }
                }
            },
            get: function() {
                return this._.selected;
            }
        }
    });

    $.at = function(index) {
        var _ = this._;
        var output = _.outputs[index];
        if (!output) {
            _.outputs[index] = output = new ChannelObject(this);
        }
        return output;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);
            
            if (_.outputs[_.selected]) {
                _.outputs[_.selected].cell.set(this.cell);
            }
        }
        
        return cell;
    };
    
    fn.register("gate", GateNode);
    
})();
(function() {
    "use strict";
    
    var fn  = timbre.fn;
    var FFT = timbre.modules.FFT;
    
    function IFFTNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);

        var _ = this._;
        _.fft = new FFT(timbre.cellsize * 2);
        _.fftCell    = new Float32Array(this._.fft.length);
        _.realBuffer = new Float32Array(this._.fft.length);
        _.imagBuffer = new Float32Array(this._.fft.length);
    }
    fn.extend(IFFTNode);
    
    var $ = IFFTNode.prototype;
    
    Object.defineProperties($, {
        real: {
            set: function(value) {
                this._.real = timbre(value);
            },
            get: function() {
                return this._.real;
            }
        },
        imag: {
            set: function(value) {
                this._.imag = timbre(value);
            },
            get: function() {
                return this._.imag;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (_.real && _.imag) {
                var real = _.realBuffer;
                var imag = _.imagBuffer;
                var _real = _.real.process(tickID);
                var _imag = _.imag.process(tickID);
                
                real.set(_real);
                imag.set(_imag);
                
                cell.set(_.fft.inverse(real, imag).subarray(0, cell.length));
                
                fn.outputSignalAR(this);
            }
        }
        
        return cell;
    };
    
    fn.register("ifft", IFFTNode);

})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    
    function IntervalNode(_args) {
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.interval = timbre(1000);
        _.count = 0;
        _.delay   = 0;
        _.timeout = Infinity;
        _.currentTime = 0;
        _.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        _.delaySamples = 0;
        _.countSamples = 0;
        _.isEnded = false;
        
        this.on("start", onstart);
    }
    fn.extend(IntervalNode);
    
    var onstart = function() {
        var _ = this._;
        _.delaySamples = (timbre.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
        _.isEnded = false;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });
    var onended = function() {
        this._.isEnded = true;
        this._.emit("ended");
    };
    
    var $ = IntervalNode.prototype;
    
    Object.defineProperties($, {
        interval: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        value = 0;
                    }
                }
                this._.interval = timbre(value);
            },
            get: function() {
                return this._.interval;
            }
        },
        delay: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    this._.delay = value;
                    this._.delaySamples = (timbre.samplerate * (value * 0.001))|0;
                }
            },
            get: function() {
                return this._.delay;
            }
        },
        count: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.count = value;
                }
            },
            get: function() {
                return this._.count;
            }
        },
        timeout: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    this._.timeout = value;
                }
            },
            get: function() {
                return this._.timeout;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });
    
    $.bang = function() {
        var _ = this._;
        _.delaySamples = (timbre.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
        _.isEnded = false;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        
        var _ = this._;
        
        if (_.isEnded) {
            return cell;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (_.delaySamples > 0) {
                _.delaySamples -= cell.length;
            }
            
            var interval = _.interval.process(tickID)[0];
            
            if (_.delaySamples <= 0) {
                _.countSamples -= cell.length;
                if (_.countSamples <= 0) {
                    _.countSamples += (timbre.samplerate * interval * 0.001)|0;
                    var inputs = this.inputs;
                    var count  = _.count;
                    var x = count * _.mul + _.add;
                    for (var j = cell.length; j--; ) {
                        cell[j] = x;
                    }
                    for (var i = 0, imax = inputs.length; i < imax; ++i) {
                        inputs[i].bang(count);
                    }
                    _.count += 1;
                }
            }
            _.currentTime += _.currentTimeIncr;

            if (_.currentTime >= _.timeout) {
                fn.nextTick(onended.bind(this));
            }
        }
        return cell;
    };
    
    fn.register("interval", IntervalNode);
    
})();
(function() {
    "use strict";

    if (timbre.envtype !== "browser") {
        return;
    }

    var fn = timbre.fn;
    var instance = null;

    function KeyboardListener(_args) {
        if (instance) {
            return instance;
        }
        instance = this;
        
        timbre.Object.call(this, _args);

        fn.fixKR(this);
    }
    fn.extend(KeyboardListener);
    
    var keyDown  = {};
    var shiftKey = false;
    var ctrlKey  = false;
    var altKey   = false;
    
    var onkeydown = function(e) {
        var _ = instance._;
        var cell = instance.cell;
        var value = e.keyCode * _.mul + _.add;
        
        for (var i = cell.length; i--; ) {
            cell[i] = value;
        }
        shiftKey = e.shiftKey;
        ctrlKey  = e.ctrlKey;
        altKey   = e.altKey;
        
        if (!keyDown[e.keyCode]) {
            keyDown[e.keyCode] = true;
            instance._.emit("keydown", e);
        }
    };
    
    var onkeyup = function(e) {
        delete keyDown[e.keyCode];
        instance._.emit("keyup", e);
    };
    
    var $ = KeyboardListener.prototype;
    
    Object.defineProperties($, {
        shiftKey: {
            get: function() {
                return shiftKey;
            }
        },
        ctrlKey: {
            get: function() {
                return ctrlKey;
            }
        },
        altKey: {
            get: function() {
                return altKey;
            }
        }
    });
    
    $.start = function() {
        window.addEventListener("keydown", onkeydown, true);
        window.addEventListener("keyup"  , onkeyup  , true);
        return this;
    };

    $.stop = function() {
        window.removeEventListener("keydown", onkeydown, true);
        window.removeEventListener("keyup"  , onkeyup  , true);
        return this;
    };

    $.play = $.pause = function() {
        return this;
    };
    
    fn.register("keyboard", KeyboardListener);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function MapNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.input  = 0;
        _.output = 0;
        _.prev   = null;
        _.map    = defaultFunction;
    }
    fn.extend(MapNode);
    
    var defaultFunction = function(x) {
        return x;
    };
    
    var $ = MapNode.prototype;
    
    Object.defineProperties($, {
        input: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.input = value;
                }
            },
            get: function() {
                return this._.input;
            }
        },
        map: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.map = value;
                }
            },
            get: function() {
                return this._.map;
            }
        }
    });

    $.bang = function() {
        this._.prev = null;
        this._.emit("bang");
        return this;
    };
    
    $.at = function(input) {
        return (this._.map) ? this._.map(input) : 0;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var input = (this.inputs.length) ? fn.inputSignalKR(this) : _.input;
            
            if (_.map && _.prev !== input) {
                _.prev = input;
                _.output = _.map(input);
            }
            
            var output = _.output * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = output;
            }
        }
        
        return cell;
    };
    
    fn.register("map", MapNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function MidiCpsNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.midi = 0;
        _.value = 0;
        _.prev  = null;
        _.a4    = 440;
    }
    fn.extend(MidiCpsNode);
    
    var $ = MidiCpsNode.prototype;
    
    Object.defineProperties($, {
        midi: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.midi = value;
                }
            },
            get: function() {
                return this._.midi;
            }
        },
        a4: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.a4   = value;
                    this._.prev = null;
                }
            },
            get: function() {
                return this._.a4;
            }
        }
    });

    $.bang = function() {
        this._.prev = null;
        this._.emit("bang");
        return this;
    };
    
    $.at = function(midi) {
        var _ = this._;
        return _.a4 * Math.pow(2, (midi - 69) / 12);
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var midi = (this.inputs.length) ? fn.inputSignalKR(this) : _.midi;
            
            if (_.prev !== midi) {
                _.prev = midi;
                _.value = _.a4 * Math.pow(2, (midi - 69) / 12);
            }
            
            var value = _.value * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = value;
            }
        }
        
        return cell;
    };
    
    fn.register("midicps", MidiCpsNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function MidiRatioNode(_args) {
        timbre.Object.call(this, _args);
        var _ = this._;
        _.midi = 0;
        _.value = 0;
        _.prev  = null;
        _.range = 12;
    }
    fn.extend(MidiRatioNode);
    
    var $ = MidiRatioNode.prototype;
    
    Object.defineProperties($, {
        midi: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.midi = value;
                }
            },
            get: function() {
                return this._.midi;
            }
        },
        range: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.range = value;
                }
            },
            get: function() {
                return this._.range;
            }
        }
    });
    
    $.bang = function() {
        this._.prev = null;
        this._.emit("bang");
        return this;
    };
    
    $.at = function(midi) {
        var _ = this._;
        return Math.pow(2, midi / _.range);
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var midi = (this.inputs.length) ? fn.inputSignalKR(this) : _.midi;
            
            if (_.prev !== midi) {
                _.prev = midi;
                _.value = Math.pow(2, midi / _.range);
            }
            
            var value = _.value * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = value;
            }
        }
        
        return cell;
    };
    
    fn.register("midiratio", MidiRatioNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function MML(_args) {
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.mml = "";
        _.status = {t:120, l:4, o:4, v:12, q:6, dot:0, tie:false};
        _.commands = [];
        _.index    = 0;
        _.queue    = [];
        _.currentTime     = 0;
        _.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        _.queueTime = 0;
        _.segnoIndex  = -1;
        _.loopStack   = [];
        _.prevNote = 0;
        _.isEnded  = false;
        _.remain   = Infinity;
        
        this.on("start", onstart);
    }
    fn.extend(MML);
    
    var onstart = function() {
        var _ = this._;
        _.commands = compile(_.mml);
        _.index    = 0;
        _.queue    = [];
        _.currentTime   = 0;
        _.queueTime = 0;
        _.segnoIndex  = -1;
        _.loopStack   = [];
        _.prevNote = 0;
        _.isEnded  = false;
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
        var cell = this.cell;
        var _ = this._;
        
        if (_.isEnded) {
            return cell;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs = this.inputs;
            var queue  = _.queue;
            var gen, i, imax;
            
            if (queue.length) {
                while (queue[0][0] <= _.currentTime) {
                    var nextItem = _.queue.shift();
                    if (nextItem[1]) {
                        for (i = 0, imax = inputs.length; i < imax; ++i) {
                            gen = inputs[i];
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
                        for (i = 0, imax = inputs.length; i < imax; ++i) {
                            gen = inputs[i];
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
            _.remain -= _.currentTimeIncr;
            if (queue.length === 0 && _.remain <= 0) {
                fn.nextTick(onended.bind(this));
            }
            _.currentTime += _.currentTimeIncr;
        }
        
        return cell;
    };
    
    var onended = function() {
        this._.isEnded = true;
        this._.emit("ended");
    };
    
    var sched = function(self) {
        var _ = self._;
        
        if (_.isEnded) {
            return;
        }
        
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
    
})();
(function() {
    "use strict";
    
    if (timbre.envtype !== "browser") {
        return;
    }
    
    var fn = timbre.fn;
    var instance = null;
    
    function MouseListener(_args) {
        if (instance) {
            return instance;
        }
        instance = this;
        
        timbre.Object.call(this, _args);
        fn.stereo(this);
        
        this.X = this.L;
        this.Y = this.R;
        
        fn.fixKR(this);
    }
    fn.extend(MouseListener);
    
    
    var mouseX = 0;
    var mouseY = 0;
    
    var onclick = function(e) {
        instance._.emit("click", e);
    };
    var onmousedown = function(e) {
        instance._.emit("mousedown", e);
    };
    var onmousemove = function(e) {
        var x = (mouseX = (e.clientX / window.innerWidth));
        var y = (mouseY = (e.clientY / window.innerHeight));
        
        var cellL = instance.cellL;
        var cellR = instance.cellR;
        for (var i = cellL.length; i--; ) {
            cellL[i] = x;
            cellR[i] = y;
        }
    };
    var onmouseup = function(e) {
        instance._.emit("mouseup", e);
    };
    
    var $ = MouseListener.prototype;
    
    $.start = function() {
        window.addEventListener("click"    , onclick    , true);
        window.addEventListener("mousedown", onmousedown, true);
        window.addEventListener("mousemove", onmousemove, true);
        window.addEventListener("mouseup"  , onmouseup  , true);
        return this;
    };
    
    $.stop = function() {
        window.removeEventListener("click"    , onclick    , true);
        window.removeEventListener("mousedown", onmousedown, true);
        window.removeEventListener("mousemove", onmousemove, true);
        window.removeEventListener("mouseup"  , onmouseup  , true);
        return this;
    };
    
    $.play = $.pause = function() {
        return this;
    };
    
    fn.register("mouse", MouseListener);
    
    
    function MouseXY(_args) {
        timbre.Object.call(this, _args);
        if (!instance) {
            instance = new MouseListener([]);
        }
        fn.fixKR(this);
    }
    fn.extend(MouseXY, timbre.Object);
    
    Object.defineProperties(MouseXY.prototype, {
        min: {
            set: function(value) {
                var _ = this._;
                _.min = value;
                _.delta = _.max - _.min;
                _.map.bang();
            },
            get: function() {
                return this._.min;
            }
        },
        max: {
            set: function(value) {
                var _ = this._;
                _.max = value;
                _.delta = _.max - _.min;
                _.map.bang();
            },
            get: function() {
                return this._.max;
            }
        },
        curve: {
            set: function(value) {
                var _ = this._;
                if (Curves[value]) {
                    _.map.map = Curves[value].bind(_);
                    _.map.bang();
                    _.curveName = value;
                }
            },
            get: function() {
                return this._.curveName;
            }
        }
    });
    
    MouseXY.prototype.start = function() {
        instance.start();
        return this;
    };
    MouseXY.prototype.stop = function() {
        instance.stop();
        return this;
    };
    MouseXY.prototype.process = function(tickID) {
        return this._.map.process(tickID);
    };

    var Curves = {
        lin: function(input) {
            return input * this.delta + this.min;
        },
        exp: function(input) {
            var min = (this.min < 0) ? 1e-6 : this.min;
            return Math.pow(this.max/min, input) * min;
        },
        sqr: function(input) {
            return (input * input) * this.delta + this.min;
        },
        cub: function(input) {
            return (input * input * input) * this.delta + this.min;
        }
    };
    
    fn.register("mouse.x", function(_args) {
        var self = new MouseXY(_args);
        
        var _ = self._;
        _.min   = 0;
        _.max   = 1;
        _.delta = 1;
        _.curveName = "lin";
        
        _.map = timbre("map", {map:Curves.lin.bind(_)}, instance.X);
        
        self.cell = _.map.cell;
        
        return self;
    });
    fn.register("mouse.y", function(_args) {
        var self = new MouseXY(_args);
        
        var _ = self._;
        _.min   = 0;
        _.max   = 1;
        _.delta = 1;
        _.curveName = "lin";
        
        _.map = timbre("map", {map:Curves.lin.bind(_)}, instance.Y);
        
        self.cell = _.map.cell;
        return self;
    });
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function TimesNode(_args) {
        timbre.Object.call(this, _args);
    }
    fn.extend(TimesNode);
    
    var $ = TimesNode.prototype;
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs = this.inputs;
            var mul = _.mul, add = _.add;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 1;
            }
            
            if (_.ar) { // audio-rate
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].process(tickID);
                    for (j = jmax; j--; ) {
                        cell[j] *= tmp[j];
                    }
                }
                if (mul !== 1 || add !== 0) {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            } else {    // control-rate
                tmp = 1;
                for (i = 0; i < imax; ++i) {
                    tmp *= inputs[i].process(tickID)[0];
                }
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        
        return cell;
    };
    
    fn.register("*", TimesNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function NDictNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixKR(this);
        
        var _ = this._;
        _.defaultValue = 0;
        _.index = 0;
        _.dict  = {};
    }
    fn.extend(NDictNode);
    
    var $ = NDictNode.prototype;
    
    Object.defineProperties($, {
        dict: {
            set: function(value) {
                if (typeof value === "object") {
                    this._.dict = value;
                } else if (typeof value === "function") {
                    var dict = {};
                    for (var i = 0; i < 128; ++i) {
                        dict[i] = value(i);
                    }
                    this._.dict = dict;
                }
            },
            get: function() {
                return this._.dict;
            }
        },
        defaultValue: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.defaultValue = value;
                }
            },
            get: function() {
                return this._.defaultValue;
            }
        },
        index: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.index = value;
                }
            },
            get: function() {
                return this._.index;
            }
        }
    });
    
    $.at = function(index) {
        var _ = this._;
        return (_.dict[index|0] || _.defaultValue) * _.mul + _.add;
    };
    
    $.clear = function() {
        this._.dict = {};
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var index = (this.inputs.length) ? fn.inputSignalKR(this) : _.index;
            
            if (index < 0) {
                index = (index - 0.5)|0;
            } else {
                index = (index + 0.5)|0;
            }
            var value = (_.dict[index] || _.defaultValue) * _.mul + _.add;
            
            for (var i = cell.length; i--; ) {
                cell[i] = value;
            }
        }
        
        return cell;
    };
    
    fn.register("ndict", NDictNode);
    
    var NDictKey = {
        90 : 48, // Z -> C3
        83 : 49, // S -> C+3
        88 : 50, // X -> D3
        68 : 51, // D -> D+3
        67 : 52, // C -> E3
        86 : 53, // V -> F3
        71 : 54, // G -> F+3
        66 : 55, // B -> G3
        72 : 56, // H -> G+3
        78 : 57, // N -> A3
        74 : 58, // J -> A+3
        77 : 59, // M -> B3
        188: 60, // , -> C4
        76 : 61, // L -> C+4
        190: 62, // . -> D4
        186: 63, // ; -> D+4

        81 : 60, // Q -> C4
        50 : 61, // 2 -> C+4
        87 : 62, // W -> D4
        51 : 63, // 3 -> D+4
        69 : 64, // E -> E4
        82 : 65, // R -> F4
        53 : 66, // 5 -> F+4
        84 : 67, // T -> G4
        54 : 68, // 6 -> G+4
        89 : 69, // Y -> A4
        55 : 70, // 7 -> A+4
        85 : 71, // U -> B4
        73 : 72, // I -> C5
        57 : 73, // 9 -> C#5
        79 : 74, // O -> D5
        48 : 75, // 0 -> D+5
        80 : 76  // P -> E5
    };
    
    fn.register("ndict.key", function(_args) {
        var instance = new NDictNode(_args);
        instance.dict = NDictKey;
        return instance;
    });
    
})();

(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function NoiseNode(_args) {
        timbre.Object.call(this, _args);
    }
    fn.extend(NoiseNode);
    
    var $ = NoiseNode.prototype;

    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var mul = _.mul, add = _.add;
            var i, x, r = Math.random;
            
            if (_.ar) { // audio-rate
                for (i = cell.length; i--; ) {
                    cell[i] = (r() * 2 - 1) * mul + add;
                }
            } else {    // control-rate
                x = (r() * 2 + 1) * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
        }
        return cell;
    };
    
    fn.register("noise", NoiseNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue  = timbre.timevalue;
    var Oscillator = timbre.modules.Oscillator;
    
    function OscNode(_args) {
        timbre.Object.call(this, _args);
        
        var _ = this._;
        _.freq = timbre(440);
        _.osc = new Oscillator(timbre.samplerate);
        _.tmp = new Float32Array(this.cell.length);
        _.osc.step = this.cell.length;
        
        this.once("init", oninit);
    }
    fn.extend(OscNode);
    
    var oninit = function() {
        var _ = this._;
        if (!this.wave) {
            this.wave = "sin";
        }
        _.plotData = _.osc.wave;
        _.plotLineWidth = 2;
        _.plotCyclic = true;
        _.plotBefore = plotBefore;
    };
    
    var $ = OscNode.prototype;
    
    Object.defineProperties($, {
        wave: {
            set: function(value) {
                this._.osc.setWave(value);
            },
            get: function() {
                return this._.osc.wave;
            }
        },
        freq: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        value = 0;
                    } else {
                        value = 1000 / value;
                    }
                }
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        }
    });
    
    $.bang = function() {
        this._.osc.reset();
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs  = this.inputs;
            var i, imax = cell.length;
            
            if (inputs.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = imax; i--; ) {
                    cell[i] = 1;
                }
            }
            
            var osc   = _.osc;
            var  freq = _.freq;
            var _freq = _.freq.process(tickID);
            
            if (_.ar) { // audio-rate
                var tmp  = _.tmp;
                if (freq.isAr) {
                    osc.processWithFreqArray(tmp, _freq);
                } else { // _.freq.isKr
                    osc.frequency = _freq[0];
                    osc.process(tmp);
                }
                for (i = imax; i--; ) {
                    cell[i] = cell[i] * tmp[i];
                }
            } else {    // control-rate
                osc.frequency = _freq[0];
                var value = osc.next();
                for (i = imax; i--; ) {
                    cell[i] *= value;
                }
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };

    var plotBefore;
    if (timbre.envtype === "browser") {
        plotBefore = function(context, offset_x, offset_y, width, height) {
            var y = (height >> 1) + 0.5;
            context.strokeStyle = "#ccc";
            context.lineWidth   = 1;
            context.beginPath();
            context.moveTo(offset_x, y + offset_y);
            context.lineTo(offset_x + width, y + offset_y);
            context.stroke();
        };
    }
    
    fn.register("osc", OscNode);
    
    fn.register("sin", function(_args) {
        return new OscNode(_args).set("wave", "sin");
    });
    fn.register("cos", function(_args) {
        return new OscNode(_args).set("wave", "cos");
    });
    fn.register("pulse", function(_args) {
        return new OscNode(_args).set("wave", "pulse");
    });
    fn.register("tri", function(_args) {
        return new OscNode(_args).set("wave", "tri");
    });
    fn.register("saw", function(_args) {
        return new OscNode(_args).set("wave", "saw");
    });
    fn.register("fami", function(_args) {
        return new OscNode(_args).set("wave", "fami");
    });
    fn.register("konami", function(_args) {
        return new OscNode(_args).set("wave", "konami");
    });
    fn.register("+sin", function(_args) {
        return new OscNode(_args).set("wave", "+sin").kr();
    });
    fn.register("+pulse", function(_args) {
        return new OscNode(_args).set("wave", "+pulse").kr();
    });
    fn.register("+tri", function(_args) {
        return new OscNode(_args).set("wave", "+tri").kr();
    });
    fn.register("+saw", function(_args) {
        return new OscNode(_args).set("wave", "+saw").kr();
    });
    
    fn.alias("square", "pulse");
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function PannerNode(_args) {
        timbre.Object.call(this, _args);
        fn.stereo(this);
        fn.fixAR(this);
        
        var _ = this._;
        _.value = timbre(0);
        _.panL = 0.5;
        _.panR = 0.5;
    }
    fn.extend(PannerNode);
    
    var $ = PannerNode.prototype;
    
    Object.defineProperties($, {
        value: {
            set: function(value) {
                this._.value = timbre(value);
            },
            get: function() {
                return this._.value;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var changed = false;
            
            var value = _.value.process(tickID)[0];
            if (_.prevValue !== value) {
                _.prevValue = value;
                changed = true;
            }
            if (changed) {
                _.panL = Math.cos(0.5 * Math.PI * ((value * 0.5) + 0.5));
                _.panR = Math.sin(0.5 * Math.PI * ((value * 0.5) + 0.5));
            }
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp, x;
            
            var cellL = this.cellL;
            var cellR = this.cellR;
            
            for (j = jmax; j--; ) {
                cellL[j] = cellR[j] = cell[j] = 0;
            }
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].process(tickID);
                for (j = jmax; j--; ) {
                    cellL[j] = cellR[j] = cell[j] += tmp[j];
                }
            }
            
            var panL = _.panL;
            var panR = _.panR;
            for (j = jmax; j--; ) {
                x  = cellL[j] = cellL[j] * panL * mul + add;
                x += cellR[j] = cellR[j] * panR * mul + add;
                cell[j] = x * 0.5;
            }
        }
        
        return cell;
    };
    
    fn.register("pan", PannerNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var Envelope = timbre.modules.Envelope;
    
    function ParamNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixKR(this);
        
        var _ = this._;
        _.env = new Envelope(timbre.samplerate);
        _.env.step = this.cell.length;
        _.curve = "lin";
    }
    fn.extend(ParamNode);
    
    var $ = ParamNode.prototype;

    Object.defineProperties($, {
        value: {
            set: function(value) {
                if (typeof value === "number") {
                    var env = this._.env;
                    env.setTable([value, [value, 0]]);
                    env.reset();
                    env.status = Envelope.StatusGate;
                }
            },
            get: function() {
                return this._.env.value;
            }
        }
    });
    
    $.to = function(nextValue, time, curve) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, curve]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = curve;
        this._.plotFlush = true;
        return this;
    };
    
    $.setAt = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [env.value, time], [nextValue, 0]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "set";
        this._.plotFlush = true;
        return this;
    };
    
    $.linTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "lin"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "lin";
        this._.plotFlush = true;
        return this;
    };
    
    $.expTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "exp"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "exp";
        this._.plotFlush = true;
        return this;
    };
    
    $.sinTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "sin"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "sin";
        this._.plotFlush = true;
        return this;
    };
    
    $.welTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "wel"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "wel";
        this._.plotFlush = true;
        return this;
    };
    
    $.sqrTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "sqr"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "sqr";
        this._.plotFlush = true;
        return this;
    };
    
    $.cubTo = function(nextValue, time) {
        var env = this._.env;
        env.setTable([env.value, [nextValue, time, "cub"]]);
        env.reset();
        env.status = Envelope.StatusGate;
        this._.curve = "cub";
        this._.plotFlush = true;
        return this;
    };
    
    $.cancel = function() {
        this._.env.status = Envelope.StatusWait;
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs  = this.inputs;
            var i, imax = cell.length;
            var mul = _.mul, add = _.add;
            
            if (inputs.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = imax; i--; ) {
                    cell[i] = 1;
                }
            }
            
            var value = _.env.next();
            
            for (i = imax; i--; ) {
                cell[i] = (cell[i] * value) * mul + add;
            }
            
            var emit = _.env.emit;
            if (emit) {
                if (emit === "ended") {
                    fn.nextTick(onended.bind(this));
                } else {
                    this._.emit(emit, _.value);
                }
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        fn.onended(this);
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var env = new Envelope(128);
            
            var table;
            if (this._.curve === "set") {
                table = [0, [0, 900], [1, 0]];
            } else {
                table = [0, [1, 1000, this._.curve]];
            }
            
            env.setTable(table);
            env.status = Envelope.StatusGate;
            
            var data = new Float32Array(128);
            var i, imax;

            for (i = 0, imax = data.length; i < imax; ++i) {
                data[i] = env.next();
            }
            
            this._.plotData  = data;
            this._.plotRange = [0, 1];
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("param", ParamNode);
    
})();
(function() {
    "use strict";
    
    var fn  = timbre.fn;
    var Biquad = timbre.modules.Biquad;

    function PhaseShiftNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var _ = this._;
        _.buffer = new Float32Array(timbre.cellsize);
        _.freq   = timbre("sin", {freq:1, add:1000, mul:250}).kr();
        _.Q      = timbre(1);
        _.allpass  = [];
        
        this.steps = 2;
    }
    fn.extend(PhaseShiftNode);
    
    var $ = PhaseShiftNode.prototype;
    
    Object.defineProperties($, {
        freq: {
            set: function(value) {
                this._.freq = value;
            },
            get: function() {
                return this._.freq;
            }
        },
        Q: {
            set: function(value) {
                this._.Q = timbre(value);
            },
            get: function() {
                return this._.Q;
            }
        },
        steps: {
            set: function(value) {
                if (typeof value === "number") {
                    value |= 0;
                    if (value === 2 || value === 4 || value === 8 || value === 12) {
                        var allpass = this._.allpass;
                        if (allpass.length < value) {
                            for (var i = allpass.length; i < value; ++i) {
                                allpass[i] = new Biquad(timbre.samplerate);
                                allpass[i].setType("allpass");
                            }
                        }
                    }
                    this._.steps = value;
                }
            },
            get: function() {
                return this._.steps;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var freq  = _.freq.process(tickID)[0];
            var Q     = _.Q.process(tickID)[0];
            var steps = _.steps;
            var i;
            
            _.buffer.set(cell);
            
            for (i = steps; i--; ) {
                _.allpass[i].setParams(freq, Q, 0);
                _.allpass[i].process(_.buffer);
                i--;
                _.allpass[i].setParams(freq, Q, 0);
                _.allpass[i].process(_.buffer);
            }
            
            for (i = cell.length; i--; ) {
                cell[i] = (cell[i] + _.buffer[i]) * 0.5;
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("phaseshift", PhaseShiftNode);
    
})();
(function() {
    "use strict";
    
    // Voss algorithm
    // http://www.firstpr.com.au/dsp/pink-noise/
    
    var MAX_KEY = 31;
    var fn = timbre.fn;
    
    function PinkNoiseNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);
        
        var whites = new Uint8Array(5);
        for (var i = 0; i < 5; ++i) {
            whites[i] = ((Math.random() * (1<<30))|0) % 25;
        }
        this._.whites = whites;
        this._.key = 0;
    }
    fn.extend(PinkNoiseNode);
    
    var $ = PinkNoiseNode.prototype;
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var i, imax, j;
            var key = _.key, whites = _.whites;
            var mul = _.mul, add = _.add;
            var last_key, sum, diff;
            
            for (i = 0, imax = cell.length; i < imax; ++i) {
                last_key = key++;
                if (key > MAX_KEY) {
                    key = 0;
                }
                diff = last_key ^ key;
                for (j = sum = 0; j < 5; ++j) {
                    if (diff & (1 << j)) {
                        whites[j] = ((Math.random() * (1<<30))|0) % 25;
                    }
                    sum += whites[j];
                }
                cell[i] = ((sum * 0.01666666) - 1) * mul + add;
            }
            _.key = key;
        }
        return cell;
    };
    
    fn.register("pink", PinkNoiseNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function PluckNode(_args) {
        timbre.Object.call(this, _args);
        
        this._.freq   = 440;
        this._.buffer = null;
        this._.readIndex  = 0;
        this._.writeIndex = 0;
    }
    fn.extend(PluckNode);
    
    var $ = PluckNode.prototype;

    Object.defineProperties($, {
        freq: {
            set: function(value) {
                if (typeof value === "number") {
                    if (value < 0) {
                        value = 0;
                    }
                    this._.freq = value;
                }
            },
            get: function() {
                return this._.freq;
            }
        }
    });
    
    $.bang = function() {
        var _ = this._;
        var freq   = _.freq;
        var size   = (timbre.samplerate / freq + 0.5)|0;
        var buffer = _.buffer = new Float32Array(size << 1);
        for (var i = size; i--; ) {
            buffer[i] = Math.random() * 2 - 1;
        }
        _.readIndex  = 0;
        _.writeIndex = size;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var buffer = _.buffer;
            if (buffer) {
                var bufferLength = buffer.length;
                var readIndex  = _.readIndex;
                var writeIndex = _.writeIndex;
                var mul = _.mul, add = _.add;
                var x, i, imax = cell.length;
                
                for (i = 0; i < imax; ++i) {
                    x = buffer[readIndex++];
                    if (readIndex >= bufferLength) {
                        readIndex = 0;
                    }
                    x = (x + buffer[readIndex]) * 0.5;
                    buffer[writeIndex++] = x;
                    if (writeIndex >= bufferLength) {
                        writeIndex = 0;
                    }
                    cell[i] = x * mul + add;
                }
                _.readIndex  = readIndex;
                _.writeIndex = writeIndex;
            }
        }
        
        return cell;
    };
    
    fn.register("pluck", PluckNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    
    var STATUS_WAIT = 0;
    var STATUS_REC  = 1;
    
    function RecNode(_args) {
        timbre.Object.call(this, _args);
        fn.listener(this);
        fn.fixAR(this);
        
        var _ = this._;
        
        _.timeout    = 5000;
        _.samplerate = timbre.samplerate;
        _.status     = STATUS_WAIT;
        _.writeIndex = 0;
        _.writeIndexIncr  = 1;
        _.currentTime     = 0;
        _.currentTimeIncr = 1000 / timbre.samplerate;
    }
    fn.extend(RecNode);
    
    var $ = RecNode.prototype;
    
    Object.defineProperties($, {
        timeout: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value > 0) {
                    this._.timeout = value;
                }
            },
            get: function() {
                return this._.timeout;
            }
        },
        samplerate: {
            set: function(value) {
                if (typeof value === "number") {
                    if (0 < value && value <= timbre.samplerate) {
                        this._.samplerate = value;
                    }
                }
            },
            get: function() {
                return this._.samplerate;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });
    
    $.start = function() {
        var _ = this._, len;
        if (_.status === STATUS_WAIT) {
            len = (_.timeout * 0.01 * _.samplerate)|0;
            if (!_.buffer || _.buffer.length < len) {
                _.buffer = new Float32Array(len);
            }
            _.writeIndex = 0;
            _.writeIndexIncr = _.samplerate / timbre.samplerate;
            _.currentTime = 0;
            _.status = STATUS_REC;
            _.emit("start");
            this.listen();
        }
        return this;
    };
    
    $.stop = function() {
        var _ = this._;
        if (_.status === STATUS_REC) {
            _.status = STATUS_WAIT;
            _.emit("stop");
            fn.nextTick(onended.bind(this));
            this.unlisten();
        }
        return this;
    };
    
    $.bang = function() {
        if (this._.status === STATUS_WAIT) {
            this.srart();
        } else if (this._.status === STATUS_REC) {
            this.stop();
        }
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            
            if (_.status === STATUS_REC) {
                var i, imax = cell.length;
                var buffer  = _.buffer;
                var timeout = _.timeout;
                var writeIndex      = _.writeIndex;
                var writeIndexIncr  = _.writeIndexIncr;
                var currentTime     = _.currentTime;
                var currentTimeIncr = _.currentTimeIncr;
                
                for (i = 0; i < imax; ++i) {
                    buffer[writeIndex|0] = cell[i];
                    writeIndex += writeIndexIncr;
                    
                    currentTime += currentTimeIncr;
                    if (timeout <= currentTime) {
                        fn.nextTick(onended.bind(this));
                    }
                }
                _.writeIndex  = writeIndex;
                _.currentTime = currentTime;
            }
            
            fn.outputSignalAR(this);
        }
        return cell;
    };
    
    var onended = function() {
        var _ = this._;
        
        var buffer = new Float32Array(_.buffer.subarray(0, _.writeIndex|0));
        
        _.status      = STATUS_WAIT;
        _.writeIndex  = 0;
        _.currentTime = 0;
        
        _.emit("ended", {
            buffer:buffer, samplerate:_.samplerate
        });
    };
    
    fn.register("record", RecNode);
    fn.alias("rec", "record");
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    
    function ScheduleNode(_args) {
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.queue = [];
        _.currentTime     = 0;
        _.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        _.maxRemain = 1000;
    }
    fn.extend(ScheduleNode);
    
    var $ = ScheduleNode.prototype;
    
    Object.defineProperties($, {
        queue: {
            get: function() {
                return this._.queue;
            }
        },
        remain: {
            get: function() {
                return this._.queue.length;
            }
        },
        maxRemain: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.maxRemain = value;
                }
            },
            get: function() {
                return this._.maxRemain;
            }
        },
        isEmpty: {
            get: function() {
                return this._.queue.length === 0;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });
    
    $.sched = function(delta, item) {
        if (typeof delta === "string") {
            delta = timevalue(delta);
        }
        if (typeof delta === "number") {
            this.schedAbs(this._.currentTime + delta, item);
        }
        return this;
    };
    
    $.schedAbs = function(time, item) {
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof time === "number") {
            var _ = this._;
            var queue = _.queue;
            if (queue.length >= _.maxRemain) {
                return this;
            }
            for (var i = queue.length; i--; ) {
                if (queue[i][0] < time) {
                    break;
                }
            }
            queue.splice(i + 1, 0, [time, timbre(item)]);
        }
        return this;
    };
    
    $.advance = function(delta) {
        if (typeof delta === "string") {
            delta = timevalue(delta);
        }
        if (typeof delta === "number") {
            this._.currentTime += delta;
        }
        return this;
    };
    
    $.clear = function() {
        this._.queue.splice(0);
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;

        if (_.isEnded) {
            return cell;
        }

        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var emit = null;
            var queue = _.queue;
            
            if (queue.length) {
                while (queue[0][0] < _.currentTime) {
                    var nextItem = _.queue.shift();
                    nextItem[1].bang(); // TODO: args?
                    emit = "sched";
                    if (queue.length === 0) {
                        emit = "empty";
                        break;
                    }
                }
            }
            _.currentTime += _.currentTimeIncr;
            if (emit) {
                _.emit(emit);
            }
        }
    };
    
    fn.register("schedule", ScheduleNode);
    fn.alias("sche", "schedule");
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    
    function ScopeNode(_args) {
        timbre.Object.call(this, _args);
        fn.listener(this);
        fn.fixAR(this);
        
        this._.samples    = 0;
        this._.writeIndex = 0;
        
        this._.plotFlush = true;
        
        this.once("init", oninit);
    }
    fn.extend(ScopeNode);
    
    var oninit = function() {
        if (!this._.buffer) {
            this.size = 1024;
        }
        if (!this._.interval) {
            this.interval = 1000;
        }
    };
    
    var $ = ScopeNode.prototype;
    
    Object.defineProperties($, {
        size: {
            set: function(value) {
                var _ = this._;
                if (!_.buffer) {
                    if (typeof value === "number") {
                        var n = (value < 64) ? 64 : (value > 2048) ? 2048 : value;
                        _.buffer = new Float32Array(n);
                        if (_.reservedinterval) {
                            this.interval = _.reservedinterval;
                            _.reservedinterval = null;
                        }
                    }
                }
            },
            get: function() {
                return this._.buffer.length;
            }
        },
        interval: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value > 0) {
                    if (!_.buffer) {
                        _.reservedinterval = value;
                    } else {
                        _.interval    = value;
                        _.samplesIncr = value * 0.001 * timbre.samplerate / _.buffer.length;
                        if (_.samplesIncr < 1) {
                            _.samplesIncr = 1;
                        }
                    }
                }
            },
            get: function() {
                return this._.interval;
            }
        }
    });
    
    $.bang = function() {
        var _ = this._;
        var buffer = _.buffer;
        
        for (var i = buffer.length; i--; ) {
            buffer[i] = 0;
        }
        _.samples    = 0;
        _.writeIndex = 0;
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;

        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            var i, imax = cell.length;
            var samples     = _.samples;
            var samplesIncr = _.samplesIncr;
            var buffer      = _.buffer;
            var writeIndex  = _.writeIndex;
            var emit = false;
            var mul = _.mul, add = _.add;
            var mask = buffer.length - 1;
            
            for (i = 0; i < imax; ++i) {
                if (samples <= 0) {
                    buffer[writeIndex++] = cell[i];
                    writeIndex &= mask;
                    emit = _.plotFlush = true;
                    samples += samplesIncr;
                }
                cell[i] = cell[i] * mul + add;
                --samples;
            }
            _.samples    = samples;
            _.writeIndex = writeIndex;
            
            if (emit) {
                this._.emit("scope");
            }
        }
        
        return cell;
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        var _ = this._;
        if (_.plotFlush) {
            var buffer = _.buffer;
            var mask   = buffer.length - 1;
            var data   = new Float32Array(buffer.length);
            var j = _.writeIndex;
            for (var i = 0, imax = buffer.length; i < imax; i++) {
                data[i] = buffer[++j & mask];
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    fn.register("scope", ScopeNode);
    
})();
(function() {
    "use strict";

    var fn = timbre.fn;

    function SelectorNode(_args) {
        timbre.Object.call(this, _args);
        
        this._.selected   = 0;
        this._.background = false;
    }
    fn.extend(SelectorNode);
    
    var $ = SelectorNode.prototype;

    Object.defineProperties($, {
        selected: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.selected = value;
                    var cell = this.cell;
                    for (var i = cell.length; i--; ) {
                        cell[i] = 0;
                    }
                }
            },
            get: function() {
                return this._.selected;
            }
        },
        background: {
            set: function(value) {
                this._.background = !!value;
            },
            get: function() {
                return this._.background;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var inputs = this.inputs;
            var i, imax = inputs.length;
            
            if (_.background) {
                for (i = 0; i < imax; ++i) {
                    inputs[i].process(tickID);
                }
            }
            
            var tmp = inputs[_.selected];
            if (tmp) {
                cell.set(tmp.process(tickID));
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("selector", SelectorNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    var FFT = timbre.modules.FFT;
    
    function SpectrumNode(_args) {
        timbre.Object.call(this, _args);
        fn.listener(this);
        fn.fixAR(this);
        
        this._.status  = 0;
        this._.samples = 0;
        this._.samplesIncr = 0;
        this._.writeIndex  = 0;
        
        this._.plotFlush = true;
        this._.plotRange = [0, 0.5];
        this._.plotBarStyle = true;
        
        this.once("init", oninit);
    }
    fn.extend(SpectrumNode);
    
    var oninit = function() {
        var _ = this._;
        if (!_.fft) {
            this.size = 512;
        }
        if (!_.interval) {
            this.interval = 500;
        }
    };
    
    var $ = SpectrumNode.prototype;
    
    Object.defineProperties($, {
        size: {
            set: function(value) {
                var _ = this._;
                if (!_.fft) {
                    if (typeof value === "number") {
                        var n = (value < 256) ? 256 : (value > 2048) ? 2048 : value;
                        _.fft    = new FFT(n);
                        _.buffer = new Float32Array(_.fft.length);
                        if (_.reservedwindow) {
                            _.fft.setWindow(_.reservedwindow);
                            _.reservedwindow = null;
                        }
                        if (_.reservedinterval) {
                            this.interval = _.reservedinterval;
                            _.reservedinterval = null;
                        }
                    }
                }
            },
            get: function() {
                return this._.buffer.length;
            }
        },
        window: {
            set: function(value) {
                this._.fft.setWindow(value);
            },
            get: function() {
                return this._.fft.windowName;
            }
        },
        interval: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value > 0) {
                    if (!_.buffer) {
                        _.reservedinterval = value;
                    } else {
                        _.interval = value;
                        _.samplesIncr = (value * 0.001 * timbre.samplerate);
                        if (_.samplesIncr < _.buffer.length) {
                            _.samplesIncr = _.buffer.length;
                            _.interval = _.samplesIncr * 1000 / timbre.samplerate;
                        }
                    }
                }
            },
            get: function() {
                return this._.interval;
            }
        },
        spectrum: {
            get: function() {
                return this._.fft.spectrum;
            }
        },
        real: {
            get: function() {
                return this._.fft.real;
            }
        },
        imag: {
            get: function() {
                return this._.fft.imag;
            }
        }
    });
    
    $.bang = function() {
        this._.samples    = 0;
        this._.writeIndex = 0;
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            
            var i, imax = cell.length;
            var status  = _.status;
            var samples = _.samples;
            var samplesIncr = _.samplesIncr;
            var writeIndex  = _.writeIndex;
            var buffer = _.buffer;
            var bufferLength = buffer.length;
            var mul = _.mul, add = _.add;
            var emit;
            
            for (i = 0; i < imax; ++i) {
                if (samples <= 0) {
                    if (status === 0) {
                        status = 1;
                        writeIndex  = 0;
                        samples += samplesIncr;
                    }
                }
                if (status === 1) {
                    buffer[writeIndex++] = cell[i];
                    if (bufferLength <= writeIndex) {
                        _.fft.forward(buffer);
                        emit = _.plotFlush = true;
                        status = 0;
                    }
                }
                cell[i] = cell[i] * mul + add;
                --samples;
            }
            
            _.samples = samples;
            _.status  = status;
            _.writeIndex = writeIndex;
            
            if (emit) {
                this._.emit("fft");
            }
        }
        return cell;
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var fft = this._.fft;
            
            var spectrum = fft.spectrum;
            var step     = fft.length >> 6;
            var istep    = 1 / step;
            var data    = new Float32Array(spectrum.length * istep);
            var i, imax = spectrum.length;
            var j, jmax = step;
            
            var v, k = 0;
            for (i = 0; i < imax; i += step) {
                v = 0;
                for (j = 0; j < jmax; ++j) {
                    v += spectrum[i + j];
                }
                data[k++] = v * istep;
            }
            
            this._.plotData  = data;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    fn.register("spectrum", SpectrumNode);

})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function SynthDefNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);

        var _ = this._;

        _.poly     = 4;
        _.genList  = [];
        _.genDict  = {};
        _.synthdef = null;
        _.isEnded  = true;
        
        _.remGen = remGen.bind(this);
    }
    fn.extend(SynthDefNode);
    
    var $ = SynthDefNode.prototype;
    
    Object.defineProperties($, {
        def: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.synthdef = value;
                }
            },
            get: function() {
                return this._.synthdef;
            }
        },
        poly: {
            set: function(value) {
                if (typeof value === "number") {
                    if (0 < value && value <= 64) {
                        this._.poly = value;
                    }
                }
            },
            get: function() {
                return this._.poly;
            }
        }
    });
    
    var doneAction = function(opts) {
        remGen.call(this, opts.gen);
    };
    
    var remGen = function(gen) {
        var _ = this._;
        var i = _.genList.indexOf(gen);
        if (i !== -1) {
            _.genList.splice(i, 1);
        }
        _.genDict[gen.noteNum] = null;
    };
    
    var noteOn = function(noteNum, freq, velocity, _opts) {
        velocity |= 0;
        if (velocity <= 0) {
            this.noteOff(this, noteNum);
        } else if (velocity > 127) {
            velocity = 127;
        }
        var _ = this._;
        var list = _.genList, dict = _.genDict;
        var gen = dict[noteNum];
        if (gen) {
            _.remGen(gen);
        }
        
        var opts = {
            freq    : freq,
            noteNum : noteNum,
            velocity: velocity
        };
        if (_opts) {
            for (var key in _opts) {
                opts[key] = _opts[key];
            }
        }
        opts.doneAction = doneAction.bind(this, opts);
        
        gen = this._.synthdef.call(this, opts);
        
        if (gen instanceof timbre.Object) {
            gen.noteNum = noteNum;
            list.push(gen);
            dict[noteNum] = opts.gen = gen;
            
            _.isEnded = false;
            
            if (list.length >= _.poly) {
                _.remGen(list[0]);
            }
        }
    };
    
    var midicps = (function() {
        var table = new Float32Array(128);
        for (var i = 0; i < 128; ++i) {
            table[i] = 440 * Math.pow(2, (i - 69) * 1 / 12);
        }
        return table;
    })();

    var cpsmidi = function(cps) {
        if (cps > 0) {
            return Math.log(cps * 1 / 440) * Math.LOG2E * 12 + 69;
        } else {
            return 0;
        }
    };
    
    $.noteOn = function(noteNum, velocity, _opts) {
        var freq = midicps[noteNum] || (440 * Math.pow(2, (noteNum - 69) / 12));
        noteOn.call(this, (noteNum + 0.5)|0, freq, velocity, _opts);
        return this;
    };
    
    $.noteOff = function(noteNum) {
        var gen = this._.genDict[noteNum];
        if (gen && gen.release) {
            gen.release();
        }
        return this;
    };
    
    $.noteOnWithFreq = function(freq, velocity, _opts) {
        var noteNum = cpsmidi(freq);
        noteOn.call(this, (noteNum + 0.5)|0, freq, velocity, _opts);
        return this;
    };
    
    $.noteOffWithFreq = function(freq) {
        var noteNum = cpsmidi(freq);
        return this.noteOff((noteNum + 0.5)|0);
    };
    
    $.allNoteOff = function() {
        var list = this._.genList;
        for (var i = 0, imax = list.length; i < imax; ++i) {
            if (list[i].release) {
                list[i].release();
            }
        }
    };
    
    $.allSoundOff = function() {
        var _ = this._;
        var list = _.genList;
        var dict = _.genDict;
        while (list.length) {
            delete dict[list.shift().noteNum];
        }
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            fn.inputSignalAR(this);
            
            // process
            if (!_.isEnded) {
                var list;
                var i, imax;
                var j, jmax = cell.length;
                var tmp;
                
                list = _.genList;
                for (i = 0, imax = list.length; i < imax; ++i) {
                    tmp = list[i].process(tickID);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                if (imax === 0) {
                    fn.nextTick(fn.onended.bind(null, this));
                }
            }
            
            fn.outputSignalAR(this);
        }
        
        return cell;
    };
    
    fn.register("SynthDef", SynthDefNode);
    
    
    var env_desc = {
        set: function(value) {
            if (fn.isDictionary(value)) {
                if (typeof value.type === "string") {
                    this._.env = value;
                }
            } else if (value instanceof timbre.Object) {
                this._.env = value;
            }
        },
        get: function() {
            return this._.env;
        }
    };
    
    fn.register("OscGen", (function() {

        var wave_desc = {
            set: function(value) {
                if (typeof value === "string") {
                    this._.wave = value;
                }
            },
            get: function() {
                return this._.wave;
            }
        };
        
        var synthdef = function(opts) {
            var _ = this._;
            var synth, env, envtype;
            
            env = _.env || {};
            envtype = env.type || "perc";
            
            synth = timbre("osc", {wave:_.wave, freq:opts.freq, mul:opts.velocity/128});
            if (env instanceof timbre.Object) {
                if (typeof env.clone === "function") {
                    synth = env.clone().append(synth);
                }
            } else {
                synth = timbre(envtype, env, synth);
            }
            synth.on("ended", opts.doneAction).bang();
            
            return synth;
        };
        
        return function(_args) {
            var instance = new SynthDefNode(_args);
            
            instance._.wave = "sin";
            
            Object.defineProperties(instance, {
                env: env_desc, wave: wave_desc
            });
            
            instance.def = synthdef;
            
            return instance;
        };
    })());
    
    fn.register("PluckGen", (function() {
        
        var synthdef = function(opts) {
            var _ = this._;
            var synth, env, envtype;
            
            env = _.env || {};
            envtype = env.type || "perc";
            
            synth = timbre("pluck", {freq:opts.freq, mul:opts.velocity/128}).bang();
            if (env instanceof timbre.Object) {
                if (typeof env.clone === "function") {
                    synth = env.clone().append(synth);
                }
            } else {
                synth = timbre(envtype, env, synth);
            }
            synth.on("ended", opts.doneAction).bang();
            
            return synth;
        };
        
        return function(_args) {
            var instance = new SynthDefNode(_args);
            
            Object.defineProperties(instance, {
                env: env_desc
            });
            
            instance.def = synthdef;
            
            return instance;
        };
    })());
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var Scissor    = timbre.modules.Scissor;
    var Tape       = Scissor.Tape;
    var TapeStream = Scissor.TapeStream;
    
    function ScissorNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixAR(this);

        var _ = this._;
        _.isLooped = false;
        _.isEnded  = false;
    }
    fn.extend(ScissorNode);
    
    var $ = ScissorNode.prototype;
    
    Object.defineProperties($, {
        tape: {
            set: function(tape) {
                if (tape instanceof Tape) {
                    this._.tape = tape;
                    this._.tapeStream = new TapeStream(tape, timbre.samplerate);
                    this._.isEnded = false;
                } else if (typeof tape === "object") {
                    if (tape.buffer instanceof Float32Array) {
                        this._.tape = new Scissor(tape);
                        this._.tapeStream = new TapeStream(tape, timbre.samplerate);
                        this._.isEnded = false;
                    }
                }
            },
            get: function() {
                return this._.tape;
            }
        },
        isLooped: {
            set: function(value) {
                this.loop(value);
            },
            get: function() {
                return this._.isLooped;
            }
        },
        isEnded: {
            get: function() {
                return this._.isEnded;
            }
        }
    });
    
    $.loop = function(value) {
        this._.isLooped = !!value;
        if (this._.tapeStream) {
            this._.tapeStream.isLooped = this._.isLooped;
        }
        return this;
    };
    
    $.bang = function() {
        if (this._.tapeStream) {
            this._.tapeStream.reset();
        }
        this._.isEnded = false;
        this._.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var _ = this._;
        var cell  = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var tapeStream = _.tapeStream;
            
            if (tapeStream) {
                var mul = _.mul, add = _.add;
                var tmp  = tapeStream.fetch(cell.length);
                var tmpL = tmp[0];
                var tmpR = tmp[1];
                for (var i = cell.length; i--; ) {
                    cell[i] = (tmpL[i] + tmpR[i]) * 0.5 * mul + add;
                }
            }
            
            if (!_.isEnded && tapeStream.isEnded) {
                fn.nextTick(onended.bind(this));
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        fn.onended(this, 0);
    };
    
    fn.register("tape", ScissorNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    var timevalue = timbre.timevalue;
    
    function TimeoutNode(_args) {
        timbre.Object.call(this, _args);
        fn.timer(this);
        fn.fixKR(this);
        
        var _ = this._;
        _.currentTime = 0;
        _.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        _.samplesMax = 0;
        _.samples    = 0;
        _.isEnded = true;
        
        this.once("init", oninit);
        this.on("start", onstart);
    }
    
    fn.extend(TimeoutNode);
    
    var oninit = function() {
        if (!this._.timeout) {
            this.timeout = 1000;
        }
    };
    
    var onstart = function() {
        this._.isEnded = false;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });
    var onended = function() {
        this._.isEnded = true;
        this._.emit("ended");
    };
    
    var $ = TimeoutNode.prototype;
    
    Object.defineProperties($, {
        timeout: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    _.timeout = value;
                    _.samplesMax = (timbre.samplerate * (value * 0.001))|0;
                    _.samples = _.samplesMax;
                    _.isEnded = false;
                }
            },
            get: function() {
                return this._.timeout;
            }
        },
        currentTime: {
            get: function() {
                return this._.currentTime;
            }
        }
    });
    
    $.bang = function() {
        var _ = this._;
        _.samples = _.samplesMax;
        _.currentTime = 0;
        _.isEnded = false;
        _.emit("bang");
        return this;
    };
    
    $.process = function(tickID) {
        var cell = this.cell;
        var _ = this._;

        if (_.isEnded) {
            return cell;
        }
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            if (_.samples > 0) {
                _.samples -= cell.length;
            }
            
            if (_.samples <= 0) {
                var inputs = this.inputs;
                for (var i = 0, imax = inputs.length; i < imax; ++i) {
                    inputs[i].bang();
                }
                fn.nextTick(onended.bind(this));
            }
            _.currentTime += _.currentTimeIncr;
        }
        return cell;
    };
    
    fn.register("timeout", TimeoutNode);
    
})();
(function() {
    "use strict";
    
    var fn = timbre.fn;
    
    function ZMapNode(_args) {
        timbre.Object.call(this, _args);
        fn.fixKR(this);
        
        this._.inMin  = 0;
        this._.inMax  = 1;
        this._.outMin = 0;
        this._.outMax = 1;
        
        this.once("init", oninit);
    }
    fn.extend(ZMapNode);
    
    var oninit = function() {
        if (!this._.warp) {
            this.warp = "linlin";
        }
    };
    
    var $ = ZMapNode.prototype;
    
    Object.defineProperties($, {
        inMin: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.inMin = value;
                }
            },
            get: function() {
                return this._.inMin;
            }
        },
        inMax: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.inMax = value;
                }
            },
            get: function() {
                return this._.inMax;
            }
        },
        outMin: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.outMin = value;
                }
            },
            get: function() {
                return this._.outMin;
            }
        },
        outMax: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.outMax = value;
                }
            },
            get: function() {
                return this._.outMax;
            }
        },
        warp: {
            set: function(value) {
                if (typeof value === "string") {
                    var f = WarpFunctions[value];
                    if (f) {
                        this._.warp = f;
                        this._.warpName = value;
                    }
                }
            },
            get: function() {
                return this._.warpName;
            }
        }
    });
    
    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            
            var inputs  = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var x;
            
            x = 0;
            for (i = 0; i < imax; ++i) {
                x += inputs[i].process(tickID)[0];
            }

            var inMin  = _.inMin, inMax   = _.inMax;
            var outMin = _.outMin, outMax = _.outMax;
            var warp   = _.warp;
            
            x = warp(x, inMin, inMax, outMin, outMax) * _.mul + _.add;
            
            for (j = jmax; j--; ) {
                cell[j] = x;
            }
        }
        
        return cell;
    };
    
    var WarpFunctions = {
        linlin: function(x, inMin, inMax, outMin, outMax) {
            if (x < inMin) {
                return outMin;
            } else if (x > inMax) {
                return outMax;
            }
            if (inMax === inMin) {
                return outMin;
            }
            return (x-inMin) / (inMax-inMin) * (outMax-outMin) + outMin;
        },
        linexp: function(x, inMin, inMax, outMin, outMax) {
            if (x < inMin) {
                return outMin;
            } else if (x > inMax) {
                return outMax;
            }
            if (outMin === 0) {
                return 0;
            }
            if (inMax === inMin) {
                return outMax;
            }
            return Math.pow(outMax/outMin, (x-inMin)/(inMax-inMin)) * outMin;
        },
        explin: function(x, inMin, inMax, outMin, outMax) {
            if (x < inMin) {
                return outMin;
            } else if (x > inMax) {
                return outMax;
            }
            if (inMin === 0) {
                return outMax;
            }
            return Math.log(x/inMin) / Math.log(inMax/inMin) * (outMax-outMin) + outMin;
        },
        expexp: function(x, inMin, inMax, outMin, outMax) {
            if (x < inMin) {
                return outMin;
            } else if (x > inMax) {
                return outMax;
            }
            if (inMin === 0 || outMin === 0) {
                return 0;
            }
            return Math.pow(outMax/outMin, Math.log(x/inMin) / Math.log(inMax/inMin)) * outMin;
        }
    };
    
    fn.register("zmap", ZMapNode);
    
})();
