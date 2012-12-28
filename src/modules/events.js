(function(timbre) {
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
                listeners[i].apply(this.context, args);
            }
            return true;
        } else if (handler instanceof timbre.Object) {
            handler.bang.apply(handler, arguments);
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
        if (typeof listener !== "function" && !(listener instanceof timbre.Object)) {
            throw new Error("once takes instances of Function or timbre.Object");
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
    
})(timbre);
