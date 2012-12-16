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
    
    timbre.nextTick = function(func) {
        _sys.nextTick(func);
        return timbre;
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
            if (typeof key === "string") {
                _constructors[key] = ctor;
            } else if (isArray(key)) {
                for (var i = key.length; i--; ) {
                    _constructors[key[i]] = ctor;
                }
            }
        } else {
            if (typeof key === "string") {
                _factories[key] = ctor;
            } else if (isArray(key)) {
                for (var j = key.length; j--; ) {
                    _constructors[key[j]] = ctor;
                }
            }
        }
    };
    timbre.fn.register = __register;
    
    var __getClass = function(key) {
        return _constructors[key];
    };
    timbre.fn.getClass = __getClass;
    
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
            
            var listeners = _.events[type];
            if (isArray(listeners)) {
                while (listeners.length) {
                    this.removeListener(type, listeners[listeners.length - 1]);
                }
            } else if (listeners) {
                this.removeListener(type, listeners);
            }
            _.events[type] = null;
            
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
            
            var params;
            if (isDictionary(_args[0])) {
                params = _args.shift();
                this.once("init", function() {
                    this.set(params);
                });
            } else if (_args[0] instanceof ObjectWrapper) {
                params = _args.shift();
                params.bind(this);
                this.once("init", function() {
                    params.emit("initValue", this);
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
                var list = slice.call(arguments);
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
                dac = this._.dac = timbre("dac", this);
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
            this._.ar = true;
            this.emit("ar", true);
            return this;
        };
        
        $.kr = function() {
            this._.ar = false;
            this.emit("ar", false);
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
    
    var TimbreDacObject = (function() {
        function TimbreDacObject(_args) {
            TimbreObject.call(this, _args);
            
            this.L = new Float32Array(_sys.cellsize);
            this.R = new Float32Array(_sys.cellsize);
            
            this.on("append", function(list) {
                for (var i = list.length; i--; ) {
                    list[i]._.dac = this;
                }
            });
        }
        __extend(TimbreDacObject, TimbreObject);
        
        var $ = TimbreDacObject.prototype;
        
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
                if (_sys.dacs.indexOf(self) === -1) {
                    _sys.dacs.push(self);
                    _sys.emit("addObject");
                    self.emit("play");
                }
            });
            return this;
        };
        
        $.pause = function() {
            if (_sys.dacs.indexOf(this) !== -1) {
                this._.remove_check = true;
                _sys.nextTick(function() {
                    _sys.emit("removeObject");
                });
                this.emit("pause");
            }
            return this;
        };
        
        return TimbreDacObject;
    })();
    timbre.DacObject = TimbreDacObject;
    
    var TimbreTimerObject = (function() {
        function TimbreTimerObject(_args) {
            TimbreObject.call(this, _args);
        }
        __extend(TimbreTimerObject, TimbreObject);
        
        var $ = TimbreTimerObject.prototype;
        
        $.start = function() {
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
        
        $.stop = function() {
            this._.remove_check = true;
            if (_sys.timers.indexOf(this) !== -1) {
                _sys.nextTick(function() {
                    _sys.emit("removeObject");
                });
                this.emit("stop");
            }
            return this;
        };
        
        $.play = $.pause = function() {
            return this;
        };
        
        return TimbreTimerObject;
    })();
    timbre.TimerObject = TimbreTimerObject;
    
    var TimbreListenerObject = (function() {
        function TimbreListenerObject(_args) {
            TimbreObject.call(this, _args);
        }
        __extend(TimbreListenerObject, TimbreObject);
        
        var $ = TimbreListenerObject.prototype;
        
        $.listen = function(target) {
            var self = this;
            if (target === null) {
                this._.remove_check = true;
                if (_sys.listeners.indexOf(this) !== -1) {
                    _sys.nextTick(function() {
                        _sys.emit("removeObject");
                    });
                }
            } else if (target instanceof TimbreObject) {
                _sys.nextTick(function() {
                    if (self._.remove_check) {
                        return self._.remove_check = null;
                    }
                    if (_sys.listeners.indexOf(self) === -1) {
                        self._.inputs = self.inputs;
                        self.inputs = [target];
                        _sys.listeners.push(self);
                        _sys.emit("addObject");
                    }
                });
            }
            this.emit("listen", target);
            
            return this;
        };
        
        $.play = $.pause = function() {
            return this;
        };
        
        return TimbreListenerObject;
    })();
    timbre.ListenerObject = TimbreListenerObject;
    
    var NumberWrapper = (function() {
        function NumberWrapper(_args) {
            TimbreObject.call(this, []);
            this.value = _args[0];
            this._.ar = false;
            
            this.on("setAdd", changeTheValue);
            this.on("setMul", changeTheValue);
            this.on("ar", function() { this._.ar = false; });
        }
        __extend(NumberWrapper, TimbreObject);
        
        var $ = NumberWrapper.prototype;

        var changeTheValue = function() {
            var _ = this._;
            var x = _.value * _.mul + _.add;
            var cell = this.cell;
            for (var i = cell.length; i--; ) {
                cell[i] = x;
            }
        };
        
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
            this.value = _args[0];
            this._.ar = false;
            
            this.on("setAdd", changeTheValue);
            this.on("setMul", changeTheValue);
            this.on("ar", function() { this._.ar = false; });
        }
        __extend(BooleanWrapper, TimbreObject);

        var $ = BooleanWrapper.prototype;

        var changeTheValue = function() {
            var _ = this._;
            var x = _.value * _.mul + _.add;
            var cell = this.cell;
            for (var i = cell.length; i--; ) {
                cell[i] = x;
            }
        };
        
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
            this.value = _args[0];
            this._.args = _args.slice(1);
            this._.ar = false;
            
            this.on("ar", function() { this._.ar = false; });
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
        
        $.bang = function() {
            this._.value.apply(null, this._.args);
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
        function ObjectWrapper(_args) {
            TimbreObject.call(this, []);
            
            this._.binded = [];
            this._.values = {};
            
            var dict = _args[0];
            
            for (var key in dict) {
                Object.defineProperty(this, key, {
                    set: setter(key),
                    get: getter(key)
                });
            }
            
            this.once("initValue", function(object) {
                if (object) {
                    for (var key in dict) {
                        object.set(key, dict[key]);
                    }
                }
            });
        }
        __extend(ObjectWrapper, TimbreObject);
        
        var setter = function(key) {
            return function(value) {
                var binded = this._.binded;
                this._.values[key] = value;
                for (var i = 0, imax = binded.length; i < imax; ++i) {
                    binded[i].set(key, value);
                }
            };
        };
        var getter = function(key) {
            return function() {
                return this._.values[key];
            };
        };
        
        var $ = ObjectWrapper.prototype;
        
        $.bind = function(object) {
            var _ = this._;
            if (_.binded.indexOf(object) === -1) {
                _.binded.push(object);
            }
            return this;
        };
        
        $.unbind = function(object) {
            var _ = this._, i;
            if ((i = _.binded.indexOf(object)) !== -1) {
                _.binded.splice(i, 1);
            }
            return this;
        };
        
        return ObjectWrapper;
    })();
    
    // defalut T("dac")
    (function() {
        function Dac(_args) {
            TimbreDacObject.call(this, _args);
        }
        __extend(Dac , TimbreDacObject);

        var $ = Dac.prototype;

        $.seq = function(seq_id) {
            var _ = this._;
            var cell = this.cell;
            var L = this.L, R = this.R;
            var inputs = this.inputs;
            var i, imax = inputs.length;
            var j, jmax = cell.length;
            var add = _.add, mul = _.mul;
            var tmp;
            
            if (this.seq_id !== seq_id) {
                this.seq_id = seq_id;
                
                for (j = jmax; j--; ) {
                    L[j] = R[j] = cell[j] = 0;
                }
                
                for (i = 0; i < imax; ++i) {
                    tmp = inputs[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        L[j] = R[j] = cell[j] += tmp[j] * mul + add;
                    }
                }
            }
            
            return cell;
        };
        __register("dac", Dac);
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
            this.dacs      = [];
            this.timers    = [];
            this.listeners = [];
            
            this.on("addObject", function() {
                if (!this.isPlaying) {
                    if (this.dacs.length > 0 || this.timers.length > 0) {
                        this.play();
                    }
                }
            });
            this.on("removeObject", function() {
                if (this.isPlaying) {
                    if (this.dacs.length === 0 && this.timers.length === 0) {
                        this.pause();
                    }
                }
            });
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
            var dacs      = this.dacs;
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
                
                for (j = 0, jmax = dacs.length; j < jmax; ++j) {
                    x = dacs[j];
                    x.seq(seq_id);
                    tmpL = x.L;
                    tmpR = x.R;
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
                for (j = dacs.length; j--; ) {
                    if (dacs[j]._.remove_check) {
                        dacs[j]._.remove_check = null;
                        dacs.splice(j, 1);
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
(function() {
    "use strict";
    
    function Add(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(Add, timbre.Object);
    
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
})();
(function() {
    "use strict";
    
    function AudioFile(_args) {
        timbre.Object.call(this, _args);
        
        this._.isLooped   = false;
        this._.isReversed = false;
        this._.isLoaded = false;
        this._.isEnded  = true;
        this._.duration = 0;
        this._.currentTime = 0;
        this._.currentTimeIncr = this.cell * 1000 / timbre.samplerate;
        
        this.on("ar", function() { this._.ar = true; });
    }
    timbre.fn.extend(AudioFile, timbre.Object);
    
    var $ = AudioFile.prototype;
    
    Object.defineProperties($, {
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
        isLoaded: {
            get: function() {
                return this._.isLoaded;
            }
        },
        isEnded: {
            get: function() {
                return this._.isEnded;
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
    
    $.bang = function() {
        this._.phase      = 0;
        this._.isEnded    = false;
        this.emit("bang");
        return this;
    };
    
    $.slice = function(begin, end) {
        var _ = this._;
        var instance = timbre("audio");
        
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
        instance._.buffer = _.buffer.subarray(begin, end);
        instance._.duration = (end - begin / _.samplerate) * 1000;
        instance.isLooped   = this.isLooped;
        instance.isReversed = this.isReversed;
        
        return instance;
    };
    
    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (!_.isEnded && _.buffer) {
                var buffer = _.buffer;
                var phase  = _.phase;
                var phaseIncr = _.phaseIncr;
                var mul = _.mul, add = _.add;
                
                for (var i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (buffer[phase|0] || 0) * mul + add;
                    phase += phaseIncr;
                }
                
                if (phase >= buffer.length) {
                    if (_.isLooped) {
                        phase = 0;
                        this.emit("looped");
                    } else {
                        _.isEnded = true;
                        this.emit("ended");
                    }
                } else if (phase < 0) {
                    if (_.isLooped) {
                        phase = buffer.length + phaseIncr;
                        this.emit("looped");
                    } else {
                        _.isEnded = true;
                        this.emit("ended");
                    }
                }
                _.phase = phase;
                _.currentTime += _.currentTimeIncr;
            }
        }
        
        return cell;
    };
    
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
        return AudioFile.__super__.plot.call(this, opts);
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
    
    if (timbre.envtype === "browser") {
        // bowser
        (function() {
            $.load = function() {
                var self = this, _ = this._;
                
                var args = arguments, i = 0;
                var callback = function() {};
                
                if (typeof args[i] === "string") {
                    _.src = args[i++];
                } else if (args[i] instanceof Buffer) {
                    _.src = args[i++];
                }
                if (typeof args[i] === "function") {
                    callback = args[i++];
                }
                
                if (!_.src) {
                    callback.call(this, false);
                    return this;
                }
                
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
                            then.call(this, decoderList, src, callback);
                            this.emit("loadstart");
                        } else {
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", src, true);
                            xhr.responseType = "arraybuffer";
                            xhr.onload = function() {
                                if (xhr.status === 200) {
                                    then.call(self, decoderList,
                                              new Uint8Array(xhr.response), callback);
                                } else {
                                    var msg = xhr.status + " " + xhr.statusText;
                                    self.emit("error", msg);
                                    callback.call(self, false);
                                }
                            };
                            xhr.send();
                            this.emit("loadstart");
                        }
                    } else {
                        callback.call(this, false);
                    }
                } else if (src instanceof File) {
                    // TODO:
                    var reader = new FileReader();
                    reader.onload = function() {
                        then.call(this, null,
                                  new Uint8Array(xhr.response), callback);
                    };
                    reader.readAsArrayBuffer(src);
                    this.emit("loadstart");
                }
                return this;
            };
        })();
    } else if (timbre.envtype === "node") {
        // node.js
        (function() {
            var fs = require("fs");
            $.load = function() {
                var self = this, _ = this._;
                var args = arguments, i = 0;
                var callback = function() {};
                
                if (typeof args[i] === "string") {
                    _.src = args[i++];
                } else if (args[i] instanceof Buffer) {
                    _.src = args[i++];
                }
                if (typeof args[i] === "function") {
                    callback = args[i++];
                }
                
                if (!_.src) {
                    return this;
                }
                
                var src = _.src;
                
                if (typeof src === "string") {
                    fs.exists(src, function(exists) {
                        if (!exists) {
                            var msg = "file does not exists";
                            self.emit("error", msg);
                            return callback.call(self, false);
                        }
                        
                        if (/.*\.ogg/.test(src)) {
                            then.call(self, [node_ogg_decoder], src, callback);
                        } else if (/.*\.mp3/.test(src)) {
                            then.call(self, [node_mp3_decoder], src, callback);
                        } else {
                            fs.readFile(src, function(err, data) {
                                if (err) {
                                    var msg = "can't read file";
                                    self.emit("error", msg);
                                    return callback.call(self, false);
                                }
                                var decoderList;
                                if (typeof src === "string") {
                                    if (/.*\.wav/.test(src)) {
                                        decoderList = [wav_decoder];
                                    }
                                }
                                then.call(self, decoderList,
                                          new Uint8Array(data), callback);
                            });
                        }
                    });
                    this.emit("loadstart");
                } else if (src instanceof Buffer) {
                    // TODO:
                    then.call(this, null,
                              new Uint8Array(src), callback);
                    this.emit("loadstart");
                }
                return this;
            };
            
            var node_ogg_decoder = function(filepath, done) {
                done(false);
            };
            
            var node_mp3_decoder = function(filepath, done) {
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
                    
                    done({
                        samplerate: samplerate,
                        buffer    : buffer,
                        duration  : duration
                    });

                    self._.isLoaded  = true;
                    self._.plotFlush = true;
                    self.emit("loadeddata");
                });
                fs.createReadStream(filepath).pipe(decoder);
            };
        })();
    }
    
    var then = function(decoderList, data, callback) {
        var self = this;
        
        // TODO:
        if (!decoderList) {
            return callback.call(self, false);
        }
        
        var done = function(result) {
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
                callback.call(self, true);
                self.emit("loadedmetadata");
            } else {
                iter();
            }
        };
        
        var iter = function() {
            if (decoderList.length > 0) {
                var decoder = decoderList.shift();
                if (decoder) {
                    decoder.call(self, data, done);
                } else {
                    iter();
                }
            } else {
                self.emit("error", "can't decode");
                callback.call(self, false);
            }
        };
        iter();
    };
    
    var webkit_decoder = (function() {
        if (typeof webkitAudioContext !== "undefined") {
            var ctx = new webkitAudioContext();
            return function(data, done) {
                var samplerate, duration, buffer;
                try {
                    buffer = ctx.createBuffer(data.buffer, true);
                } catch (e) {
                    return done(false);
                }
                
                samplerate = ctx.sampleRate;
                buffer     = buffer.getChannelData(0);
                duration   = buffer.length / samplerate;
                
                done({
                    samplerate: samplerate,
                    buffer    : buffer,
                    duration  : duration
                });

                this._.isLoaded  = true;
                this._.plotFlush = true;
                this.emit("loadeddata");
            };
        }
    })();
    
    var moz_decoder = (function() {
        if (typeof Audio === "function" && typeof new Audio().mozSetup === "function") {
            return function(data, done) {
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
                        done({
                            samplerate: samplerate,
                            buffer    : buffer,
                            duration  : duration
                        });
                    }, 1000);
                }, false);
                audio.addEventListener("ended", function() {
                    self._.isLoaded  = true;
                    self._.plotFlush = true;
                    self.emit("loadeddata");
                }, false);
                audio.addEventListener("error", function() {
                    self.emit("error");
                }, false);
                audio.load();
            };
        }
    })();
    
    var wav_decoder = function(data, done) {
        if (data[0] !== 0x52 || data[1] !== 0x49 ||
            data[2] !== 0x46 || data[3] !== 0x46) { // 'RIFF'
            // "HeaderError: not exists 'RIFF'"
            return done(false);
        }
        
        var l1 = data[4] + (data[5]<<8) + (data[6]<<16) + (data[7]<<24);
        if (l1 + 8 !== data.length) {
            // "HeaderError: invalid data size"
            return done(false);
        }
        
        if (data[ 8] !== 0x57 || data[ 9] !== 0x41 ||
            data[10] !== 0x56 || data[11] !== 0x45) { // 'WAVE'
            // "HeaderError: not exists 'WAVE'"
            return done(false);
        }
        
        if (data[12] !== 0x66 || data[13] !== 0x6D ||
            data[14] !== 0x74 || data[15] !== 0x20) { // 'fmt '
            // "HeaderError: not exists 'fmt '"
            return done(false);
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
            return done(false);
        }
        
        var l2 = data[40] + (data[41]<<8) + (data[42]<<16) + (data[43]<<24);
        var duration = ((l2 / channels) >> 1) / samplerate;

        if (l2 > data.length - 44) {
            // "HeaderError: not exists data"
            return done(false);
        }
        
        var buffer = new Float32Array((duration * samplerate)|0);
        
        done({
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
        this.emit("loadeddata");
    };
    
    timbre.fn.register("audio", AudioFile);
})();
(function() {
    "use strict";

    function FFTListener(_args) {
        timbre.ListenerObject.call(this, _args);
        
        this._.status  = 0;
        this._.samples = 0;
        this._.samplesIncr = 0;
        this._.writeIndex  = 0;
        
        this._.plotFlush = true;
        this._.plotRange = [0, 0.5];
        this._.plotBarStyle = true;
        
        this.once("init", function() {
            var _ = this._;
            if (!_.fft) {
                this.size = 512;
            }
            if (!_.interval) {
                this.interval = 500;
            }
        });
        
        this.on("ar", function() { this._.ar = true; });
    }
    timbre.fn.extend(FFTListener, timbre.ListenerObject);
    
    var $ = FFTListener.prototype;
    
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
                if (!this._.fft) {
                    this._.reservedwindow = value;
                } else {
                   this._.fft.setWindow(value);
                }
            },
            get: function() {
                return this._.fft.windowName;
            }
        },
        interval: {
            set: function(value) {
                var _ = this._;
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
    
    $.create = function(n) {
        return new FFT(n);
    };
    
    $.bang = function() {
        this._.samples    = 0;
        this._.writeIndex = 0;
        this.emit("bang");
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
                this.emit("fft");
            }
        }
        return cell;
    };
    
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
        return FFTListener.__super__.plot.call(this, opts);
    };
    
    
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
    
    timbre.fn.register("fft", FFTListener);
})();
(function() {
    "use strict";
    
    function Biquad(_args) {
        timbre.Object.call(this, _args);
        
        this._.biquad = new BiquadFilter({samplerate:timbre.samplerate});
        
        this._.plotRange = [0, 1.2];
        this._.plotFlush = true;

        this.once("init", function() {
            if (!this._.freq) {
                this.freq = 340;
            }
            if (!this._.Q) {
                this.Q = 1;
            }
            if (!this._.gain) {
                this.gain = 0;
            }
        });
        
        this.on("ar", function() { this._.ar = true; });
    }
    timbre.fn.extend(Biquad, timbre.Object);
    
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
    
    $.create = function(type) {
        return new BiquadFilter(type);
    };
    
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
    
    $.plot = (function() {
        var fft = timbre("fft").create(256);
        return function(opts) {
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
            return Biquad.__super__.plot.call(this, opts);
        };
    })();
    
    
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
        if ((x1 > 0 && x1 <  0.0000152587890625) || (x1 < 0 && x1 > -0.0000152587890625)) {
            x1 = 0;
        }
        if ((y1 > 0 && y1 <  0.0000152587890625) || (y1 < 0 && y1 > -0.0000152587890625)) {
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
            f.call(this, this.frequency, this.Q, this.dbGain);
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
    
    timbre.fn.register(["lowpass","LPF"], function(_args) {
        return new Biquad(_args).set("type", "lowpass");
    });
    timbre.fn.register(["highpass","HPF"], function(_args) {
        return new Biquad(_args).set("type", "highpass");
    });
    timbre.fn.register(["bandpass","BPF"], function(_args) {
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
    timbre.fn.register(["notch","BEF","BRF"], function(_args) {
        return new Biquad(_args).set("type", "notch");
    });
    timbre.fn.register(["allpass","APF"], function(_args) {
        return new Biquad(_args).set("type", "allpass");
    });
})();
(function() {
    "use strict";

    function Interval(_args) {
        var pending =  (_args[0] && _args[0].pending);
        timbre.TimerObject.call(this, _args);
        
        this._.interval = 1000;
        this._.delay    =    0;
        this._.count    =    0;
        this._.limit    = Infinity;
        this._.currentTime = 0;
        this._.currentTimeIncr = timbre.cellsize * 1000 / timbre.samplerate;
        
        this._.delaySamples = 0;
        this._.countSamples = 0;
        
        this.on("start", function() {
            this._.currentTime  = timbre.currentTime;
        });
        
        if (!pending && this.inputs.length) {
            this.once("init", function() {
                this.start();
            });
        }
        
        this.on("ar", function() { this._.ar = false; });
    }
    timbre.fn.extend(Interval, timbre.TimerObject);
    
    var $ = Interval.prototype;
    
    Object.defineProperties($, {
        interval: {
            set: function(value) {
                if (typeof value === "number" && value >= 0) {
                    this._.interval = value;
                }
            },
            get: function() {
                return this._.interval;
            }
        },
        delay: {
            set: function(value) {
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
        limit: {
            set: function(value) {
                if (typeof value === "number" && value >= 0) {
                    this._.limit = value;
                }
            },
            get: function() {
                return this._.limit;
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
        _.countSamples = _.count = 0;
        _.currentTime  = timbre.currentTime;
        this.emit("bang");
        return this;
    };
    
    $.seq = function(seq_id) {
        var cell = this.cell;
        
        var _ = this._;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            if (_.delaySamples > 0) {
                _.delaySamples -= cell.length;
            }
            
            if (_.delaySamples <= 0) {
                _.countSamples -= cell.length;
                if (_.countSamples <= 0) {
                    _.countSamples += (timbre.samplerate * _.interval * 0.001)|0;
                    var inputs = this.inputs;
                    for (var i = 0, imax = inputs.length; i < imax; ++i) {
                        inputs[i].bang();
                    }
                    ++_.count;
                    if (_.count >= _.limit) {
                        var self = this;
                        timbre.nextTick(function() {
                            self.emit("limit");
                            self.pause();
                        });
                    }
                }
            }
            _.currentTime += _.currentTimeIncr;
        }
        return cell;
    };
    
    timbre.fn.register("interval", Interval);
    
    timbre.fn.register("timeout", function(_args) {
        return new Interval(_args).once("init", function() {
            if (this.delay === 0) {
                this.delay = this.interval;
            }
            this.limit = 1;
        });
    });
})();
(function() {
    "use strict";
    
    function Mul(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(Mul, timbre.Object);
    
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
})();
(function() {
    "use strict";
    
    function Noise(_args) {
        timbre.Object.call(this, _args);
    }
    timbre.fn.extend(Noise, timbre.Object);
    
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
})();
(function() {
    "use strict";
    
    function Oscillator(_args) {
        timbre.Object.call(this, _args);
        
        this._.phase = 0;
        this._.x     = 0;
        this._.coeff = 1024 / timbre.samplerate;

        this.once("init", function() {
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
        });
    }
    timbre.fn.extend(Oscillator, timbre.Object);
    
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
        this.emit("bang");
        return this;
    };

    $.seq = function(seq_id) {
        var _ = this._;
        var cell = this.cell;
        
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            var freq = _.freq.seq(seq_id);
            var mul  = _.mul , add = _.add;
            var wave = _.wave, x   = _.x, coeff = _.coeff;
            var index, delta, x0, x1, xx, dx;
            var i, imax;
            
            if (_.ar) { // audio-rate
                if (_.freq.isAr) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        index = x|0;
                        delta = x - index;
                        x0 = wave[index & 1023];
                        x1 = wave[(index+1) & 1023];
                        cell[i] = ((1.0 - delta) * x0 + delta * x1) * mul + add;
                        x += freq[i] * coeff;
                    }
                } else { // _.freq.isKr
                    dx = freq[0] * coeff;
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        index = x|0;
                        delta = x - index;
                        x0 = wave[index & 1023];
                        x1 = wave[(index+1) & 1023];
                        cell[i] = ((1.0 - delta) * x0 + delta * x1) * mul + add;
                        x += dx;
                    }
                }
            } else {    // control-rate
                index = x|0;
                delta = x - index;
                x0 = wave[index & 1023];
                x1 = wave[(index+1) & 1023];
                xx = ((1.0 - delta) * x0 + delta * x1) * mul + add;
                for (i = imax = cell.length; i--; ) {
                    cell[i] = xx;
                }
                x += freq[0] * coeff * imax;
            }
            while (x > 1024) {
                x -= 1024;
            }
            _.x = x;
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
})();
(function() {
    "use strict";

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
        
        this._.value = 0;
        this._.minvalue = -Infinity;
        this._.maxValue = +Infinity;
        
        this._.eventtype = ParamEvent.None;
        this._.currentTimeIncr = this.cell.length * 1000 / timbre.samplerate;
        
        this._.schedules = [];
        
        this._.ar = false;
        
        this.on("setAdd", changeTheValue);
        this.on("setMul", changeTheValue);
        this.on("ar", function() { this._.ar = false; });
    }
    timbre.fn.extend(Param, timbre.Object);
    
    var $ = Param.prototype;
    
    var changeTheValue = function() {
        var _ = this._;
        var x = _.value * _.mul + _.add;
        var cell = this.cell;
        for (var i = cell.length; i--; ) {
            cell[i] = x;
        }
    };
    
    Object.defineProperties($, {
        value: {
            set: function(value) {
                if (typeof value === "number") {
                    var _ = this._;
                    value = (value < _.minvalue) ?
                        _.minvalue : (value > _.maxValue) ? _.maxValue : value;
                    _.value = isNaN(value) ? 0 : value;
                    _.eventtype = ParamEvent.None;
                    changeTheValue.call(this);
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
    
    var insertEvent = function(object, type, value, time) {
        var s = object._.schedules;
        var e = new ParamEvent(type, value, time);
        s.push(e);
        s.sort(function(a, b) {
            return a.time - b.time;
        });
    };
    
    $.setValueAtTime = function(value, time) {
        var _ = this._;
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            _.currentTime = timbre.currentTime;
            insertEvent(this, ParamEvent.SetValue, value, time);
        }
        return this;
    };
    
    $.linearRampToValueAtTime = function(value, time) {
        var _ = this._;
        _.currentTime = timbre.currentTime;
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(this, ParamEvent.LinearRampToValue, value, time);
        }
        return this;
    };
    $.lin = $.linearRampToValueAtTime;
    
    $.exponentialRampToValueAtTime = function(value, time) {
        var _ = this._;
        _.currentTime = timbre.currentTime;
        if (typeof value === "number" && typeof time === "number") {
            value = (value < _.minvalue) ?
                _.minvalue : (value > _.maxValue) ? _.maxValue : value;
            insertEvent(this, ParamEvent.ExponentialRampToValue, value, time);
        }
        return this;
    };
    $.exp = $.exponentialRampToValueAtTime;
    
    $.cancelScheduledValues = function(time) {
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
            
            while (_.eventtype === ParamEvent.None &&
                   schedules.length > 0 && _.currentTime <= schedules[0].time) {
                
                e = schedules.shift();
                switch (e.type) {
                case ParamEvent.SetValue:
                    _.eventtype = ParamEvent.SetValue;
                    _.goalValue = e.value;
                    _.goalTime  = e.time;
                    break;
                case ParamEvent.LinearRampToValue:
                    samples = (e.time - _.currentTime) * 0.001 * timbre.samplerate;
                    if (samples > 0) {
                        _.eventtype = ParamEvent.LinearRampToValue;
                        _.goalValue = e.value;
                        _.goalTime  = e.time;
                        _.variation = (e.value - _.value) / (samples / cell.length);
                    }
                    break;
                case ParamEvent.ExponentialRampToValue:
                    samples = (e.time - _.currentTime) * 0.001 * timbre.samplerate;
                    if (_.value !== 0 && samples > 0) {
                        _.eventtype = ParamEvent.ExponentialRampToValue;
                        _.goalValue = e.value;
                        _.goalTime  = e.time;
                        _.variation = Math.pow(e.value/_.value, 1/(samples/cell.length));
                    }
                    break;
                }
            }
            
            var changed = false;
            var emit    = false;
            var i, x;
            
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
                _.eventtype = ParamEvent.None;
                changed = emit = true;
            }
            
            if (changed) {
                x = _.value * _.mul + _.add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
                if (emit) {
                    this.emit("done", _.value);
                }
            }
        }
        
        return cell;
    };
    
    timbre.fn.register("param", Param);
})();
(function() {
    "use strict";

    function WaveListener(_args) {
        timbre.ListenerObject.call(this, _args);
        
        this._.buffer = new Float32Array(2048);
        this._.samples    = 0;
        this._.writeIndex = 0;
        
        this._.plotFlush = true;
        
        this.once("init", function() {
            if (!this._.interval) {
                this.interval = 1000;
            }
        });
        
        this.on("ar", function() { this._.ar = true; });
    }
    timbre.fn.extend(WaveListener, timbre.ListenerObject);
    
    var $ = WaveListener.prototype;
    
    Object.defineProperties($, {
        interval: {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number" && value > 0) {
                    _.interval    = value;
                    _.samplesIncr = value * 0.001 * timbre.samplerate / 2048;
                    if (_.samplesIncr < 1) {
                        _.samplesIncr = 1;
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
        
        for (var i = 2048; i--; ) {
            buffer[i] = 0;
        }
        _.samples    = 0;
        _.writeIndex = 0;
        this.emit("bang");
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
            
            for (j = 0; j < jmax; ++j) {
                if (samples <= 0) {
                    buffer[writeIndex++] = cell[j];
                    writeIndex &= 2047;
                    emit = _.plotFlush = true;
                    samples += samplesIncr;
                }
                cell[j] = cell[j] * mul + add;
                --samples;
            }
            _.samples    = samples;
            _.writeIndex = writeIndex;
            
            if (emit) {
                this.emit("wave");
            }
        }
        
        return cell;
    };
    
    $.plot = function(opts) {
        var _ = this._;
        if (_.plotFlush) {
            var data   = new Float32Array(2048);
            var buffer = _.buffer;
            for (var i = 0, j = _.writeIndex; i < 2048; i++) {
                data[i] = buffer[++j & 2047];
            }
            _.plotData  = data;
            _.plotFlush = null;
        }
        return WaveListener.__super__.plot.call(this, opts);
    };
    
    timbre.fn.register("wave", WaveListener);
})();
