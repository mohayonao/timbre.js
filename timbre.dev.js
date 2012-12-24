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
(function(timbre) {
    "use strict";
    
    function Add(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(Add);
    
    var $ = Add.prototype;
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
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
                    tmp = inputs[i].seq(seq_id);
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
                    tmp += inputs[i].seq(seq_id)[0];
                }
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    timbre.fn.register("+", Add);
})(timbre);
(function(timbre) {
    "use strict";
    
    timbre.fn.register("audio", function(_args) {
        var instance = timbre.apply(null, ["buffer"].concat(_args));
        
        timbre.fn.deferred(instance);
        
        instance._.isLoaded = false;
        instance._.isEnded  = true;
        instance._.loadedTime  = 0;
        
        Object.defineProperties(instance, {
            src: {
                set: function(value) {
                    var _ = this._;
                    if (_.value !== value) {
                        if (typeof value === "string") {
                            this._.src = value;
                            this._.isLoaded = false;
                        } else if (timbre.envtype === "browser" && value instanceof File) {
                            this._.src = value;
                            this._.isLoaded = false;
                        }
                    }
                },
                get: function() {
                    return this._.src;
                }
            },
            isLoaded: {
                get: function() {
                    return this._.isLoaded;
                }
            },
            loadedTime: {
                get: function() {
                    return this._.loadedTime;
                }
            }
        });
        
        instance.load = load;
        
        return instance;
    });
    
    
    var load = (function() {
        if (timbre.envtype === "browser") {
            return getLoadFunctionForBrowser();
        } else if (timbre.envtype === "node") {
            return getLoadFunctionForNodeJS();
        } else {
            return timbre.fn.nop;
        }
    })();
    
    
    function getLoadFunctionForBrowser() {
        return function() {
            var self = this, _ = this._;
            
            if (_.deferred.isResolve) {
                // throw error ??
                return this;
            }
            
            var args = arguments, i = 0;
            if (typeof args[i] === "string") {
                _.src = args[i++];
            } else if (args[i] instanceof File) {
                _.src = args[i++];
            }
            if (!_.src) {
                // throw error ??
                return this;
            }
            
            var dfd = _.deferred;
            
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
            
            var src = _.src;
            var decoderList;
            
            if (typeof src === "string") {
                if (src !== "") {
                    var noUseByteData = false;
                    if (/.*\.wav/.test(src)) {
                        decoderList = [wav_decoder];
                    } else {
                        if (webkit_decoder) {
                            decoderList = [webkit_decoder];
                        } else if (moz_decoder) {
                            decoderList = [moz_decoder];
                            noUseByteData = true;
                        }
                    }
                    
                    if (noUseByteData) {
                        then.call(this, decoderList, src, dfd);
                        this._.emit("load");
                    } else {
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", src, true);
                        xhr.responseType = "arraybuffer";
                        xhr.onload = function() {
                            if (xhr.status === 200) {
                                then.call(self, decoderList,
                                          new Uint8Array(xhr.response), dfd);
                            } else {
                                var msg = xhr.status + " " + xhr.statusText;
                                self._.emit("error", msg);
                                dfd.reject();
                            }
                        };
                        xhr.send();
                        this._.emit("load");
                    }
                } else {
                    dfd.reject();
                }
            } else if (src instanceof File) {
                // TODO:
                var reader = new FileReader();
                reader.onload = function() {
                    then.call(this, null,
                              new Uint8Array(xhr.response), dfd);
                };
                reader.readAsArrayBuffer(src);
                this._.emit("load");
            }
            return this;
        };
    }
    
    
    function getLoadFunctionForNodeJS() {
        return function() {
            var fs = require("fs");
            var self = this, _ = this._;
            
            if (_.deferred.isResolve) {
                // throw error ??
                return this;
            }
            
            var args = arguments, i = 0;
            if (typeof args[i] === "string") {
                _.src = args[i++];
            }
            if (!_.src) {
                // throw error ??
                return this;
            }
            
            var dfd = _.deferred;
            
            if (typeof args[i] === "function") {
                dfd.done(args[i++]);
                if (typeof args[i] === "function") {
                    dfd.fail(args[i++]);
                }
            }
            
            _.loadedTime = 0;
            
            var src = _.src;
            
            if (typeof src === "string") {
                fs.exists(src, function(exists) {
                    if (!exists) {
                        var msg = "file does not exists";
                        self._.emit("error", msg);
                        dfd.reject();
                    }
                    
                    if (/.*\.ogg/.test(src)) {
                        then.call(self, [node_ogg_decoder], src, dfd);
                    } else if (/.*\.mp3/.test(src)) {
                        then.call(self, [node_mp3_decoder], src, dfd);
                    } else {
                        fs.readFile(src, function(err, data) {
                            if (err) {
                                var msg = "can't read file";
                                self._.emit("error", msg);
                                return dfd.reject();
                            }
                            var decoderList;
                            if (typeof src === "string") {
                                if (/.*\.wav/.test(src)) {
                                    decoderList = [wav_decoder];
                                }
                            }
                            then.call(self, decoderList,
                                      new Uint8Array(data), dfd);
                        });
                    }
                });
                this._.emit("load");
            }
            return this;
        };
    }
    
    
    
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
    
    
    var then = function(decoderList, data, dfd) {
        var self = this;
        
        // TODO:
        if (!decoderList) {
            return dfd.reject();
        }
        
        var onloadedmetadata = function(result) {
            var _ = self._;
            if (result) {
                _.samplerate = result.samplerate;
                _.buffer     = result.buffer;
                _.phase      = 0;
                _.phaseIncr  = result.samplerate / timbre.samplerate;
                _.duration   = result.duration * 1000;
                _.loadedTime = _.duration;
                _.isEnded    = false;
                _.currentTime = 0;
                if (_.isReversed) {
                    _.phaseIncr *= -1;
                    _.phase = result.buffer.length + _.phaseIncr;
                }
                self._.emit("loadedmetadata");
            } else {
                iter();
            }
        };
        
        var onloadeddata = function() {
            self._.emit("loadeddata");
            dfd.resolve();
        };
        
        var iter = function() {
            if (decoderList.length > 0) {
                var decoder = decoderList.shift();
                if (decoder) {
                    decoder.call(self, data, onloadedmetadata, onloadeddata);
                } else {
                    iter();
                }
            } else {
                self._.emit("error", "can't decode");
                dfd.reject();
            }
        };
        iter();
    };
    
    var webkit_decoder = (function() {
        if (typeof webkitAudioContext !== "undefined") {
            var ctx = new webkitAudioContext();
            return function(data, onloadedmetadata, onloadeddata) {
                var samplerate, duration, buffer;
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
                
                this._.isLoaded  = true;
                this._.plotFlush = true;
                
                onloadeddata();
            };
        }
    })();
    
    var moz_decoder = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(data, onloadedmetadata, onloadeddata) {
                var self = this;
                var samplerate, duration, buffer;
                var writeIndex = 0;
                
                var audio = new Audio(data);
                audio.volume = 0.0;
                audio.speed  = 2;
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
                            self._.loadedTime = samples.length * 1000 / samplerate;
                        }, false);
                    } else {
                        audio.addEventListener("MozAudioAvailable", function(e) {
                            var samples = e.frameBuffer;
                            for (var i = 0, imax = samples.length; i < imax; ++i) {
                                buffer[writeIndex++] = samples[i];
                            }
                            self._.loadedTime = samples.length * 1000 / samplerate;
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
                    self._.isLoaded  = true;
                    self._.plotFlush = true;
                    onloadeddata();
                }, false);
                audio.addEventListener("error", function() {
                    self._.emit("error");
                }, false);
                audio.load();
            };
        }
    })();
    
    var wav_decoder = function(data, onloadedmetadata, onloadeddata) {
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
        
        this._.isLoaded  = true;
        this._.plotFlush = true;
        
        onloadeddata();
    };
    
    var node_ogg_decoder = function(filepath, onloadedmetadata) {
        onloadedmetadata(false);
    };
    
    var node_mp3_decoder = function(filepath, onloadedmetadata, onloadeddata) {
        var fs   = require("fs");
        var lame = require("lame");
        var self = this;
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

            self._.isLoaded  = true;
            self._.plotFlush = true;
            
            onloadeddata();
        });
        fs.createReadStream(filepath).pipe(decoder);
    };
})(timbre);
(function(timbre) {
    "use strict";
    
    function FFTListener(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.listener(this);
        timbre.fn.stereo(this);
        timbre.fn.fixAR(this);
        
        this.real = this.L;
        this.imag = this.R;
        
        this._.fft = new FFT(timbre.cellsize * 2);
        this._.fftCell  = new Float32Array(this._.fft.length);
        this._.prevCell = new Float32Array(timbre.cellsize);
        
        this._.plotFlush = true;
        this._.plotRange = [0, 0.5];
        this._.plotBarStyle = true;
    }
    timbre.fn.extend(FFTListener);
    
    var $ = FFTListener.prototype;
    
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;

        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            _.fftCell.set(_.prevCell);
            _.fftCell.set(cell, jmax);
            _.fft.forward(_.fftCell);
            _.prevCell.set(cell);
            
            var real = this.cellL;
            var imag = this.cellR;
            var _real = _.fft.real;
            var _imag = _.fft.imag;
            
            for (j = jmax; j--; ) {
                real[j] = _real[j];
                imag[j] = _imag[j];
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
    
    timbre.fn.register("fft", FFTListener);
    
    
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
    
    FFT.prototype.setWindow = function(key) {
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
    
    FFT.prototype.forward = function(_buffer) {
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
    
    FFT.prototype.inverse = function(_real, _imag) {
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
    
    timbre.utils.FFT = FFT;
})(timbre);
(function(timbre) {
    "use strict";
    
    function Biquad(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixAR(this);
        
        this._.biquad = new BiquadFilter({samplerate:timbre.samplerate});
        
        this._.plotRange = [0, 1.2];
        this._.plotFlush = true;
        
        this.once("init", oninit);
    }
    timbre.fn.extend(Biquad);
    
    var oninit = function() {
        if (!this._.freq) {
            this.freq = 340;
        }
        if (!this._.Q) {
            this.Q = 1;
        }
        if (!this._.gain) {
            this.gain = 0;
        }
    };
    
    var $ = Biquad.prototype;
    
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
        Q: {
            set: function(value) {
                this._.Q = timbre(value);
            },
            get: function() {
                return this._.Q;
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var changed = false;
            
            var freq = _.freq.seq(seq_id)[0];
            if (_.prevFreq !== freq) {
                _.prevFreq = freq;
                changed = true;
            }
            var Q = _.Q.seq(seq_id)[0];
            if (_.prevQ !== Q) {
                _.prevQ = Q;
                changed = true;
            }
            var gain = _.gain.seq(seq_id)[0];
            if (_.prevGain !== gain) {
                _.prevGain = gain;
                changed = true;
            }
            if (changed) {
                _.biquad.setParams(freq, Q, gain);
                _.plotFlush = true;
            }
            
            var inputs = this.inputs;
            var tmp;
            var i, imax;
            var j;
            var mul = _.mul, add = _.add;
            
            for (j = cell.length; j--; ) {
                cell[j] = 0;
            }
            for (i = 0, imax = inputs.length; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = cell.length; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            _.biquad.process(cell);
            
            for (j = cell.length; j--; ) {
                cell[j] = cell[j] * mul + add;
            }
        }
        
        return cell;
    };
    
    var fft = new timbre.utils.FFT(256);
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var biquad = new BiquadFilter({type:this.type,samplerate:timbre.samplerate});
            biquad.setParams(this.freq.valueOf(), this.Q.valueOf(), this.gain.valueOf());
            
            var impluse = new Float32Array(256);
            impluse[0] = 1;
            
            biquad.process(impluse);
            fft.forward(impluse);
            
            this._.plotData  = fft.spectrum;
            this._.plotFlush = null;
        }
        return super_plot.call(this, opts);
    };
    
    
    function BiquadFilter(opts) {
        opts = opts || {};
        
        this.samplerate = opts.samplerate || 44100;
        this.frequency = 340;
        this.Q = 1;
        this.gain = 0;
        
        this.x1 = this.x2 = this.y1 = this.y2 = 0;
        this.b0 = this.b1 = this.b2 = this.a1 = this.a2 = 0;
        
        this.setType(setParams[opts.type] ? opts.type : "LPF");
    }
    
    BiquadFilter.prototype.process = function(cell) {
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
    
    BiquadFilter.prototype.setType = function(type) {
        var f;
        if ((f = setParams[type])) {
            this.type = type;
            f.call(this, this.frequency, this.Q, this.gain);
        }
    };
    
    BiquadFilter.prototype.setParams = function(frequency, Q, dbGain) {
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
    
    setParams.LPF = setParams.lowpass;
    setParams.HPF = setParams.highpass;
    setParams.BPF = setParams.bandpass;
    setParams.BEF = setParams.notch;
    setParams.BRF = setParams.notch;
    setParams.APF = setParams.allpass;
    
    timbre.fn.register("biquad", Biquad);
    
    timbre.fn.register("lowpass", function(_args) {
        return new Biquad(_args).set("type", "lowpass");
    });
    timbre.fn.register("highpass", function(_args) {
        return new Biquad(_args).set("type", "highpass");
    });
    timbre.fn.register("bandpass", function(_args) {
        return new Biquad(_args).set("type", "bandpass");
    });
    timbre.fn.register("lowshelf", function(_args) {
        return new Biquad(_args).set("type", "lowshelf");
    });
    timbre.fn.register("highshelf", function(_args) {
        return new Biquad(_args).set("type", "highshelf");
    });
    timbre.fn.register("peaking", function(_args) {
        return new Biquad(_args).set("type", "peaking");
    });
    timbre.fn.register("notch", function(_args) {
        return new Biquad(_args).set("type", "notch");
    });
    timbre.fn.register("allpass", function(_args) {
        return new Biquad(_args).set("type", "allpass");
    });
    
    timbre.fn.alias("LPF", "lowpass");
    timbre.fn.alias("HPF", "highpass");
    timbre.fn.alias("BPF", "bandpass");
    timbre.fn.alias("BEF", "notch");
    timbre.fn.alias("BRF", "notch");
    timbre.fn.alias("APF", "allpass");
    
    timbre.utils.BiquadFilter = BiquadFilter;
})(timbre);
(function(timbre) {
    "use strict";
    
    function SoundBuffer(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixAR(this);
        
        this._.isLooped   = false;
        this._.isReversed = false;
        this._.duration    = 0;
        this._.currentTime = 0;
        this._.currentTimeIncr = this.cell.length * 1000 / timbre.samplerate;
        this._.samplerate  = 44100;
        this._.phase = 0;
        this._.phaseIncr = 0;
        this._.pitch = timbre(1);
    }
    timbre.fn.extend(SoundBuffer);
    
    var $ = SoundBuffer.prototype;
    
    var setBuffer = function(value) {
        var _ = this._;
        if (!_.buffer && typeof value === "object") {
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
                _.phaseIncr = _.samplerate / timbre.samplerate;
                _.duration  = _.buffer.length * 1000 / _.samplerate;
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
                this._.isLooped = !!value;
            },
            get: function() {
                return this._.isLooped;
            }
        },
        isReversed: {
            set: function(value) {
                var _ = this._;
                _.isReversed = !!value;
                if (_.isReversed) {
                    if (_.phaseIncr > 0) {
                        _.phaseIncr *= -1;
                    }
                    if (_.phase === 0) {
                        _.phase = _.buffer.length + _.phaseIncr;
                    }
                } else {
                    if (_.phaseIncr < 0) {
                        _.phaseIncr *= -1;
                    }
                }
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
        
        instance._.samplerate = _.samplerate;
        if (_.buffer) {
            setBuffer.call(instance, _.buffer.subarray(begin, end));
        }
        instance.isLooped   = this.isLooped;
        instance.isReversed = this.isReversed;
        
        return instance;
    };
    
    $.reversed = function() {
        this.isReversed = !this._.isReversed;
        return this;
    };
    
    $.bang = function() {
        this._.phase   = 0;
        this._.isEnded = false;
        this._.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (!_.isEnded && _.buffer) {
                var pitch  = _.pitch.seq(seq_id)[0];
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
                        timbre.fn.nextTick(onlooped.bind(this));
                    } else {
                        timbre.fn.nextTick(onended.bind(this));
                    }
                } else if (phase < 0) {
                    if (_.isLooped) {
                        timbre.fn.nextTick(onlooped.bind(this));
                    } else {
                        timbre.fn.nextTick(onended.bind(this));
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
        timbre.fn.onended(this, 0);
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
    
    timbre.fn.register("buffer", SoundBuffer);
})(timbre);
(function(timbre) {
    "use strict";

    function Clip(_args) {
        timbre.Object.call(this, _args);
        
        this._.lv = 0.8;
    }
    timbre.fn.extend(Clip);
    
    var $ = Clip.prototype;
    
    Object.defineProperties($, {
        lv: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.lv = Math.abs(value);
                }
            },
            get: function() {
                return this._.lv;
            }
        }
    });
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var mul = _.mul, add = _.add;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var lv = _.lv;
            var tmp, x;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            if (_.ar) { // audio-rate
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                for (j = jmax; j--; ) {
                    x = cell[j];
                    x = (x < -lv) ? -lv : (x > lv) ? lv : x;
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
                    tmp += inputs[i].seq(seq_id)[0];
                }
                tmp = (tmp < -lv) ? -lv : (tmp > lv) ? lv : tmp;
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    timbre.fn.register("clip", Clip);
    
})(timbre);
(function(timbre) {
    "use strict";
    
    var timevalue = timbre.utils.timevalue;
    
    function EfxDelayNode(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixAR(this);
        
        this._.delay = new EfxDelay();
        
        this.once("init", oninit);
    }
    timbre.fn.extend(EfxDelayNode);
    
    var oninit = function() {
        if (!this._.time) {
            this.time = 100;
        }
        if (!this._.feedback) {
            this.feedback = 0.25;
        }
        if (!this._.wet) {
            this.wet = 0.2;
        }
    };
    
    var $ = EfxDelayNode.prototype;
    
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
        feedback: {
            set: function(value) {
                this._.feedback = timbre(value);
            },
            get: function() {
                return this._.feedback;
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;

        if (this.seq_id !== seq_id) {

            var changed = false;
            var feedback = _.feedback.seq(seq_id)[0];
            if (_.prevFeedback !== feedback) {
                _.prevFeedback = feedback;
                changed = true;
            }
            var wet = _.wet.seq(seq_id)[0];
            if (_.prevWet !== wet) {
                _.prevWet = wet;
                changed = true;
            }
            if (changed) {
                _.delay.setParams({feedback:feedback, wet:wet});
            }
            
            var inputs = this.inputs;
            var tmp;
            var i, imax;
            var j;
            var mul = _.mul, add = _.add;
            
            for (j = cell.length; j--; ) {
                cell[j] = 0;
            }
            for (i = 0, imax = inputs.length; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = cell.length; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            _.delay.process(cell, true);
            
            for (j = cell.length; j--; ) {
                cell[j] = cell[j] * mul + add;
            }
        }
        
        return cell;
    };
    
    
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
    
    EfxDelay.prototype.setParams = function(opts) {
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
    
    EfxDelay.prototype.process = function(_cell, overwrite) {
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
    
    timbre.utils.EfxDelay = EfxDelay;
    
    timbre.fn.register("efx.delay", EfxDelayNode);
})(timbre);
(function(timbre) {
    "use strict";
    
    function EfxDistortion(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixAR(this);
        
        this.once("init", oninit);
    }
    timbre.fn.extend(EfxDistortion);
    
    var oninit = function() {
        if (!this._.preGain) {
            this.preGain = -60;
        }
        if (!this._.postGain) {
            this.postGain = 18;
        }
    };
    
    var $ = EfxDistortion.prototype;
    
    Object.defineProperties($, {
        preGain: {
            set: function(value) {
                this._.preGain = timbre(value);
            },
            get: function() {
                return this._.preGain;
            }
        },
        postGain: {
            set: function(value) {
                this._.postGain = timbre(value);
            },
            get: function() {
                return this._.postGain;
            }
        }
    });
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs  = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            var changed = false;

            var preGain = _.preGain.seq(seq_id)[0];
            if (_.prevPreGain !== preGain) {
                _.prevPreGain = preGain;
                changed = true;
            }
            var postGain = _.postGain.seq(seq_id)[0];
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
            var x;
            
            for (j = jmax; j--; ) {
                x = cell[j] * preScale;
                x = (x > limit) ? limit : (x < -limit) ? -limit : x;
                cell[j] = x * mul + add;
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("efx.dist", EfxDistortion);
})(timbre);
(function(timbre) {
    "use strict";
    
    var ZERO = 1e-6;
    var timevalue = timbre.utils.timevalue;
    
    function Envelope(_args) {
        timbre.Object.call(this, _args);
        
        this._.value   = ZERO;
        this._.index   = 0;
        this._.samples = 0;
        this._.curve   = CurveTypeNone;
        this._.goalValue = ZERO;
        this._.variation = 0;
        this._.status = StatusWait;
        this._.releaseNode = null;
        this._.loopNode    = null;
        this._.defaultCurve = CurveTypeLin;
        this._.curveName = "linear";
        this._.initValue = ZERO;
        this._.table = [];
        
        this._.kr = true;
        
        this._.plotFlush = true;
    }
    timbre.fn.extend(Envelope);
    
    var CurveTypeNone = 0;
    var CurveTypeLin  = 1;
    var CurveTypeExp  = 2;
    var StatusWait    = 0;
    var StatusGate    = 1;
    var StatusSustain = 2;
    var StatusRelease = 3;
    var StatusEnd     = 4;
    
    var $ = Envelope.prototype;
    
    Object.defineProperties($, {
        table: {
            set: function(value) {
                if (Array.isArray(value)) {
                    this._.originaltable = value;
                    buildTable.call(this, value);
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.originaltable;
            }
        },
        curve: {
            set: function(value) {
                switch (value) {
                case "linear": case "lin":
                    this._.defaultCurve = CurveTypeLin;
                    this._.curveName = value;
                    break;
                case "exponential": case "exp":
                    this._.defaultCurve = CurveTypeExp;
                    this._.curveName = value;
                    break;
                }
            },
            get: function() {
                return this._.curveName;
            }
        },
        index: {
            get: function() {
                return this._.index;
            }
        },
        releaseNode: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.releaseNode = value - 1;
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.releaseNode + 1;
            }
        },
        loopNode: {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.loopNode = value - 1;
                    this._.plotFlush = true;
                }
            },
            get: function() {
                return this._.loopNode + 1;
            }
        }
    });
    
    var buildTable = function(list) {
        var _ = this._;
        var i, imax;
        if (list.length === 0) {
            _.initValue = ZERO;
            _.table     = [];
            return;
        }
        
        _.initValue = list[0] || ZERO;
        _.table     = [];
        
        var table = _.table;
        var value, time, curve;
        for (i = 1, imax = list.length; i < imax; ++i) {
            value = list[i][0] || ZERO;
            time  = list[i][1];
            curve = list[i][2];
            
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

            switch (curve) {
            case "linear": case "lin":
                curve = CurveTypeLin;
                break;
            case "exponential": case "exp":
                curve = CurveTypeExp;
                break;
            default:
                curve = null;
                break;
            }
            
            table.push([value, time, curve]);
        }
    };
    
    $.reset = function() {
        var _ = this._;
        
        _.value = _.goalValue = _.initValue;
        _.index = 0;
        
        _.samples = 0;
        _.curve   = CurveTypeNone;
        _.variation = 0;
        _.status = StatusWait;
        return this;
    };
    
    $.release = function() {
        var _ = this._;
        _.samples = 0;
        _.status = StatusRelease;
        _.emit("released");
        return this;
    };
    
    $.bang = function() {
        var _ = this._;
        this.reset();
        _.status = StatusGate;
        _.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs  = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp;

            if (inputs.length) {
                for (j = jmax; j--; ) {
                    cell[j] = 0;
                }
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
            } else {
                for (j = jmax; j--; ) {
                    cell[j] = 1;
                }
            }
            
            var items, samples;
            var time, value;
            var emit = false;
            
            switch (_.status) {
            case StatusWait:
            case StatusEnd:
                break;
            case StatusGate:
            case StatusRelease:
                while (_.samples <= 0) {
                    if (_.index >= _.table.length) {
                        if (_.status === StatusGate && _.loopNode !== null) {
                            _.index = _.loopNode;
                            continue;
                        }
                        _.samples = Infinity;
                        _.curve   = CurveTypeNone;
                        emit = "ended";
                        continue;
                    } else if (_.status === StatusGate && _.index === _.releaseNode) {
                        if (_.loopNode !== null && _.loopNode < _.releaseNode) {
                            _.index = _.loopNode;
                            continue;
                        }
                        _.status  = StatusSustain;
                        _.samples = Infinity;
                        _.curve   = CurveTypeNone;
                        emit = "sustained";
                        continue;
                    }
                    items = _.table[_.index++];
                    
                    _.goalValue = items[0];
                    if (items[2] === null) {
                        _.curve = _.defaultCurve;
                    } else {
                        _.curve = items[2];
                    }
                    time = items[1];
                    
                    samples = time * 0.001 * timbre.samplerate;
                    if (samples > 0) {
                        if (_.curve === CurveTypeExp) {
                            _.variation = Math.pow(
                                _.goalValue / _.value, 1 / (samples / cell.length)
                            );
                        } else {
                            _.curve = CurveTypeLin;
                            _.variation = (_.goalValue - _.value) / (samples / cell.length);
                        }
                        _.samples += samples;
                    }
                }
                break;
            }
            
            value = _.value;
            for (j = jmax; j--; ) {
                cell[j] = (cell[j] * value) * mul + add;
            }
            
            switch (_.curve) {
            case CurveTypeLin:
                _.value += _.variation;
                break;
            case CurveTypeExp:
                _.value *= _.variation;
                break;
            }
            _.value = _.value || ZERO;
            _.samples -= cell.length;
            
            if (emit) {
                if (emit === "ended") {
                    timbre.fn.nextTick(onended.bind(this));
                } else {
                    this._.emit(emit, _.value);
                }
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        timbre.fn.onended(this, 0);
    };
    
    var super_plot = timbre.Object.prototype.plot;
    
    $.plot = function(opts) {
        if (this._.plotFlush) {
            var plotter = new EnvPlotter(this);
            var data = plotter.plot(256);
            
            var totalDuration    = plotter.totalDuration;
            var loopBeginTime    = plotter.loopBeginTime;
            var releaseBeginTime = plotter.releaseBeginTime;
            
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
            for (var i = 0, imax = data.length; i < imax; ++i) {
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
    timbre.fn.register("env", Envelope);
    
    function EnvPlotter(env) {
        this.initValue = env._.initValue;
        this.table     = env._.table;
        this.tableIndex   = 0;
        this.loopNode     = env._.loopNode;
        this.releaseNode  = env._.releaseNode;
        this.defaultCurve = env._.defaultCurve;
        this.sustainTime = 1000;
        this.value = this.nextValue = 0;
        this.index = this.nextIndex = 0;
        this.duration = 0;
        this.loopBeginTime    = Infinity;
        this.releaseBeginTime = Infinity;
        this.status = 0; // 0:gate, 1:release
        this.isEndlessLoop = false;
        
        var totalDuration = 0;
        for (var i = 0, imax = this.table.length; i < imax; ++i) {
            if (this.loopNode === i) {
                this.loopBeginTime = totalDuration;
            }
            if (this.releaseNode === i) {
                totalDuration += this.sustainTime;
                this.releaseBeginTime = totalDuration;
            }
            
            var items = this.table[i];
            if (Array.isArray(items)) {
                totalDuration += items[1];
            }
        }
        if (this.loopBeginTime !== Infinity && this.releaseBeginTime === Infinity) {
            totalDuration += this.sustainTime;
            this.isEndlessLoop = true;
        }
        
        this.totalDuration = totalDuration;
    }
    
    EnvPlotter.prototype.plot = function(size) {
        this.data = new Float32Array(size);
        this.dt = this.data.length / this.totalDuration;
        
        this.value = this.initValue;
        
        while (this.duration < this.totalDuration) {
            if (this.status === 0 && this.duration < this.releaseBeginTime) {
                if (this.tableIndex === this.releaseNode) {
                    if (this.loopNode) {
                        this.tableIndex = this.loopNode;
                    } else {
                        this.tableIndex -= 1;
                    }
                }
            }
            var items = this.table[this.tableIndex];
            if (!items) {
                break;
            }
            this.fillValues(items);
            this.tableIndex += 1;
            if (this.isEndlessLoop && this.tableIndex === this.table.length) {
                this.tableIndex = this.loopNode;
            }
        }
        return this.data;
    };
    
    EnvPlotter.prototype.fillValues = function(items) {
        var nextValue = items[0] || ZERO;
        var duration  = items[1] || 0;
        var nextIndex = this.index + (duration * this.dt)|0;
        var curve = (items[2] === null) ? this.defaultCurve : items[2];
        
        var durationIncr;
        if (this.index === nextIndex) {
            durationIncr = 1 / this.dt;
            nextIndex += 1;
        } else {
            durationIncr = duration / (nextIndex - this.index);
        }
        
        var dx;
        if (curve === CurveTypeLin) {
            dx = (nextValue - this.value) / (nextIndex - this.index);
        } else if (curve === CurveTypeExp) {
            dx = Math.pow(
                nextValue / this.value, 1 / (nextIndex - this.index)
            );
        }
        
        var lastIndex = Math.min(nextIndex, this.data.length);
        while (this.index < lastIndex) {
            this.data[this.index] = this.value;
            if (curve === CurveTypeLin) {
                this.value += dx;
            } else if (curve === CurveTypeExp) {
                this.value *= dx;
            }
            this.duration += durationIncr;
            this.index += 1;
            if (this.status === 0 && this.releaseBeginTime <= this.duration) {
                this.tableIndex = this.releaseNode - 1;
                this.status = 1; // release
                break;
            }
        }

        nextIndex = (this.data.length * (this.duration / this.totalDuration))|0;
        while (this.index < nextIndex) {
            this.data[this.index++] = this.value;
        }
    };
    
    var isDictionary = function(x) {
        return (typeof x === "object" && x.constructor === Object);
    };
    
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
    
    
    timbre.fn.register("perc", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime", timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "decayTime" , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"     );
        
        opts.table = [ZERO, [lv, a], [ZERO, r]];
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    timbre.fn.register("adsr", function(_args) {
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
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    timbre.fn.register("asr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var r  = envValue(opts,   10, 1000, "r" , "releaseTime" , timevalue);
        
        opts.table = [ZERO, [s, a], [ZERO, r]];
        opts.releaseNode = 2;
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    timbre.fn.register("dadsr", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var dl = envValue(opts,   10,  100, "dl", "delayTime"   , timevalue);
        var a  = envValue(opts,   10,   10, "a" , "attackTime"  );
        var d  = envValue(opts,   10,  300, "d" , "decayTime"   , timevalue);
        var s  = envValue(opts, ZERO,  0.5, "s" , "sustainLevel");
        var r  = envValue(opts,   10, 1000, "r" , "relaseTime"  , timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"       );
        
        opts.table = [ZERO, [ZERO, dl], [lv, a], [s, d], [ZERO, r]];
        opts.releaseNode = 4;
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    timbre.fn.register("linen", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var a  = envValue(opts,   10,   10, "a" , "attackTime" , timevalue);
        var s  = envValue(opts,   10, 1000, "s" , "sustainTime", timevalue);
        var r  = envValue(opts,   10, 1000, "r" , "releaseTime", timevalue);
        var lv = envValue(opts, ZERO,    1, "lv", "level"      );
        
        opts.table = [ZERO, [lv, a], [lv, s], [ZERO, r]];
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    timbre.fn.register("env.tri", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var dur = envValue(opts,   20, 1000, "dur", "duration", timevalue);
        var lv  = envValue(opts, ZERO,    1, "lv" , "level"   );
        
        dur *= 0.5;
        opts.table = [ZERO, [lv, dur], [ZERO, dur]];
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
    timbre.fn.register("env.cutoff", function(_args) {
        if (!isDictionary(_args[0])) {
            _args.unshift({});
        }
        
        var opts = _args[0];
        var r  = envValue(opts,   10, 100, "r" , "relaseTime", timevalue);
        var lv = envValue(opts, ZERO,   1, "lv", "level"    );
        
        opts.table = [lv, [ZERO, r]];
        
        return timbre.apply(null, ["env"].concat(_args));
    });
    
})(timbre);
(function(timbre) {
    "use strict";
    
    var FFT = timbre.utils.FFT;
    
    function IFFT(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixAR(this);
        
        this._.fft = new FFT(timbre.cellsize * 2);
        this._.fftCell    = new Float32Array(this._.fft.length);
        this._.realBuffer = new Float32Array(this._.fft.length);
        this._.imagBuffer = new Float32Array(this._.fft.length);
    }
    timbre.fn.extend(IFFT);
    
    var $ = IFFT.prototype;
    
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (_.real && _.imag) {
                var real = _.realBuffer;
                var imag = _.imagBuffer;
                var _real = _.real.seq(seq_id);
                var _imag = _.imag.seq(seq_id);
                var j, jmax = cell.length;
                var mul = _.mul, add = _.add;
                
                real.set(_real);
                imag.set(_imag);
                
                cell.set(_.fft.inverse(real, imag).subarray(0, cell.length));
                
                for (j = jmax; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("ifft", IFFT);

})(timbre);
(function(timbre) {
    "use strict";

    var timevalue = timbre.utils.timevalue;

    var TYPE_TIMER    = 0;
    var TYPE_INTERVAL = 1;
    
    function Interval(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.timer(this);
        timbre.fn.fixKR(this);
        
        this._.count = 0;
        this._.timeout = Infinity;
        this._.currentTime = 0;
        this._.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        this._.delaySamples = 0;
        this._.countSamples = 0;
        this._.isEnded = false;
        
        this.once("init", oninit);
        this.on("start", onstart);
    }
    timbre.fn.extend(Interval);
    
    var oninit = function() {
        if (this._.originkey === "timer") {
            this._.type = TYPE_TIMER;
            timbre.fn.deferred(this);
        } else {
            this._.type = TYPE_INTERVAL;
        }
        if (!this._.interval) {
            this.interval = 1000;
        }
        if (this._.delay === undefined) {
            if (this._.originkey === "interval") {
                this.delay = this.interval.valueOf();
            } else {
                this.delay = 0;
            }
        }
    };
    
    var onstart = function() {
        this._.currentTime = 0;
        this._.isEnded = false;
    };
    Object.defineProperty(onstart, "unremovable", {
        value:true, writable:false
    });
    
    var $ = Interval.prototype;
    
    Object.defineProperties($, {
        interval: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
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
        _.currentTime = 0;
        _.delaySamples = (timbre.samplerate * (_.delay * 0.001))|0;
        _.countSamples = _.count = _.currentTime = 0;
        _.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        
        var _ = this._;
        
        if (_.isEnded) {
            return cell;
        }
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (_.delaySamples > 0) {
                _.delaySamples -= cell.length;
            }
            _.interval.seq(seq_id);
            
            if (_.delaySamples <= 0) {
                _.countSamples -= cell.length;
                if (_.countSamples <= 0) {
                    _.countSamples += (timbre.samplerate * _.interval.valueOf() * 0.001)|0;
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
                timbre.fn.nextTick(onended.bind(this));
            }
        }
        return cell;
    };
    
    var onended = function() {
        var _ = this._;
        _.isEnded = true;
        if (_.type === TYPE_TIMER && !this.isResolved) {
            var stop = this.stop;
            this.start = this.stop = timbre.fn.nop;
            _.emit("ended");
            _.deferred.resolve();
            stop.call(this);
        } else {
            this.stop();
            _.emit("ended");
        }
    };
    
    timbre.fn.register("interval", Interval);
    timbre.fn.alias("interval0", "interval");
    timbre.fn.alias("timer", "interval");
    
})(timbre);
(function(timbre) {
    "use strict";
    
    function Map(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixKR(this);
        
        this._.inMin  = 0;
        this._.inMax  = 1;
        this._.outMin = 0;
        this._.outMax = 1;
        
        this.once("init", oninit);
    }
    timbre.fn.extend(Map);
    
    var oninit = function() {
        if (!this._.warp) {
            this.warp = "linlin";
        }
    };
    
    var $ = Map.prototype;
    
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs  = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var x;
            
            x = 0;
            for (i = 0; i < imax; ++i) {
                x += inputs[i].seq(seq_id)[0];
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
    
    timbre.fn.register("map", Map);
})(timbre);
(function(timbre) {
    "use strict";
    
    function Mul(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(Mul);
    
    var $ = Mul.prototype;
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
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
                    tmp = inputs[i].seq(seq_id);
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
                    tmp *= inputs[i].seq(seq_id)[0];
                }
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("*", Mul);
})(timbre);
(function(timbre) {
    "use strict";
    
    function Noise(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(Noise);
    
    var $ = Noise.prototype;

    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
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
    
    timbre.fn.register("noise", Noise);
})(timbre);
(function(timbre) {
    "use strict";
    
    var timevalue = timbre.utils.timevalue;
    
    function Oscillator(_args) {
        timbre.Object.call(this, _args);
        
        this._.phase = 0;
        this._.x     = 0;
        this._.coeff = 1024 / timbre.samplerate;
        
        this.once("init", oninit);
    }
    timbre.fn.extend(Oscillator);
    
    var oninit = function() {
        var _ = this._;
        if (!_.wave) {
            this.wave = "sin";
        }
        if (!_.freq) {
            this.freq = 440;
        }
        this._.plotData = this._.wave;
        this._.plotLineWidth = 2;
        this._.plotCyclic = true;
        this._.plotBefore = plotBefore;
    };
    
    var $ = Oscillator.prototype;
    
    Object.defineProperties($, {
        wave: {
            set: function(value) {
                if (!this._.wave) {
                    this._.wave = new Float32Array(1024);
                }
                var dx, wave = this._.wave;
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
                } else if (typeof value === "string") {
                    if ((dx = this.getWavetable(value)) !== undefined) {
                        this._.wave = dx;
                    }
                }
            },
            get: function() {
                return this._.wave;
            }
        },
        freq: {
            set: function(value) {
                if (typeof value === "string") {
                    value = timevalue(value);
                    if (value <= 0) {
                        return;
                    }
                    value = 1000 / value;
                }
                this._.freq = timbre(value);
            },
            get: function() {
                return this._.freq;
            }
        },
        phase: {
            set: function(value) {
                if (typeof value === "number") {
                    while (value >= 1.0) {
                        value -= 1.0;
                    }
                    while (value <  0.0) {
                        value += 1.0;
                    }
                    this._.phase = value;
                    this._.x = 1024 * this._.phase;
                }
            },
            get: function() {
                return this._.phase;
            }
        }
    });
    
    $.bang = function() {
        this._.x = 1024 * this._.phase;
        this._.emit("bang");
        return this;
    };

    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;

            var inputs  = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp;
            
            if (inputs.length) {
                for (j = jmax; j--; ) {
                    cell[j] = 0;
                }
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
            } else {
                for (j = jmax; j--; ) {
                    cell[j] = 1;
                }
            }
            
            var freq = _.freq.seq(seq_id);
            var wave = _.wave, x   = _.x, coeff = _.coeff;
            var index, delta, x0, x1, xx, dx;
            
            if (_.ar) { // audio-rate
                if (_.freq.isAr) {
                    for (j = 0; j < jmax; ++j) {
                        index = x|0;
                        delta = x - index;
                        x0 = wave[index & 1023];
                        x1 = wave[(index+1) & 1023];
                        cell[j] *= ((1.0 - delta) * x0 + delta * x1);
                        x += freq[j] * coeff;
                    }
                } else { // _.freq.isKr
                    dx = freq[0] * coeff;
                    for (j = 0; j < jmax; ++j) {
                        index = x|0;
                        delta = x - index;
                        x0 = wave[index & 1023];
                        x1 = wave[(index+1) & 1023];
                        cell[j] *= ((1.0 - delta) * x0 + delta * x1);
                        x += dx;
                    }
                }
            } else {    // control-rate
                index = x|0;
                delta = x - index;
                x0 = wave[index & 1023];
                x1 = wave[(index+1) & 1023];
                xx = ((1.0 - delta) * x0 + delta * x1);
                for (j = jmax; j--; ) {
                    cell[j] *= xx;
                }
                x += freq[0] * coeff * jmax;
            }
            while (x > 1024) {
                x -= 1024;
            }
            _.x = x;
            
            for (j = jmax; j--; ) {
                cell[j] = cell[j] * mul + add;
            }
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
        if (width !== undefined) {
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
    
    Oscillator.getWavetable = $.getWavetable = function(key) {
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
    
    Oscillator.setWavetable = $.setWavetable = function(name, value) {
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
    
    var Wavetables = Oscillator.Wavetables = {
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
    
    timbre.fn.register("osc", Oscillator);
    
    timbre.fn.register("sin", function(_args) {
        return new Oscillator(_args).set("wave", "sin");
    });
    timbre.fn.register("cos", function(_args) {
        return new Oscillator(_args).set("wave", "cos");
    });
    timbre.fn.register("pulse", function(_args) {
        return new Oscillator(_args).set("wave", "pulse");
    });
    timbre.fn.register("tri", function(_args) {
        return new Oscillator(_args).set("wave", "tri");
    });
    timbre.fn.register("saw", function(_args) {
        return new Oscillator(_args).set("wave", "saw");
    });
    timbre.fn.register("fami", function(_args) {
        return new Oscillator(_args).set("wave", "fami");
    });
    timbre.fn.register("konami", function(_args) {
        return new Oscillator(_args).set("wave", "konami");
    });
    timbre.fn.register("+sin", function(_args) {
        return new Oscillator(_args).set("wave", "+sin");
    });
    timbre.fn.register("+pulse", function(_args) {
        return new Oscillator(_args).set("wave", "+pulse");
    });
    timbre.fn.register("+tri", function(_args) {
        return new Oscillator(_args).set("wave", "+tri");
    });
    timbre.fn.register("+saw", function(_args) {
        return new Oscillator(_args).set("wave", "+saw");
    });
    
    timbre.fn.alias("square", "pulse");
})(timbre);
(function(timbre) {
    "use strict";
    
    function Panner(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.stereo(this);
        timbre.fn.fixAR(this);
        
        this._.panL = 0.5;
        this._.panR = 0.5;
        
        this.once("init", oninit);
    }
    timbre.fn.extend(Panner);
    
    var oninit = function() {
        if (!this._.value) {
            this.value = 0;
        }
    };
    
    var $ = Panner.prototype;
    
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var changed = false;
            
            var value = _.value.seq(seq_id)[0];
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
                tmp = inputs[i].seq(seq_id);
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
    
    timbre.fn.register("pan", Panner);
})(timbre);
(function(timbre) {
    "use strict";
    
    var timevalue = timbre.utils.timevalue;
    
    function ParamEvent(type, value, time) {
        this.type  = type;
        this.value = value;
        this.time  = time;
    }
    ParamEvent.None                   = 0;
    ParamEvent.SetValue               = 1;
    ParamEvent.LinearRampToValue      = 2;
    ParamEvent.ExponentialRampToValue = 3;
    ParamEvent.SetValueCurve          = 4;
    
    function Param(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixKR(this);
        
        this._.value = 0;
        this._.minvalue = -Infinity;
        this._.maxValue = +Infinity;
        
        this._.eventtype = ParamEvent.None;
        this._.currentTime = 0;
        this._.currentTimeIncr = this.cell.length * 1000 / timbre.samplerate;
        
        this._.schedules = [];
        
        this.on("setAdd", __changeWithValue);
        this.on("setMul", __changeWithValue);
    }
    timbre.fn.extend(Param);

    var __changeWithValue = timbre.fn.changeWithValue;
    
    var $ = Param.prototype;
    
    Object.defineProperties($, {
        value: {
            set: function(value) {
                if (typeof value === "number") {
                    var _ = this._;
                    value = (value < _.minvalue) ?
                        _.minvalue : (value > _.maxValue) ? _.maxValue : value;
                    _.value = isNaN(value) ? 0 : value;
                    _.eventtype = ParamEvent.None;
                    __changeWithValue.call(this);
                }
            },
            get: function() {
                return this._.value;
            }
        },
        minValue: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.minValue = value;
                }
            },
            get: function() {
                return this._.minValue;
            }
        },
        maxValue: {
            set: function(value) {
                if (typeof value === "number") {
                    this._.maxValue = value;
                }
            },
            get: function() {
                return this._.maxValue;
            }
        }
    });
    
    var insertEvent = function(schedules, type, value, time) {
        schedules.push(new ParamEvent(type, value, time));
    };
    
    $.setValueAtTime = function(value, time) {
        var _ = this._;
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(_.schedules, ParamEvent.SetValue, value, time);
        }
        return this;
    };
    $.setAt = $.setValueAtTime;
    
    $.linearRampToValueAtTime = function(value, time) {
        var _ = this._;
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(_.schedules, ParamEvent.LinearRampToValue, value, time);
        }
        return this;
    };
    $.lineTo = $.linearRampToValueAtTime;
    
    $.exponentialRampToValueAtTime = function(value, time) {
        var _ = this._;
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(_.schedules, ParamEvent.ExponentialRampToValue, value, time);
        }
        return this;
    };
    $.expTo = $.exponentialRampToValueAtTime;
    
    $.cancelScheduledValues = function(time) {
        if (typeof time === "string") {
            time = timevalue(time);
        }
        if (typeof time === "number") {
            var s = this._.schedules;
            for (var i = 0, imax = s.length; i < imax; ++i) {
                if (time <= s[i].time) {
                    s.splice(i);
                    if (i === 0) {
                        this._.eventtype = ParamEvent.None;
                    }
                    break;
                }
            }
        }
        return this;
    };
    $.cancel = $.cancelScheduledValues;
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var schedules = _.schedules;
            var e, samples;
            
            while (_.eventtype === ParamEvent.None && schedules.length > 0) {
                e = schedules.shift();
                switch (e.type) {
                case ParamEvent.SetValue:
                    _.eventtype = ParamEvent.SetValue;
                    _.goalValue = e.value;
                    _.goalTime  = e.time + _.currentTime;
                    _.isEnded = false;
                    break;
                case ParamEvent.LinearRampToValue:
                    samples = e.time * 0.001 * timbre.samplerate;
                    if (samples > 0) {
                        _.eventtype = ParamEvent.LinearRampToValue;
                        _.goalValue = e.value;
                        _.goalTime  = e.time + _.currentTime;
                        _.variation = (e.value - _.value) / (samples / cell.length);
                        _.isEnded = false;
                    }
                    break;
                case ParamEvent.ExponentialRampToValue:
                    samples = e.time * 0.001 * timbre.samplerate;
                    if (_.value !== 0 && samples > 0) {
                        _.eventtype = ParamEvent.ExponentialRampToValue;
                        _.goalValue = e.value;
                        _.goalTime  = e.time + _.currentTime;
                        _.variation = Math.pow(e.value/_.value, 1/(samples/cell.length));
                        _.isEnded = false;
                    }
                    break;
                }
            }
            
            var changed = false;
            var i, x;

            if (!_.isEnded) {
                switch (_.eventtype) {
                case ParamEvent.LinearRampToValue:
                    if (_.currentTime < _.goalTime) {
                        _.value += _.variation;
                        changed = true;
                    }
                    break;
                case ParamEvent.ExponentialRampToValue:
                    if (_.currentTime < _.goalTime) {
                        _.value *= _.variation;
                        changed = true;
                    }
                    break;
                }
                _.currentTime += _.currentTimeIncr;
                
                if (_.eventtype !== ParamEvent.None && _.currentTime >= _.goalTime) {
                    _.value = _.goalValue;
                    if (schedules.length === 0) {
                        timbre.fn.nextTick(onended.bind(this));
                    } else {
                        timbre.fn.nextTick(onnext.bind(this));
                    }
                    changed = true;
                }
                
                if (changed) {
                    x = _.value * _.mul + _.add;
                    for (i = cell.length; i--; ) {
                        cell[i] = x;
                    }
                }
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        this._.eventtype = ParamEvent.None;
        timbre.fn.onended(this);
    };
    
    var onnext = function() {
        var _ = this._;
        _.eventtype = ParamEvent.None;
        this._.emit("next", _.value);
    };
    
    timbre.fn.register("param", Param);
})(timbre);
(function(timbre) {
    "use strict";
    
    // Voss algorithm
    // http://www.firstpr.com.au/dsp/pink-noise/
    
    var MAX_KEY = 31;
    
    function PinkNoise(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.fixAR(this);
        
        var whites = new Uint8Array(5);
        for (var i = 0; i < 5; ++i) {
            whites[i] = ((Math.random() * (1<<30))|0) % 25;
        }
        this._.whites = whites;
        this._.key = 0;
    }
    timbre.fn.extend(PinkNoise);
    
    var $ = PinkNoise.prototype;
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
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
    
    timbre.fn.register("pink", PinkNoise);
})(timbre);
(function(timbre) {
    "use strict";
    
    var timevalue = timbre.utils.timevalue;
    
    var STATUS_WAIT = 0;
    var STATUS_REC  = 1;
    
    function Recorder(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.listener(this);
        timbre.fn.fixAR(this);
        
        var _ = this._;
        
        _.timeout    = 5000;
        _.samplerate = timbre.samplerate;
        _.status     = STATUS_WAIT;
        _.writeIndex = 0;
        _.writeIndexIncr  = 1;
        _.currentTime     = 0;
        _.currentTimeIncr = 1000 / timbre.samplerate;
    }
    timbre.fn.extend(Recorder);
    
    var $ = Recorder.prototype;
    
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
        }
        return this;
    };
    
    $.stop = function() {
        var _ = this._;
        if (_.status === STATUS_REC) {
            _.status = STATUS_WAIT;
            _.emit("stop");
            timbre.fn.nextTick(onended.bind(this));
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;

        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var mul = _.mul, add = _.add;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            if (_.status === STATUS_REC) {
                var buffer  = _.buffer;
                var timeout = _.timeout;
                var writeIndex      = _.writeIndex;
                var writeIndexIncr  = _.writeIndexIncr;
                var currentTime     = _.currentTime;
                var currentTimeIncr = _.currentTimeIncr;
                
                for (j = 0; j < jmax; ++j) {
                    buffer[writeIndex|0] = cell[j];
                    writeIndex += writeIndexIncr;
                    
                    currentTime += currentTimeIncr;
                    if (timeout <= currentTime) {
                        timbre.fn.nextTick(onended.bind(this));
                    }
                }
                _.writeIndex  = writeIndex;
                _.currentTime = currentTime;
            }
            
            for (j = jmax; j--; ) {
                cell[j] = cell[j] * mul + add;
            }
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
    
    timbre.fn.register("rec", Recorder);
    
})(timbre);
(function(timbre) {
    "use strict";
    
    var timevalue = timbre.utils.timevalue;
    var FFT = timbre.utils.FFT;
    
    function FFTSpectrum(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.listener(this);
        timbre.fn.fixAR(this);
        
        this._.status  = 0;
        this._.samples = 0;
        this._.samplesIncr = 0;
        this._.writeIndex  = 0;
        
        this._.plotFlush = true;
        this._.plotRange = [0, 0.5];
        this._.plotBarStyle = true;
        
        this.once("init", oninit);
    }
    timbre.fn.extend(FFTSpectrum);
    
    var oninit = function() {
        var _ = this._;
        if (!_.fft) {
            this.size = 512;
        }
        if (!_.interval) {
            this.interval = 500;
        }
    };
    
    var $ = FFTSpectrum.prototype;
    
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;

        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            var status  = _.status;
            var samples = _.samples;
            var samplesIncr = _.samplesIncr;
            var writeIndex  = _.writeIndex;
            var buffer = _.buffer;
            var bufferLength = buffer.length;
            var mul = _.mul, add = _.add;
            var emit;
            
            for (j = 0; j < jmax; ++j) {
                if (samples <= 0) {
                    if (status === 0) {
                        status = 1;
                        writeIndex  = 0;
                        samples += samplesIncr;
                    }
                }
                if (status === 1) {
                    buffer[writeIndex++] = cell[j];
                    if (bufferLength <= writeIndex) {
                        _.fft.forward(buffer);
                        emit = _.plotFlush = true;
                        status = 0;
                    }
                }
                cell[j] = cell[j] * mul + add;
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
    
    timbre.fn.register("spectrum", FFTSpectrum);

})(timbre);

(function(timbre) {
    "use strict";
    
    function ScissorNode(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.stereo(this);
        timbre.fn.fixAR(this);
        
        this._.isLooped = false;
        this._.isEnded  = false;
    }
    timbre.fn.extend(ScissorNode);
    
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
                this._.isLooped = !!value;
                if (this._.tapeStream) {
                    this._.tapeStream.isLooped = this._.isLooped;
                }
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
    
    $.bang = function() {
        if (this._.tapeStream) {
            this._.tapeStream.reset();
        }
        this._.isEnded = false;
        this._.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell  = this.cell;
        var cellL = this.cellL;
        var cellR = this.cellR;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;

            var tapeStream = _.tapeStream;
            
            if (tapeStream) {
                var mul = _.mul, add = _.add;
                var tmp  = tapeStream.fetch(cell.length);
                var tmpL = tmp[0];
                var tmpR = tmp[1];
                for (var i = cell.length; i--; ) {
                    cellL[i] = tmpL[i] * mul + add;
                    cellR[i] = tmpR[i] * mul + add;
                    cell[i] = (cellL[i] + cellR[i]) * 0.5;
                }
            }
            
            if (!_.isEnded && tapeStream.isEnded) {
                timbre.fn.nextTick(onended.bind(this));
            }
        }
        
        return cell;
    };
    
    var onended = function() {
        timbre.fn.onended(this, 0);
    };
    
    timbre.fn.register("tape", ScissorNode);
    
    
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
    
    timbre.utils.scissor = {
        Scissor: Scissor,
        join   : Scissor.join,
        silence: Scissor.silence
    };
    
})(timbre);
(function(timbre) {
    "use strict";
    
    var timevalue = timbre.utils.timevalue;
    
    var TYPE_WAIT    = 0;
    var TYPE_TIMEOUT = 1;
    
    function Timeout(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.timer(this);
        timbre.fn.fixKR(this);
        
        this._.currentTime = 0;
        this._.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        this._.waitSamples = 0;
        this._.samples = 0;
        this._.isEnded = true;
        
        this.once("init", oninit);
        this.on("start", onstart);
    }
    timbre.fn.extend(Timeout);
    
    var oninit = function() {
        if (this._.originkey === "wait") {
            this._.type = TYPE_WAIT;
            timbre.fn.deferred(this);
        } else {
            this._.type = TYPE_TIMEOUT;
        }
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
    
    var $ = Timeout.prototype;
    
    Object.defineProperties($, {
        timeout: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "string") {
                    value = timevalue(value);
                }
                if (typeof value === "number" && value >= 0) {
                    _.timeout = value;
                    _.waitSamples = (timbre.samplerate * (value * 0.001))|0;
                    _.samples = _.waitSamples;
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
        if (_.type === TYPE_TIMEOUT) {
            _.samples     = _.waitSamples;
            _.currentTime = 0;
            _.isEnded     = false;
        }
        _.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        var _ = this._;

        if (_.isEnded) {
            return cell;
        }
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (_.samples > 0) {
                _.samples -= cell.length;
            }
            
            if (_.samples <= 0) {
                var inputs = this.inputs;
                for (var i = 0, imax = inputs.length; i < imax; ++i) {
                    inputs[i].bang();
                }
                timbre.fn.nextTick(onended.bind(this));
            }
            _.currentTime += _.currentTimeIncr;
        }
        return cell;
    };
    
    var onended = function() {
        var _ = this._;
        _.isEnded = true;
        if (_.type === TYPE_WAIT && !this.isResolved) {
            _.waitSamples = Infinity;
            _.emit("ended");
            _.deferred.resolve();
            var stop = this.stop;
            this.start = this.stop = timbre.fn.nop;
            stop.call(this);
        } else {
            _.emit("ended");
        }
    };
    
    timbre.fn.register("timeout", Timeout);
    timbre.fn.alias("wait", "timeout");
    
})(timbre);
(function(timbre) {
    "use strict";
    
    var timevalue = timbre.utils.timevalue;
    
    function WaveListener(_args) {
        timbre.Object.call(this, _args);
        timbre.fn.listener(this);
        timbre.fn.fixAR(this);
        
        this._.samples    = 0;
        this._.writeIndex = 0;
        
        this._.plotFlush = true;
        
        this.once("init", oninit);
    }
    timbre.fn.extend(WaveListener);
    
    var oninit = function() {
        if (!this._.buffer) {
            this.size = 1024;
        }
        if (!this._.interval) {
            this.interval = 1000;
        }
    };
    
    var $ = WaveListener.prototype;
    
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
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;

        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var tmp;
            
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            
            for (i = 0; i < imax; ++i) {
                tmp = inputs[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            var samples     = _.samples;
            var samplesIncr = _.samplesIncr;
            var buffer      = _.buffer;
            var writeIndex  = _.writeIndex;
            var emit = false;
            var mul = _.mul, add = _.add;
            var mask = buffer.length - 1;
            
            for (j = 0; j < jmax; ++j) {
                if (samples <= 0) {
                    buffer[writeIndex++] = cell[j];
                    writeIndex &= mask;
                    emit = _.plotFlush = true;
                    samples += samplesIncr;
                }
                cell[j] = cell[j] * mul + add;
                --samples;
            }
            _.samples    = samples;
            _.writeIndex = writeIndex;
            
            if (emit) {
                this._.emit("wave");
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
    
    timbre.fn.register("wave", WaveListener);
})(timbre);
