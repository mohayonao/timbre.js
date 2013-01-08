(function() {
    "use strict";
    
    var slice = [].slice;
    var isDeferred = function(x) {
        return x && typeof x.promise === "function";
    };
    
    function Deferred(context) {
        this.context = context || this;
        this._state = "pending";
        this._doneList = [];
        this._failList = [];
        
        this._promise = {
            then: this.then,
            done: this.done.bind(this),
            fail: this.fail.bind(this),
            pipe: this.pipe.bind(this),
            always : this.always.bind(this),
            promise: this.promise.bind(this),
            isResolved: this.isResolved.bind(this),
            isRejected: this.isRejected.bind(this)
        };
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
