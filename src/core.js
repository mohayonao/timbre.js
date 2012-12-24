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
    var _bpm = 120;
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
        
        instance._.emit("init");
        
        return instance;
    };
    
    timbre.fn    = {};
    timbre.utils = {};
    
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
        bpm: {
            set: function(value) {
                if (typeof value === "number" ) {
                    if (5 <= value && value <= 300) {
                        _bpm = value;
                    }
                }
            },
            get: function() {
                return _bpm;
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
        _sys.rec.apply(_sys, arguments);
        return timbre;
    };
    
    timbre.then = function() {
        _sys.then.apply(_sys, arguments);
        return timbre;
    };
    
    timbre.done = function() {
        _sys.done.apply(_sys, arguments);
        return timbre;
    };
    
    timbre.fail = function() {
        _sys.fail.apply(_sys, arguments);
        return timbre;
    };
    
    timbre.always = function() {
        _sys.always.apply(_sys, arguments);
        return timbre;
    };
    
    timbre.promise = function() {
        return _sys.promise.apply(_sys, arguments);
    };
    
    timbre.ready = timbre.when = function() {
        return _sys.ready.apply(_sys, arguments);
    };
    
    var __nop = function() {
        return this;
    };
    timbre.fn.nop = __nop;
    
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
    timbre.fn.extend = __extend;

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
    timbre.fn.constructorof = __constructorof;
    
    var __register = function(key, ctor) {
        if (__constructorof(ctor, TimbreObject)) {
            _constructors[key] = ctor;
        } else {
            _factories[key] = ctor;
        }
    };
    timbre.fn.register = __register;

    var __alias = function(key, alias) {
        if (_constructors[alias]) {
            _constructors[key] = _constructors[alias];
        } else if (_factories[alias]) {
            _factories[key] = _factories[alias];
        }
        
    };
    timbre.fn.alias = __alias;
    
    var __getClass = function(key) {
        return _constructors[key];
    };
    timbre.fn.getClass = __getClass;
    
    var __nextTick = function(func) {
        _sys.nextTick(func);
        return timbre;
    };
    timbre.fn.nextTick = __nextTick;
    
    var __fixAR = function(object) {
        object._.ar = true;
        object._.aronly = true;
    };
    timbre.fn.fixAR = __fixAR;
    
    var __fixKR = function(object) {
        object._.ar = false;
        object._.kronly = true;
    };
    timbre.fn.fixKR = __fixKR;
    
    var __changeWithValue = function() {
        var _ = this._;
        var x = _.value * _.mul + _.add;
        var cell = this.cell;
        for (var i = cell.length; i--; ) {
            cell[i] = x;
        }
    };
    Object.defineProperty(__changeWithValue, "unremovable", {
        value:true, writable:false
    });
    timbre.fn.changeWithValue = __changeWithValue;
    
    var __stereo = function(object) {
        object.L = new ChannelObject(object);
        object.R = new ChannelObject(object);
        object.cellL = object.L.cell;
        object.cellR = object.R.cell;
        Object.defineProperty(object, "isStereo", {
            value:true, writable:false
        });
    };
    timbre.fn.stereo = __stereo;
    
    var __timer = (function() {
        var start = function() {
            var self = this;
            _sys.nextTick(function() {
                if (self._.remove_check) {
                    return self._.remove_check = null;
                }
                
                if (_sys.timers.indexOf(self) === -1) {
                    _sys.timers.push(self);
                    _sys.emit("addObject");
                    self._.emit("start");
                }
            });
            return this;
        };
        
        var stop = function() {
            var self = this;
            this._.remove_check = true;
            if (_sys.timers.indexOf(this) !== -1) {
                _sys.nextTick(function() {
                    _sys.emit("removeObject");
                    self._.emit("stop");
                });
            }
            return this;
        };
        
        return function(object) {
            object.start = start;
            object.stop  = stop;
            return object;
        };
    })();
    timbre.fn.timer = __timer;

    var __listener = (function() {
        var listen = function() {
            var self = this;
            if (arguments.length) {
                this.append.apply(this, arguments);
            }
            if (this.inputs.length) {
                _sys.nextTick(function() {
                    if (self._.remove_check) {
                        return self._.remove_check = null;
                    }
                    if (_sys.listeners.indexOf(self) === -1) {
                        _sys.listeners.push(self);
                        _sys.emit("addObject");
                        self._.emit("listen");
                    }
                });
            }
            return this;
        };
        
        var unlisten = function() {
            var self = this;
            if (arguments.length) {
                this.remove.apply(this, arguments);
            }
            if (!this.inputs.length) {
                this._.remove_check = true;
                if (_sys.listeners.indexOf(this) !== -1) {
                    _sys.nextTick(function() {
                        _sys.emit("removeObject");
                        self._.emit("unlisten");
                    });
                }
            }
            return this;
        };
        
        return function(object) {
            object.listen   = listen;
            object.unlisten = unlisten;
            return object;
        };
    })();
    timbre.fn.listener = __listener;
    
    var __deferred = (function() {
        var then = function() {
            var dfd = this._.deferred;
            dfd.then.apply(dfd, arguments);
            return this;
        };
        var done = function() {
            var dfd = this._.deferred;
            dfd.done.apply(dfd, arguments);
            return this;
        };
        var fail = function() {
            var dfd = this._.deferred;
            dfd.fail.apply(dfd, arguments);
            return this;
        };
        var pipe = function() {
            var dfd = this._.deferred;
            return dfd.pipe.apply(dfd, arguments);
        };
        var always = function() {
            var dfd = this._.deferred;
            dfd.always.apply(dfd, arguments);
            return this;
        };
        var isResolved = function() {
            return this._.deferred.isResolved;
        };
        var promise = function() {
            return this._.deferred.promise();
        };
        return function(object) {
            object._.deferred = new timbre.utils.Deferred(object);
            object.then = then.bind(object);
            object.done = done.bind(object);
            object.fail = fail.bind(object);
            object.pipe = pipe.bind(object);
            object.always = always.bind(object);
            object.promise = promise.bind(object);
            Object.defineProperty(object, "isResolved", {
                get: isResolved.bind(object)
            });
        };
    })();
    timbre.fn.deferred = __deferred;
    
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
    timbre.fn.onended = __onended;
    
    // borrowed from node.js
    var EventEmitter = (function() {
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
                    listeners[i].apply(this.context, args);
                }
                return true;
            } else {
                return false;
            }
        };
        
        $.addListener = function(type, listener) {
            if (typeof listener !== "function") {
                throw new Error("addListener only takes instances of Function");
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
            if (typeof listener !== "function") {
                throw new Error("once only takes instances of Function");
            }
            var self = this;
            function g() {
                self.removeListener(type, g);
                listener.apply(self.context, arguments);
            }
            g.listener = listener;
            
            self.on(type, g);
            
            return this;
        };
        
        $.removeListener = function(type, listener) {
            if (typeof listener !== "function") {
                throw new Error("removeListener only takes instances of Function");
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
        
        return EventEmitter;
    })();
    timbre.utils.EventEmitter = EventEmitter;
    
    var Deferred = (function() {
        var STATUS_PENDING  = 0;
        var STATUS_RESOLVED = 1;
        var STATUS_REJECTED = 2;
        
        function Deferred(context) {
            this.context = context;
            this._ = { status:STATUS_PENDING, doneList:[], failList:[] };
        }
        
        var $ = Deferred.prototype;
        
        Object.defineProperties($, {
            isResolved: {
                get: function() {
                    return this._.status === STATUS_RESOLVED;
                }
            },
            isRejected: {
                get: function() {
                    return this._.status === STATUS_REJECTED;
                }
            }
        });
        
        var done = function(status, list, args) {
            if (this._.status === STATUS_PENDING) {
                this._.status = status;
                var c = this.context;
                for (var i = 0, imax = list.length; i < imax; ++i) {
                    list[i].apply(c, args);
                }
                // this._.doneList = this._.failList = null;
            }
        };
        
        $.resolve = function() {
            done.call(this, STATUS_RESOLVED, this._.doneList, arguments);
            return this;
        };
        
        $.reject = function() {
            done.call(this, STATUS_REJECTED, this._.failList, arguments);
            return this;
        };
        
        $.promise = function() {
            return new Promise(this);
        };
        
        $.then = function(done, fail) {
            return this.done(done).fail(fail);
        };
        
        $.done = function() {
            var args = slice.call(arguments);
            var status = this._.status;
            var doneList = this._.doneList;
            for (var i = 0, imax = args.length; i < imax; ++i) {
                if (typeof args[i] === "function") {
                    if (status === STATUS_RESOLVED) {
                        args[i]();
                    } else if (status === STATUS_PENDING) {
                        doneList.push(args[i]);
                    }
                }
            }
            return this;
        };
        
        $.fail = function() {
            var args = slice.call(arguments);
            var status = this._.status;
            var failList = this._.failList;
            for (var i = 0, imax = args.length; i < imax; ++i) {
                if (typeof args[i] === "function") {
                    if (status === STATUS_REJECTED) {
                        args[i]();
                    } else if (status === STATUS_PENDING) {
                        failList.push(args[i]);
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
        
        $.pipe = function(done, fail) {
            var dfd = new Deferred();
            
            this.then(function() {
                var res = done.apply(this.context || this, arguments);
                if (isDeferred(res)) {
                    dfd.context = res;
                    res.then(function() {
                        dfd.resolve.apply(dfd, arguments);
                    });
                }
            }.bind(this), function() {
                if (typeof fail === "function") {
                    var res = fail.apply(this.contex || this, arguments);
                    if (isDeferred(res)) {
                        dfd.context = res;
                        res.fail(function() {
                            dfd.reject.apply(dfd, arguments);
                        });
                    }
                } else {
                    dfd.reject.apply(dfd, arguments);
                }
            }.bind(this));
            
            return dfd.promise();
        };
        
        var isDeferred = function(x) {
            return x && typeof x.promise === "function";
        };
        
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
        
        return Deferred;
    })();
    timbre.utils.Deferred = Deferred;
    
    var Promise = (function() {
        function Promise(dfd) {
            this.then = then.bind(dfd);
            this.done = done.bind(dfd);
            this.fail = fail.bind(dfd);
            this.pipe = pipe.bind(dfd);
            this.always  = always.bind(dfd);
            this.promise = promise.bind(this);
        }
        var then = function(done, fail) {
            return this.then(done, fail);
        };
        var done = function() {
            return this.done.apply(this, arguments);
        };
        var fail = function() {
            return this.fail.apply(this, arguments);
        };
        var pipe = function() {
            return this.pipe.apply(this, arguments);
        };
        var always = function() {
            return this.always.apply(this, arguments);
        };
        var promise = function() {
            return this;
        };
        return Promise;
    })();
    
    // root object
    var TimbreObject = (function() {
        function TimbreObject(_args) {
            this._ = {}; // private members
            this._.events = new EventEmitter(this);
            this._.emit   = this._.events.emit.bind(this._.events);
            
            if (isDictionary(_args[0])) {
                var params = _args.shift();
                this.once("init", function() {
                    this.set(params);
                });
            }
            
            this.seq_id = -1;
            this.cell   = new Float32Array(_sys.cellsize);
            this.inputs = _args.map(timbre);
            
            this._.ar  = true;
            this._.mul = 1;
            this._.add = 0;
            this._.dac = null;
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
            if (_sys.seq_id !== this.seq_id) {
                this.seq(_sys.seq_id);
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
        
        //
        $.set = function(key, value) {
            var x, desc;
            switch (typeof key) {
            case "string":
                x = Object.getPrototypeOf(this);
                while (x !== null) {
                    if ((desc = Object.getOwnPropertyDescriptor(x, key)) !== undefined) {
                        if (!desc.configurable) {
                            this[key] = value;
                        }
                        break;
                    }
                    x = Object.getPrototypeOf(x);
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
            var x = Object.getPrototypeOf(this);
            while (x !== null) {
                if (Object.getOwnPropertyDescriptor(x, key) !== undefined) {
                    return this[key];
                }
                x = Object.getPrototypeOf(x);
            }
        };
        
        $.bang = function() {
            this._.emit("bang");
            return this;
        };
        
        $.seq = function() {
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
                this._.emit("play");
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
        
        $.ar = function() {
            if (!this._.kronly) {
                this._.ar = true;
                this._.emit("ar", true);
            }
            return this;
        };
        
        $.kr = function() {
            if (!this._.aronly) {
                this._.ar = false;
                this._.emit("ar", false);
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
                
                context.rect(offset_x, offset_y, width + 1, height);
                context.clip();
                
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
        
        ChannelObject.prototype.seq = function(seq_id) {
            if (this.seq_id !== seq_id) {
                this.seq_id = seq_id;
                this._.parent.seq(seq_id);
            }
            return this.cell;
        };
        
        return ChannelObject;
    })();
    
    var NumberWrapper = (function() {
        function NumberWrapper(_args) {
            TimbreObject.call(this, _args.slice(1));
            __fixKR(this);
            
            this.value = _args[0];
            
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
            TimbreObject.call(this, _args.slice(1));
            __fixKR(this);
            
            this.value = _args[0];
            
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
            this._.args  = _args.slice(1);
            this._.value = 0;
            
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
        
        $.bang = function(arg) {
            var _ = this._;
            var x = _.func.call(this, arg);
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
        var MODE_CLIP = 0;
        var MODE_WRAP = 1;
        var MODE_FOLD = 2;
        
        function ArrayWrapper(_args) {
            TimbreObject.call(this, _args.slice(1));
            __fixKR(this);
            
            this._.index = 0;
            this._.array = _args[0].map(timbre);
            this._.elem =  this._.array[0] || timbre(0);
            this._.clipMode = MODE_WRAP;
            this._.modeName = "wrap";
            this._.withBang = false;
            
            this._.ignoreFirstBang      = false;
            this._.savedIgnoreFirstBang = false;
        }
        __extend(ArrayWrapper);
        
        var $ = ArrayWrapper.prototype;
        
        Object.defineProperties($, {
            array: {
                set: function(value) {
                    var _ = this._;
                    if (isArray(value)) {
                        _.array = value.map(timbre);
                        _.index = 0;
                        _.elem  = _.array[0] || timbre(0);
                        _.ignoreFirstBang = _.savedIgnoreFirstBang;
                    }
                },
                get: function() {
                    return this._.array;
                }
            },
            index: {
                set: function(value) {
                    if (typeof value === "number") {
                        var _ = this._;
                        var i = ClipFunctions[_.clipMode](value, _.array.length);
                        _.index = value;
                        _.elem  = _.array[i] || timbre(0);
                    }
                },
                get: function() {
                    var _ = this._;
                    return ClipFunctions[_.clipMode](_.index, _.array.length);
                }
            },
            clipMode: {
                set: function(value) {
                    var _ = this._;
                    switch (value) {
                    case "clip":
                        _.clipMode = MODE_CLIP;
                        _.modeName = value;
                        break;
                    case "wrap":
                        _.clipMode = MODE_WRAP;
                        _.modeName = value;
                        break;
                    case "fold":
                        _.clipMode = MODE_FOLD;
                        _.modeName = value;
                        break;
                    }
                    var i = ClipFunctions[_.clipMode](_.index, _.array.length);
                    _.elem  = _.array[i] || timbre(0);
                },
                get: function() {
                    return this._.modeName;
                }
            },
            withBang: {
                set: function(value) {
                    this._.withBang = !!value;
                },
                get: function() {
                    return this._.withBang;
                }
            },
            ignoreFirstBang: {
                set: function(value) {
                    this._.ignoreFirstBang = this._.savedIgnoreFirstBang = !!value;
                },
                get: function() {
                    return this._.savedIgnoreFirstBang;
                }
            },
            length: {
                get: function() {
                    return this._.array.length;
                }
            },
            current: {
                get: function() {
                    return this._.elem;
                }
            }
        });
        
        $.bang = function() {
            var _ = this._;

            if (_.ignoreFirstBang) {
                _.ignoreFirstBang = false;
                return this;
            }
            
            _.index += 1;
            
            var i = ClipFunctions[_.clipMode](_.index, _.array.length);
            _.elem = _.array[i] || timbre(0);
            _.emit("bang");
            
            if (_.withBang) {
                _.elem.bang();
            }
            
            return this;
        };
        
        $.seq = function(seq_id) {
            var cell = this.cell;
            var _ = this._;
            
            if (this.seq_id !== seq_id) {
                this.seq_id = seq_id;
                
                var mul = _.mul, add = _.add;
                var i, imax = cell.length;
                
                var object = _.array[ClipFunctions[_.clipMode](_.index, _.array.length)];
                
                cell.set(object.seq(seq_id));

                for (i = imax; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            }
            
            return cell;
        };
        
        
        var ClipFunctions = [
            function(index, length) {
                return index < 0 ? 0 : index < (length-1) ? index : (length-1);
            },
            function(index, length) {
                if (index < 0 || length <= index) {
                    index %= length;
                    if (index < 0) {
                        index += length;
                    }
                }
                return index;
            },
            function(index, length) {
                length -= 1;
                if (index < 0 || length <= index) {
                    var length2 = length << 1;
                    index %= length2;
                    if (index < 0) {
                        index += length2;
                    }
                    if (index > length) {
                        index = length2 - index;
                    }
                }
                return index;
            }
        ];
        
        return ArrayWrapper;
    })();
    
    var ObjectWrapper = (function() {
        function ObjectWrapper() {
            TimbreObject.call(this, []);
        }
        __extend(ObjectWrapper);
        
        return ObjectWrapper;
    })();
    
    
    var timevalue = function(str) {
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
                bpm = timbre.bpm;
            } else {
                bpm = +m[1];
                if (bpm < 5 || 300 < bpm) {
                    bpm = timbre.bpm;
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
                bpm = timbre.bpm;
            } else {
                bpm = +m[1];
                if (bpm < 5 || 300 < bpm) {
                    bpm = timbre.bpm;
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
                bpm = timbre.bpm;
            } else {
                bpm = +m[1];
                if (bpm < 5 || 300 < bpm) {
                    bpm = timbre.bpm;
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
    timbre.utils.timevalue = timevalue;
    
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
            var self = this;
            _sys.nextTick(function() {
                if (_sys.inlets.indexOf(self) === -1) {
                    _sys.inlets.push(self);
                    _sys.emit("addObject");
                    self._.isPlaying = true;
                    self._.emit("play");
                }
            });
            return this;
        };
        
        $.pause = function() {
            if (_sys.inlets.indexOf(this) !== -1) {
                this._.remove_check = true;
                _sys.nextTick(function() {
                    _sys.emit("removeObject");
                });
                this._.isPlaying = false;
                this._.emit("pause");
            }
            return this;
        };
        
        $.seq = function(seq_id) {
            var _ = this._;
            var cell  = this.cell;
            var cellL = this.cellL;
            var cellR = this.cellR;
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var add = _.add, mul = _.mul;
            var tmp, tmpL, tmpR, x;
            
            if (this.seq_id !== seq_id) {
                this.seq_id = seq_id;
                
                for (j = jmax; j--; ) {
                    cellL[j] = cellR[j] = cell[j] = 0;
                }
                
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i];
                    tmp.seq(seq_id);
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
            this.seq_id = 0;
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
            
            this.reset();
        }
        __extend(SoundSystem, EventEmitter);
        
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
                        this.sampleRate = this.impl.defaultSamplerate;
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
                this.emit("play");
            }
            return this;
        };
        
        $.pause = function() {
            if (this.status === STATUS_PLAY) {
                this.status = STATUS_NONE;
                this.impl.pause();
                this.emit("pause");
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
            this.on("addObject", function() {
                if (this.status === STATUS_NONE) {
                    if (this.inlets.length > 0 || this.timers.length > 0) {
                        this.play();
                    }
                }
            });
            this.on("removeObject", function() {
                if (this.status === STATUS_PLAY) {
                    if (this.inlets.length === 0 && this.timers.length === 0) {
                        this.pause();
                    }
                }
            });
            if (this.status === STATUS_REC) {
                if (this._.deferred) {
                    this._.deferred.reject();
                }
                this._.deferred = null;
            }
            return this;
        };
        
        $.process = function() {
            var seq_id = this.seq_id;
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
                ++seq_id;
                
                for (j = 0, jmax = timers.length; j < jmax; ++j) {
                    timers[j].seq(seq_id);
                }
                
                for (j = 0, jmax = inlets.length; j < jmax; ++j) {
                    x = inlets[j];
                    x.seq(seq_id);
                    tmpL = x.cellL;
                    tmpR = x.cellR;
                    for (k = 0, i = saved_i; k < kmax; ++k, ++i) {
                        strmL[i] += tmpL[k];
                        strmR[i] += tmpR[k];
                    }
                }
                saved_i = i;
                
                for (j = 0, jmax = listeners.length; j < jmax; ++j) {
                    listeners[j].seq(seq_id);
                }
                
                for (j = timers.length; j--; ) {
                    if (timers[j]._.remove_check) {
                        timers[j]._.remove_check = null;
                        timers.splice(j, 1);
                    }
                }
                for (j = inlets.length; j--; ) {
                    if (inlets[j]._.remove_check) {
                        inlets[j]._.remove_check = null;
                        inlets.splice(j, 1);
                    }
                }
                for (j = listeners.length; j--; ) {
                    if (listeners[j]._.remove_check) {
                        listeners[j]._.remove_check = null;
                        listeners.splice(j, 1);
                    }
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
            
            this.seq_id = seq_id;
            
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
            if (this.status !== STATUS_NONE) {
                // throw error??
                console.log("status is not none", this.status);
                return;
            }
            if (this._.deferred) {
                console.warn("rec deferred is exists??");
                // throw error??
                return;
            }
            
            var i = 0, args = arguments;
            var opts = isDictionary(args[i]) ? args[i++] : {};
            var func = args[i];
            
            if (typeof func !== "function") {
                // throw error??
                console.warn("no function");
                return;
            }
            
            this.status = STATUS_REC;
            this.reset();
            
            this._.deferred = new Deferred(this);
            
            var rec_inlet = new SystemInlet();
            var inlet_dfd = new Deferred(this);
            
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
        
        $.then = function() {
            var dfd = this._.deferred || new Deferred().resolve().promise();
            dfd.then.apply(dfd, arguments);
        };

        $.done = function() {
            var dfd = this._.deferred || new Deferred().resolve().promise();
            dfd.done.apply(dfd, arguments);
        };
        
        $.fail = function() {
            var dfd = this._.deferred || new Deferred().resolve().promise();
            dfd.fail.apply(dfd, arguments);
        };
        
        $.always = function() {
            var dfd = this._.deferred || new Deferred().resolve().promise();
            dfd.alywas.apply(dfd, arguments);
        };
        
        $.promise = function() {
            var dfd = this._.deferred || new Deferred().resolve();
            return dfd.promise();
        };
        
        $.ready = function() {
            return Deferred.when.apply(null, arguments);
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
                var interval = sys.streamsize / sys.samplerate * 1000;
                
                onaudioprocess = function() {
                    var inL = sys.strmL, inR = sys.strmR,
                        i = interleaved.length, j = inL.length;
                    sys.process();
                    while (j--) {
                        interleaved[--i] = inR[j];
                        interleaved[--i] = inL[j];
                    }
                    audio.mozWriteAudio(interleaved);
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
