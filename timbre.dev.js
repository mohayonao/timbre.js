/**
 * T("timbre.js") - A JavaScript library for objective sound programming
 */
(function(undefined) {
    "use strict";

    if (typeof Float32Array === "undefined") {
        /*jshint latedef:true */
        setupTypedArray();
        /*jshint latedef:false */
    }

    var timbre = function() {
        return T.apply(null, arguments);
    };

    var slice = Array.prototype.slice;

    var FINISHED_STATE    = 0;
    var PLAYING_STATE     = 1;
    var UNSCHEDULED_STATE = 2; // (not use)
    var SCHEDULED_STATE   = 3; // (not use)

    var ACCEPT_SAMPLERATES = [8000,11025,12000,16000,22050,24000,32000,44100,48000];
    var ACCEPT_CELLSIZES = [32,64,128,256];

    var _ver = "13.08.03";
    var _sys = null;
    var _constructors = {};
    var _factories    = {};
    var _envtype = (typeof module !== "undefined" && module.exports) ? "node" :
        (typeof window !== "undefined") ? "browser" : "unknown";
    var _envmobile = _envtype === "browser" && /(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent);
    var _f64mode = false;
    var _bpm = 120;

    var T = function() {
        var args = slice.call(arguments), key = args[0], t, m;

        switch (typeof key) {
        case "string":
            if (_constructors[key]) {
                t = new _constructors[key](args.slice(1));
            } else if (_factories[key]) {
                t = _factories[key](args.slice(1));
            } else {
                m = /^(.+?)(?:\.(ar|kr))?$/.exec(key);
                if (m) {
                    key = m[1];
                    if (_constructors[key]) {
                        t = new _constructors[key](args.slice(1));
                    } else if (_factories[key]) {
                        t = _factories[key](args.slice(1));
                    }
                    if (t && m[2]) {
                        t[m[2]]();
                    }
                }
            }
            break;
        case "number":
            t = new NumberWrapper(args);
            break;
        case "boolean":
            t = new BooleanWrapper(args);
            break;
        case "function":
            t = new FunctionWrapper(args);
            break;
        case "object":
            if (key !== null) {
                if (key instanceof TimbreObject) {
                    return key;
                } else if (key.context instanceof TimbreObject) {
                    return key.context;
                } else if (isDictionary(key)) {
                    t = new ObjectWrapper(args);
                } else if (isArray(key)) {
                    t = new ArrayWrapper(args);
                }
            }
            break;
        }

        if (t === undefined) {
            t = new AddNode(args.slice(1));
            console.warn("T(\"" + key + "\") is not defined.");
        }

        var _ = t._;
        _.originkey = key;
        _.meta = __buildMetaData(t);
        _.emit("init");

        return t;
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

    // properties
    Object.defineProperties(timbre, {
        version  : { value: _ver },
        envtype  : { value: _envtype },
        envmobile: { value: _envmobile },
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
                return _sys.status === PLAYING_STATE;
            }
        },
        isRecording: {
            get: function() {
                return _sys.status === SCHEDULED_STATE;
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
        },
        bpm: {
            set: function(value) {
                if (typeof value === "number") {
                    if (5 <= value && value <= 300) {
                        _bpm = value;
                    }
                }
            },
            get: function() {
                return _bpm;
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
    timbre.on = timbre.addListener = function(type, listener) {
        _sys.on(type, listener);
        return timbre;
    };
    timbre.once = function(type, listener) {
        _sys.once(type, listener);
        return timbre;
    };
    timbre.off = timbre.removeListener = function(type, listener) {
        _sys.off(type, listener);
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
    timbre.timevalue = (function() {
        var getbpm = function(str) {
            var m, bpm = _bpm;
            if ((m = /^bpm(\d+(?:\.\d+)?)/i.exec(str))) {
                bpm = Math.max(5, Math.min(300, +(m[1]||0)));
            }
            return bpm;
        };
        return function(str) {
            var m, ms, x;
            if ((m = /^(\d+(?:\.\d+)?)Hz$/i.exec(str))) {
                return +m[1] === 0 ? 0 : 1000 / +m[1];
            }
            if ((m = /L(\d+)?(\.*)$/i.exec(str))) {
                ms = 60 / getbpm(str) * (4 / (m[1]||4)) * 1000;
                ms *= [1, 1.5, 1.75, 1.875][(m[2]||"").length] || 1;
                return ms;
            }
            if ((m = /^(\d+(?:\.\d+)?|\.(?:\d+))(min|sec|m)s?$/i.exec(str))) {
                switch (m[2]) {
                case "min": return +(m[1]||0) * 60 * 1000;
                case "sec": return +(m[1]||0) * 1000;
                case "m"  : return +(m[1]||0);
                }
            }
            if ((m = /^(?:([0-5]?[0-9]):)?(?:([0-5]?[0-9]):)(?:([0-5]?[0-9]))(?:\.([0-9]{1,3}))?$/.exec(str))) {
                x = (m[1]||0) * 3600 + (m[2]||0) * 60 + (m[3]||0);
                x = x * 1000 + ((((m[4]||"")+"00").substr(0, 3))|0);
                return x;
            }
            if ((m = /(\d+)\.(\d+)\.(\d+)$/i.exec(str))) {
                x = (m[1] * 4 + (+m[2])) * 480 + (+m[3]);
                return 60 / getbpm(str) * (x / 480) * 1000;
            }
            if ((m = /(\d+)ticks$/i.exec(str))) {
                return 60 / getbpm(str) * (m[1] / 480) * 1000;
            }
            if ((m = /^(\d+)samples(?:\/(\d+)Hz)?$/i.exec(str))) {
                return m[1] * 1000 / (m[2] || timbre.samplerate);
            }
            return 0;
        };
    })();

    var fn = timbre.fn = {
        SignalArray: Float32Array,
        currentTimeIncr: 0,
        emptycell: null,
        FINISHED_STATE: FINISHED_STATE,
        PLAYING_STATE: PLAYING_STATE,
        UNSCHEDULED_STATE: UNSCHEDULED_STATE,
        SCHEDULED_STATE: SCHEDULED_STATE
    };

    var isArray = fn.isArray = Array.isArray;
    var isDictionary = fn.isDictionary = function(object) {
        return typeof object === "object" && object.constructor === Object;
    };

    fn.nop = function() {
        return this;
    };

    fn.isSignalArray = function(obj) {
        if (obj instanceof fn.SignalArray) {
            return true;
        }
        if (Array.isArray(obj) && obj.__klass && obj.__klass.type === 2) {
            return true;
        }
        return false;
    };

    // borrowed from coffee-script
    fn.extend = function(child, parent) {
        parent = parent || TimbreObject;

        for (var key in parent) {
            if (parent.hasOwnProperty(key)) {
                child[key] = parent[key];
            }
        }
        /*jshint validthis:true */
        function ctor() {
            this.constructor = child;
        }
        /*jshint validthis:false */
        ctor.prototype  = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    fn.constructorof = function(ctor, Klass) {
        var f = ctor && ctor.prototype;
        while (f) {
            if (f === Klass.prototype) {
                return true;
            }
            f = Object.getPrototypeOf(f);
        }
        return false;
    };

    fn.register = function(key, ctor) {
        if (fn.constructorof(ctor, TimbreObject)) {
            _constructors[key] = ctor;
        } else {
            _factories[key] = ctor;
        }
    };

    fn.alias = function(key, alias) {
        if (_constructors[alias]) {
            _constructors[key] = _constructors[alias];
        } else if (_factories[alias]) {
            _factories[key] = _factories[alias];
        }

    };

    fn.getClass = function(key) {
        return _constructors[key];
    };

    fn.pointer = function(src, offset, length) {
        offset = src.byteOffset + offset * src.constructor.BYTES_PER_ELEMENT;
        if (typeof length === "number") {
            return new src.constructor(src.buffer, offset, length);
        } else {
            return new src.constructor(src.buffer, offset);
        }
    };

    fn.nextTick = function(func) {
        _sys.nextTick(func);
        return timbre;
    };

    fn.fixAR = function(self) {
        self._.ar = true;
        self._.aronly = true;
    };

    fn.fixKR = function(self) {
        self._.ar = false;
        self._.kronly = true;
    };

    fn.changeWithValue = function() {
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
    fn.changeWithValue.unremovable = true;

    fn.clone = function(src) {
        var new_instance = new src.constructor([]);
        new_instance._.ar  = src._.ar;
        new_instance._.mul = src._.mul;
        new_instance._.add = src._.add;
        new_instance._.bypassed = src._.bypassed;
        return new_instance;
    };

    fn.timer = (function() {
        var make_onstart = function(self) {
            return function() {
                if (_sys.timers.indexOf(self) === -1) {
                    _sys.timers.push(self);
                    _sys.events.emit("addObject");
                    self._.emit("start");
                    fn.buddies_start(self);
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
                    fn.buddies_stop(self);
                }
            };
        };
        return function(self) {
            var onstart = make_onstart(self);
            var onstop  = make_onstop(self);
            self.nodeType = TimbreObject.TIMER;
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

    fn.listener = (function() {
        var make_onlisten = function(self) {
            return function() {
                if (_sys.listeners.indexOf(self) === -1) {
                    _sys.listeners.push(self);
                    _sys.events.emit("addObject");
                    self._.emit("listen");
                    fn.buddies_start(self);
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
                    fn.buddies_stop(self);
                }
            };
        };
        return function(self) {
            var onlisten = make_onlisten(self);
            var onunlisten = make_onunlisten(self);
            self.nodeType = TimbreObject.LISTENER;
            self.listen = function(buddies) {
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

    fn.make_onended = function(self, lastValue) {
        return function() {
            self.playbackState = FINISHED_STATE;
            if (typeof lastValue === "number") {
                var cell  = self.cells[0];
                var cellL = self.cells[1];
                var cellR = self.cells[2];
                for (var i = 0, imax = cellL.length; i < imax; ++i) {
                    cell[0] = cellL[i] = cellR[i] = lastValue;
                }
            }
            self._.emit("ended");
        };
    };

    fn.inputSignalAR = function(self) {
        var cell  = self.cells[0];
        var cellL = self.cells[1];
        var cellR = self.cells[2];
        var nodes = self.nodes;
        var i, imax = nodes.length;
        var j, jmax = cell.length;
        var tickID  = self.tickID;
        var not_clear, tmp, tmpL, tmpR;

        if (self.numChannels === 2) {
            not_clear = true;
            if (imax !== 0) {
                for (i = 0; i < imax; ++i) {
                    if (nodes[i].playbackState === PLAYING_STATE) {
                        nodes[i].process(tickID);
                        cellL.set(nodes[i].cells[1]);
                        cellR.set(nodes[i].cells[2]);
                        not_clear = false;
                        ++i;
                        break;
                    }
                }
                for (; i < imax; ++i) {
                    if (nodes[i].playbackState === PLAYING_STATE) {
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
                }
            }
            if (not_clear) {
                cellL.set(fn.emptycell);
                cellR.set(fn.emptycell);
            }
        } else {
            not_clear = true;
            if (imax !== 0) {
                for (i = 0; i < imax; ++i) {
                    if (nodes[i].playbackState === PLAYING_STATE) {
                        nodes[i].process(tickID);
                        cell.set(nodes[i].cells[0]);
                        not_clear = false;
                        ++i;
                        break;
                    }
                }
                for (; i < imax; ++i) {
                    if (nodes[i].playbackState === PLAYING_STATE) {
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
            }
            if (not_clear) {
                cell.set(fn.emptycell);
            }
        }
    };

    fn.inputSignalKR = function(self) {
        var nodes = self.nodes;
        var i, imax = nodes.length;
        var tickID = self.tickID;
        var tmp = 0;
        for (i = 0; i < imax; ++i) {
            if (nodes[i].playbackState === PLAYING_STATE) {
                tmp += nodes[i].process(tickID).cells[0][0];
            }
        }
        return tmp;
    };

    fn.outputSignalAR = function(self) {
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

    fn.outputSignalKR = function(self) {
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

    fn.buddies_start = function(self) {
        var buddies = self._.buddies;
        var node, i, imax;
        for (i = 0, imax = buddies.length; i < imax; ++i) {
            node = buddies[i];
            switch (node.nodeType) {
            case TimbreObject.DSP:
                node.play();
                break;
            case TimbreObject.TIMER:
                node.start();
                break;
            case TimbreObject.LISTENER:
                node.listen();
                break;
            }
        }
    };

    fn.buddies_stop = function(self) {
        var buddies = self._.buddies;
        var node, i, imax;
        for (i = 0, imax = buddies.length; i < imax; ++i) {
            node = buddies[i];
            switch (node.nodeType) {
            case TimbreObject.DSP:
                node.pause();
                break;
            case TimbreObject.TIMER:
                node.stop();
                break;
            case TimbreObject.LISTENER:
                node.unlisten();
                break;
            }
        }
    };

    fn.fix_iOS6_1_problem = function(flag) {
        _sys.fix_iOS6_1_problem(flag);
    };

    var modules = timbre.modules = {};

    // EventEmitter
    var EventEmitter = modules.EventEmitter = (function() {
        function EventEmitter(context) {
            this.context = context;
            this.events = {};
        }

        var $ = EventEmitter.prototype;

        $.emit = function(type) {
            var handler = this.events[type];
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
                    if (listeners[i] instanceof TimbreObject) {
                        listeners[i].bang.apply(listeners[i], args);
                    } else {
                        listeners[i].apply(this.context, args);
                    }
                }
                return true;
            } else if (handler instanceof TimbreObject) {
                args = slice.call(arguments, 1);
                handler.bang.apply(handler, args);
            } else {
                return false;
            }
        };

        $.on = function(type, listener) {
            if (typeof listener !== "function" && !(listener instanceof TimbreObject)) {
                throw new Error("addListener takes instances of Function or timbre.Object");
            }
            var e = this.events;

            if (!e[type]) {
                e[type] = listener;
            } else if (isArray(e[type])) {
                e[type].push(listener);
            } else {
                e[type] = [e[type], listener];
            }
            return this;
        };

        $.once = function(type, listener) {
            var self = this;
            var g;
            if (typeof listener === "function") {
                g = function () {
                    self.off(type, g);
                    listener.apply(self.context, arguments);
                };
            } else if (listener instanceof TimbreObject) {
                g = function () {
                    self.off(type, g);
                    listener.bang.apply(listener, arguments);
                };
            } else {
                throw new Error("once takes instances of Function or timbre.Object");
            }
            g.listener = listener;

            self.on(type, g);

            return this;
        };

        $.off = function(type, listener) {
            if (typeof listener !== "function" && !(listener instanceof TimbreObject)) {
                throw new Error("removeListener takes instances of Function or timbre.Object");
            }
            var e = this.events;

            if (!e[type]) {
                return this;
            }

            var list = e[type];

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
                    e[type] = null;
                }
            } else if (list === listener ||
                       // once listener
                       (list.listener && list.listener === listener)) {
                e[type] = null;
            }

            return this;
        };

        $.removeAllListeners = function(type) {
            var e = this.events;

            var remain = false;
            var listeners = e[type];
            if (isArray(listeners)) {
                for (var i = listeners.length; i--; ) {
                    var listener = listeners[i];
                    if (listener.unremovable) {
                        remain = true;
                        continue;
                    }
                    this.off(type, listener);
                }
            } else if (listeners) {
                if (!listeners.unremovable) {
                    this.off(type, listeners);
                } else {
                    remain = true;
                }
            }
            if (!remain) {
                e[type] = null;
            }

            return this;
        };

        $.listeners = function(type) {
            var a, e = this.events;
            if (!e[type]) {
                return [];
            }
            e = e[type];
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

        return EventEmitter;
    })();

    var Deferred = modules.Deferred = (function() {
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

        var isDeferred = function(x) {
            return x && typeof x.promise === "function";
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
            var self = this;
            var dfd = new Deferred(this.context);

            this.done(function() {
                var res = done.apply(self.context, arguments);
                if (isDeferred(res)) {
                    res.then(function() {
                        var args = slice.call(arguments);
                        dfd.resolveWith.apply(dfd, [res].concat(args));
                    });
                } else {
                    dfd.resolveWith(self, res);
                }
            });
            this.fail(function() {
                if (typeof fail === "function") {
                    var res = fail.apply(self.context, arguments);
                    if (isDeferred(res)) {
                        res.fail(function() {
                            var args = slice.call(arguments);
                            dfd.rejectWith.apply(dfd, [res].concat(args));
                        });
                    }
                } else {
                    dfd.reject.apply(dfd, arguments);
                }
            });

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
                var onfailed = function() {
                    deferred.reject();
                };
                for (; i < length; ++i) {
                    if (resolveValues[i] && isDeferred(resolveValues[i])) {
                        resolveValues[i].promise().done(
                            updateFunc(i, resolveResults)
                        ).fail(onfailed);
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

        function Promise(object) {
            this.context = object.context;
            this.then = object.then;
            this.done = function() {
                object.done.apply(object, arguments);
                return this;
            };
            this.fail = function() {
                object.fail.apply(object, arguments);
                return this;
            };
            this.pipe = function() {
                return object.pipe.apply(object, arguments);
            };
            this.always = function() {
                object.always.apply(object, arguments);
                return this;
            };
            this.promise = function() {
                return this;
            };
            this.isResolved = function() {
                return object.isResolved();
            };
            this.isRejected = function() {
                return object.isRejected();
            };
        }

        return Deferred;
    })();

    // root object
    var TimbreObject = timbre.Object = (function() {
        function TimbreObject(numChannels, _args) {
            this._ = {}; // private members
            var e = this._.events = new EventEmitter(this);
            this._.emit = function() {
                return e.emit.apply(e, arguments);
            };
            if (isDictionary(_args[0])) {
                var params = _args.shift();
                var _in = params["in"];
                this.once("init", function() {
                    this.set(params);
                    if (_in) {
                        if (isArray(_in)) {
                            this.append.apply(this, _in);
                        } else if (_in instanceof TimbreObject) {
                            this.append(_in);
                        }
                    }
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
            this.playbackState = PLAYING_STATE;
            this.nodeType = TimbreObject.DSP;

            this._.ar  = true;
            this._.mul = 1;
            this._.add = 0;
            this._.dac = null;
            this._.bypassed = false;
            this._.meta = {};
            this._.samplerate = _sys.samplerate;
            this._.cellsize   = _sys.cellsize;
            this._.buddies    = [];
        }
        TimbreObject.DSP      = 1;
        TimbreObject.TIMER    = 2;
        TimbreObject.LISTENER = 3;

        var $ = TimbreObject.prototype;

        Object.defineProperties($, {
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
            isEnded: {
                get: function() {
                    return !(this.playbackState & 1);
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
            buddies: {
                set: function(value) {
                    if (!isArray(value)) {
                        value = [value];
                    }
                    this._.buddies = value.filter(function(node) {
                        return node instanceof TimbreObject;
                    });
                },
                get: function() {
                    return this._.buddies;
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

        $.postMessage = function(message) {
            this._.emit("message", message);
            return this;
        };

        $.to = function(object) {
            if (object instanceof TimbreObject) {
                object.append(this);
            } else {
                var args = slice.call(arguments);
                if (isDictionary(args[1])) {
                    args.splice(2, 0, this);
                } else {
                    args.splice(1, 0, this);
                }
                object = T.apply(null, args);
            }
            return object;
        };

        $.splice = function(ins, obj, rem) {
            var i;
            if (!obj) {
                if (this._.dac) {
                    if (ins instanceof TimbreObject) {
                        if (rem instanceof TimbreObject) {
                            if (rem._.dac) {
                                rem._.dac._.node = ins;
                                ins._.dac = rem._.dac;
                                rem._.dac = null;
                                ins.nodes.push(this);
                            }
                        } else {
                            if (this._.dac) {
                                this._.dac._.node = ins;
                                ins._.dac = this._.dac;
                                this._.dac = null;
                                ins.nodes.push(this);
                            }
                        }
                    } else if (rem instanceof TimbreObject) {
                        if (rem._.dac) {
                            rem._.dac._.node = this;
                            this._.dac = rem._.dac;
                            rem._.dac = null;
                        }
                    }
                }
            } else {
                if (obj instanceof TimbreObject) {
                    i = obj.nodes.indexOf(rem);
                    if (i !== -1) {
                        obj.nodes.splice(i, 1);
                    }
                    if (ins instanceof TimbreObject) {
                        ins.nodes.push(this);
                        obj.nodes.push(ins);
                    } else {
                        obj.nodes.push(this);
                    }
                }
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
            this._.events.off(type, listener);
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

        $.process = fn.nop;

        $.bypass = function() {
            this._.bypassed = (arguments.length === 0) ? true : !!arguments[0];
            return this;
        };

        $.play = function() {
            var dac = this._.dac;
            if (dac === null) {
                dac = this._.dac = new SystemInlet(this);
            }
            if (dac.play()) {
                this._.emit.apply(this, ["play"].concat(slice.call(arguments)));
            }
            fn.buddies_start(this);
            return this;
        };

        $.pause = function() {
            var dac = this._.dac;
            if (dac && dac.playbackState === PLAYING_STATE) {
                dac.pause();
                this._.dac = null;
                this._.emit("pause");
            }
            fn.buddies_stop(this);
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
            $.plot = fn.nop;
        }

        return TimbreObject;
    })();

    var ChannelObject = timbre.ChannelObject = (function() {
        function ChannelObject(parent) {
            timbre.Object.call(this, -1, []);
            fn.fixAR(this);

            this._.parent = parent;
            this.cell = new fn.SignalArray(_sys.cellsize);

            this.L = this.R = this;
            this.cells[0] = this.cells[1] = this.cells[2] = this.cell;

            this.numChannels = 1;
        }
        fn.extend(ChannelObject);

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

    var AddNode = (function() {
        function AddNode(_args) {
            TimbreObject.call(this, 2, _args);
        }
        fn.extend(AddNode);

        AddNode.prototype.process = function(tickID) {
            var _ = this._;
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                if (_.ar) {
                    fn.inputSignalAR(this);
                    fn.outputSignalAR(this);
                } else {
                    this.cells[0][0] = fn.inputSignalKR(this);
                    fn.outputSignalKR(this);
                }
            }
            return this;
        };
        fn.register("+", AddNode);

        return AddNode;
    })();

    var NumberWrapper = (function() {
        function NumberWrapper(_args) {
            TimbreObject.call(this, 1, []);
            fn.fixKR(this);

            this.value = _args[0];

            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
            this.on("setAdd", fn.changeWithValue);
            this.on("setMul", fn.changeWithValue);
        }
        fn.extend(NumberWrapper);

        var $ = NumberWrapper.prototype;

        Object.defineProperties($, {
            value: {
                set: function(value) {
                    if (typeof value === "number") {
                        this._.value = isNaN(value) ? 0 : value;
                        fn.changeWithValue.call(this);
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
            fn.fixKR(this);

            this.value = _args[0];

            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
            this.on("setAdd", fn.changeWithValue);
            this.on("setMul", fn.changeWithValue);
        }
        fn.extend(BooleanWrapper);

        var $ = BooleanWrapper.prototype;

        Object.defineProperties($, {
            value: {
                set: function(value) {
                    this._.value = value ? 1 : 0;
                    fn.changeWithValue.call(this);
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
            fn.fixKR(this);

            this.func    = _args[0];
            this._.value = 0;

            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
            this.on("setAdd", fn.changeWithValue);
            this.on("setMul", fn.changeWithValue);
        }
        fn.extend(FunctionWrapper);

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
                fn.changeWithValue.call(this);
            }
            this._.emit("bang");
            return this;
        };

        return FunctionWrapper;
    })();

    var ArrayWrapper = (function() {
        function ArrayWrapper(_args) {
            TimbreObject.call(this, 1, []);

            var i, imax;
            for (i = 0, imax = _args[0].length; i < imax; ++i) {
              this.append(_args[0][i]);
            }

            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
        }
        fn.extend(ArrayWrapper);

        var $ = ArrayWrapper.prototype;

        Object.defineProperties($, {

        });

        $.bang = function() {
            var args = ["bang"].concat(slice.call(arguments));
            var nodes = this.nodes;
            var i, imax;
            for (i = 0, imax = nodes.length; i < imax; ++i) {
                nodes[i].bang.apply(nodes[i], args);
            }
            return this;
        };

        $.postMessage = function(message) {
            var nodes = this.nodes;
            var i, imax;
            for (i = 0, imax = nodes.length; i < imax; ++i) {
                nodes[i].postMessage(message);
            }
            return this;
        };

        $.process = function(tickID) {
            var _ = this._;
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                if (_.ar) {
                    fn.inputSignalAR(this);
                    fn.outputSignalAR(this);
                } else {
                    this.cells[0][0] = fn.inputSignalKR(this);
                    fn.outputSignalKR(this);
                }
            }
            return this;
        };

        return ArrayWrapper;
    })();

    var ObjectWrapper = (function() {
        function ObjectWrapper(_args) {
            TimbreObject.call(this, 1, []);
            fn.fixKR(this);

            if (isDictionary(_args[1])) {
                var params = _args[1];
                this.once("init", function() {
                    this.set(params);
                });
            }
        }
        fn.extend(ObjectWrapper);

        var $ = ObjectWrapper.prototype;

        Object.defineProperties($, {

        });

        return ObjectWrapper;
    })();

    var SystemInlet = (function() {
        function SystemInlet(object) {
            TimbreObject.call(this, 2, []);

            this.playbackState = FINISHED_STATE;
            var _ = this._;
            _.node = object;
            _.onplay  = make_onplay(this);
            _.onpause = make_onpause(this);
        }
        fn.extend(SystemInlet);

        var make_onplay = function(self) {
            return function() {
                if (_sys.inlets.indexOf(self) === -1) {
                    _sys.inlets.push(self);
                    _sys.events.emit("addObject");
                    self.playbackState = PLAYING_STATE;
                    self._.emit("play");
                }
            };
        };

        var make_onpause = function(self) {
            return function() {
                var i = _sys.inlets.indexOf(self);
                if (i !== -1) {
                    _sys.inlets.splice(i, 1);
                    self.playbackState = FINISHED_STATE;
                    self._.emit("pause");
                    _sys.events.emit("removeObject");
                }
            };
        };

        var $ = SystemInlet.prototype;

        $.play = function() {
            _sys.nextTick(this._.onplay);
            return (_sys.inlets.indexOf(this) === -1);
        };

        $.pause = function() {
            _sys.nextTick(this._.onpause);
        };

        $.process = function(tickID) {
            var node = this._.node;
            if (node.playbackState & 1) {
                node.process(tickID);
                this.cells[1].set(node.cells[1]);
                this.cells[2].set(node.cells[2]);
            } else {
                this.cells[1].set(fn.emptycell);
                this.cells[2].set(fn.emptycell);
            }
        };

        return SystemInlet;
    })();

    var SoundSystem = (function() {
        function SoundSystem() {
            this.context = this;
            this.tickID = 0;
            this.impl = null;
            this.amp  = 0.8;
            this.status = FINISHED_STATE;
            this.samplerate = 44100;
            this.channels   = 2;
            this.cellsize   = 64;
            this.streammsec = 20;
            this.streamsize = 0;
            this.currentTime = 0;
            this.nextTicks = [];
            this.inlets    = [];
            this.timers    = [];
            this.listeners = [];

            this.deferred = null;
            this.recStart   = 0;
            this.recBuffers = null;
            this.delayProcess = make_delayProcess(this);

            this.events = null;

            fn.currentTimeIncr = this.cellsize * 1000 / this.samplerate;
            fn.emptycell = new fn.SignalArray(this.cellsize);

            this.reset(true);
        }

        var make_delayProcess = function(self) {
            return function() {
                self.recStart = Date.now();
                self.process();
            };
        };

        var $ = SoundSystem.prototype;

        $.bind = function(Klass, opts) {
            if (typeof Klass === "function") {
                var player = new Klass(this, opts);
                this.impl = player;
                if (this.impl.defaultSamplerate) {
                    this.samplerate = this.impl.defaultSamplerate;
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
                if (typeof Float64Array !== "undefined" && typeof params.f64 !== "undefined") {
                    _f64mode = !!params.f64;
                    if (_f64mode) {
                        fn.SignalArray = Float64Array;
                    } else {
                        fn.SignalArray = Float32Array;
                    }
                }
            }
            fn.currentTimeIncr = this.cellsize * 1000 / this.samplerate;
            fn.emptycell = new fn.SignalArray(this.cellsize);
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
            if (this.status === FINISHED_STATE) {
                this.status = PLAYING_STATE;

                this.streamsize = this.getAdjustSamples();
                this.strmL = new fn.SignalArray(this.streamsize);
                this.strmR = new fn.SignalArray(this.streamsize);

                this.impl.play();
                this.events.emit("play");
            }
            return this;
        };

        $.pause = function() {
            if (this.status === PLAYING_STATE) {
                this.status = FINISHED_STATE;
                this.impl.pause();
                this.events.emit("pause");
            }
            return this;
        };

        $.reset = function(deep) {
            if (deep) {
                this.events = new EventEmitter(this).on("addObject", function() {
                    if (this.status === FINISHED_STATE) {
                        this.play();
                    }
                }).on("removeObject", function() {
                    if (this.status === PLAYING_STATE) {
                        if (this.inlets.length + this.timers.length + this.listeners.length === 0) {
                            this.pause();
                        }
                    }
                });
            }
            this.currentTime = 0;
            this.nextTicks = [];
            this.inlets    = [];
            this.timers    = [];
            this.listeners = [];
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
            var currentTimeIncr = fn.currentTimeIncr;

            for (i = 0; i < imax; ++i) {
                strmL[i] = strmR[i] = 0;
            }

            while (n--) {
                ++tickID;

                for (j = 0, jmax = timers.length; j < jmax; ++j) {
                    if (timers[j].playbackState & 1) {
                        timers[j].process(tickID);
                    }
                }

                for (j = 0, jmax = inlets.length; j < jmax; ++j) {
                    x = inlets[j];
                    x.process(tickID);
                    if (x.playbackState & 1) {
                        tmpL = x.cells[1];
                        tmpR = x.cells[2];
                        for (k = 0, i = saved_i; k < kmax; ++k, ++i) {
                            strmL[i] += tmpL[k];
                            strmR[i] += tmpR[k];
                        }
                    }
                }
                saved_i += kmax;

                for (j = 0, jmax = listeners.length; j < jmax; ++j) {
                    if (listeners[j].playbackState & 1) {
                        listeners[j].process(tickID);
                    }
                }

                this.currentTime += currentTimeIncr;

                nextTicks = this.nextTicks.splice(0);
                for (j = 0, jmax = nextTicks.length; j < jmax; ++j) {
                    nextTicks[j]();
                }
            }

            for (i = 0; i < imax; ++i) {
                x = strmL[i] * amp;
                if (x < -1) {
                    x = -1;
                } else if (x > 1) {
                    x = 1;
                }
                strmL[i] = x;
                x = strmR[i] * amp;
                if (x < -1) {
                    x = -1;
                } else if (x > 1) {
                    x = 1;
                }
                strmR[i] = x;
            }

            this.tickID = tickID;

            var currentTime = this.currentTime;

            if (this.status === SCHEDULED_STATE) {
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
                    this.deferred.sub.reject();
                } else if (currentTime >= this.recDuration) {
                    this.deferred.sub.resolve();
                } else {
                    var now = Date.now();
                    if ((now - this.recStart) > 20) {
                        setTimeout(this.delayProcess, 10);
                    } else {
                        this.process();
                    }
                }
            }
        };

        $.nextTick = function(func) {
            if (this.status === FINISHED_STATE) {
                func();
            } else {
                this.nextTicks.push(func);
            }
        };

        $.rec = function() {
            fn.fix_iOS6_1_problem(true);

            var dfd = new Deferred(this);

            if (this.deferred) {
                console.warn("rec deferred is exists??");
                return dfd.reject().promise();
            }

            if (this.status !== FINISHED_STATE) {
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

            this.deferred = dfd;
            this.status = SCHEDULED_STATE;
            this.reset();

            var rec_inlet = new T("+");
            var inlet_dfd = new Deferred(this);

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

            this.deferred.sub = inlet_dfd;

            this.savedSamplerate = this.samplerate;
            this.samplerate  = opts.samplerate  || this.samplerate;
            this.recDuration = opts.recDuration || Infinity;
            this.maxDuration = opts.maxDuration || 10 * 60 * 1000;
            this.recCh = opts.ch || 1;
            if (this.recCh !== 2) {
                this.recCh = 1;
            }
            this.recBuffers = [];

            this.streamsize = this.getAdjustSamples();
            this.strmL = new fn.SignalArray(this.streamsize);
            this.strmR = new fn.SignalArray(this.streamsize);

            this.inlets.push(rec_inlet);

            func(outlet);

            setTimeout(this.delayProcess, 10);

            return dfd.promise();
        };

        var recdone = function() {
            this.status = FINISHED_STATE;
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
                var mixed = new fn.SignalArray(bufferLength);

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
                for (i = 0, imax = bufferLength; i < imax; ++i) {
                    mixed[i] = (L[i] + R[i]) * 0.5;
                }

                result = {
                    samplerate: samplerate,
                    channels  : 2,
                    buffer: [mixed, L, R]
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
                result = {
                    samplerate: samplerate,
                    channels  : 1,
                    buffer: [buffer]
                };
            }

            var args = [].concat.apply([result], arguments);
            this.deferred.resolve.apply(this.deferred, args);
            this.deferred = null;
        };

        // EventEmitter
        $.on = function(type, listeners) {
            this.events.on(type, listeners);
        };
        $.once = function(type, listeners) {
            this.events.once(type, listeners);
        };
        $.off = function(type, listener) {
            this.events.off(type, listener);
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

    // player
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
                var sys_streamsize = sys.streamsize;
                var x, dx;

                if (sys.samplerate === context.sampleRate) {
                    onaudioprocess = function(e) {
                        var outs = e.outputBuffer;
                        sys.process();
                        outs.getChannelData(0).set(sys.strmL);
                        outs.getChannelData(1).set(sys.strmR);
                    };
                } else if (sys.samplerate * 2 === context.sampleRate) {
                    onaudioprocess = function(e) {
                        var inL = sys.strmL;
                        var inR = sys.strmR;
                        var outs = e.outputBuffer;
                        var outL = outs.getChannelData(0);
                        var outR = outs.getChannelData(1);
                        var i, imax = outs.length;
                        var j;

                        sys.process();
                        for (i = j = 0; i < imax; i += 2, ++j) {
                            outL[i] = outL[i+1] = inL[j];
                            outR[i] = outR[i+1] = inR[j];
                        }
                    };
                } else {
                    x  = sys_streamsize;
                    dx = sys.samplerate / context.sampleRate;
                    onaudioprocess = function(e) {
                        var inL = sys.strmL;
                        var inR = sys.strmR;
                        var outs = e.outputBuffer;
                        var outL = outs.getChannelData(0);
                        var outR = outs.getChannelData(1);
                        var i, imax = outs.length;

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
        ImplClass = function(sys) {
            this.maxSamplerate     = 48000;
            this.defaultSamplerate = 44100;
            this.env = "nop";
            this.play  = function() {};
            this.pause = function() {};
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

    // Flash fallback
    (function() {
        if (_sys.impl.env !== "nop" || _envtype !== "browser" || _envmobile) {
            return;
        }
        var nav = navigator;

        /*jshint latedef:true */
        if (getFlashPlayerVersion(0) < 10) {
            return;
        }
        /*jshint latedef:false */

        var swf, PlayerDivID = "TimbreFlashPlayerDiv";
        var src = (function() {
            var scripts = document.getElementsByTagName("script");
            if (scripts && scripts.length) {
                for (var m, i = 0, imax = scripts.length; i < imax; ++i) {
                    if ((m = /^(.*\/)timbre(?:\.dev)?\.js$/i.exec(scripts[i].src))) {
                        return m[1] + "timbre.swf";
                    }
                }
            }
        })();

        window.timbrejs_flashfallback_init = function() {
            function TimbreFlashPlayer(sys) {
                var timerId = 0;

                this.maxSamplerate     = 44100;
                this.defaultSamplerate = 44100;
                this.env = "flash";

                this.play = function() {
                    var onaudioprocess;
                    var interleaved = new Array(sys.streamsize * sys.channels);
                    var streammsec  = sys.streammsec;
                    var written = 0;
                    var writtenIncr = sys.streamsize / sys.samplerate * 1000;
                    var start = Date.now();

                    onaudioprocess = function() {
                        if (written > Date.now() - start) {
                            return;
                        }
                        var inL = sys.strmL;
                        var inR = sys.strmR;
                        var i = interleaved.length;
                        var j = inL.length;
                        sys.process();
                        while (j--) {
                            interleaved[--i] = (inR[j] * 32768)|0;
                            interleaved[--i] = (inL[j] * 32768)|0;
                        }
                        swf.writeAudio(interleaved.join(" "));
                        written += writtenIncr;
                    };

                    if (swf.setup) {
                        swf.setup(sys.channels, sys.samplerate);
                        timerId = setInterval(onaudioprocess, streammsec);
                    } else {
                        console.warn("Cannot find " + src);
                    }
                };

                this.pause = function() {
                    if (timerId !== 0) {
                        swf.cancel();
                        clearInterval(timerId);
                        timerId = 0;
                    }
                };
            }
            _sys.bind(TimbreFlashPlayer);
            delete window.timbrejs_flashfallback_init;
        };

        var o, p;
        var swfSrc  = src;
        var swfName = swfSrc + "?" + (+new Date());
        var swfId   = "TimbreFlashPlayer";
        var div = document.createElement("div");
        div.id = PlayerDivID;
        div.style.display = "inline";
        div.width = div.height = 1;

        if (nav.plugins && nav.mimeTypes && nav.mimeTypes.length) {
            // ns
            o = document.createElement("object");
            o.id = swfId;
            o.classid = "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000";
            o.width = o.height = 1;
            o.setAttribute("data", swfName);
            o.setAttribute("type", "application/x-shockwave-flash");
            p = document.createElement("param");
            p.setAttribute("name", "allowScriptAccess");
            p.setAttribute("value", "always");
            o.appendChild(p);
            div.appendChild(o);
        } else {
            // ie
            /*jshint quotmark:single */
            div.innerHTML = '<object id="' + swfId + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="1" height="1"><param name="movie" value="' + swfName + '" /><param name="bgcolor" value="#FFFFFF" /><param name="quality" value="high" /><param name="allowScriptAccess" value="always" /></object>';
            /*jshint quotmark:double */
        }
        window.addEventListener("load", function() {
            document.body.appendChild(div);
            swf = document[swfId];
        });

        function getFlashPlayerVersion(subs) {
            /*global ActiveXObject:true */
            try {
                if (nav.plugins && nav.mimeTypes && nav.mimeTypes.length) {
                    return nav.plugins["Shockwave Flash"].description.match(/([0-9]+)/)[subs];
                }
                return (new ActiveXObject("ShockwaveFlash.ShockwaveFlash")).GetVariable("$version").match(/([0-9]+)/)[subs];
            } catch (e) {
                return -1;
            }
            /*global ActiveXObject:false */
        }
    })();

    function setupTypedArray() {
        var unsigned = 0, signed = 1, floating  = 2;

        function ArrayBuffer(_) {
            var a = new Array(_.byteLength);
            var bytes = _.BYTES_PER_ELEMENT, shift;
            for (var i = 0, imax = a.length; i < imax; ++i) {
                shift = (i % bytes) * 8;
                a[i] = (_[(i / bytes)|0] & (0x0FF << shift)) >>> shift;
            }
            a.__view = _;
            return a;
        }

        function TypedArray(klass, arg, offset, length) {
            var a, b, bytes, i, imax;
            if (Array.isArray(arg)) {
                if (arg.__view) {
                    if (typeof offset === "undefined") {
                        offset = 0;
                    }
                    if (typeof length === "undefined") {
                        length = arg.length - offset;
                    }
                    bytes = klass.bytes;
                    if (klass.type === floating) {
                        a = arg.__view.slice((offset/bytes)|0, ((offset+length)/bytes)|0);
                    } else {
                        b = arg.slice(offset, offset + length);
                        a = new Array((b.length / bytes)|0);
                        for (i = 0, imax = a.length; i < imax; ++i) {
                            a[i] = 0;
                        }
                        for (i = 0, imax = b.length; i < imax; ++i) {
                            a[(i/bytes)|0] += (b[i] & 0xFF) << ((i % bytes) * 8);
                        }
                    }
                } else {
                    a = arg.slice();
                }
            } else if (typeof arg === "number" && arg > 0) {
                a = new Array(arg|0);
            } else {
                a = [];
            }
            if (klass.type !== floating) {
                for (i = 0, imax = a.length; i < imax; ++i) {
                    a[i] = (+a[i] || 0) & ((1 << (2 * 8)) - 1);
                }
            } else {
                for (i = 0, imax = a.length; i < imax; ++i) {
                    a[i] = a[i] || 0;
                }
            }
            if (klass.type === signed) {
                for (i = 0, imax = a.length; i < imax; ++i) {
                    if (a[i] & (1 << ((bytes * 8) - 1))) {
                        a[i] -= 1 << (bytes * 8);
                    }
                }
            }

            a.__klass  = klass;
            a.constructor = window[klass.name];
            a.set      = set;
            a.subarray = subarray;
            a.BYTES_PER_ELEMENT = klass.bytes;
            a.byteLength = klass.bytes * a.length;
            a.byteOffset = offset || 0;
            Object.defineProperty(a, "buffer", {
                get: function() {
                    return new ArrayBuffer(this);
                }
            });
            return a;
        }
        var set = function(array, offset) {
            if (typeof offset === "undefined") {
                offset = 0;
            }
            var i, imax = Math.min(this.length - offset, array.length);
            for (i = 0; i < imax; ++i) {
                this[offset + i] = array[i];
            }
        };
        var subarray = function(begin, end) {
            if (typeof end === "undefined") {
                end = this.length;
            }
            return new this.constructor(this.slice(begin, end));
        };
        [["Int8Array" , 1, signed], ["Uint8Array" , 1, unsigned],
         ["Int16Array", 2, signed], ["Uint16Array", 2, unsigned],
         ["Int32Array", 4, signed], ["Uint32Array", 4, unsigned],
         ["Float32Array", 4, floating], ["Float64Array", 8, floating]
        ].forEach(function(_params) {
            var name = _params[0];
            var params = { bytes:_params[1], type:_params[2], name:name };
            window[name] = function(arg, offset, length) {
                return TypedArray.call(this, params, arg, offset, length);
            };
        });
    }
})();
(function(T) {
    "use strict";

    function Biquad(samplerate) {
        this.samplerate = samplerate;
        this.frequency = 340;
        this.Q         = 1;
        this.gain      = 0;

        this.x1L = this.x2L = this.y1L = this.y2L = 0;
        this.x1R = this.x2R = this.y1R = this.y2R = 0;
        this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;

        this.setType("lpf");
    }

    var $ = Biquad.prototype;

    $.process = function(cellL, cellR) {
        var xL, xR, yL, yR;
        var x1L = this.x1L, x2L = this.x2L, y1L = this.y1L, y2L = this.y2L;
        var x1R = this.x1R, x2R = this.x2R, y1R = this.y1R, y2R = this.y2R;
        var b0 = this.b0, b1 = this.b1, b2 = this.b2, a1 = this.a1, a2 = this.a2;
        var i, imax;

        for (i = 0, imax = cellL.length; i < imax; ++i) {
            xL = cellL[i];
            yL = b0 * xL + b1 * x1L + b2 * x2L - a1 * y1L - a2 * y2L;
            x2L = x1L; x1L = xL; y2L = y1L; y1L = yL;

            xR = cellR[i];
            yR = b0 * xR + b1 * x1R + b2 * x2R - a1 * y1R - a2 * y2R;
            x2R = x1R; x1R = xR; y2R = y1R; y1R = yR;

            cellL[i] = yL;
            cellR[i] = yR;
        }
        this.x1L = x1L; this.x2L = x2L; this.y1L = y1L; this.y2L = y2L;
        this.x1R = x1R; this.x2R = x2R; this.y1R = y1R; this.y2R = y2R;
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

    T.modules.Biquad = Biquad;

})(timbre);
(function(T) {
    "use strict";

    function Chorus(samplerate) {
        this.samplerate = samplerate;

        var bits = Math.round(Math.log(samplerate * 0.1) * Math.LOG2E);
        this.buffersize = 1 << bits;
        this.bufferL = new T.fn.SignalArray(this.buffersize + 1);
        this.bufferR = new T.fn.SignalArray(this.buffersize + 1);

        this.wave       = null;
        this._wave      = null;
        this.writeIndex = this.buffersize >> 1;
        this.readIndex  = 0;
        this.delayTime  = 20;
        this.rate       = 4;
        this.depth      = 20;
        this.feedback   = 0.2;
        this.wet        = 0.5;
        this.phase      = 0;
        this.phaseIncr  = 0;
        this.phaseStep  = 4;

        this.setWaveType("sin");
        this.setDelayTime(this.delayTime);
        this.setRate(this.rate);
    }

    var $ = Chorus.prototype;

    var waves = [];
    waves[0] = (function() {
        var wave = new Float32Array(512);
        for (var i = 0; i < 512; ++i) {
            wave[i] = Math.sin(2 * Math.PI * (i/512));
        }
        return wave;
    })();
    waves[1] = (function() {
        var wave = new Float32Array(512);
        for (var x, i = 0; i < 512; ++i) {
            x = (i / 512) - 0.25;
            wave[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
        }
        return wave;
    })();

    $.setWaveType = function(waveType) {
        if (waveType === "sin") {
            this.wave = waveType;
            this._wave = waves[0];
        } else if (waveType === "tri") {
            this.wave = waveType;
            this._wave = waves[1];
        }
    };

    $.setDelayTime = function(delayTime) {
        this.delayTime = delayTime;
        var readIndex = this.writeIndex - ((delayTime * this.samplerate * 0.001)|0);
        while (readIndex < 0) {
            readIndex += this.buffersize;
        }
        this.readIndex = readIndex;
    };

    $.setRate = function(rate) {
        this.rate      = rate;
        this.phaseIncr = (512 * this.rate / this.samplerate) * this.phaseStep;
    };

    $.process = function(cellL, cellR) {
        var bufferL = this.bufferL;
        var bufferR = this.bufferR;
        var size = this.buffersize;
        var mask = size - 1;
        var wave       = this._wave;
        var phase      = this.phase;
        var phaseIncr  = this.phaseIncr;
        var writeIndex = this.writeIndex;
        var readIndex  = this.readIndex;
        var depth      = this.depth;
        var feedback   = this.feedback;
        var x, index, mod;
        var wet = this.wet, dry = 1 - wet;
        var i, imax = cellL.length;
        var j, jmax = this.phaseStep;

        for (i = 0; i < imax; ) {
            mod = wave[phase|0] * depth;
            phase += phaseIncr;
            while (phase > 512) {
                phase -= 512;
            }
            for (j = 0; j < jmax; ++j, ++i) {
                index = (readIndex + size + mod) & mask;

                x = (bufferL[index] + bufferL[index + 1]) * 0.5;
                bufferL[writeIndex] = cellL[i] - x * feedback;
                cellL[i] = (cellL[i] * dry) + (x * wet);

                x = (bufferR[index] + bufferR[index + 1]) * 0.5;
                bufferR[writeIndex] = cellR[i] - x * feedback;
                cellR[i] = (cellR[i] * dry) + (x * wet);

                writeIndex = (writeIndex + 1) & mask;
                readIndex  = (readIndex  + 1) & mask;
            }
        }

        this.phase = phase;
        this.writeIndex = writeIndex;
        this.readIndex  = readIndex;
    };

    T.modules.Chorus = Chorus;

})(timbre);
(function(T) {
    "use strict";

    var MaxPreDelayFrames     = 1024;
    var MaxPreDelayFramesMask = MaxPreDelayFrames - 1;
    var DefaultPreDelayFrames = 256;
    var kSpacingDb = 5;

    function Compressor(samplerate, channels) {
        this.samplerate = samplerate;
        this.channels = channels;

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

        this.detectorAverage = 0;
        this.compressorGain  = 1;
        this.meteringGain    = 1;

        this.delayBufferL = new T.fn.SignalArray(MaxPreDelayFrames);
        if (channels === 2) {
            this.delayBufferR = new T.fn.SignalArray(MaxPreDelayFrames);
        } else {
            this.delayBufferR = this.delayBufferL;
        }
        this.preDelayTime = 6;
        this.preDelayReadIndex = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;
        this.maxAttackCompressionDiffDb = -1;
        this.meteringReleaseK = 1 - Math.exp(-1 / (this.samplerate * 0.325));

        this.setAttackTime(this.attackTime);
        this.setReleaseTime(this.releaseTime);
        this.setPreDelayTime(this.preDelayTime);
        this.setParams(-24, 30, 12);
    }

    var $ = Compressor.prototype;

    $.clone = function() {
        var new_instance = new Compressor(this.samplerate, this.channels);
        new_instance.setAttackTime(this.attackTime);
        new_instance.setReleaseTime(this.releaseTime);
        new_instance.setPreDelayTime(this.preDelayTime);
        new_instance.setParams(this.dbThreshold, this.dbKnee, this.ratio);
        return new_instance;
    };

    $.setAttackTime = function(value) {
        this.attackTime = Math.max(0.001, value);
        this._attackFrames = this.attackTime * this.samplerate;
    };

    $.setReleaseTime = function(value) {
        this.releaseTime = Math.max(0.001, value);
        var releaseFrames = this.releaseTime * this.samplerate;

        var satReleaseTime = 0.0025;
        this._satReleaseFrames = satReleaseTime * this.samplerate;

        var y1 = releaseFrames * this.releaseZone1;
        var y2 = releaseFrames * this.releaseZone2;
        var y3 = releaseFrames * this.releaseZone3;
        var y4 = releaseFrames * this.releaseZone4;

        this._kA = 0.9999999999999998*y1 + 1.8432219684323923e-16*y2 - 1.9373394351676423e-16*y3 + 8.824516011816245e-18*y4;
        this._kB = -1.5788320352845888*y1 + 2.3305837032074286*y2 - 0.9141194204840429*y3 + 0.1623677525612032*y4;
        this._kC = 0.5334142869106424*y1 - 1.272736789213631*y2 + 0.9258856042207512*y3 - 0.18656310191776226*y4;
        this._kD = 0.08783463138207234*y1 - 0.1694162967925622*y2 + 0.08588057951595272*y3 - 0.00429891410546283*y4;
        this._kE = -0.042416883008123074*y1 + 0.1115693827987602*y2 - 0.09764676325265872*y3 + 0.028494263462021576*y4;
    };

    $.setPreDelayTime = function(preDelayTime) {
        this.preDelayTime = preDelayTime;
        var preDelayFrames = preDelayTime * this.samplerate;
        if (preDelayFrames > MaxPreDelayFrames - 1) {
            preDelayFrames = MaxPreDelayFrames - 1;
        }
        if (this.lastPreDelayFrames !== preDelayFrames) {
            this.lastPreDelayFrames = preDelayFrames;
            for (var i = 0, imax = this.delayBufferL.length; i < imax; ++i) {
                this.delayBufferL[i] = this.delayBufferR[i] = 0;
            }
            this.preDelayReadIndex = 0;
            this.preDelayWriteIndex = preDelayFrames;
        }
    };

    $.setParams = function(dbThreshold, dbKnee, ratio) {
        this._k = this.updateStaticCurveParameters(dbThreshold, dbKnee, ratio);

        var fullRangeGain = this.saturate(1, this._k);
        var fullRangeMakeupGain = 1 / fullRangeGain;

        fullRangeMakeupGain = Math.pow(fullRangeMakeupGain, 0.6);

        this._masterLinearGain = Math.pow(10, 0.05 * this.dbPostGain) * fullRangeMakeupGain;
    };

    $.kneeCurve = function(x, k) {
        if (x < this.linearThreshold) {
            return x;
        }
        return this.linearThreshold + (1 - Math.exp(-k * (x - this.linearThreshold))) / k;
    };

    $.saturate = function(x, k) {
        var y;
        if (x < this.kneeThreshold) {
            y = this.kneeCurve(x, k);
        } else {
            var xDb = (x) ? 20 * Math.log(x) * Math.LOG10E : -1000;
            var yDb = this.ykneeThresholdDb + this.slope * (xDb - this.kneeThresholdDb);
            y = Math.pow(10, 0.05 * yDb);
        }
        return y;
    };

    $.slopeAt = function(x, k) {
        if (x < this.linearThreshold) {
            return 1;
        }

        var x2   = x * 1.001;
        var xDb  = (x ) ? 20 * Math.log(x ) * Math.LOG10E : -1000;
        var x2Db = (x2) ? 20 * Math.log(x2) * Math.LOG10E : -1000;
        var y  = this.kneeCurve(x , k);
        var y2 = this.kneeCurve(x2, k);
        var yDb  = (y ) ? 20 * Math.log(y ) * Math.LOG10E : -1000;
        var y2Db = (y2) ? 20 * Math.log(y2) * Math.LOG10E : -1000;

        return (y2Db - yDb) / (x2Db - xDb);
    };

    $.kAtSlope = function(desiredSlope) {
        var xDb = this.dbThreshold + this.dbKnee;
        var x   = Math.pow(10, 0.05 * xDb);

        var minK = 0.1;
        var maxK = 10000;
        var k = 5;

        for (var i = 0; i < 15; ++i) {
            var slope = this.slopeAt(x, k);
            if (slope < desiredSlope) {
                maxK = k;
            } else {
                minK = k;
            }
            k = Math.sqrt(minK * maxK);
        }
        return k;
    };

    $.updateStaticCurveParameters = function(dbThreshold, dbKnee, ratio) {
        this.dbThreshold     = dbThreshold;
        this.linearThreshold = Math.pow(10, 0.05 * dbThreshold);
        this.dbKnee          = dbKnee;

        this.ratio = ratio;
        this.slope = 1 / this.ratio;

        this.kneeThresholdDb = dbThreshold + dbKnee;
        this.kneeThreshold   = Math.pow(10, 0.05 * this.kneeThresholdDb);

        var k = this.kAtSlope(1 / this.ratio);
        var y = this.kneeCurve(this.kneeThreshold, k);
        this.ykneeThresholdDb = (y) ? 20 * Math.log(y) * Math.LOG10E : -1000;

        this._k = k;

        return this._k;
    };

    $.process = function(cellL, cellR) {
        var dryMix = 1 - this.effectBlend;
        var wetMix = this.effectBlend;
        var k = this._k;
        var masterLinearGain = this._masterLinearGain;
        var satReleaseFrames = this._satReleaseFrames;
        var kA = this._kA;
        var kB = this._kB;
        var kC = this._kC;
        var kD = this._kD;
        var kE = this._kE;
        var nDivisionFrames = 64;
        var nDivisions = cellL.length / nDivisionFrames;
        var frameIndex = 0;
        var desiredGain = this.detectorAverage;
        var compressorGain = this.compressorGain;
        var maxAttackCompressionDiffDb = this.maxAttackCompressionDiffDb;
        var i_attackFrames = 1 / this._attackFrames;
        var preDelayReadIndex = this.preDelayReadIndex;
        var preDelayWriteIndex = this.preDelayWriteIndex;
        var detectorAverage = this.detectorAverage;
        var delayBufferL = this.delayBufferL;
        var delayBufferR = this.delayBufferR;
        var meteringGain = this.meteringGain;
        var meteringReleaseK = this.meteringReleaseK;

        for (var i = 0; i < nDivisions; ++i) {
            var scaledDesiredGain = Math.asin(desiredGain) / (0.5 * Math.PI);
            var envelopeRate;
            var isReleasing = scaledDesiredGain > compressorGain;
            var x = compressorGain / scaledDesiredGain;

            var compressionDiffDb = (x) ? 20 * Math.log(x) * Math.LOG10E : -1000;
            if (compressionDiffDb === Infinity || isNaN(compressionDiffDb)) {
                compressionDiffDb = -1;
            }

            if (isReleasing) {
                maxAttackCompressionDiffDb = -1;

                x = compressionDiffDb;
                if (x < -12) {
                    x = 0;
                } else if (x > 0) {
                    x = 3;
                } else {
                    x = 0.25 * (x + 12);
                }

                var x2 = x * x;
                var x3 = x2 * x;
                var x4 = x2 * x2;
                var _releaseFrames = kA + kB * x + kC * x2 + kD * x3 + kE * x4;

                var _dbPerFrame = kSpacingDb / _releaseFrames;

                envelopeRate = Math.pow(10, 0.05 * _dbPerFrame);
            } else {
                if (maxAttackCompressionDiffDb === -1 || maxAttackCompressionDiffDb < compressionDiffDb) {
                    maxAttackCompressionDiffDb = compressionDiffDb;
                }

                var effAttenDiffDb = Math.max(0.5, maxAttackCompressionDiffDb);

                x = 0.25 / effAttenDiffDb;
                envelopeRate = 1 - Math.pow(x, i_attackFrames);
            }

            var loopFrames = nDivisionFrames;
            while (loopFrames--) {
                var compressorInput = 0;

                var absUndelayedSource = (cellL[frameIndex] + cellR[frameIndex]) * 0.5;
                delayBufferL[preDelayWriteIndex] = cellL[frameIndex];
                delayBufferR[preDelayWriteIndex] = cellR[frameIndex];

                if (absUndelayedSource < 0) {
                    absUndelayedSource *= -1;
                }
                if (compressorInput < absUndelayedSource) {
                    compressorInput = absUndelayedSource;
                }

                var absInput = compressorInput;
                if (absInput < 0) {
                    absInput *= -1;
                }

                var shapedInput = this.saturate(absInput, k);
                var attenuation = absInput <= 0.0001 ? 1 : shapedInput / absInput;
                var attenuationDb = (attenuation) ? -20 * Math.log(attenuation) * Math.LOG10E : 1000;
                if (attenuationDb < 2) {
                    attenuationDb = 2;
                }

                var dbPerFrame = attenuationDb / satReleaseFrames;
                var satReleaseRate = Math.pow(10, 0.05 * dbPerFrame) - 1;
                var isRelease = (attenuation > detectorAverage);
                var rate = isRelease ? satReleaseRate : 1;

                detectorAverage += (attenuation - detectorAverage) * rate;
                if (detectorAverage > 1) {
                    detectorAverage = 1;
                }

                if (envelopeRate < 1) {
                    compressorGain += (scaledDesiredGain - compressorGain) * envelopeRate;
                } else {
                    compressorGain *= envelopeRate;
                    if (compressorGain > 1) {
                        compressorGain = 1;
                    }
                }

                var postWarpCompressorGain = Math.sin(0.5 * Math.PI * compressorGain);
                var totalGain = dryMix + wetMix * masterLinearGain * postWarpCompressorGain;

                var dbRealGain = 20 * Math.log(postWarpCompressorGain) * Math.LOG10E;
                if (dbRealGain < meteringGain)  {
                    meteringGain = dbRealGain;
                } else {
                    meteringGain += (dbRealGain - meteringGain) * meteringReleaseK;
                }
                cellL[frameIndex] = delayBufferL[preDelayReadIndex] * totalGain;
                cellR[frameIndex] = delayBufferR[preDelayReadIndex] * totalGain;

                frameIndex++;
                preDelayReadIndex  = (preDelayReadIndex  + 1) & MaxPreDelayFramesMask;
                preDelayWriteIndex = (preDelayWriteIndex + 1) & MaxPreDelayFramesMask;
            }

            if (detectorAverage < 1e-6) {
                detectorAverage = 1e-6;
            }
            if (compressorGain < 1e-6) {
                compressorGain = 1e-6;
            }
        }
        this.preDelayReadIndex  = preDelayReadIndex;
        this.preDelayWriteIndex = preDelayWriteIndex;
        this.detectorAverage    = detectorAverage;
        this.compressorGain = compressorGain;
        this.maxAttackCompressionDiffDb = maxAttackCompressionDiffDb;
        this.meteringGain = meteringGain;
    };

    $.reset = function() {
        this.detectorAverage = 0;
        this.compressorGain = 1;
        this.meteringGain = 1;

        for (var i = 0, imax = this.delayBufferL.length; i < imax; ++i) {
            this.delayBufferL[i] = this.delayBufferR[i] = 0;
        }

        this.preDelayReadIndex = 0;
        this.preDelayWriteIndex = DefaultPreDelayFrames;

        this.maxAttackCompressionDiffDb = -1;
    };

    T.modules.Compressor = Compressor;

})(timbre);
(function(T) {
    "use strict";

    function Decoder() {}

    Decoder.prototype.decode = function(src, onloadedmetadata, onloadeddata) {
        if (typeof src === "string") {
            if (/\.wav$/.test(src)) {
                return Decoder.wav_decode(src, onloadedmetadata, onloadeddata);
            } else if (Decoder.ogg_decode && /\.ogg$/.test(src)) {
                return Decoder.ogg_decode(src, onloadedmetadata, onloadeddata);
            } else if (Decoder.mp3_decode && /\.mp3$/.test(src)) {
                return Decoder.mp3_decode(src, onloadedmetadata, onloadeddata);
            }
        } else if (typeof src === "object") {
            if (src.type === "wav") {
                return Decoder.wav_decode(src.data, onloadedmetadata, onloadeddata);
            } else if (Decoder.ogg_decode && src.type === "ogg") {
                return Decoder.ogg_decode(src.data, onloadedmetadata, onloadeddata);
            } else if (Decoder.mp3_decode && src.type === "mp3") {
                return Decoder.mp3_decode(src.data, onloadedmetadata, onloadeddata);
            }
        }
        if (Decoder.webkit_decode) {
            if (typeof src === "object") {
                return Decoder.webkit_decode(src.data||src, onloadedmetadata, onloadeddata);
            } else {
                return Decoder.webkit_decode(src, onloadedmetadata, onloadeddata);
            }
        } else if (Decoder.moz_decode) {
            return Decoder.moz_decode(src, onloadedmetadata, onloadeddata);
        }
        onloadedmetadata(false);
    };
    T.modules.Decoder = Decoder;

    if (T.envtype === "browser") {
        Decoder.getBinaryWithPath = function(path, callback) {
            T.fn.fix_iOS6_1_problem(true);

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path);
            xhr.responseType = "arraybuffer";
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.response) {
                        callback(new Uint8Array(xhr.response));
                    } else if (xhr.responseBody !== undefined) {
                        /*global VBArray:true */
                        callback(new Uint8Array(VBArray(xhr.responseBody).toArray()));
                        /*global VBArray:false */
                    }
                    T.fn.fix_iOS6_1_problem(false);
                }
            };
            xhr.send();
        };
    } else {
        Decoder.getBinaryWithPath = function(path, callback) {
            callback("no support");
        };
    }

    var _24bit_to_32bit = function(uint8) {
        var b0, b1, b2, bb, x;
        var int32 = new Int32Array(uint8.length / 3);
        for (var i = 0, imax = uint8.length, j = 0; i < imax; ) {
            b0 = uint8[i++] ,b1 = uint8[i++], b2 = uint8[i++];
            bb = b0 + (b1 << 8) + (b2 << 16);
            x = (bb & 0x800000) ? bb - 16777216 : bb;
            int32[j++] = x;
        }
        return int32;
    };

    Decoder.wav_decode = (function() {
        var _decode = function(data, onloadedmetadata, onloadeddata) {
            if (String.fromCharCode(data[0], data[1], data[2], data[3]) !== "RIFF") {
                return onloadedmetadata(false);
            }

            var l1 = data[4] + (data[5]<<8) + (data[6]<<16) + (data[7]<<24);
            if (l1 + 8 !== data.length) {
                return onloadedmetadata(false);
            }

            if (String.fromCharCode(data[8], data[9], data[10], data[11]) !== "WAVE") {
                return onloadedmetadata(false);
            }

            if (String.fromCharCode(data[12], data[13], data[14], data[15]) !== "fmt ") {
                return onloadedmetadata(false);
            }

            var channels   = data[22] + (data[23]<<8);
            var samplerate = data[24] + (data[25]<<8) + (data[26]<<16) + (data[27]<<24);
            var bitSize    = data[34] + (data[35]<<8);

            var i = 36;
            while (i < data.length) {
                if (String.fromCharCode(data[i], data[i+1], data[i+2], data[i+3]) === "data") {
                    break;
                }
                i += 1;
            }
            if (i >= data.length) {
                return onloadedmetadata(false);
            }
            i += 4;

            var l2 = data[i] + (data[i+1]<<8) + (data[i+2]<<16) + (data[i+3]<<24);
            var duration = ((l2 / channels) >> 1) / samplerate;
            i += 4;

            if (l2 > data.length - i) {
                return onloadedmetadata(false);
            }

            var mixdown, bufferL, bufferR;
            mixdown = new Float32Array((duration * samplerate)|0);
            if (channels === 2) {
                bufferL = new Float32Array(mixdown.length);
                bufferR = new Float32Array(mixdown.length);
            }

            onloadedmetadata({
                samplerate: samplerate,
                channels  : channels,
                buffer    : [mixdown, bufferL, bufferR],
                duration  : duration
            });

            if (bitSize === 8) {
                data = new Int8Array(data.buffer, i);
            } else if (bitSize === 16) {
                data = new Int16Array(data.buffer, i);
            } else if (bitSize === 32) {
                data = new Int32Array(data.buffer, i);
            } else if (bitSize === 24) {
                data = _24bit_to_32bit(new Uint8Array(data.buffer, i));
            }

            var imax, j, k = 1 / ((1 << (bitSize-1)) - 1), x;
            if (channels === 2) {
                for (i = j = 0, imax = mixdown.length; i < imax; ++i) {
                    x =  bufferL[i] = data[j++] * k;
                    x += bufferR[i] = data[j++] * k;
                    mixdown[i] = x * 0.5;
                }
            } else {
                for (i = 0, imax = mixdown.length; i < imax; ++i) {
                    mixdown[i] = data[i] * k;
                }
            }

            onloadeddata();
        };

        return function(src, onloadedmetadata, onloadeddata) {
            if (typeof src === "string") {
                Decoder.getBinaryWithPath(src, function(data) {
                    _decode(data, onloadedmetadata, onloadeddata);
                });
            } else {
                _decode(src, onloadedmetadata, onloadeddata);
            }
        };
    })();

    Decoder.webkit_decode = (function() {
        if (typeof webkitAudioContext !== "undefined") {
            var ctx = T.fn._audioContext;
            var _decode = function(data, onloadedmetadata, onloadeddata) {
                var samplerate, channels, bufferL, bufferR, duration;

                if (typeof data === "string") {
                    return onloadeddata(false);
                }

                var buffer;
                try {
                    buffer = ctx.createBuffer(data.buffer, false);
                } catch (e) {
                    return onloadedmetadata(false);
                }

                samplerate = ctx.sampleRate;
                channels   = buffer.numberOfChannels;
                if (channels === 2) {
                    bufferL = buffer.getChannelData(0);
                    bufferR = buffer.getChannelData(1);
                } else {
                    bufferL = bufferR = buffer.getChannelData(0);
                }
                duration = bufferL.length / samplerate;

                var mixdown = new Float32Array(bufferL);
                for (var i = 0, imax = mixdown.length; i < imax; ++i) {
                    mixdown[i] = (mixdown[i] + bufferR[i]) * 0.5;
                }

                onloadedmetadata({
                    samplerate: samplerate,
                    channels  : channels,
                    buffer    : [mixdown, bufferL, bufferR],
                    duration  : duration
                });

                onloadeddata();
            };

            return function(src, onloadedmetadata, onloadeddata) {
                /*global File:true */
                if (src instanceof File) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        _decode(new Uint8Array(e.target.result),
                                onloadedmetadata, onloadeddata);
                    };
                    reader.readAsArrayBuffer(src);
                } else if (typeof src === "string") {
                    Decoder.getBinaryWithPath(src, function(data) {
                        _decode(data, onloadedmetadata, onloadeddata);
                    });
                } else {
                    _decode(src, onloadedmetadata, onloadeddata);
                }
                /*global File:false */
            };
        }
    })();

    Decoder.moz_decode = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(src, onloadedmetadata, onloadeddata) {
                var samplerate, channels, mixdown, bufferL, bufferR, duration;
                var writeIndex = 0;

                var audio = new Audio(src);
                audio.volume = 0.0;
                audio.addEventListener("loadedmetadata", function() {
                    samplerate = audio.mozSampleRate;
                    channels   = audio.mozChannels;
                    duration   = audio.duration;
                    mixdown = new Float32Array((audio.duration * samplerate)|0);
                    if (channels === 2) {
                        bufferL = new Float32Array((audio.duration * samplerate)|0);
                        bufferR = new Float32Array((audio.duration * samplerate)|0);
                    }
                    if (channels === 2) {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var x, samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; i += 2) {
                                x =  bufferL[writeIndex] = samples[i  ];
                                x += bufferR[writeIndex] = samples[i+1];
                                mixdown[writeIndex] = x * 0.5;
                                writeIndex += 1;
                            }
                        }, false);
                    } else {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; ++i) {
                                mixdown[i] = samples[i];
                                writeIndex += 1;
                            }
                        }, false);
                    }
                    audio.play();
                    setTimeout(function() {
                        onloadedmetadata({
                            samplerate: samplerate,
                            channels  : channels,
                            buffer    : [mixdown, bufferL, bufferR],
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
})(timbre);
(function(T) {
    "use strict";

    function Envelope(samplerate) {
        this.samplerate = samplerate || 44100;
        this.value  = ZERO;
        this.status = StatusWait;
        this.curve  = "linear";
        this.step   = 1;
        this.releaseNode = null;
        this.loopNode    = null;
        this.emit = null;

        this._envValue = new EnvelopeValue(samplerate);

        this._table  = [];
        this._initValue  = ZERO;
        this._curveValue = 0;
        this._defaultCurveType = CurveTypeLin;
        this._index   = 0;
        this._counter = 0;
    }

    var ZERO           = Envelope.ZERO = 1e-6;
    var CurveTypeSet   = Envelope.CurveTypeSet   = 0;
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
        set:CurveTypeSet,
        lin:CurveTypeLin, linear     :CurveTypeLin,
        exp:CurveTypeExp, exponential:CurveTypeExp,
        sin:CurveTypeSin, sine       :CurveTypeSin,
        wel:CurveTypeWel, welch      :CurveTypeWel,
        sqr:CurveTypeSqr, squared    :CurveTypeSqr,
        cub:CurveTypeCub, cubed      :CurveTypeCub
    };
    Envelope.CurveTypeDict = CurveTypeDict;

    var $ = Envelope.prototype;

    $.clone = function() {
        var new_instance = new Envelope(this.samplerate);
        new_instance._table = this._table;
        new_instance._initValue = this._initValue;
        new_instance.setCurve(this.curve);
        if (this.releaseNode !== null) {
            new_instance.setReleaseNode(this.releaseNode + 1);
        }
        if (this.loopNode !== null) {
            new_instance.setLoopNode(this.loopNode + 1);
        }
        new_instance.setStep(this.step);
        new_instance.reset();
        return new_instance;
    };
    $.setTable = function(value) {
        this._initValue = value[0];
        this._table = value.slice(1);
        this.value = this._envValue.value = this._initValue;
        this._index   = 0;
        this._counter = 0;
        this.status = StatusWait;
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
    $.setStep = function(step) {
        this.step = this._envValue.step = step;
    };
    $.reset = function() {
        this.value = this._envValue.value = this._initValue;
        this._index   = 0;
        this._counter = 0;
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

    $.calcStatus = function() {
        var status  = this.status;
        var table   = this._table;
        var index   = this._index;
        var counter = this._counter;

        var curveValue = this._curveValue;
        var defaultCurveType = this._defaultCurveType;
        var loopNode    = this.loopNode;
        var releaseNode = this.releaseNode;
        var envValue = this._envValue;
        var items, endValue, time, curveType, emit = null;

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
                    curveType = CurveTypeSet;
                    emit      = "ended";
                    continue;
                } else if (status === StatusGate && index === releaseNode) {
                    if (loopNode !== null && loopNode < releaseNode) {
                        index = loopNode;
                        continue;
                    }
                    status    = StatusSustain;
                    counter   = Infinity;
                    curveType = CurveTypeSet;
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

                counter = envValue.setNext(endValue, time, curveType, curveValue);
            }
            break;
        }

        this.status = status;
        this.emit   = emit;
        this._index = index;
        this._counter = counter;

        return status;
    };

    $.next = function() {
        if (this.calcStatus() & 1) {
            this.value  = this._envValue.next() || ZERO;
        }
        this._counter -= 1;
        return this.value;
    };

    $.process = function(cell) {
        var envValue = this._envValue;
        var i, imax = cell.length;

        if (this.calcStatus() & 1) {
            for (i = 0; i < imax; ++i) {
                cell[i] = envValue.next() || ZERO;
            }
        } else {
            var value = this.value || ZERO;
            for (i = 0; i < imax; ++i) {
                cell[i] = value;
            }
        }
        this.value = cell[imax-1];

        this._counter -= cell.length;
    };


    function EnvelopeValue(samplerate) {
        this.samplerate = samplerate;
        this.value = ZERO;
        this.step  = 1;

        this._curveType  = CurveTypeLin;
        this._curveValue = 0;

        this._grow = 0;

        this._a2 = 0;
        this._b1 = 0;
        this._y1 = 0;
        this._y2 = 0;
    }
    EnvelopeValue.prototype.setNext = function(endValue, time, curveType, curveValue) {
        var n = this.step;
        var value = this.value;
        var grow, w, a1, a2, b1, y1, y2;

        var counter = ((time * 0.001 * this.samplerate) / n)|0;
        if (counter < 1) {
            counter   = 1;
            curveType = CurveTypeSet;
        }

        switch (curveType) {
        case CurveTypeSet:
            this.value = endValue;
            break;
        case CurveTypeLin:
            grow = (endValue - value) / counter;
            break;
        case CurveTypeExp:
            if (value !== 0) {
                grow = Math.pow(
                    endValue / value, 1 / counter
                );
            } else {
                grow = 0;
            }
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

        this.next = NextFunctions[curveType];
        this._grow = grow;
        this._a2 = a2;
        this._b1 = b1;
        this._y1 = y1;
        this._y2 = y2;

        return counter;
    };

    var NextFunctions = [];
    NextFunctions[CurveTypeSet] = function() {
        return this.value;
    };
    NextFunctions[CurveTypeLin] = function() {
        this.value += this._grow;
        return this.value;
    };
    NextFunctions[CurveTypeExp] = function() {
        this.value *= this._grow;
        return this.value;
    };
    NextFunctions[CurveTypeSin] = function() {
        var y0 = this._b1 * this._y1 - this._y2;
        this.value = this._a2 - y0;
        this._y2 = this._y1;
        this._y1 = y0;
        return this.value;
    };
    NextFunctions[CurveTypeWel] = function() {
        var y0 = this._b1 * this._y1 - this._y2;
        this.value = this._a2 + y0;
        this._y2 = this._y1;
        this._y1 = y0;
        return this.value;
    };
    NextFunctions[CurveTypeCurve] = function() {
        this._b1 *= this._grow;
        this.value = this._a2 - this._b1;
        return this.value;
    };
    NextFunctions[CurveTypeSqr] = function() {
        this._y1 += this._grow;
        this.value = this._y1 * this._y1;
        return this.value;
    };
    NextFunctions[CurveTypeCub] = function() {
        this._y1 += this._grow;
        this.value = this._y1 * this._y1 * this._y1;
        return this.value;
    };

    EnvelopeValue.prototype.next = NextFunctions[CurveTypeSet];

    T.modules.Envelope      = Envelope;
    T.modules.EnvelopeValue = EnvelopeValue;

})(timbre);
(function(T) {
    "use strict";

    function FFT(n) {
        n = (typeof n === "number") ? n : 512;
        n = 1 << Math.ceil(Math.log(n) * Math.LOG2E);

        this.length  = n;
        this.buffer  = new T.fn.SignalArray(n);
        this.real    = new T.fn.SignalArray(n);
        this.imag    = new T.fn.SignalArray(n);
        this._real   = new T.fn.SignalArray(n);
        this._imag   = new T.fn.SignalArray(n);
        this.mag     = new T.fn.SignalArray(n>>1);

        this.minDecibels =  -30;
        this.maxDecibels = -100;

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
                        this._window = new T.fn.SignalArray(this.length);
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
        var buffer   = this.buffer;
        var real   = this.real;
        var imag   = this.imag;
        var window = this._window;
        var bitrev = this._bitrev;
        var sintable = this._sintable;
        var costable = this._costable;
        var n = buffer.length;
        var i, j, k, k2, h, d, c, s, ik, dx, dy;

        if (window) {
            for (i = 0; i < n; ++i) {
                buffer[i] = _buffer[i] * window[i];
            }
        } else {
            buffer.set(_buffer);
        }

        for (i = 0; i < n; ++i) {
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

        var mag = this.mag;
        var rval, ival;
        for (i = 0; i < n; ++i) {
            rval = real[i];
            ival = imag[i];
            mag[i] = Math.sqrt(rval * rval + ival * ival);
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

        for (i = 0; i < n; ++i) {
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

        for (i = 0; i < n; ++i) {
            buffer[i] = real[i] / n;
        }
        return buffer;
    };

    $.getFrequencyData = function(array) {
        var minDecibels  = this.minDecibels;
        var i, imax = Math.min(this.mag.length, array.length);
        if (imax) {
            var x, mag = this.mag;
            var peak = 0;
            for (i = 0; i < imax; ++i) {
                x  = mag[i];
                array[i] = !x ? minDecibels : 20 * Math.log(x) * Math.LOG10E;
                if (peak < array[i]) {
                    peak = array[i];
                }
            }
        }
        return array;
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
                var i, imax, k = Math.floor(Math.log(n) / Math.LN2);
                var sintable = new T.fn.SignalArray((1<<k)-1);
                var costable = new T.fn.SignalArray((1<<k)-1);
                var PI2 = Math.PI * 2;

                for (i = 0, imax = sintable.length; i < imax; ++i) {
                    sintable[i] = Math.sin(PI2 * (i / n));
                    costable[i] = Math.cos(PI2 * (i / n));
                }
                FFTParams[n] = {
                    bitrev: bitrev, sintable:sintable, costable:costable
                };
                return FFTParams[n];
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

    T.modules.FFT = FFT;

})(timbre);
(function(T) {
    "use strict";

    function Oscillator(samplerate) {
        this.samplerate = samplerate || 44100;

        this.wave = null;
        this.step = 1;
        this.frequency = 0;
        this.value = 0;
        this.phase = 0;
        this.feedback = false;

        this._x = 0;
        this._lastouts = 0;
        this._coeff = TABLE_SIZE / this.samplerate;
        this._radtoinc = TABLE_SIZE / (Math.PI * 2);
    }

    var TABLE_SIZE = 1024;
    var TABLE_MASK = TABLE_SIZE - 1;

    var $ = Oscillator.prototype;

    $.setWave = function(value) {
        var i, dx, wave = this.wave;
        if (!this.wave) {
            this.wave = new Float32Array(TABLE_SIZE + 1);
        }
        if (typeof value === "function") {
            for (i = 0; i < TABLE_SIZE; ++i) {
                wave[i] = value(i / TABLE_SIZE);
            }
        } else if (T.fn.isSignalArray(value)) {
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
        this.wave[TABLE_SIZE] = this.wave[0];
    };

    $.clone = function() {
        var new_instance = new Oscillator(this.samplerate);
        new_instance.wave      = this.wave;
        new_instance.step      = this.step;
        new_instance.frequency = this.frequency;
        new_instance.value     = this.value;
        new_instance.phase     = this.phase;
        new_instance.feedback  = this.feedback;
        return new_instance;
    };

    $.reset = function() {
        this._x = 0;
    };

    $.next = function() {
        var x = this._x;
        var index = (x + this.phase * this._radtoinc)|0;
        this.value = this.wave[index & TABLE_MASK];
        x += this.frequency * this._coeff * this.step;
        if (x > TABLE_SIZE) {
            x -= TABLE_SIZE;
        }
        this._x = x;
        return this.value;
    };

    $.process = function(cell) {
        var wave = this.wave;
        var radtoinc = this._radtoinc;
        var phase, x = this._x;
        var index, frac, x0, x1, dx = this.frequency * this._coeff;
        var i, imax = this.step;

        if (this.feedback) {
            var lastouts = this._lastouts;
            radtoinc *= this.phase;
            for (i = 0; i < imax; ++i) {
                phase = x + lastouts * radtoinc;
                index = phase|0;
                frac  = phase - index;
                index = index & TABLE_MASK;
                x0 = wave[index  ];
                x1 = wave[index+1];
                cell[i] = lastouts = x0 + frac * (x1 - x0);
                x += dx;
            }
            this._lastouts = lastouts;
        } else {
            var phaseoffset = this.phase * radtoinc;
            for (i = 0; i < imax; ++i) {
                phase = x + phaseoffset;
                index = phase|0;
                frac  = phase - index;
                index = index & TABLE_MASK;
                x0 = wave[index  ];
                x1 = wave[index+1];
                cell[i] = x0 + frac * (x1 - x0);
                x += dx;
            }
        }
        if (x > TABLE_SIZE) {
            x -= TABLE_SIZE;
        }
        this._x = x;
        this.value = cell[cell.length - 1];
    };

    $.processWithFreqArray = function(cell, freqs) {
        var wave = this.wave;
        var radtoinc = this._radtoinc;
        var phase, x = this._x;
        var index, frac, x0, x1, dx = this._coeff;
        var i, imax = this.step;

        if (this.feedback) {
            var lastouts = this._lastouts;
            radtoinc *= this.phase;
            for (i = 0; i < imax; ++i) {
                phase = x + lastouts * radtoinc;
                index = phase|0;
                frac  = phase - index;
                index = index & TABLE_MASK;
                x0 = wave[index  ];
                x1 = wave[index+1];
                cell[i] = lastouts = x0 + frac * (x1 - x0);
                x += freqs[i] * dx;
            }
            this._lastouts = lastouts;
        } else {
            var phaseoffset = this.phase * this._radtoinc;
            for (i = 0; i < imax; ++i) {
                phase = x + phaseoffset;
                index = phase|0;
                frac  = phase - index;
                index = index & TABLE_MASK;
                x0 = wave[index  ];
                x1 = wave[index+1];
                cell[i] = x0 + frac * (x1 - x0);
                x += freqs[i] * dx;
            }
        }
        if (x > TABLE_SIZE) {
            x -= TABLE_SIZE;
        }
        this._x = x;
        this.value = cell[cell.length - 1];
    };

    $.processWithPhaseArray = function(cell, phases) {
        var wave = this.wave;
        var radtoinc = this._radtoinc;
        var phase, x = this._x;
        var index, frac, x0, x1, dx = this.frequency * this._coeff;
        var i, imax = this.step;

        if (this.feedback) {
            var lastouts = this._lastouts;
            radtoinc *= this.phase;
            for (i = 0; i < imax; ++i) {
                phase = x + lastouts * radtoinc;
                index = phase|0;
                frac  = phase - index;
                index = index & TABLE_MASK;
                x0 = wave[index  ];
                x1 = wave[index+1];
                cell[i] = lastouts = x0 + frac * (x1 - x0);
                x += dx;
            }
            this._lastouts = lastouts;
        } else {
            for (i = 0; i < imax; ++i) {
                phase = x + phases[i] * radtoinc;
                index = phase|0;
                frac  = phase - index;
                index = index & TABLE_MASK;
                x0 = wave[index  ];
                x1 = wave[index+1];
                cell[i] = x0 + frac * (x1 - x0);
                x += dx;
            }
        }
        if (x > TABLE_SIZE) {
            x -= TABLE_SIZE;
        }
        this._x = x;
        this.value = cell[cell.length - 1];
    };

    $.processWithFreqAndPhaseArray = function(cell, freqs, phases) {
        var wave = this.wave;
        var radtoinc = this._radtoinc;
        var phase, x = this._x;
        var index, frac, x0, x1, dx = this._coeff;
        var i, imax = this.step;

        if (this.feedback) {
            var lastouts = this._lastouts;
            radtoinc *= this.phase;
            for (i = 0; i < imax; ++i) {
                phase = x + lastouts * radtoinc;
                index = phase|0;
                frac  = phase - index;
                index = index & TABLE_MASK;
                x0 = wave[index  ];
                x1 = wave[index+1];
                cell[i] = lastouts = x0 + frac * (x1 - x0);
                x += freqs[i] * dx;
            }
            this._lastouts = lastouts;
        } else {
            for (i = 0; i < imax; ++i) {
                phase = x + phases[i] * TABLE_SIZE;
                index = phase|0;
                frac  = phase - index;
                index = index & TABLE_MASK;
                x0 = wave[index  ];
                x1 = wave[index+1];
                cell[i] = x0 + frac * (x1 - x0);
                x += freqs[i] * dx;
            }
        }
        if (x > TABLE_SIZE) {
            x -= TABLE_SIZE;
        }
        this._x = x;
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
            for (i = 0; i < 1024; ++i) {
                wave[i] = wave[i] * 0.5 + 0.5;
            }
        } else if (sign === "-") {
            for (i = 0; i < 1024; ++i) {
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
                for (var j = 0, jmax = 1024 / n; j < jmax; ++j) {
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
            for (i = 0; i < 1024; ++i) {
                if (maxx < (absx = Math.abs(wave[i]))) {
                    maxx = absx;
                }
            }
            if (maxx > 0) {
                for (i = 0; i < 1024; ++i) {
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
                Wavetables[key] = wave;
                return wave;
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
        } else if (T.fn.isSignalArray(value)) {
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
            for (var i = 0; i < 1024; ++i) {
                wave[i] = Math.sin(2 * Math.PI * (i/1024));
            }
            return wave;
        },
        cos: function() {
            var wave = new Float32Array(1024);
            for (var i = 0; i < 1024; ++i) {
                wave[i] = Math.cos(2 * Math.PI * (i/1024));
            }
            return wave;
        },
        pulse: function() {
            var wave = new Float32Array(1024);
            for (var i = 0; i < 1024; ++i) {
                wave[i] = (i < 512) ? +1 : -1;
            }
            return wave;
        },
        tri: function() {
            var wave = new Float32Array(1024);
            for (var x, i = 0; i < 1024; ++i) {
                x = (i / 1024) - 0.25;
                wave[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
            }
            return wave;
        },
        saw: function() {
            var wave = new Float32Array(1024);
            for (var x, i = 0; i < 1024; ++i) {
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
            for (var i = 0; i < 1024; ++i) {
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
            for (var i = 0; i < 1024; ++i) {
                wave[i] = d[(i / 1024 * d.length)|0];
            }
            return wave;
        }
    };

    T.modules.Oscillator = Oscillator;

})(timbre);
/**
 * Port of the Freeverb Schrodoer/Moorer reverb model.
 * https://ccrma.stanford.edu/~jos/pasp/Freeverb.html
*/
(function(T) {
    "use strict";

    var CombParams    = [1116,1188,1277,1356,1422,1491,1557,1617];
    var AllpassParams = [225,556,441,341];

    function Reverb(samplerate, buffersize) {
        this.samplerate = samplerate;

        var i, imax;
        var k = samplerate / 44100;

        imax = CombParams.length * 2;
        this.comb = new Array(imax);
        this.combout = new Array(imax);
        for (i = 0; i < imax; ++i) {
            this.comb[i]    = new CombFilter(CombParams[i % CombParams.length] * k);
            this.combout[i] = new T.fn.SignalArray(buffersize);
        }

        imax = AllpassParams.length * 2;
        this.allpass = new Array(imax);
        for (i = 0; i < imax; ++i) {
            this.allpass[i] = new AllpassFilter(AllpassParams[i % AllpassParams.length] * k);
        }
        this.outputs = [ new T.fn.SignalArray(buffersize),
                         new T.fn.SignalArray(buffersize) ];
        this.damp = 0;
        this.wet  = 0.33;

        this.setRoomSize(0.5);
        this.setDamp(0.5);
    }

    var $ = Reverb.prototype;

    $.setRoomSize = function(roomsize) {
        var comb = this.comb;
        var value = (roomsize * 0.28) + 0.7;
        this.roomsize = roomsize;
        comb[0].feedback = comb[1].feedback = comb[2].feedback = comb[3].feedback = comb[4].feedback = comb[5].feedback = comb[6].feedback = comb[7].feedback = comb[8].feedback = comb[9].feedback = comb[10].feedback = comb[11].feedback = comb[12].feedback = comb[13].feedback = comb[14].feedback = comb[15].feedback = value;
    };
    $.setDamp = function(damp) {
        var comb = this.comb;
        var value = damp * 0.4;
        this.damp = damp;
        comb[0].damp = comb[1].damp = comb[2].damp = comb[3].damp = comb[4].damp = comb[5].damp = comb[6].damp = comb[7].damp = comb[8].damp = comb[9].damp = comb[10].damp = comb[11].damp = comb[12].damp = comb[13].damp = comb[14].damp = comb[15].damp = value;

    };
    $.process = function(cellL, cellR) {
        var comb = this.comb;
        var combout = this.combout;
        var allpass = this.allpass;
        var output0 = this.outputs[0];
        var output1 = this.outputs[1];
        var wet = this.wet, dry = 1 - wet;
        var i, imax = cellL.length;

        comb[0].process(cellL, combout[0]);
        comb[1].process(cellL, combout[1]);
        comb[2].process(cellL, combout[2]);
        comb[3].process(cellL, combout[3]);
        comb[4].process(cellL, combout[4]);
        comb[5].process(cellL, combout[5]);
        comb[6].process(cellL, combout[6]);
        comb[7].process(cellL, combout[7]);

        comb[ 8].process(cellR, combout[ 8]);
        comb[ 9].process(cellR, combout[ 9]);
        comb[10].process(cellR, combout[10]);
        comb[11].process(cellR, combout[11]);
        comb[12].process(cellR, combout[12]);
        comb[13].process(cellR, combout[13]);
        comb[14].process(cellR, combout[14]);
        comb[15].process(cellR, combout[15]);

        for (i = 0; i < imax; ++i) {
            output0[i] = combout[0][i] + combout[1][i] + combout[2][i] + combout[3][i] + combout[4][i] + combout[5][i] + combout[6][i] + combout[7][i];
            output1[i] = combout[8][i] + combout[9][i] + combout[10][i] + combout[11][i] + combout[12][i] + combout[13][i] + combout[14][i] + combout[15][i];
        }
        allpass[0].process(output0, output0);
        allpass[1].process(output0, output0);
        allpass[2].process(output0, output0);
        allpass[3].process(output0, output0);

        allpass[4].process(output1, output1);
        allpass[5].process(output1, output1);
        allpass[6].process(output1, output1);
        allpass[7].process(output1, output1);

        for (i = 0; i < imax; ++i) {
            cellL[i] = output0[i] * wet + cellL[i] * dry;
            cellR[i] = output1[i] * wet + cellR[i] * dry;
        }
    };

    function CombFilter(buffersize) {
        this.buffer = new T.fn.SignalArray(buffersize|0);
        this.buffersize = this.buffer.length;
        this.bufidx = 0;
        this.feedback =  0;
        this.filterstore = 0;
        this.damp = 0;
    }

    CombFilter.prototype.process = function(input, output) {
        var ins, outs;
        var buffer = this.buffer;
        var buffersize = this.buffersize;
        var bufidx = this.bufidx;
        var filterstore = this.filterstore;
        var feedback = this.feedback;
        var damp1 = this.damp, damp2 = 1 - damp1;
        var i, imax = input.length;

        for (i = 0; i < imax; ++i) {
            ins = input[i] * 0.015;
            outs = buffer[bufidx];

            filterstore = (outs * damp2) + (filterstore * damp1);

            buffer[bufidx] = ins + (filterstore * feedback);

            if (++bufidx >= buffersize) {
                bufidx = 0;
            }

            output[i] = outs;
        }

        this.bufidx = bufidx;
        this.filterstore = filterstore;
    };

    function AllpassFilter(buffersize) {
        this.buffer = new T.fn.SignalArray(buffersize|0);
        this.buffersize = this.buffer.length;
        this.bufidx = 0;
    }

    AllpassFilter.prototype.process = function(input, output) {
        var ins, outs, bufout;
        var buffer = this.buffer;
        var buffersize = this.buffersize;
        var bufidx = this.bufidx;
        var i, imax = input.length;

        for (i = 0; i < imax; ++i) {
            ins = input[i];

            bufout = buffer[bufidx];

            outs = -ins + bufout;
            buffer[bufidx] = ins + (bufout * 0.5);

            if (++bufidx >= buffersize) {
                bufidx = 0;
            }

            output[i] = outs;
        }

        this.bufidx = bufidx;
    };

    T.modules.Reverb = Reverb;

})(timbre);
(function(T) {
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
            var duration   = soundbuffer.buffer[0].length / samplerate;
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
        if (right_percent > 100) {
            right_percent = 100;
        } else if (right_percent < 0) {
            right_percent = 0;
        }
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

    Tape.prototype.getBuffer = function() {
        var samplerate = 44100;
        if (this.fragments.length > 0) {
            samplerate = this.fragments[0].samplerate;
        }
        var stream = new TapeStream(this, samplerate);
        var total_samples = (this.duration() * samplerate)|0;
        return {
            samplerate: samplerate,
            buffer    : stream.fetch(total_samples)
        };
    };

    function Fragment(soundbuffer, start, duration, reverse, pitch, stretch, pan) {
        if (!soundbuffer) {
            soundbuffer = silencebuffer;
        }
        this.buffer     = soundbuffer.buffer[0];
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
        this.panL = 0.5;
        this.panR = 0.5;
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
        this.panL = 0.5;
        this.panR = 0.5;
        this.isLooped = false;
        return this;
    };

    TapeStream.prototype.fetch = function(n) {
        var cellL = new T.fn.SignalArray(n);
        var cellR = new T.fn.SignalArray(n);
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
        var pan;
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

                    pan = (fragment.pan * 0.01);
                    panL = 1 - pan;
                    panR = pan;

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

    T.modules.Scissor = Scissor;

})(timbre);
(function(T) {
    "use strict";

    function StereoDelay(samplerate) {
        this.samplerate = samplerate;

        var bits = Math.ceil(Math.log(samplerate * 1.5) * Math.LOG2E);

        this.buffersize = 1 << bits;
        this.buffermask = this.buffersize - 1;
        this.writeBufferL = new T.fn.SignalArray(this.buffersize);
        this.writeBufferR = new T.fn.SignalArray(this.buffersize);
        this.readBufferL = this.writeBufferL;
        this.readBufferR = this.writeBufferR;
        this.delaytime = null;
        this.feedback  = null;
        this.cross = null;
        this.mix   = null;
        this.prevL = 0;
        this.prevR = 0;

        this.readIndex  = 0;
        this.writeIndex = 0;

        this.setParams(125, 0.25, false, 0.45);
    }

    var $ = StereoDelay.prototype;

    $.setParams = function(delaytime, feedback, cross ,mix) {
        if (this.delaytime !== delaytime) {
            this.delaytime = delaytime;
            var offset = (delaytime * 0.001 * this.samplerate)|0;
            if (offset > this.buffermask) {
                offset = this.buffermask;
            }
            this.writeIndex = (this.readIndex + offset) & this.buffermask;
        }
        if (this.feedback !== feedback) {
            this.feedback = feedback;
        }
        if (this.cross !== cross) {
            this.cross = cross;
            if (cross) {
                this.readBufferL = this.writeBufferR;
                this.readBufferR = this.writeBufferL;
            } else {
                this.readBufferL = this.writeBufferL;
                this.readBufferR = this.writeBufferR;
            }
        }
        if (this.mix !== mix) {
            this.mix = mix;
        }
    };

    $.process = function(cellL, cellR) {
        var readBufferL = this.readBufferL;
        var readBufferR = this.readBufferR;
        var writeBufferL = this.writeBufferL;
        var writeBufferR = this.writeBufferR;
        var readIndex  = this.readIndex;
        var writeIndex = this.writeIndex;
        var mask = this.buffermask;
        var fb = this.feedback;
        var wet = this.mix, dry = 1 - wet;
        var prevL = this.prevL;
        var prevR = this.prevR;

        var x;
        var i, imax = cellL.length;

        for (i = 0; i < imax; ++i) {
            x = readBufferL[readIndex];
            writeBufferL[writeIndex] = cellL[i] - x * fb;
            cellL[i] = prevL = ((cellL[i] * dry) + (x * wet) + prevL) * 0.5;

            x = readBufferR[readIndex];
            writeBufferR[writeIndex] = cellR[i] - x * fb;
            cellR[i] = prevR = ((cellR[i] * dry) + (x * wet) + prevR) * 0.5;

            readIndex  += 1;
            writeIndex = (writeIndex + 1) & mask;
        }

        this.readIndex  = readIndex  & this.buffermask;
        this.writeIndex = writeIndex;
        this.prevL = prevL;
        this.prevR = prevR;
    };

    T.modules.StereoDelay = StereoDelay;

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var modules = T.modules;

    fn.register("audio", function(_args) {
        var BufferNode = fn.getClass("buffer");
        var instance = new BufferNode(_args);

        instance.playbackState = fn.FINISHED_STATE;
        instance._.isLoaded = false;

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
            self._.emit("done");
        });

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
                self.playbackState = fn.PLAYING_STATE;
                _.samplerate = result.samplerate;
                _.channels   = result.channels;
                _.bufferMix  = null;
                _.buffer     = result.buffer;
                _.phase      = 0;
                _.phaseIncr  = result.samplerate / T.samplerate;
                _.duration   = result.duration * 1000;
                _.currentTime = 0;
                if (_.isReversed) {
                    _.phaseIncr *= -1;
                    _.phase = result.buffer[0].length + _.phaseIncr;
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

})(timbre);
(function(T) {
    "use strict";

    var fn  = T.fn;
    var FFT = T.modules.FFT;
    var Biquad = T.modules.Biquad;
    var PLOT_LOW_FREQ = 20;

    function BiquadNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.biquad = new Biquad(_.samplerate);
        _.freq = T(340);
        _.band = T(1);
        _.gain = T(0);

        _.plotBefore = plotBefore;
        _.plotRange  = [-18, 18];
        _.plotFlush  = true;
    }
    fn.extend(BiquadNode);

    var plotBefore = function(context, x, y, width, height) {
        context.lineWidth = 1;
        context.strokeStyle = "rgb(192, 192, 192)";
        var nyquist = this._.samplerate * 0.5;
        for (var i = 1; i <= 10; ++i) {
            for (var j = 1; j <= 4; j++) {
                var f = i * Math.pow(10, j);
                if (f <= PLOT_LOW_FREQ || nyquist <= f) {
                    continue;
                }
                context.beginPath();
                var _x = (Math.log(f/PLOT_LOW_FREQ)) / (Math.log(nyquist/PLOT_LOW_FREQ));
                _x = ((_x * width + x)|0) + 0.5;
                context.moveTo(_x, y);
                context.lineTo(_x, y + height);
                context.stroke();
            }
        }

        var h = height / 6;
        for (i = 1; i < 6; i++) {
            context.beginPath();
            var _y = ((y + (i * h))|0) + 0.5;
            context.moveTo(x, _y);
            context.lineTo(x + width, _y);
            context.stroke();
        }
    };

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
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        cutoff: {
            set: function(value) {
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        res: {
            set: function(value) {
                this._.band = T(value);
            },
            get: function() {
                return this._.band;
            }
        },
        Q: {
            set: function(value) {
                this._.band = T(value);
            },
            get: function() {
                return this._.band;
            }
        },
        band: {
            set: function(value) {
                this._.band = T(value);
            },
            get: function() {
                return this._.band;
            }
        },
        gain: {
            set: function(value) {
                this._.gain = T(value);
            },
            get: function() {
                return this._.gain;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var freq = _.freq.process(tickID).cells[0][0];
            var band = _.band.process(tickID).cells[0][0];
            var gain = _.gain.process(tickID).cells[0][0];
            if (_.prevFreq !== freq || _.prevband !== band || _.prevGain !== gain) {
                _.prevFreq = freq;
                _.prevband = band;
                _.prevGain = gain;
                _.biquad.setParams(freq, band, gain);
                _.plotFlush = true;
            }

            if (!_.bypassed) {
                _.biquad.process(this.cells[1], this.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    var fft = new FFT(2048);
    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        if (this._.plotFlush) {
            var biquad = new Biquad(this._.samplerate);
            biquad.setType(this.type);
            biquad.setParams(this.freq.valueOf(), this.band.valueOf(), this.gain.valueOf());

            var impluse = new Float32Array(fft.length);
            impluse[0] = 1;

            biquad.process(impluse, impluse);
            fft.forward(impluse);

            var size = 512;
            var data = new Float32Array(size);
            var nyquist  = this._.samplerate * 0.5;
            var spectrum = new Float32Array(size);
            var i, j, f, index, delta, x0, x1, xx;

            fft.getFrequencyData(spectrum);
            for (i = 0; i < size; ++i) {
                f = Math.pow(nyquist / PLOT_LOW_FREQ, i / size) * PLOT_LOW_FREQ;
                j = f / (nyquist / spectrum.length);
                index = j|0;
                delta = j - index;
                if (index === 0) {
                    x1 = x0 = xx = spectrum[index];
                } else {
                    x0 = spectrum[index - 1];
                    x1 = spectrum[index];
                    xx = ((1.0 - delta) * x0 + delta * x1);
                }
                data[i] = xx;
            }
            this._.plotData  = data;
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

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var Tape = T.modules.Scissor.Tape;
    var isSignalArray = function(obj) {
        return fn.isSignalArray(obj) || obj instanceof Float32Array;
    };

    function BufferNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        _.pitch      = T(1);
        _.samplerate = 44100;
        _.channels   = 0;
        _.bufferMix  = null;
        _.buffer     = [];
        _.isLooped   = false;
        _.isReversed = false;
        _.duration    = 0;
        _.currentTime = 0;
        _.currentTimeObj = null;
        _.phase = 0;
        _.phaseIncr = 0;
        _.onended  = fn.make_onended(this, 0);
        _.onlooped = make_onlooped(this);
    }
    fn.extend(BufferNode);

    var make_onlooped = function(self) {
        return function() {
            var _ = self._;
            if (_.phase >= _.buffer[0].length) {
                _.phase = 0;
            } else if (_.phase < 0) {
                _.phase = _.buffer[0].length + _.phaseIncr;
            }
            self._.emit("looped");
        };
    };

    var $ = BufferNode.prototype;

    var setBuffer = function(value) {
        var _ = this._;
        if (typeof value === "object") {
            var buffer = [], samplerate, channels;

            if (isSignalArray(value)) {
                buffer[0] = value;
                channels = 1;
            } else if (typeof value === "object") {
                if (value instanceof T.Object) {
                    value = value.buffer;
                } else if (value instanceof Tape) {
                    value = value.getBuffer();
                }
                if (Array.isArray(value.buffer)) {
                    if (isSignalArray(value.buffer[0])) {
                        if (isSignalArray(value.buffer[1]) &&
                            isSignalArray(value.buffer[2])) {
                            channels = 2;
                            buffer = value.buffer;
                        } else {
                            channels = 1;
                            buffer = [value.buffer[0]];
                        }
                    }
                } else if (isSignalArray(value.buffer)) {
                    channels = 1;
                    buffer = [value.buffer];
                }
                if (typeof value.samplerate === "number") {
                    samplerate = value.samplerate;
                }
            }
            if (buffer.length) {
                if (samplerate > 0) {
                    _.samplerate = value.samplerate;
                }
                _.bufferMix = null;
                _.buffer  = buffer;
                _.phase     = 0;
                _.phaseIncr = _.samplerate / T.samplerate;
                _.duration  = _.buffer[0].length * 1000 / _.samplerate;
                _.currentTime = 0;
                _.plotFlush = true;
                this.reverse(_.isReversed);
            }
        }
    };

    Object.defineProperties($, {
        buffer: {
            set: setBuffer,
            get: function() {
                var _ = this._;
                return {
                    samplerate: _.samplerate,
                    channels  : _.channels,
                    buffer    : _.buffer
                };
            }
        },
        pitch: {
            set: function(value) {
                this._.pitch = T(value);
            },
            get: function() {
                return this._.pitch;
            }
        },
        isLooped: {
            get: function() {
                return this._.isLooped;
            }
        },
        isReversed: {
            get: function() {
                return this._.isReversed;
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
                } else if (value instanceof T.Object) {
                    this._.currentTimeObj = value;
                } else if (value === null) {
                    this._.currentTimeObj = null;
                }
            },
            get: function() {
                if (this._.currentTimeObj) {
                    return this._.currentTimeObj;
                } else {
                    return this._.currentTime;
                }
            }
        }
    });

    $.clone = function() {
        var _ = this._;
        var instance = fn.clone(this);

        if (_.buffer.length) {
            setBuffer.call(instance, {
                buffer    : _.buffer,
                samplerate: _.samplerate,
                channels  : _.channels
            });
        }
        instance.loop(_.isLooped);
        instance.reverse(_.isReversed);

        return instance;
    };

    $.slice = function(begin, end) {
        var _ = this._;
        var instance = T(_.originkey);
        var isReversed = _.isReversed;

        if (_.buffer.length) {
            if (typeof begin === "number" ){
                begin = (begin * 0.001 * _.samplerate)|0;
            } else {
                begin = 0;
            }
            if (typeof end === "number") {
                end   = (end   * 0.001 * _.samplerate)|0;
            } else {
                end = _.buffer[0].length;
            }
            if (begin > end) {
                var tmp = begin;
                begin = end;
                end   = tmp;
                isReversed = !isReversed;
            }

            if (_.channels === 2) {
                setBuffer.call(instance, {
                    buffer   : [ fn.pointer(_.buffer[0], begin, end-begin),
                                 fn.pointer(_.buffer[1], begin, end-begin),
                                 fn.pointer(_.buffer[2], begin, end-begin) ],
                    samplerate: _.samplerate
                });
            } else {
                setBuffer.call(instance, {
                    buffer: fn.pointer(_.buffer[0], begin, end-begin),
                    samplerate: _.samplerate
                });
            }
            instance.playbackState = fn.PLAYING_STATE;
        }
        instance.loop(_.isLooped);
        instance.reverse(_.isReversed);

        return instance;
    };

    $.reverse = function(value) {
        var _ = this._;

        _.isReversed = !!value;
        if (_.isReversed) {
            if (_.phaseIncr > 0) {
                _.phaseIncr *= -1;
            }
            if (_.phase === 0 && _.buffer.length) {
                _.phase = _.buffer[0].length + _.phaseIncr;
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
        this.playbackState = (value === false ? fn.FINISHED_STATE : fn.PLAYING_STATE);
        this._.phase = 0;
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (!_.buffer.length) {
            return this;
        }

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var phase  = _.phase;
            var i, imax = _.cellsize;

            var bufferL, bufferR;
            if (_.channels === 2) {
                bufferL = _.buffer[1];
                bufferR = _.buffer[2];
            } else {
                bufferL = bufferR = _.buffer[0];
            }

            if (_.currentTimeObj) {
                var pos = _.currentTimeObj.process(tickID).cells[0];
                var t, sr = _.samplerate * 0.001;
                for (i = 0; i < imax; ++i) {
                    t = pos[i];
                    phase = t * sr;
                    cellL[i] = (bufferL[phase|0] || 0);
                    cellR[i] = (bufferR[phase|0] || 0);
                }
                _.phase = phase;
                _.currentTime = t;
            } else {
                var pitch  = _.pitch.process(tickID).cells[0][0];
                var phaseIncr = _.phaseIncr * pitch;

                for (i = 0; i < imax; ++i) {
                    cellL[i] = (bufferL[phase|0] || 0);
                    cellR[i] = (bufferR[phase|0] || 0);
                    phase += phaseIncr;
                }

                if (phase >= bufferL.length) {
                    if (_.isLooped) {
                        fn.nextTick(_.onlooped);
                    } else {
                        fn.nextTick(_.onended);
                    }
                } else if (phase < 0) {
                    if (_.isLooped) {
                        fn.nextTick(_.onlooped);
                    } else {
                        fn.nextTick(_.onended);
                    }
                }
                _.phase = phase;
                _.currentTime += fn.currentTimeIncr;
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        var _ = this._;
        var bufferL, bufferR;
        if (_.plotFlush) {
            if (_.channels === 2) {
                bufferL = _.buffer[1];
                bufferR = _.buffer[2];
            } else {
                bufferL = bufferR = _.buffer[0];
            }
            var data = new Float32Array(2048);
            var x = 0, xIncr = bufferL.length / 2048;
            for (var i = 0; i < 2048; i++) {
                data[i] = (bufferL[x|0] + bufferR[x|0]) * 0.5;
                x += xIncr;
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("buffer", BufferNode);

})(timbre);
(function(T) {
    "use strict";

    var fn  = T.fn;
    var Chorus = T.modules.Chorus;

    function ChorusNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var chorus = new Chorus(this._.samplerate);
        chorus.setDelayTime(20);
        chorus.setRate(4);
        chorus.depth = 20;
        chorus.feedback = 0.2;
        chorus.mix = 0.33;
        this._.chorus = chorus;
    }
    fn.extend(ChorusNode);

    var $ = ChorusNode.prototype;

    Object.defineProperties($, {
        type: {
            set: function(value) {
                this._.chorus.setDelayTime(value);
            },
            get: function() {
                return this._.chorus.wave;
            }
        },
        delay: {
            set: function(value) {
                if (0.5 <= value && value <= 80) {
                    this._.chorus.setDelayTime(value);
                }
            },
            get: function() {
                return this._.chorus.delayTime;
            }
        },
        rate: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.chorus.setRate(value);
                }
            },
            get: function() {
                return this._.chorus.rate;
            }
        },
        depth: {
            set: function(value) {
                if (typeof value === "number") {
                    if (0 <= value && value <= 100) {
                        value *= this._.samplerate / 44100;
                        this._.chorus.depth = value;
                    }
                }
            },
            get: function() {
                return this._.chorus.depth;
            }
        },
        fb: {
            set: function(value) {
                if (typeof value === "number") {
                    if (-1 <= value && value <= 1) {
                        this._.chorus.feedback = value * 0.99996;
                    }
                }
            },
            get: function() {
                return this._.chorus.feedback;
            }
        },
        mix: {
            set: function(value) {
                this._.mix = T(value);
            },
            get: function() {
                return this._.mix;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                _.chorus.process(this.cells[1], this.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("chorus", ChorusNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function ClipNode(_args) {
        T.Object.call(this, 2, _args);

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
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = cellL.length;
            var min = _.min, max = _.max;
            var value;

            if (_.ar) {
                fn.inputSignalAR(this);
                for (i = 0; i < imax; ++i) {
                    value = cellL[i];
                    if (value < min) {
                        value = min;
                    } else if (value > max) {
                        value = max;
                    }
                    cellL[i] = value;
                    value = cellR[i];
                    if (value < min) {
                        value = min;
                    } else if (value > max) {
                        value = max;
                    }
                    cellR[i] = value;
                }
                fn.outputSignalAR(this);
            } else {
                value = fn.inputSignalKR(this);
                if (value < min) {
                    value = min;
                } else if (value > max) {
                    value = max;
                }
                this.cells[0][0] = value;
                fn.outputSignalKR(this);
            }
        }
        return this;
    };

    fn.register("clip", ClipNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var Compressor = T.modules.Compressor;

    function CompressorNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.prevThresh = -24;
        _.prevKnee   =  30;
        _.prevRatio  =  12;
        _.thresh = T(_.prevThresh);
        _.knee   = T(_.prevKnee);
        _.ratio  = T(_.prevRatio);
        _.postGain  = 6;
        _.reduction = 0;
        _.attack = 3;
        _.release = 25;

        _.comp = new Compressor(_.samplerate);
        _.comp.dbPostGain = _.postGain;
        _.comp.setAttackTime(_.attack * 0.001);
        _.comp.setReleaseTime(_.release * 0.001);
        _.comp.setPreDelayTime(6);
        _.comp.setParams(_.prevThresh, _.prevKnee, _.prevRatio);
    }
    fn.extend(CompressorNode);

    var $ = CompressorNode.prototype;

    Object.defineProperties($, {
        thresh: {
            set: function(value) {
                this._.thresh = T(value);
            },
            get: function() {
                return this._.thresh;
            }
        },
        thre: {
            set: function(value) {
                this._.thresh = T(value);
            },
            get: function() {
                return this._.thre;
            }
        },
        knee: {
            set: function(value) {
                this._.kne = T(value);
            },
            get: function() {
                return this._.knee;
            }
        },
        ratio: {
            set: function(value) {
                this._.ratio = T(value);
            },
            get: function() {
                return this._.ratio;
            }
        },
        gain: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.comp.dbPostGain = value;
                }
            },
            get: function() {
                return this._.comp.dbPostGain;
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
                    this._.comp.setAttackTime(value * 0.001);
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
                }
                if (typeof value === "number") {
                    value = (value < 0) ? 0 : (1000 < value) ? 1000 : value;
                    this._.release = value;
                    this._.comp.setReleaseTime(value * 0.001);
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

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var thresh = _.thresh.process(tickID).cells[0][0];
            var knee   = _.knee.process(tickID).cells[0][0];
            var ratio  = _.ratio.process(tickID).cells[0][0];
            if (_.prevThresh !== thresh || _.prevKnee !== knee || _.prevRatio !== ratio) {
                _.prevThresh = thresh;
                _.prevKnee   = knee;
                _.prevRatio  = ratio;
                _.comp.setParams(thresh, knee, ratio);
            }

            if (!_.bypassed) {
                _.comp.process(this.cells[1], this.cells[2]);
                _.reduction = _.comp.meteringGain;
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("comp", CompressorNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var StereoDelay = T.modules.StereoDelay;

    function DelayNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.time  = T(100);
        _.fb    = T(0.2);
        _.cross = T(false);
        _.mix   = 0.33;

        _.delay = new StereoDelay(_.samplerate);
    }
    fn.extend(DelayNode);

    var $ = DelayNode.prototype;

    Object.defineProperties($, {
        time: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                this._.time = T(value);
            },
            get: function() {
                return this._.time;
            }
        },
        fb: {
            set: function(value) {
                this._.fb = T(value);
            },
            get: function() {
                return this._.fb;
            }
        },
        cross: {
            set: function(value) {
                this._.cross = T(value);
            },
            get: function() {
                return this._.cross;
            }
        },
        mix: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.mix = value;
                }
            },
            get: function() {
                return this._.mix;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var time  = _.time.process(tickID).cells[0][0];
            var fb    = _.fb.process(tickID).cells[0][0];
            var cross = _.cross.process(tickID).cells[0][0] !== 0;
            var mix   = _.mix;

            if (_.prevTime !== time || _.prevFb !== fb || _.prevCross !== cross || _.prevMix !== mix) {
                _.prevTime  = time;
                _.prevFb    = fb;
                _.prevCross = cross;
                _.prevMix   = mix;
                _.delay.setParams(time, fb, cross, mix);
            }

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                _.delay.process(this.cells[1], this.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("delay", DelayNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function DistNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.pre  = T( 60);
        _.post = T(-18);
        _.x1L = _.x2L = _.y1L = _.y2L = 0;
        _.x1R = _.x2R = _.y1R = _.y2R = 0;
        _.b0 = _.b1 = _.b2 = _.a1 = _.a2 = 0;
        _.cutoff = 0;
        _.Q = 1;
        _.preScale = 0;
        _.postScale = 0;
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
                this._.pre = T(value);
            },
            get: function() {
                return this._.pre;
            }
        },
        post: {
            set: function(value) {
                this._.post = T(value);
            },
            get: function() {
                return this._.post;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var preGain  = -_.pre.process(tickID).cells[0][0];
            var postGain = -_.post.process(tickID).cells[0][0];

            if (_.prevPreGain !== preGain || _.prevPostGain !== postGain) {
                _.prevPreGain  = preGain;
                _.prevPostGain = postGain;
                _.preScale  = Math.pow(10, -preGain  * 0.05);
                _.postScale = Math.pow(10, -postGain * 0.05);
            }

            if (!_.bypassed) {
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var preScale  = _.preScale;
                var postScale = _.postScale;
                var i, imax, value, x0, y0;

                if (_.cutoff) {
                    if (_.prevCutoff !== _.cutoff) {
                        _.prevCutoff = _.cutoff;
                        lowpass_params(_);
                    }

                    var x1L = _.x1L, x2L = _.x2L, y1L = _.y1L, y2L = _.y2L;
                    var x1R = _.x1R, x2R = _.x2R, y1R = _.y1R, y2R = _.y2R;
                    var b0 = _.b0, b1 = _.b1, b2 = _.b2, a1 = _.a1, a2 = _.a2;

                    for (i = 0, imax = cellL.length; i < imax; ++i) {
                        x0 = cellL[i] * preScale;
                        y0 = b0 * x0 + b1 * x1L + b2 * x2L - a1 * y1L - a2 * y2L;
                        value = y0 * postScale;
                        if (value < -1) {
                            value = -1;
                        } else if (value > 1) {
                            value = 1;
                        }
                        cellL[i] = value;
                        x2L = x1L; x1L = x0; y2L = y1L; y1L = y0;

                        x0 = cellR[i] * preScale;
                        y0 = b0 * x0 + b1 * x1R + b2 * x2R - a1 * y1R - a2 * y2R;
                        value = y0 * postScale;
                        if (value < -1) {
                            value = -1;
                        } else if (value > 1) {
                            value = 1;
                        }
                        cellR[i] = value;
                        x2R = x1R; x1R = x0; y2R = y1R; y1R = y0;
                    }

                    _.x1L = x1L; _.x2L = x2L; _.y1L = y1L; _.y2L = y2L;
                    _.x1R = x1R; _.x2R = x2R; _.y1R = y1R; _.y2R = y2R;
                } else {
                    for (i = 0, imax = cellL.length; i < imax; ++i) {
                        value = cellL[i] * preScale * postScale;
                        if (value < -1) {
                            value = -1;
                        } else if (value > 1) {
                            value = 1;
                        }
                        cellL[i] = value;

                        value = cellR[i] * preScale * postScale;
                        if (value < -1) {
                            value = -1;
                        } else if (value > 1) {
                            value = 1;
                        }
                        cellR[i] = value;
                    }
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    var lowpass_params = function(_) {
        var w0 = 2 * Math.PI * _.cutoff / _.samplerate;
        var cos = Math.cos(w0);
        var sin = Math.sin(w0);
        var alpha = sin / (2 * _.Q);

        var ia0 = 1 / (1 + alpha);
        _.b0 =  (1 - cos) * 0.5 * ia0;
        _.b1 =   1 - cos * ia0;
        _.b2 =  (1 - cos) * 0.5 * ia0;
        _.a1 =  -2 * cos * ia0;
        _.a2 =   1 - alpha * ia0;
    };

    fn.register("dist", DistNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function DivNode(_args) {
        T.Object.call(this, 2, _args);
        this._.ar = false;
    }
    fn.extend(DivNode);

    var $ = DivNode.prototype;

    $.process = function(tickID) {
            var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var cell  = this.cells[0];
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = nodes.length;
            var j, jmax = cell.length;
            var tmp, tmpL, tmpR, div;

            if (_.ar) {
                if (nodes.length > 0) {
                    nodes[0].process(tickID);
                    tmpL = nodes[0].cells[1];
                    tmpR = nodes[0].cells[2];
                    cellL.set(tmpL);
                    cellR.set(tmpR);
                    for (i = 1; i < imax; ++i) {
                        nodes[i].process(tickID);
                        tmpL = nodes[i].cells[1];
                        tmpR = nodes[i].cells[2];
                        for (j = 0; j < jmax; ++j) {
                            div = tmpL[j];
                            cellL[j] = (div === 0) ? 0 : cellL[j] / div;
                            div = tmpR[j];
                            cellR[j] = (div === 0) ? 0 : cellR[j] / div;
                        }
                    }
                } else {
                    for (j = 0; j < jmax; ++j) {
                        cellL[j] = cellR[i] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0][0];
                    for (i = 1; i < imax; ++i) {
                        div = nodes[i].process(tickID).cells[0][0];
                        tmp = (div === 0) ? 0 : tmp / div;
                    }
                } else {
                    tmp = 0;
                }
                cell[0] = tmp;
                fn.outputSignalKR(this);
            }
        }

        return this;
    };

    fn.register("/", DivNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var Envelope  = T.modules.Envelope;
    var isDictionary = fn.isDictionary;

    function EnvNode(_args) {
        T.Object.call(this, 2, _args);
        var _ = this._;
        _.env = new Envelope(_.samplerate);
        _.env.setStep(_.cellsize);
        _.tmp = new fn.SignalArray(_.cellsize);
        _.ar = false;
        _.plotFlush = true;
        _.onended = make_onended(this);
        this.on("ar", onar);
    }
    fn.extend(EnvNode);

    var onar = function(value) {
        this._.env.setStep((value) ? 1 : this._.cellsize);
    };

    var make_onended = function(self) {
        return function() {
            self._.emit("ended");
        };
    };

    var $ = EnvNode.prototype;

    Object.defineProperties($, {
        table: {
            set: function(value) {
                if (Array.isArray(value)) {
                    setTable.call(this, value);
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
        var instance = fn.clone(this);
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

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = _.cellsize;

            if (this.nodes.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = 0; i < imax; ++i) {
                    cellL[i] = cellR[i] = 1;
                }
            }

            var value, emit = null;
            if (_.ar) {
                var tmp = _.tmp;
                _.env.process(tmp);
                for (i = 0; i < imax; ++i) {
                    cellL[i] *= tmp[i];
                    cellR[i] *= tmp[i];
                }
                emit = _.env.emit;
            } else {
                value = _.env.next();
                for (i = 0; i < imax; ++i) {
                    cellL[i] *= value;
                    cellR[i] *= value;
                }
                emit = _.env.emit;
            }

            fn.outputSignalAR(this);

            if (emit) {
                if (emit === "ended") {
                    fn.nextTick(_.onended);
                } else {
                    this._.emit(emit, _.value);
                }
            }
        }

        return this;
    };

    var setTable = function(list) {
        var env = this._.env;

        var table = [list[0] || ZERO];

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
                curveType  = Envelope.CurveTypeCurve;
            } else {
                curveType  = Envelope.CurveTypeDict[curveType] || null;
                curveValue = 0;
            }
            table.push([value, time, curveType, curveValue]);
        }

        env.setTable(table);
    };

    var super_plot = T.Object.prototype.plot;

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
            var samples = (totalDuration * 0.001 * this._.samplerate)|0;
            var i, imax;

            samples /= data.length;
            env.setStep(samples);
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
        var a  = envValue(opts,   10,   10, "a" , "attackTime" , timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "releaseTime", timevalue);
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

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var FFT = T.modules.FFT;
    var Biquad = T.modules.Biquad;
    var PLOT_LOW_FREQ = 20;
    var PARAM_NAMES = {
        hpf:0, lf:1, lmf:2, mf:3, hmf:4, hf:5, lpf:6
    };

    function EQNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.biquads = new Array(7);

        _.plotBefore = plotBefore;
        _.plotRange  = [-18, 18];
        _.plotFlush  = true;
    }
    fn.extend(EQNode);

    var plotBefore = function(context, x, y, width, height) {
        context.lineWidth = 1;
        context.strokeStyle = "rgb(192, 192, 192)";
        var nyquist = this._.samplerate * 0.5;
        for (var i = 1; i <= 10; ++i) {
            for (var j = 1; j <= 4; j++) {
                var f = i * Math.pow(10, j);
                if (f <= PLOT_LOW_FREQ || nyquist <= f) {
                    continue;
                }
                context.beginPath();
                var _x = (Math.log(f/PLOT_LOW_FREQ)) / (Math.log(nyquist/PLOT_LOW_FREQ));
                _x = ((_x * width + x)|0) + 0.5;
                context.moveTo(_x, y);
                context.lineTo(_x, y + height);
                context.stroke();
            }
        }

        var h = height / 6;
        for (i = 1; i < 6; i++) {
            context.beginPath();
            var _y = ((y + (i * h))|0) + 0.5;
            context.moveTo(x, _y);
            context.lineTo(x + width, _y);
            context.stroke();
        }
    };

    var $ = EQNode.prototype;

    Object.defineProperties($, {
        params: {
            set: function(value) {
                if (typeof value === "object") {
                    var keys = Object.keys(value);
                    for (var i = 0, imax = keys.length; i < imax; ++i) {
                        var items = value[keys[i]];
                        if (Array.isArray(items)) {
                            this.setParams(keys[i], items[0], items[1], items[2]);
                        } else {
                            this.setParams(keys[i]);
                        }
                    }
                }
            }
        }
    });

    $.setParams = function(index, freq, Q, gain) {
        var _ = this._;
        if (typeof index === "string") {
            index = PARAM_NAMES[index];
        }
        if (0 <= index && index < _.biquads.length) {
            index |= 0;
            if (typeof freq === "number" && typeof Q === "number") {
                if (typeof gain !== "number") {
                    gain = 0;
                }
                var biquad = _.biquads[index];
                if (!biquad) {
                    biquad = _.biquads[index] = new Biquad(_.samplerate);
                    switch (index) {
                    case 0:
                        biquad.setType("highpass");
                        break;
                    case _.biquads.length - 1:
                        biquad.setType("lowpass");
                        break;
                    default:
                        biquad.setType("peaking");
                        break;
                    }
                }
                biquad.setParams(freq, Q, gain);
            } else {
                _.biquads[index] = undefined;
            }
            _.plotFlush = true;
        }
        return this;
    };

    $.getParams = function(index) {
        var _ = this._;
        var biquad = _.biquads[index|0];
        if (biquad) {
            return {freq:biquad.frequency, Q:biquad.Q, gain:biquad.gain};
        }
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var biquads = _.biquads;
                for (var i = 0, imax = biquads.length; i < imax; ++i) {
                    if (biquads[i]) {
                        biquads[i].process(cellL, cellR);
                    }
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    var fft = new FFT(2048);
    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        if (this._.plotFlush) {
            var _ = this._;
            var impluse = new Float32Array(fft.length);
            impluse[0] = 1;
            for (var i = 0, imax = _.biquads.length; i < imax; ++i) {
                var params = this.getParams(i);
                if (params) {
                    var biquad = new Biquad(_.samplerate);
                    if (i === 0) {
                        biquad.setType("highpass");
                    } else if (i === imax - 1) {
                        biquad.setType("lowpass");
                    } else {
                        biquad.setType("peaking");
                    }
                    biquad.setParams(params.freq, params.Q, params.gain);
                    biquad.process(impluse, impluse);
                }
            }

            fft.forward(impluse);

            var size = 512;
            var data = new Float32Array(size);
            var nyquist  = _.samplerate * 0.5;
            var spectrum = new Float32Array(size);
            var j, f, index, delta, x0, x1, xx;

            fft.getFrequencyData(spectrum);
            for (i = 0; i < size; ++i) {
                f = Math.pow(nyquist / PLOT_LOW_FREQ, i / size) * PLOT_LOW_FREQ;
                j = f / (nyquist / spectrum.length);
                index = j|0;
                delta = j - index;
                if (index === 0) {
                    x1 = x0 = xx = spectrum[index];
                } else {
                    x0 = spectrum[index - 1];
                    x1 = spectrum[index];
                    xx = ((1.0 - delta) * x0 + delta * x1);
                }
                data[i] = xx;
            }
            this._.plotData  = data;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("eq", EQNode);

})(timbre);
(function(T) {
    "use strict";

    var fn  = T.fn;
    var FFT = T.modules.FFT;

    function FFTNode(_args) {
        T.Object.call(this, 2, _args);
        fn.listener(this);
        fn.fixAR(this);

        this.real = new T.ChannelObject(this);
        this.imag = new T.ChannelObject(this);
        this.cells[3] = this.real.cell;
        this.cells[4] = this.imag.cell;

        var _ = this._;
        _.fft = new FFT(_.cellsize * 2);
        _.fftCell  = new fn.SignalArray(_.fft.length);
        _.prevCell = new fn.SignalArray(_.cellsize);
        _.freqs    = new fn.SignalArray(_.fft.length>>1);

        _.plotFlush = true;
        _.plotRange = [0, 32];
        _.plotBarStyle = true;
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
                return this._.fft.getFrequencyData(this._.freqs);
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);

            var cell = this.cells[0];
            var cellsize = _.cellsize;

            _.fftCell.set(_.prevCell);
            _.fftCell.set(cell, cellsize);
            _.fft.forward(_.fftCell);
            _.prevCell.set(cell);
            _.plotFlush = true;

            this.cells[3].set(_.fft.real.subarray(0, cellsize));
            this.cells[4].set(_.fft.imag.subarray(0, cellsize));
        }

        return this;
    };

    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        if (this._.plotFlush) {
            this._.plotData  = this.spectrum;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("fft", FFTNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function FNoiseNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        _.freq = T(440);
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
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;
        var cell = this.cells[0];

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var lastValue = _.lastValue;
            var phase     = _.phase;
            var phaseStep = _.freq.process(tickID).cells[0][0] / _.samplerate;
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

        return this;
    };

    fn.register("fnoise", FNoiseNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    var GateChannelNode = (function() {
        function GateChannelNode(parent) {
            T.Object.call(this, 2, []);
            fn.fixAR(this);
            this._.parent = parent;
        }
        fn.extend(GateChannelNode);

        GateChannelNode.prototype.process = function(tickID) {
            if (this.tickID !== tickID) {
                this.tickID = tickID;
                this._.parent.process(tickID);
            }
            return this;
        };

        return GateChannelNode;
    })();

    function GateNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        this._.selected = 0;
        this._.outputs  = [];
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
                    for (var i = 0, imax = outputs.length; i < imax; ++i) {
                        if (outputs[i]) {
                            outputs[i].cells[0].set(fn.emptycell);
                            outputs[i].cells[1].set(fn.emptycell);
                            outputs[i].cells[2].set(fn.emptycell);
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
            _.outputs[index] = output = new GateChannelNode(this);
        }
        return output;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);

            var output = _.outputs[_.selected];
            if (output) {
                output.cells[0].set(this.cells[0]);
                output.cells[1].set(this.cells[1]);
                output.cells[2].set(this.cells[2]);
            }
        }

        return this;
    };

    fn.register("gate", GateNode);

})(timbre);
(function(T) {
    "use strict";

    var fn  = T.fn;
    var FFT = T.modules.FFT;

    function IFFTNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        _.fft = new FFT(_.cellsize * 2);
        _.fftCell    = new fn.SignalArray(this._.fft.length);
        _.realBuffer = new fn.SignalArray(this._.fft.length);
        _.imagBuffer = new fn.SignalArray(this._.fft.length);
    }
    fn.extend(IFFTNode);

    var $ = IFFTNode.prototype;

    Object.defineProperties($, {
        real: {
            set: function(value) {
                this._.real = T(value);
            },
            get: function() {
                return this._.real;
            }
        },
        imag: {
            set: function(value) {
                this._.imag = T(value);
            },
            get: function() {
                return this._.imag;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            if (_.real && _.imag) {
                var cell = this.cells[0];
                var real = _.realBuffer;
                var imag = _.imagBuffer;
                var _real = _.real.process(tickID).cells[0];
                var _imag = _.imag.process(tickID).cells[0];

                real.set(_real);
                imag.set(_imag);

                cell.set(_.fft.inverse(real, imag).subarray(0, _.cellsize));

                fn.outputSignalAR(this);
            }
        }

        return this;
    };

    fn.register("ifft", IFFTNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function IntervalNode(_args) {
        T.Object.call(this, 1, _args);
        fn.timer(this);
        fn.fixKR(this);

        var _ = this._;
        _.interval = T(1000);
        _.count = 0;
        _.delay   = 0;
        _.timeout = Infinity;
        _.currentTime = 0;
        _.delaySamples = 0;
        _.countSamples = 0;
        _.onended = fn.make_onended(this);

        this.on("start", onstart);
    }
    fn.extend(IntervalNode);

    var onstart = function() {
        var _ = this._;
        this.playbackState = fn.PLAYING_STATE;
        _.delaySamples = (_.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });

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
                this._.interval = T(value);
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
                    this._.delaySamples = (this._.samplerate * (value * 0.001))|0;
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
        this.playbackState = fn.PLAYING_STATE;
        _.delaySamples = (_.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
        _.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];

        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            if (_.delaySamples > 0) {
                _.delaySamples -= cell.length;
            }

            var interval = _.interval.process(tickID).cells[0][0];

            if (_.delaySamples <= 0) {
                _.countSamples -= cell.length;
                if (_.countSamples <= 0) {
                    _.countSamples += (_.samplerate * interval * 0.001)|0;
                    var nodes = this.nodes;
                    var count  = _.count;
                    var x = count * _.mul + _.add;
                    for (var j = 0, jmax = cell.length; j < jmax; ++j) {
                        cell[j] = x;
                    }
                    for (var i = 0, imax = nodes.length; i < imax; ++i) {
                        nodes[i].bang(count);
                    }
                    _.count += 1;
                }
            }
            _.currentTime += fn.currentTimeIncr;

            if (_.currentTime >= _.timeout) {
                fn.nextTick(_.onended);
            }
        }
        return this;
    };

    fn.register("interval", IntervalNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function LagNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        var _ = this._;
        var bits = Math.ceil(Math.log(_.samplerate) * Math.LOG2E);
        _.buffersize = 1 << bits;
        _.buffermask = _.buffersize - 1;
        _.buffer = new fn.SignalArray(_.buffersize);
        _.time = 0;
        _.readIndex  = 0;
        _.writeIndex = 0;
    }
    fn.extend(LagNode);

    var $ = LagNode.prototype;

    Object.defineProperties($, {
        time: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value > 0) {
                    var _ = this._;
                    _.time = value;
                    var offset = (value * 0.001 * _.samplerate)|0;
                    if (offset > _.buffermask) {
                        offset = _.buffermask;
                    }
                    _.writeIndex = (_.readIndex + offset) & _.buffermask;
                }
            },
            get: function() {
                return this._.time;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            var cell = this.cells[0];
            var buffer = _.buffer;
            var mask   = _.buffermask;
            var readIndex  = _.readIndex;
            var writeIndex = _.writeIndex;
            var i, imax = cell.length;

            for (i = 0; i < imax; ++i) {
                buffer[writeIndex] = cell[i];
                cell[i] = buffer[readIndex];

                readIndex  += 1;
                writeIndex = (writeIndex + 1) & mask;
            }

            _.readIndex  = readIndex & mask;
            _.writeIndex = writeIndex;

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("lag", LagNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function MapNode(_args) {
        T.Object.call(this, 1, _args);
        var _ = this._;
        _.input  = 0;
        _.value = 0;
        _.prev   = null;
        _.ar     = false;
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
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var len = this.nodes.length;
            var i, imax = cell.length;

            if (_.ar && len) {
                fn.inputSignalAR(this);
                var map = _.map;
                if (map) {
                    for (i = 0; i < imax; ++i) {
                        cell[i] = map(cell[i]);
                    }
                }
                _.value = cell[imax-1];
                fn.outputSignalAR(this);
            } else {
                var input = len ? fn.inputSignalKR(this) : _.input;
                if (_.map && _.prev !== input) {
                    _.prev = input;
                    _.value = _.map(input);
                }
                var value = _.value * _.mul + _.add;
                for (i = 0; i < imax; ++i) {
                    cell[i] = value;
                }
            }
        }

        return this;
    };

    fn.register("map", MapNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function MaxNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(MaxNode);

    var $ = MaxNode.prototype;

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var i, imax = nodes.length;
            var j, jmax = cell.length;
            var tmp, val;

            if (_.ar) {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0];
                    cell.set(tmp);
                    for (i = 1; i < imax; ++i) {
                        tmp = nodes[i].process(tickID).cells[0];
                        for (j = 0; j < jmax; ++j) {
                            val = tmp[j];
                            if (cell[j] < val) {
                                cell[j] = val;
                            }
                        }
                    }
                } else {
                    for (j = 0; j < jmax; ++j) {
                        cell[j] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0][0];
                    for (i = 1; i < imax; ++i) {
                        val = nodes[i].process(tickID).cells[0][0];
                        if (tmp < val) {
                            tmp = val;
                        }
                    }
                } else {
                    tmp = 0;
                }
                cell[0] = tmp;
                fn.outputSignalKR(this);
            }
        }

        return this;
    };

    fn.register("max", MaxNode);

})(timbre);
(function(T) {
    "use strict";

    if (T.envtype !== "browser") {
        return;
    }

    var fn = T.fn;
    var BUFFER_SIZE = 4096;
    var BUFFER_MASK = BUFFER_SIZE - 1;

    function MediaStreamNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.src = _.func = null;
        _.bufferL = new fn.SignalArray(BUFFER_SIZE);
        _.bufferR = new fn.SignalArray(BUFFER_SIZE);
        _.readIndex  = 0;
        _.writeIndex = 0;
        _.totalRead  = 0;
        _.totalWrite = 0;
    }
    fn.extend(MediaStreamNode);

    var $ = MediaStreamNode.prototype;

    $.listen = function(audio) {
        var _impl = impl[T.env];
        if (_impl) {
            _impl.set.call(this, audio);
            _impl.listen.call(this);
        }
    };

    $.unlisten = function() {
        var _impl = impl[T.env];
        if (_impl) {
            _impl.unlisten.call(this);
        }

        this.cells[0].set(fn.emptycell);
        this.cells[1].set(fn.emptycell);
        this.cells[2].set(fn.emptycell);

        var _ = this._;
        var bufferL = _.bufferL, bufferR = _.bufferR;
        for (var i = 0, imax = bufferL.length; i < imax; ++i) {
            bufferL[i] = bufferR[i] = 0;
        }
    };

    $.process = function(tickID) {
        var _ = this._;

        if (_.src === null) {
            return this;
        }

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellsize = _.cellsize;
            if (_.totalWrite > _.totalRead + cellsize) {
                var begin = _.readIndex;
                var end   = begin + cellsize;
                this.cells[1].set(_.bufferL.subarray(begin, end));
                this.cells[2].set(_.bufferR.subarray(begin, end));
                _.readIndex = end & BUFFER_MASK;
                _.totalRead += cellsize;
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    var impl = {};
    impl.webkit = {
        set: function(src) {
            var _ = this._;
            /*global HTMLMediaElement:true */
            if (src instanceof HTMLMediaElement) {
                var context = fn._audioContext;
                _.src = context.createMediaElementSource(src);
            }
            /*global HTMLMediaElement:false */
        },
        listen: function() {
            var _ = this._;
            var context = fn._audioContext;
            _.gain = context.createGainNode();
            _.gain.gain.value = 0;
            _.node = context.createJavaScriptNode(1024, 2, 2);
            _.node.onaudioprocess = onaudioprocess(this);
            _.src.connect(_.node);
            _.node.connect(_.gain);
            _.gain.connect(context.destination);
        },
        unlisten: function() {
            var _ = this._;
            if (_.src) {
                _.src.disconnect();
            }
            if (_.gain) {
                _.gain.disconnect();
            }
            if (_.node) {
                _.node.disconnect();
            }
        }
    };
    var onaudioprocess = function(self) {
        return function(e) {
            var _ = self._;
            var ins = e.inputBuffer;
            var length = ins.length;
            var writeIndex = _.writeIndex;

            _.bufferL.set(ins.getChannelData(0), writeIndex);
            _.bufferR.set(ins.getChannelData(1), writeIndex);
            _.writeIndex = (writeIndex + length) & BUFFER_MASK;
            _.totalWrite += length;
        };
    };

    impl.moz = {
        set: function(src) {
            var _ = this._;
            /*global HTMLAudioElement:true */
            if (src instanceof HTMLAudioElement) {
                _.src = src;
                _.istep = _.samplerate / src.mozSampleRate;
            }
            /*global HTMLAudioElement:false */
        },
        listen: function() {
            var _ = this._;
            var o0 = _.bufferL;
            var o1 = _.bufferR;
            var prev0 = 0, prev1 = 0;
            if (_.src.mozChannels === 2) {
                _.x = 0;
                _.func = function(e) {
                    var writeIndex = _.writeIndex;
                    var totalWrite = _.totalWrite;
                    var samples = e.frameBuffer;
                    var x, istep = _.istep;
                    var i, imax = samples.length;
                    x = _.x;
                    for (i = 0; i < imax; i+= 2) {
                        x += istep;
                        while (x > 0) {
                            o0[writeIndex] = (samples[i  ] + prev0) * 0.5;
                            o1[writeIndex] = (samples[i+1] + prev1) * 0.5;
                            writeIndex = (writeIndex + 1) & BUFFER_MASK;
                            ++totalWrite;
                            x -= 1;
                        }
                        prev0 = samples[i  ];
                        prev1 = samples[i+1];
                    }
                    _.x = x;
                    _.writeIndex = writeIndex;
                    _.totalWrite = totalWrite;
                };
            } else {
                _.x = 0;
                _.func = function(e) {
                    var writeIndex = _.writeIndex;
                    var totalWrite = _.totalWrite;
                    var samples = e.frameBuffer;
                    var x, istep = _.istep;
                    var i, imax = samples.length;
                    x = _.x;
                    for (i = 0; i < imax; ++i) {
                        x += istep;
                        while (x >= 0) {
                            o0[writeIndex] = o1[writeIndex] = (samples[i] + prev0) * 0.5;
                            writeIndex = (writeIndex + 1) & BUFFER_MASK;
                            ++totalWrite;
                            x -= 1;
                        }
                        prev0 = samples[i];
                    }
                    _.x = x;
                    _.writeIndex = writeIndex;
                    _.totalWrite = totalWrite;
                };
            }
            _.src.addEventListener("MozAudioAvailable", _.func);
        },
        unlisten: function() {
            var _ = this._;
            if (_.func) {
                _.src.removeEventListener("MozAudioAvailable", _.func);
                _.func = null;
            }
        }
    };

    fn.register("mediastream", MediaStreamNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function MidiCpsNode(_args) {
        T.Object.call(this, 1, _args);
        var _ = this._;
        _.midi = 0;
        _.value = 0;
        _.prev  = null;
        _.a4    = 440;
        _.ar    = false;
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
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cell = this.cells[0];
            var len  = this.nodes.length;
            var i, imax = cell.length;

            if (_.ar && len) {
                fn.inputSignalAR(this);
                var a4 = _.a4;
                for (i = 0; i < imax; ++i) {
                    cell[i] = a4 * Math.pow(2, (cell[i] - 69) / 12);
                }
                _.value = cell[imax-1];
                fn.outputSignalAR(this);
            } else {
                var input = (len) ? fn.inputSignalKR(this) : _.midi;
                if (_.prev !== input) {
                    _.prev = input;
                    _.value = _.a4 * Math.pow(2, (input - 69) / 12);
                }
                cell[0] = _.value;
                fn.outputSignalKR(this);
            }
        }

        return this;
    };

    fn.register("midicps", MidiCpsNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function MidiRatioNode(_args) {
        T.Object.call(this, 1, _args);
        var _ = this._;
        _.midi = 0;
        _.value = 0;
        _.prev  = null;
        _.range = 12;
        _.ar    = false;
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
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var len = this.nodes.length;
            var i, imax = cell.length;

            if (_.ar && len) {
                fn.inputSignalAR(this);
                var range = _.range;
                for (i = 0; i < imax; ++i) {
                    cell[i] = Math.pow(2, cell[i] / range);
                }
                _.value = cell[imax-1];
                fn.outputSignalAR(this);
            } else {
                var input = (this.nodes.length) ? fn.inputSignalKR(this) : _.midi;
                if (_.prev !== input) {
                    _.prev = input;
                    _.value = Math.pow(2, input / _.range);
                }
                var value = _.value * _.mul + _.add;
                for (i = 0; i < imax; ++i) {
                    cell[i] = value;
                }
            }
        }

        return this;
    };

    fn.register("midiratio", MidiRatioNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function MinNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(MinNode);

    var $ = MinNode.prototype;

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var i, imax = nodes.length;
            var j, jmax = cell.length;
            var tmp, val;

            if (_.ar) {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0];
                    cell.set(tmp);
                    for (i = 1; i < imax; ++i) {
                        tmp = nodes[i].process(tickID).cells[0];
                        for (j = 0; j < jmax; ++j) {
                            val = tmp[j];
                            if (cell[j] > val) {
                                cell[j] = val;
                            }
                        }
                    }
                } else {
                    for (j = 0; j < jmax; ++j) {
                        cell[j] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0][0];
                    for (i = 1; i < imax; ++i) {
                        val = nodes[i].process(tickID).cells[0][0];
                        if (tmp > val) {
                            tmp = val;
                        }
                    }
                } else {
                    tmp = 0;
                }
                cell[0] = tmp;
                fn.outputSignalKR(this);
            }
        }

        return this;
    };

    fn.register("min", MinNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function MML(_args) {
        T.Object.call(this, 0, _args);
        fn.timer(this);
        fn.fixKR(this);

        var _ = this._;
        _.tracks  = [];
        _.onended = fn.make_onended(this);
        _.currentTime = 0;

        this.on("start", onstart);
    }
    fn.extend(MML);

    var onstart = function() {
        var self = this, _ = this._;
        var mml  = _.mml;
        if (typeof mml === "string") {
            mml = [mml];
        }
        _.tracks = mml.map(function(mml, i) {
            return new MMLTrack(self, i, mml);
        });
        _.currentTime = 0;
        this.playbackState = fn.PLAYING_STATE;
    };
    Object.defineProperty(onstart, "unremoved", {
        value:true, writable:false
    });

    var $ = MML.prototype;

    Object.defineProperties($, {
        mml: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string" || Array.isArray(value)) {
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

    $.on = $.addListener = function(type, listener) {
        if (type === "mml") {
            type = "data";
            console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener.");
        }
        this._.events.on(type, listener);
        return this;
    };

    $.once = function(type, listener) {
        if (type === "mml") {
            type = "data";
            console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener.");
        }
        this._.events.once(type, listener);
        return this;
    };

    $.off = $.removeListener = function(type, listener) {
        if (type === "mml") {
            type = "data";
            console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener.");
        }
        this._.events.off(type, listener);
        return this;
    };

    $.removeAllListeners = function(type) {
        if (type === "mml") {
            console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener.");
            type = "data";
        }
        this._.events.removeAllListeners(type);
        return this;
    };

    $.listeners = function(type) {
        if (type === "mml") {
            console.warn("A 'mml' event listener was deprecated in ~v13.03.01. use 'data' event listener.");
            type = "data";
        }
        return this._.events.listeners(type);
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var i, imax;
            var tracks = _.tracks;

            for (i = 0, imax = tracks.length; i < imax; ++i) {
                tracks[i].process();
            }
            while (i--) {
                if (tracks[i].ended) {
                    tracks.splice(i, 1);
                }
            }
            if (tracks.length === 0) {
                fn.nextTick(_.onended);
            }
            _.currentTime += fn.currentTimeIncr;
        }

        return this;
    };

    fn.register("mml", MML);

    var MMLTrack = (function() {
        function MMLTrack(sequencer, trackNum, mml) {
            var _ = this._ = {};
            _.sequencer = sequencer;
            _.trackNum  = trackNum;
            _.commands  = compile(mml);
            _.status = {t:120, l:4, o:4, v:12, q:6, dot:0, tie:false};
            _.index    = 0;
            _.queue    = [];
            _.currentTime = 0;
            _.queueTime   = 0;
            _.segnoIndex  = -1;
            _.loopStack   = [];
            _.prevNote = 0;
            _.remain   = Infinity;
            this.ended = false;
            sched(this);
        }

        var EOF     = 0;
        var NOTEON  = 1;
        var NOTEOFF = 2;
        var COMMAND = 3;

        MMLTrack.prototype.process = function() {
            var _ = this._;
            var sequencer = _.sequencer;
            var trackNum  = _.trackNum;
            var queue  = _.queue;
            var eof = false;

            if (queue.length) {
                while (queue[0][0] <= _.currentTime) {
                    var nextItem = _.queue.shift();
                    switch (nextItem[1]) {
                    case NOTEON:
                        noteOn(sequencer, trackNum, nextItem[2], nextItem[3]);
                        _.remain = nextItem[4];
                        sched(this);
                        break;
                    case NOTEOFF:
                        noteOff(sequencer, trackNum, nextItem[2], nextItem[3]);
                        break;
                    case COMMAND:
                        command(sequencer, nextItem[2]);
                        break;
                    case EOF:
                        eof = true;
                        break;
                    }
                    if (queue.length === 0) {
                        break;
                    }
                }
            }
            _.remain -= fn.currentTimeIncr;
            if (eof) {
                this.ended = true;
            }
            _.currentTime += fn.currentTimeIncr;
        };

        var noteOn = function(sequencer, trackNum, noteNum, velocity) {
            var gen, i, imax;
            var nodes = sequencer.nodes;
            for (i = 0, imax = nodes.length; i < imax; ++i) {
                gen = nodes[i];
                if (gen.noteOn) {
                    gen.noteOn(noteNum, velocity);
                } else {
                    gen.bang();
                }
            }
            sequencer._.emit("data", "noteOn", {
                trackNum:trackNum, noteNum:noteNum, velocity:velocity
            });
        };

        var noteOff = function(sequencer, trackNum, noteNum, velocity) {
            var gen, i, imax;
            var nodes = sequencer.nodes;
            for (i = 0, imax = nodes.length; i < imax; ++i) {
                gen = nodes[i];
                if (gen.noteOff) {
                    gen.noteOff(noteNum, velocity);
                } else if (gen.release) {
                    gen.release();
                }
            }
            sequencer._.emit("data", "noteOff", {
                trackNum:trackNum, noteNum:noteNum, velocity:velocity
            });
        };

        var command = function(sequencer, cmd) {
            sequencer._.emit("data", "command", {
                command: cmd
            });
        };

        var sched = function(self) {
            var _ = self._;

            var sequencer = _.sequencer;
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
                case "@":
                    queue.push([queueTime, COMMAND, cmd.val]);
                    break;
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
                        queue.push([queueTime, NOTEON, val, vel, duration]);
                    }

                    if (len > 0) {
                        quantize = status.q / 8;
                        // noteOff
                        if (quantize < 1) {
                            _queueTime = queueTime + (duration * quantize);
                            queue.push([_queueTime, NOTEOFF, val, vel]);
                            for (i = 0, imax = pending.length; i < imax; ++i) {
                                queue.push([_queueTime, NOTEOFF, pending[i], vel]);
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
                case "EOF":
                    queue.push([queueTime, EOF]);
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
            commands.push({name:"EOF"});
            return commands;
        };

        var MMLCommands = [
            { re:/@(\d*)/g, func: function(m) {
                return {
                    name: "@",
                    val: m[1] || null
                };
            }},
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

        return MMLTrack;
    })();

})(timbre);
(function(T) {
    "use strict";

    var fn  = T.fn;

    function MonoNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(MonoNode);

    MonoNode.prototype.process = function(tickID) {
        var _ = this._;
        if (this.tickID !== tickID) {
            this.tickID = tickID;
            if (_.ar) {
                fn.inputSignalAR(this);
                fn.outputSignalAR(this);
            } else {
                this.cells[0][0] = fn.inputSignalKR(this);
                fn.outputSignalKR(this);
            }
        }
        return this;
    };
    fn.register("mono", MonoNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function MulNode(_args) {
        T.Object.call(this, 2, _args);
    }
    fn.extend(MulNode);

    var $ = MulNode.prototype;

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var cell  = this.cells[0];
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = nodes.length;
            var j, jmax = cell.length;
            var tmp, tmpL, tmpR;

            if (_.ar) {
                if (nodes.length > 0) {
                    nodes[0].process(tickID);
                    tmpL = nodes[0].cells[1];
                    tmpR = nodes[0].cells[2];
                    cellL.set(tmpL);
                    cellR.set(tmpR);
                    for (i = 1; i < imax; ++i) {
                        nodes[i].process(tickID);
                        tmpL = nodes[i].cells[1];
                        tmpR = nodes[i].cells[2];
                        for (j = 0; j < jmax; ++j) {
                            cellL[j] *= tmpL[j];
                            cellR[j] *= tmpR[j];
                        }
                    }
                } else {
                    for (j = 0; j < jmax; ++j) {
                        cellL[j] = cellR[j] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0][0];
                    for (i = 1; i < imax; ++i) {
                        tmp *= nodes[i].process(tickID).cells[0][0];
                    }
                } else {
                    tmp = 0;
                }
                cell[0] = tmp;
                fn.outputSignalKR(this);
            }
        }

        return this;
    };

    fn.register("*", MulNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function NDictNode(_args) {
        T.Object.call(this, 1, _args);

        var _ = this._;
        _.defaultValue = 0;
        _.index = 0;
        _.dict  = {};
        _.ar    = false;
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
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var len = this.nodes.length;
            var index, value;
            var dict = _.dict, defaultValue = _.defaultValue;
            var mul = _.mul, add = _.add;
            var i, imax = cell.length;

            if (_.ar && len) {

                fn.inputSignalAR(this);
                for (i = 0; i < imax; ++i) {
                    index = cell[i];
                    if (index < 0) {
                        index = (index - 0.5)|0;
                    } else {
                        index = (index + 0.5)|0;
                    }
                    cell[i] = (dict[index] || defaultValue) * mul + add;
                }
                fn.outputSignalAR(this);
            } else {
                index = (this.nodes.length) ? fn.inputSignalKR(this) : _.index;
                if (index < 0) {
                    index = (index - 0.5)|0;
                } else {
                    index = (index + 0.5)|0;
                }
                value = (dict[index] || defaultValue) * mul + add;
                for (i = 0; i < imax; ++i) {
                    cell[i] = value;
                }
            }
        }

        return this;
    };

    fn.register("ndict", NDictNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function NoiseNode(_args) {
        T.Object.call(this, 1, _args);
    }
    fn.extend(NoiseNode);

    var $ = NoiseNode.prototype;

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var mul = _.mul, add = _.add;
            var i, imax, x;

            if (_.ar) { // audio-rate
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (Math.random() * 2 - 1) * mul + add;
                }
            } else {    // control-rate
                x = (Math.random() * 2 + 1) * mul + add;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = x;
                }
            }
        }
        return this;
    };

    fn.register("noise", NoiseNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue  = T.timevalue;
    var Oscillator = T.modules.Oscillator;

    function OscNode(_args) {
        T.Object.call(this, 2, _args);

        var _ = this._;
        _.freq  = T(440);
        _.phase = T(0);
        _.osc = new Oscillator(_.samplerate);
        _.tmp = new fn.SignalArray(_.cellsize);
        _.osc.step = _.cellsize;

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
                this._.freq = T(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        phase: {
            set: function(value) {
                this._.phase = T(value);
                this._.osc.feedback = false;
            },
            get: function() {
                return this._.phase;
            }
        },
        fb: {
            set: function(value) {
                this._.phase = T(value);
                this._.osc.feedback = true;
            },
            get: function() {
                return this._.phase;
            }
        }
    });

    $.clone = function() {
        var instance = fn.clone(this);
        instance._.osc = this._.osc.clone();
        instance._.freq  = this._.freq;
        instance._.phase = this._.phase;
        return instance;
    };

    $.bang = function() {
        this._.osc.reset();
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = _.cellsize;

            if (this.nodes.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = 0; i < imax; ++i) {
                    cellL[i] = cellR[i] = 1;
                }
            }

            var osc = _.osc;
            var freq  = _.freq.process(tickID).cells[0];
            var phase = _.phase.process(tickID).cells[0];

            osc.frequency = freq[0];
            osc.phase     = phase[0];

            if (_.ar) {
                var tmp  = _.tmp;
                if (_.freq.isAr) {
                    if (_.phase.isAr) {
                        osc.processWithFreqAndPhaseArray(tmp, freq, phase);
                    } else {
                        osc.processWithFreqArray(tmp, freq);
                    }
                } else {
                    if (_.phase.isAr) {
                        osc.processWithPhaseArray(tmp, phase);
                    } else {
                        osc.process(tmp);
                    }
                }
                for (i = 0; i < imax; ++i) {
                    cellL[i] *= tmp[i];
                    cellR[i] *= tmp[i];
                }
            } else {
                var value = osc.next();
                for (i = 0; i < imax; ++i) {
                    cellL[i] *= value;
                    cellR[i] *= value;
                }
            }
            fn.outputSignalAR(this);
        }

        return this;
    };

    var plotBefore;
    if (T.envtype === "browser") {
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

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function PanNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.pos  = T(0);
        _.panL = 0.5;
        _.panR = 0.5;
    }
    fn.extend(PanNode);

    var $ = PanNode.prototype;

    Object.defineProperties($, {
        pos: {
            set: function(value) {
                this._.pos = T(value);
            },
            get: function() {
                return this._.pos;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var pos = _.pos.process(tickID).cells[0][0];
            if (_.prevPos !== pos) {
                var index = pos * 0.5 + 0.5;
                _.panL = 1 - pos;
                _.panR = _.prevPos = pos;
            }

            var nodes = this.nodes;
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = nodes.length;
            var j, jmax = cellL.length;
            var tmp;

            if (imax) {
                tmp = nodes[0].process(tickID).cells[0];
                for (j = 0; j < jmax; ++j) {
                    cellL[j] = cellR[j] = tmp[j];
                }
                for (i = 1; i < imax; ++i) {
                    tmp = nodes[i].process(tickID).cells[0];
                    for (j = 0; j < jmax; ++j) {
                        cellL[j] = (cellR[j] += tmp[j]);
                    }
                }

                var panL = _.panL;
                var panR = _.panR;
                for (j = 0; j < jmax; ++j) {
                    cellL[j] = cellL[j] * panL;
                    cellR[j] = cellR[j] * panR;
                }

            } else {
                cellL.set(fn.emptycell);
                cellR.set(fn.emptycell);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("pan", PanNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var Envelope      = T.modules.Envelope;
    var EnvelopeValue = T.modules.EnvelopeValue;

    function ParamNode(_args) {
        T.Object.call(this, 2, _args);

        var _ = this._;
        _.value = 0;
        _.env = new EnvelopeValue(_.samplerate);
        _.env.step = _.cellsize;
        _.curve   = "lin";
        _.counter = 0;
        _.ar = false;
        _.onended = make_onended(this);

        this.on("ar", onar);
    }
    fn.extend(ParamNode);

    var make_onended = function(self, lastValue) {
        return function() {
            if (typeof lastValue === "number") {
                var cell  = self.cells[0];
                var cellL = self.cells[1];
                var cellR = self.cells[2];
                var value = self._.env.value;
                for (var i = 0, imax = cellL.length; i < imax; ++i) {
                    cell[0] = cellL[i] = cellR[i] = value;
                }
            }
            self._.emit("ended");
        };
    };

    var onar = function(value) {
        this._.env.step = (value) ? 1 : this._.cellsize;
    };

    var $ = ParamNode.prototype;

    Object.defineProperties($, {
        value: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.env.value = value;
                }
            },
            get: function() {
                return this._.env.value;
            }
        }
    });

    $.to = function(nextValue, time, curve) {
        var _ = this._;
        var env = _.env;
        if (typeof time === "string") {
            time = timevalue(time);
        } else if (typeof time === "undefined") {
            time = 0;
        }
        if (typeof curve === "undefined") {
            _.counter = env.setNext(nextValue, time, Envelope.CurveTypeLin);
            _.curve = "lin";
        } else {
            var _curve = Envelope.CurveTypeDict[curve];
            if (typeof _curve === "undefined") {
                _.counter = env.setNext(nextValue, time, Envelope.CurveTypeCurve, curve);
            } else {
                _.counter = env.setNext(nextValue, time, _curve);
            }
            _.curve = curve;
        }
        _.plotFlush = true;
        return this;
    };

    $.setAt = function(nextValue, time) {
        var _ = this._;
        this.to(_.env.value, time, "set");
        _.atValue = nextValue;
        return this;
    };

    $.linTo = function(nextValue, time) {
        return this.to(nextValue, time, "lin");
    };

    $.expTo = function(nextValue, time) {
        return this.to(nextValue, time, "exp");
    };

    $.sinTo = function(nextValue, time) {
        return this.to(nextValue, time, "sin");
    };

    $.welTo = function(nextValue, time) {
        return this.to(nextValue, time, "wel");
    };

    $.sqrTo = function(nextValue, time) {
        return this.to(nextValue, time, "sqr");
    };

    $.cubTo = function(nextValue, time) {
        return this.to(nextValue, time, "cub");
    };

    $.cancel = function() {
        var _ = this._;
        _.counter = _.env.setNext(_.env.value, 0, Envelope.CurveTypeSet);
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = _.cellsize;
            var env = _.env;
            var counter = _.counter;
            var value;

            if (this.nodes.length) {
                fn.inputSignalAR(this);
            } else {
                for (i = 0; i < imax; ++i) {
                    cellL[i] = cellR[i] = 1;
                }
            }

            if (counter <= 0) {
                if (_.curve === "set") {
                    env.setNext(_.atValue, 0, Envelope.CurveTypeSet);
                } else {
                    env.setNext(env.value, 0, Envelope.CurveTypeSet);
                }
                fn.nextTick(_.onended);
                _.counter = Infinity;
            }

            if (_.ar) {
                for (i = 0; i < imax; ++i) {
                    value = env.next();
                    cellL[i] *= value;
                    cellR[i] *= value;
                }
                _.counter -= _.cellsize;
            } else {
                value = env.next();
                for (i = 0; i < imax; ++i) {
                    cellL[i] *= value;
                    cellR[i] *= value;
                }
                _.counter -= 1;
            }

            fn.outputSignalAR(this);

            _.value = value;
        }

        return this;
    };

    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        var _ = this._;
        if (_.plotFlush) {
            var env  = new EnvelopeValue(128);
            var data = new Float32Array(128);
            var curve, i, imax;
            if (_.curve === "set") {
                for (i = 100, imax = data.length; i < imax; ++i) {
                    data[i] = 1;
                }
            } else {
                curve = Envelope.CurveTypeDict[_.curve];
                if (typeof curve === "undefined") {
                    env.setNext(1, 1000, Envelope.CurveTypeCurve, _.curve);
                } else {
                    env.setNext(1, 1000, curve);
                }

                for (i = 0, imax = data.length; i < imax; ++i) {
                    data[i] = env.next();
                }
            }
            _.plotData  = data;
            _.plotRange = [0, 1];
            _.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("param", ParamNode);

})(timbre);
(function(T) {
    "use strict";

    var fn  = T.fn;
    var Biquad = T.modules.Biquad;

    function PhaserNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.freq = T("sin", {freq:1, add:1000, mul:250}).kr();
        _.Q    = T(1);
        _.allpass  = [];

        this.steps = 2;
    }
    fn.extend(PhaserNode);

    var $ = PhaserNode.prototype;

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
                this._.Q = T(value);
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
                                allpass[i] = new Biquad(this._.samplerate);
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

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var freq  = _.freq.process(tickID).cells[0][0];
                var Q     = _.Q.process(tickID).cells[0][0];
                var steps = _.steps;
                var i;

                for (i = 0; i < steps; i += 2) {
                    _.allpass[i  ].setParams(freq, Q, 0);
                    _.allpass[i  ].process(cellL, cellR);
                    _.allpass[i+1].setParams(freq, Q, 0);
                    _.allpass[i+1].process(cellL, cellR);
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("phaser", PhaserNode);

})(timbre);
(function(T) {
    "use strict";

    // Voss algorithm
    // http://www.firstpr.com.au/dsp/pink-noise/

    var MAX_KEY = 31;
    var fn = T.fn;

    function PinkNoiseNode(_args) {
        T.Object.call(this, 1, _args);
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
        var cell = this.cells[0];
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
        return this;
    };

    fn.register("pink", PinkNoiseNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function PluckNode(_args) {
        T.Object.call(this, 1, _args);

        this._.freq   = 440;
        this._.buffer = null;
        this._.index  = 0;
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
        var size   = (_.samplerate / freq + 0.5)|0;
        var buffer = _.buffer = new fn.SignalArray(size);
        for (var i = 0; i < size; ++i) {
            buffer[i] = Math.random() * 2 - 1;
        }
        _.index = 0;
        _.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var buffer = _.buffer;
            if (buffer) {
                var bufferLength = buffer.length;
                var index = _.index, write;
                var mul = _.mul, add = _.add;
                var x, i, imax = cell.length;

                for (i = 0; i < imax; ++i) {
                    write = index;
                    x = buffer[index++];
                    if (index >= bufferLength) {
                        index = 0;
                    }
                    x = (x + buffer[index]) * 0.5;
                    buffer[write] = x;
                    cell[i] = x * mul + add;
                }
                _.index = index;
            }
        }

        return this;
    };

    fn.register("pluck", PluckNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    var STATUS_WAIT = 0;
    var STATUS_REC  = 1;

    function RecNode(_args) {
        T.Object.call(this, 1, _args);
        fn.listener(this);
        fn.fixAR(this);

        var _ = this._;
        _.timeout    = 5000;
        _.status     = STATUS_WAIT;
        _.writeIndex = 0;
        _.writeIndexIncr  = 1;
        _.currentTime     = 0;
        _.currentTimeIncr = 1000 / _.samplerate;
        _.onended = make_onended(this);
    }
    fn.extend(RecNode);

    var make_onended = function(self) {
        return function() {
            var _ = self._;

            var buffer = new fn.SignalArray(_.buffer.subarray(0, _.writeIndex|0));

            _.status      = STATUS_WAIT;
            _.writeIndex  = 0;
            _.currentTime = 0;

            _.emit("ended", {
                buffer:buffer, samplerate:_.samplerate
            });
        };
    };

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
                    if (0 < value && value <= this._.samplerate) {
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
                _.buffer = new fn.SignalArray(len);
            }
            _.writeIndex = 0;
            _.writeIndexIncr = _.samplerate / T.samplerate;
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
            fn.nextTick(_.onended);
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
        var cell = this.cells[0];

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
                        fn.nextTick(_.onended);
                    }
                }
                _.writeIndex  = writeIndex;
                _.currentTime = currentTime;
            }

            fn.outputSignalAR(this);
        }
        return this;
    };

    fn.register("record", RecNode);
    fn.alias("rec", "record");

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var Reverb = T.modules.Reverb;

    function ReverbNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        this._.reverb = new Reverb(this._.samplerate, this._.cellsize);
    }
    fn.extend(ReverbNode);

    var $ = ReverbNode.prototype;

    Object.defineProperties($, {
        room: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.reverb.setRoomSize(value);
                }
            },
            get: function() {
                return this._.reverb.roomsize;
            }
        },
        damp: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.reverb.setDamp(value);
                }
            },
            get: function() {
                return this._.reverb.damp;
            }
        },
        mix: {
            set: function(value) {
                if (typeof value === "number") {
                    value = (value > 1) ? 1 : (value < 0) ? 0 : value;
                    this._.reverb.wet = value;
                }
            },
            get: function() {
                return this._.reverb.wet;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (!_.bypassed) {
                _.reverb.process(this.cells[1], this.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("reverb", ReverbNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function ScheduleNode(_args) {
        T.Object.call(this, 0, _args);
        fn.timer(this);
        fn.fixKR(this);

        var _ = this._;
        _.queue = [];
        _.currentTime = 0;
        _.maxRemain   = 1000;
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

    $.sched = function(delta, item, args) {
        if (typeof delta === "string") {
            delta = timevalue(delta);
        }
        if (typeof delta === "number") {
            this.schedAbs(this._.currentTime + delta, item, args);
        }
        return this;
    };

    $.schedAbs = function(time, item, args) {
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
            queue.splice(i + 1, 0, [time, T(item), args]);
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
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var emit = null;
            var queue = _.queue;

            if (queue.length) {
                while (queue[0][0] < _.currentTime) {
                    var nextItem = _.queue.shift();
                    nextItem[1].bang(nextItem[2]);
                    emit = "sched";
                    if (queue.length === 0) {
                        emit = "empty";
                        break;
                    }
                }
            }
            _.currentTime += fn.currentTimeIncr;
            if (emit) {
                _.emit(emit);
            }
        }
        return this;
    };

    fn.register("schedule", ScheduleNode);
    fn.alias("sched", "schedule");

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function ScopeNode(_args) {
        T.Object.call(this, 2, _args);
        fn.listener(this);
        fn.fixAR(this);

        var _ = this._;
        _.samples    = 0;
        _.writeIndex = 0;
        _.plotFlush = true;

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
                        _.buffer = new fn.SignalArray(n);
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
                        _.samplesIncr = value * 0.001 * _.samplerate / _.buffer.length;
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

        for (var i = 0, imax = buffer.length; i < imax; ++i) {
            buffer[i] = 0;
        }
        _.samples    = 0;
        _.writeIndex = 0;
        this._.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);

            var cell = this.cells[0];
            var i, imax = _.cellsize;
            var samples     = _.samples;
            var samplesIncr = _.samplesIncr;
            var buffer      = _.buffer;
            var writeIndex  = _.writeIndex;
            var emit = false;
            var bufferlength = buffer.length;

            for (i = 0; i < imax; ++i) {
                if (samples <= 0) {
                    buffer[writeIndex++] = cell[i];
                    if (writeIndex >= bufferlength) {
                        writeIndex = 0;
                    }
                    emit = _.plotFlush = true;
                    samples += samplesIncr;
                }
                --samples;
            }
            _.samples    = samples;
            _.writeIndex = writeIndex;

            if (emit) {
                this._.emit("data");
            }
        }

        return this;
    };

    var super_plot = T.Object.prototype.plot;

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

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function ScriptProcessorNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.numberOfInputs = 0;
        _.numberOfOutputs = 0;
        _.bufferSize = 0;
        _.bufferMask = 0;
        _.duration   = 0;
        _.inputBufferL = null;
        _.inputBufferR = null;
        _.outputBufferL = null;
        _.outputBufferR = null;
        _.onaudioprocess = null;
        _.index = 0;
        this.once("init", oninit);
    }
    fn.extend(ScriptProcessorNode);

    var oninit = function() {
        var _ = this._;
        if (_.numberOfInputs === 0) {
            this.numberOfInputs = 1;
        }
        if (_.numberOfOutputs === 0) {
            this.numberOfOutputs = 1;
        }
        if (_.bufferSize === 0) {
            this.bufferSize = 1024;
        }
    };

    var $ = ScriptProcessorNode.prototype;

    Object.defineProperties($, {
        numberOfInputs: {
            set: function(value) {
                var _ = this._;
                if (_.numberOfInputs === 0) {
                    _.numberOfInputs = (value === 2) ? 2 : 1;
                }
            },
            get: function() {
                return this._.numberOfInputs;
            }
        },
        numberOfOutputs: {
            set: function(value) {
                var _ = this._;
                if (_.numberOfOutputs === 0) {
                    _.numberOfOutputs = (value === 2) ? 2 : 1;
                }
            },
            get: function() {
                return this._.numberOfOutputs;
            }
        },
        bufferSize: {
            set: function(value) {
                var _ = this._;
                if (_.bufferSize === 0) {
                    if ([256, 512, 1024, 2048, 4096, 8192, 16384].indexOf(value) !== -1) {
                        _.bufferSize = value;
                        _.bufferMask = value - 1;
                        _.duration = value / _.samplerate;
                        _.inputBufferL  = new fn.SignalArray(value);
                        _.inputBufferR  = new fn.SignalArray(value);
                        _.outputBufferL = new fn.SignalArray(value);
                        _.outputBufferR = new fn.SignalArray(value);
                    }
                }
            },
            get: function() {
                return this._.bufferSize;
            }
        },
        onaudioprocess: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.onaudioprocess = value;
                }
            },
            get: function() {
                return this._.onaudioprocess;
            }
        }
    });

    function AudioBuffer(self, buffers) {
        this.samplerate = self._.samplerate;
        this.length     = self._.bufferSize;
        this.duration   = self._.duration;
        this.numberOfChannels = buffers.length;
        this.getChannelData = function(n) {
            return buffers[n];
        };
    }

    function AudioProcessingEvent(self) {
        var _ = self._;
        this.node = self;
        this.playbackTime = T.currentTime;
        if (_.numberOfInputs === 2) {
            this.inputBuffer  = new AudioBuffer(self, [_.inputBufferL, _.inputBufferR]);
        } else {
            this.inputBuffer  = new AudioBuffer(self, [_.inputBufferL]);
        }
        if (_.numberOfOutputs === 2) {
            this.outputBuffer = new AudioBuffer(self, [_.outputBufferL, _.outputBufferR]);
        } else {
            this.outputBuffer = new AudioBuffer(self, [_.outputBufferL]);
        }
    }

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var cellsize   = _.cellsize;
            var bufferMask = _.bufferMask;
            var begin = _.index;
            var end   = begin + cellsize;
            var buffer;
            var cellL  = this.cells[1];
            var cellR  = this.cells[2];

            fn.inputSignalAR(this);

            if (_.numberOfInputs === 2) {
                _.inputBufferL.set(cellL, begin);
                _.inputBufferR.set(cellR, begin);
            } else {
                buffer = _.inputBufferL;
                for (var i = 0; i < cellsize; i++) {
                    buffer[begin + i] = (cellL[i] + cellR[i]) * 0.5;
                }
            }

            cellL.set(_.outputBufferL.subarray(begin, end));
            cellR.set(_.outputBufferR.subarray(begin, end));

            _.index = end & bufferMask;

            if (_.index === 0 && _.onaudioprocess) {
                _.onaudioprocess(new AudioProcessingEvent(this));
                if (_.numberOfOutputs === 1) {
                    _.outputBufferR.set(_.outputBufferL);
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("script", ScriptProcessorNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function SelectorNode(_args) {
        T.Object.call(this, 2, _args);

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
                    this.cells[1].set(fn.emptycell);
                    this.cells[2].set(fn.emptycell);
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

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var i, imax = nodes.length;

            if (_.background) {
                for (i = 0; i < imax; ++i) {
                    nodes[i].process(tickID);
                }
            }

            var tmp = nodes[_.selected];
            if (tmp) {
                if (!_.background) {
                    tmp.process(tickID);
                }
                this.cells[1].set(tmp.cells[1]);
                this.cells[2].set(tmp.cells[2]);
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("selector", SelectorNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var FFT = T.modules.FFT;

    var WAIT_STATE = 0;
    var EXEC_STATE = 1;

    function SpectrumNode(_args) {
        T.Object.call(this, 2, _args);
        fn.listener(this);
        fn.fixAR(this);

        var _ = this._;
        _.status  = WAIT_STATE;
        _.samples = 0;
        _.samplesIncr = 0;
        _.writeIndex  = 0;

        _.plotFlush = true;
        _.plotRange = [0, 32];
        _.plotBarStyle = true;

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
                        _.buffer = new fn.SignalArray(_.fft.length);
                        _.freqs  = new fn.SignalArray(_.fft.length>>1);
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
                        _.samplesIncr = (value * 0.001 * _.samplerate);
                        if (_.samplesIncr < _.buffer.length) {
                            _.samplesIncr = _.buffer.length;
                            _.interval = _.samplesIncr * 1000 / _.samplerate;
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
                return this._.fft.getFrequencyData(this._.freqs);
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

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);
            fn.outputSignalAR(this);

            var cell = this.cells[0];
            var i, imax = cell.length;
            var status  = _.status;
            var samples = _.samples;
            var samplesIncr = _.samplesIncr;
            var writeIndex  = _.writeIndex;
            var buffer = _.buffer;
            var bufferLength = buffer.length;
            var emit;

            for (i = 0; i < imax; ++i) {
                if (samples <= 0) {
                    if (status === WAIT_STATE) {
                        status = EXEC_STATE;
                        writeIndex = 0;
                        samples += samplesIncr;
                    }
                }
                if (status === EXEC_STATE) {
                    buffer[writeIndex++] = cell[i];
                    if (bufferLength <= writeIndex) {
                        _.fft.forward(buffer);
                        emit = _.plotFlush = true;
                        status = WAIT_STATE;
                    }
                }
                --samples;
            }

            _.samples = samples;
            _.status  = status;
            _.writeIndex = writeIndex;

            if (emit) {
                this._.emit("data");
            }
        }
        return this;
    };

    var super_plot = T.Object.prototype.plot;

    $.plot = function(opts) {
        if (this._.plotFlush) {
            this._.plotData  = this.spectrum;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };

    fn.register("spectrum", SpectrumNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function SubtractNode(_args) {
        T.Object.call(this, 2, _args);
        this._.ar = false;
    }
    fn.extend(SubtractNode);

    var $ = SubtractNode.prototype;

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var nodes = this.nodes;
            var cell  = this.cells[0];
            var cellL = this.cells[1];
            var cellR = this.cells[2];
            var i, imax = nodes.length;
            var j, jmax = cell.length;
            var tmp, tmpL, tmpR;

            if (_.ar) {
                if (nodes.length > 0) {
                    nodes[0].process(tickID);
                    tmpL = nodes[0].cells[1];
                    tmpR = nodes[0].cells[2];
                    cellL.set(tmpL);
                    cellR.set(tmpR);
                    for (i = 1; i < imax; ++i) {
                        nodes[i].process(tickID);
                        tmpL = nodes[i].cells[1];
                        tmpR = nodes[i].cells[2];
                        for (j = 0; j < jmax; ++j) {
                            cellL[j] -= tmpL[j];
                            cellR[j] -= tmpR[j];
                        }
                    }
                } else {
                    for (j = 0; j < jmax; ++j) {
                        cellL[j] = cellR[i] = 0;
                    }
                }
                fn.outputSignalAR(this);
            } else {
                if (nodes.length > 0) {
                    tmp = nodes[0].process(tickID).cells[0][0];
                    for (i = 1; i < imax; ++i) {
                        tmp -= nodes[i].process(tickID).cells[0][0];
                    }
                } else {
                    tmp = 0;
                }
                cell[0] = tmp;
                fn.outputSignalKR(this);
            }
        }

        return this;
    };

    fn.register("-", SubtractNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function SynthDefNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        this.playbackState = fn.FINISHED_STATE;
        _.poly     = 4;
        _.genList  = [];
        _.genDict  = {};
        _.synthdef = null;
        _.remGen = make_remGen(this);
        _.onended = fn.make_onended(this);
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

    var make_doneAction = function(self, opts) {
        return function() {
            self._.remGen(opts.gen);
        };
    };

    var make_remGen = function(self) {
        return function(gen) {
            var _ = self._;
            var i = _.genList.indexOf(gen);
            if (i !== -1) {
                _.genList.splice(i, 1);
            }
            if (typeof gen.noteNum !== "undefined") {
                _.genDict[gen.noteNum] = null;
            }
        };
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
            velocity: velocity,
            mul     : velocity * 0.0078125
        };
        if (_opts) {
            for (var key in _opts) {
                opts[key] = _opts[key];
            }
        }
        opts.doneAction = make_doneAction(this, opts);

        gen = _.synthdef.call(this, opts);

        if (gen instanceof T.Object) {
            gen.noteNum = noteNum;
            list.push(gen);
            dict[noteNum] = opts.gen = gen;

            this.playbackState = fn.PLAYING_STATE;

            if (list.length > _.poly) {
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

    $.synth = function(_opts) {
        var _ = this._;
        var list = _.genList;
        var gen, opts = {};

        if (_opts) {
            for (var key in _opts) {
                opts[key] = _opts[key];
            }
        }
        opts.doneAction = make_doneAction(this, opts);

        gen = _.synthdef.call(this, opts);

        if (gen instanceof T.Object) {
            list.push(gen);
            opts.gen = gen;
            this.playbackState = fn.PLAYING_STATE;

            if (list.length > _.poly) {
                _.remGen(list[0]);
            }
        }

        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            if (this.playbackState === fn.PLAYING_STATE) {
                var list = _.genList;
                var gen;
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var i, imax;
                var j, jmax = cell.length;
                var tmpL, tmpR;

                if (list.length) {
                    gen = list[0];
                    gen.process(tickID);
                    cellL.set(gen.cells[1]);
                    cellR.set(gen.cells[2]);
                    for (i = 1, imax = list.length; i < imax; ++i) {
                        gen = list[i];
                        gen.process(tickID);
                        tmpL = gen.cells[1];
                        tmpR = gen.cells[2];
                        for (j = 0; j < jmax; ++j) {
                            cellL[j] += tmpL[j];
                            cellR[j] += tmpR[j];
                        }
                    }
                } else {
                    fn.nextTick(_.onended);
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("SynthDef", SynthDefNode);


    var env_desc = {
        set: function(value) {
            if (fn.isDictionary(value)) {
                if (typeof value.type === "string") {
                    this._.env = value;
                }
            } else if (value instanceof T.Object) {
                this._.env = value;
            }
        },
        get: function() {
            return this._.env;
        }
    };

    fn.register("OscGen", (function() {

        var osc_desc = {
            set: function(value) {
                if (value instanceof T.Object) {
                    this._.osc = value;
                }
            },
            get: function() {
                return this._.osc;
            }
        };

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
            var synth, osc, env, envtype;

            osc = _.osc || null;
            env = _.env || {};
            envtype = env.type || "perc";

            if (osc instanceof T.Object) {
                if (typeof osc.clone === "function") {
                    osc = osc.clone();
                }
            }
            if (!osc) {
                osc = T("osc", {wave:_.wave});
            }
            osc.freq = opts.freq;
            osc.mul  = osc.mul * opts.velocity/128;

            synth = osc;
            if (env instanceof T.Object) {
                if (typeof env.clone === "function") {
                    synth = env.clone().append(synth);
                }
            } else {
                synth = T(envtype, env, synth);
            }
            synth.on("ended", opts.doneAction).bang();

            return synth;
        };

        return function(_args) {
            var instance = new SynthDefNode(_args);

            instance._.wave = "sin";

            Object.defineProperties(instance, {
                env: env_desc, osc: osc_desc, wave: wave_desc
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

            synth = T("pluck", {freq:opts.freq, mul:opts.velocity/128}).bang();
            if (env instanceof T.Object) {
                if (typeof env.clone === "function") {
                    synth = env.clone().append(synth);
                }
            } else {
                synth = T(envtype, env, synth);
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

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var Scissor    = T.modules.Scissor;
    var Tape       = Scissor.Tape;
    var TapeStream = Scissor.TapeStream;
    var isSignalArray = fn.isSignalArray;

    function ScissorNode(_args) {
        T.Object.call(this, 2, _args);
        fn.fixAR(this);

        var _ = this._;
        _.isLooped = false;
        _.onended  = fn.make_onended(this, 0);
    }
    fn.extend(ScissorNode);

    var $ = ScissorNode.prototype;

    Object.defineProperties($, {
        tape: {
            set: function(tape) {
                if (tape instanceof Tape) {
                    this.playbackState = fn.PLAYING_STATE;
                    this._.tape = tape;
                    this._.tapeStream = new TapeStream(tape, this._.samplerate);
                    this._.tapeStream.isLooped = this._.isLooped;
                } else {
                    if (tape instanceof T.Object) {
                        if (tape.buffer) {
                            tape = tape.buffer;
                        }
                    }
                    if (typeof tape === "object") {
                        if (Array.isArray(tape.buffer) && isSignalArray(tape.buffer[0])) {
                            this.playbackState = fn.PLAYING_STATE;
                            this._.tape = new Scissor(tape);
                            this._.tapeStream = new TapeStream(this._.tape, this._.samplerate);
                            this._.tapeStream.isLooped = this._.isLooped;
                        }
                    }
                }
            },
            get: function() {
                return this._.tape;
            }
        },
        isLooped: {
            get: function() {
                return this._.isLooped;
            }
        },
        buffer: {
            get: function() {
                if (this._.tape) {
                    return this._.tape.getBuffer();
                }
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
        this.playbackState = fn.PLAYING_STATE;
        if (this._.tapeStream) {
            this._.tapeStream.reset();
        }
        this._.emit("bang");
        return this;
    };

    $.getBuffer = function() {
        if (this._.tape) {
            return this._.tape.getBuffer();
        }
    };

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var tapeStream = _.tapeStream;

            if (tapeStream) {
                var cellL = this.cells[1];
                var cellR = this.cells[2];
                var tmp  = tapeStream.fetch(cellL.length);
                cellL.set(tmp[0]);
                cellR.set(tmp[1]);
                if (this.playbackState === fn.PLAYING_STATE && tapeStream.isEnded) {
                    fn.nextTick(_.onended);
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("tape", ScissorNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;
    var FunctionWrapper = T(function(){}).constructor;

    function TaskNode(_args) {
        T.Object.call(this, 1, _args);
        fn.timer(this);

        var _ = this._;
        this.playbackState = fn.FINISHED_STATE;
        _.task = [];
        _.i     = 0;
        _.j     = 0;
        _.imax  = 0;
        _.jmax  = 0;
        _.wait  = 0;
        _.count = 0;
        _.args  = {};
        _.doNum = 1;
        _.initFunc = fn.nop;
        _.onended = make_onended(this);

        this.on("start", onstart);
    }
    fn.extend(TaskNode);

    var onstart = function() {
        var _ = this._, args;
        this.playbackState = fn.PLAYING_STATE;
        _.task = this.nodes.map(function(x) {
            return x instanceof FunctionWrapper ? x.func : false;
        }).filter(function(x) {
            return !!x;
        });
        _.i = _.j = 0;
        _.imax = _.doNum;
        _.jmax = _.task.length;
        args = _.initFunc();
        if (!fn.isDictionary(args)) {
            args = {param:args};
        }
        _.args = args;
    };

    var make_onended = function(self) {
        return function() {
            self.playbackState = fn.FINISHED_STATE;
            var _ = self._;
            var cell  = self.cells[0];
            var cellL = self.cells[1];
            var cellR = self.cells[2];
            var lastValue = _.args;
            if (typeof lastValue === "number") {
                for (var i = 0, imax = cellL.length; i < imax; ++i) {
                    cell[0] = cellL[i] = cellR[i] = lastValue;
                }
            }
            _.emit("ended", _.args);
        };
    };

    var $ = TaskNode.prototype;

    Object.defineProperties($, {
        "do": {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.doNum = value === Infinity ? Infinity : value|0;
                }
            },
            get: function() {
                return this._.doNum;
            }
        },
        init: {
            set: function(value) {
                if (typeof value === "function") {
                    this._.initFunc = value;
                }
            },
            get: function() {
                return this._.initFunc;
            }
        }
    });

    $.bang = function() {
        var _ = this._;
        _.count  = 0;
        _.emit("bang");
        return this;
    };

    $.wait = function(time) {
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof time === "number" && time > 0) {
            this._.count += (this._.samplerate * time * 0.001)|0;
        }
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;
        var args, func;

        if (this.tickID !== tickID) {
            this.tickID = tickID;
            if (_.i < _.imax) {
                while (_.count <= 0) {
                    if (_.j >= _.jmax) {
                        ++_.i;
                        if (_.i >= _.imax) {
                            fn.nextTick(_.onended);
                            break;
                        }
                        _.j = 0;
                    }
                    func = _.task[_.j++];
                    if (func) {
                        func.call(this, _.i, _.args);
                    }
                }
                _.count -= cell.length;
            }
        }

        return this;
    };

    fn.register("task", TaskNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;
    var timevalue = T.timevalue;

    function TimeoutNode(_args) {
        T.Object.call(this, 0, _args);
        fn.timer(this);
        fn.fixKR(this);

        var _ = this._;
        this.playbackState = fn.FINISHED_STATE;
        _.currentTime = 0;
        _.samplesMax = 0;
        _.samples    = 0;
        _.onended = fn.make_onended(this);

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
        this.playbackState = fn.PLAYING_STATE;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });

    var $ = TimeoutNode.prototype;

    Object.defineProperties($, {
        timeout: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    this.playbackState = fn.PLAYING_STATE;
                    _.timeout = value;
                    _.samplesMax = (_.samplerate * (value * 0.001))|0;
                    _.samples = _.samplesMax;
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
        this.playbackState = fn.PLAYING_STATE;
        _.samples = _.samplesMax;
        _.currentTime = 0;
        _.emit("bang");
        return this;
    };

    $.process = function(tickID) {
        var cell = this.cells[0];
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            if (_.samples > 0) {
                _.samples -= cell.length;
            }

            if (_.samples <= 0) {
                var nodes = this.nodes;
                for (var i = 0, imax = nodes.length; i < imax; ++i) {
                    nodes[i].bang();
                }
                fn.nextTick(_.onended);
            }
            _.currentTime += fn.currentTimeIncr;
        }
        return this;
    };

    fn.register("timeout", TimeoutNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function WaveShaperNode(_args) {
        T.Object.call(this, 1, _args);
        fn.fixAR(this);

        this._.curve = null;
    }
    fn.extend(WaveShaperNode);

    var $ = WaveShaperNode.prototype;

    Object.defineProperties($, {
        curve: {
            set: function(value) {
                if (fn.isSignalArray(value)) {
                    this._.curve = value;
                }
            },
            get: function() {
                return this._.curve;
            }
        }
    });

    $.process = function(tickID) {
        var _ = this._;

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            fn.inputSignalAR(this);

            if (_.curve) {
                var cell = this.cells[0];
                var curve = _.curve;
                var len    = curve.length;
                var x, i, imax = _.cellsize;
                for (i = 0; i < imax; ++i) {
                    x = (((cell[i] + 1) * 0.5) * len + 0.5)|0;
                    if (x < 0) {
                        x = 0;
                    } else if (x >= len - 1) {
                        x = len - 1;
                    }
                    cell[i] = curve[x];
                }
            }

            fn.outputSignalAR(this);
        }

        return this;
    };

    fn.register("waveshaper", WaveShaperNode);

})(timbre);
(function(T) {
    "use strict";

    var fn = T.fn;

    function ZMapNode(_args) {
        T.Object.call(this, 1, _args);

        var _ = this._;
        _.inMin  = 0;
        _.inMax  = 1;
        _.outMin = 0;
        _.outMax = 1;
        _.ar     = false;

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
        var cell = this.cells[0];

        if (this.tickID !== tickID) {
            this.tickID = tickID;

            var inMin  = _.inMin, inMax   = _.inMax;
            var outMin = _.outMin, outMax = _.outMax;
            var warp   = _.warp;

            var len = this.nodes.length;
            var mul = _.mul, add = _.add;
            var i, imax = cell.length;

            if (_.ar && len) {
                fn.inputSignalAR(this);
                for (i = 0; i < imax; ++i) {
                    cell[i] = warp(cell[i], inMin, inMax, outMin, outMax) * mul + add;
                }
                fn.outputSignalAR(this);
            } else {
                var input = (this.nodes.length) ? fn.inputSignalKR(this) : 0;
                var value = warp(input, inMin, inMax, outMin, outMax) * mul + add;
                for (i = 0; i < imax; ++i) {
                    cell[i] = value;
                }
            }
        }

        return this;
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

})(timbre);
