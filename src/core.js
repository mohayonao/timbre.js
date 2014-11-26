/**
 * T("timbre.js") - A JavaScript library for objective sound programming
 */
(function(undefined) {
    "use strict";

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

    var _ver = "${VERSION}";
    var _sys = null;
    var _constructors = {};
    var _factories    = {};
    var _envtype = (typeof window !== "undefined") ? "browser" :
        (typeof module !== "undefined" && module.exports) ? "node" : "unknown";
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
                ms *= 2 - (1 / Math.pow(2, (m[2]||"").length));
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
    var ImplClass    = null;
    var AudioContext;
    if (typeof window !== "undefined") {
      AudioContext = window.AudioContext || window.webkitAudioContext;
    }

    if (typeof AudioContext !== "undefined") {
        ImplClass = function(sys) {
            var context = new AudioContext();
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
                jsNode = context.createScriptProcessor(jsn_streamsize, 2, sys.channels);
                jsNode.onaudioprocess = onaudioprocess;
                if (bufSrc.noteOn) {
                    bufSrc.noteOn(0);
                }
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
    } else {
        ImplClass = function(sys) {
            this.maxSamplerate     = 48000;
            this.defaultSamplerate = 44100;
            this.env = "nop";
            this.play  = function() {};
            this.pause = function() {};
        };
    }

    _sys = new SoundSystem().bind(ImplClass);

    var exports = timbre;

    if (_envtype === "node" || typeof module !== "undefined" && module.exports) {
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

})();
