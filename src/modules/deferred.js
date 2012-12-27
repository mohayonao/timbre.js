(function(timbre) {
    "use strict";
    
    var slice = [].slice;
    
    var STATUS_PENDING  = 0;
    var STATUS_RESOLVED = 1;
    var STATUS_REJECTED = 2;
    
    function Deferred() {
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
    
    var done = function(status, list, context,args) {
        if (this._.status === STATUS_PENDING) {
            this._.status = status;
            for (var i = 0, imax = list.length; i < imax; ++i) {
                list[i].apply(context, args);
            }
            // this._.doneList = this._.failList = null;
        }
    };
    
    $.resolve = function() {
        var args = slice.call(arguments, 0);
        done.call(this, STATUS_RESOLVED, this._.doneList, this, args);
        return this;
    };
    
    $.resolveWith = function(context) {
        var args = slice.call(arguments, 1);
        done.call(this, STATUS_RESOLVED, this._.doneList, context, args);
        return this;
    };
    
    $.reject = function() {
        var args = slice.call(arguments, 0);
        done.call(this, STATUS_REJECTED, this._.failList, this, args);
        return this;
    };
    
    $.rejectWith = function(context) {
        var args = slice.call(arguments, 1);
        done.call(this, STATUS_REJECTED, this._.failList, context, args);
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
            var res = done.apply(this, arguments);
            if (isDeferred(res)) {
                res.then(function() {
                    var args = slice.call(arguments);
                    dfd.resolveWith.apply(dfd, [res].concat(args));
                });
            } else {
                dfd.resolveWith(this, res);
            }
        }.bind(this), function() {
            if (typeof fail === "function") {
                var res = fail.apply(this, arguments);
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
        
        return dfd;
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
    
    var Promise = (function() {
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
        function Promise(dfd) {
            this.then = then.bind(dfd);
            this.done = done.bind(dfd);
            this.fail = fail.bind(dfd);
            this.pipe = pipe.bind(dfd);
            this.always  = always.bind(dfd);
            this.promise = promise.bind(this);
        }
        return Promise;
    })();
    
    timbre.modules.Deferred = Deferred;
    
})(timbre);
