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
        
        instance.emit("init");
        
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
                return _sys.isPlaying;
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
    
    // borrowed from coffee-script
    var __extend = function(child, parent) {
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
    
    var __nextTick = = function(func) {
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

    var __stereo = function(object) {
        object.L = new TimbreObject([]);
        object.R = new TimbreObject([]);
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
                    self.emit("start");
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
                    self.emit("stop");
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
                        self.emit("listen");
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
                        self.emit("unlisten");
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
    
    // borrowed from node.js
    var EventEmitter = (function() {
        function EventEmitter() {
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
                    handler.call(this);
                    break;
                case 2:
                    handler.call(this, arguments[1]);
                    break;
                case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                default:
                    args = slice.call(arguments, 1);
                    handler.apply(this, args);
                }
                return true;
            } else if (isArray(handler)) {
                args = slice.call(arguments, 1);
                var listeners = handler.slice();
                for (var i = 0, imax = listeners.length; i < imax; ++i) {
                    listeners[i].apply(this, args);
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
                listener.apply(self, arguments);
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
            if (!isArray(_.events[type])) {
                return [_.events[type]];
            }
            return _.events[type].slice();
        };
        
        return EventEmitter;
    })();
    
    // root object
    var TimbreObject = (function() {
        function TimbreObject(_args) {
            this._ = {}; // private members
            
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
        __extend(TimbreObject, EventEmitter);
        
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
                        this.emit("setMul", value);
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
                        this.emit("setAdd", value);
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
                this.emit("append", list);
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
                    this.emit("remove", list);
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
                this.emit("remove", list);
            }
            return this;
        };

        $.removeAtIndex = function(index) {
            var item = this.inputs[index];
            if (item) {
                this.inputs.splice(index, 1);
                this.emit("remove", [item]);
            }
            return this;
        };
        
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
            this.emit("bang");
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
                this.emit("play");
            }
            return this;
        };
        
        $.pause = function() {
            var dac = this._.dac;
            if (dac) {
                if (dac.inputs.indexOf(this) !== -1) {
                    dac.remove(this);
                    this.emit("pause");
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
                this.emit("ar", true);
            }
            return this;
        };
        
        $.kr = function() {
            if (!this._.aronly) {
                this._.ar = false;
                this.emit("ar", false);
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
            $.plot = function() {};
        }
        
        return TimbreObject;
    })();
    timbre.Object = TimbreObject;
    
    var NumberWrapper = (function() {
        function NumberWrapper(_args) {
            TimbreObject.call(this, []);
            __fixKR(this);
            
            this.value = _args[0];
            this._.ar = false;
            
            this.on("setAdd", changeTheValue);
            this.on("setMul", changeTheValue);
        }
        __extend(NumberWrapper, TimbreObject);
        
        var changeTheValue = function() {
            var _ = this._;
            var x = _.value * _.mul + _.add;
            var cell = this.cell;
            for (var i = cell.length; i--; ) {
                cell[i] = x;
            }
        };
        Object.defineProperty(changeTheValue, "unremovable", {
            value:true, writable:false
        });
        
        var $ = NumberWrapper.prototype;
        
        Object.defineProperties($, {
            value: {
                set: function(value) {
                    if (typeof value === "number") {
                        this._.value = isNaN(value) ? 0 : value;
                        changeTheValue.call(this);
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
            this._.ar = false;
            
            this.on("setAdd", changeTheValue);
            this.on("setMul", changeTheValue);
        }
        __extend(BooleanWrapper, TimbreObject);
        
        var changeTheValue = function() {
            var _ = this._;
            var x = _.value * _.mul + _.add;
            var cell = this.cell;
            for (var i = cell.length; i--; ) {
                cell[i] = x;
            }
        };
        Object.defineProperty(changeTheValue, "unremovable", {
            value:true, writable:false
        });
        
        var $ = BooleanWrapper.prototype;
        
        Object.defineProperties($, {
            value: {
                set: function(value) {
                    if (typeof value === "number") {
                        this._.value = value ? 1 : 0;
                        changeTheValue.call(this);
                    }
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
            
            this.value  = _args[0];
            this._.args = _args.slice(1);
            this._.ar = false;
        }
        __extend(FunctionWrapper, TimbreObject);
        
        var $ = FunctionWrapper.prototype;
        
        Object.defineProperties($, {
            value: {
                set: function(value) {
                    if (typeof value === "function") {
                        this._.value = value;
                    }
                },
                get: function() {
                    return this._.value;
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
            var x = _.value.call(this, arg);
            if (typeof x === "number") {
                var i, cell = this.cell;
                x = x * _.mul + _.add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
            this.emit("bang");
            return this;
        };
        
        return FunctionWrapper;
    })();
    
    var ArrayWrapper = (function() {
        function ArrayWrapper() {
            TimbreObject.call(this, []);
        }
        __extend(ArrayWrapper, TimbreObject);
        
        return ArrayWrapper;
    })();
    
    var ObjectWrapper = (function() {
        function ObjectWrapper() {
            TimbreObject.call(this, []);
        }
        __extend(ObjectWrapper, TimbreObject);
        
        return ObjectWrapper;
    })();
    
    var SystemInlet = (function() {
        function SystemInlet(object) {
            TimbreObject.call(this, []);
            this.inputs.push(object);
            this.on("append", onappend);
            __stereo(this);
        }
        __extend(SystemInlet , TimbreObject);
        
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
                set: function() {
                },
                get: function() {
                    return this;
                }
            }
        });
        
        $.play = function() {
            var self = this;
            _sys.nextTick(function() {
                if (_sys.inlets.indexOf(self) === -1) {
                    _sys.inlets.push(self);
                    _sys.emit("addObject");
                    self.emit("play");
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
                this.emit("pause");
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
            this.seq_id = 0;
            this.impl = null;
            this.amp  = 0.8;
            this.isPlaying  = false;
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
            if (!this.isPlaying) {
                this.isPlaying  = true;
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
            if (this.isPlaying) {
                this.isPlaying = false;
                this.impl.pause();
                this.emit("pause");
            }
            return this;
        };
        
        $.reset = function() {
            this._.events = null;
            this.currentTime = 0;
            this.nextTicks = [];
            this.inlets    = [];
            this.timers    = [];
            this.listeners = [];
            this.on("addObject", function() {
                if (!this.isPlaying) {
                    if (this.inlets.length > 0 || this.timers.length > 0) {
                        this.play();
                    }
                }
            });
            this.on("removeObject", function() {
                if (this.isPlaying) {
                    if (this.inlets.length === 0 && this.timers.length === 0) {
                        this.pause();
                    }
                }
            });
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
        };
        
        $.nextTick = function(func) {
            if (!this.isPlaying) {
                func();
            } else {
                this.nextTicks.push(func);
            }
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
            this.play  = function() {};
            this.pause = function() {};
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
