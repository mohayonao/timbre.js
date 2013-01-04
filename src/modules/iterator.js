(function(timbre) {
    "use strict";
    
    var fn = timbre.fn;
    var iterator = {};
    
    var Iterator = (function() {
        function Iterator() {
            this.position = 0;
        }
        
        Iterator.create = function(opts) {
            return new Iterator(opts);
        };
        
        var $ = Iterator.prototype;
        
        $.next = function() {
            return null;
        };
        
        $.valueOf = function(item) {
            if (item.next) {
                return item.next();
            } else {
                return item;
            }
        };
        
        $.reset = function() {};
        
        return Iterator;
    })();
    iterator.Iterator = Iterator;
    
    var ListSequence = (function() {
        function ListSequence(list, length, offset) {
            Iterator.call(this);
            this.list    = list;
            this.length = length  || 1;
            this.offset  = offset || 0;
        }
        fn.extend(ListSequence, Iterator);
        
        ListSequence.create = function(opts) {
            return new ListSequence(opts.list, opts.length, opts.offset);
        };
        
        var $ = ListSequence.prototype;
        
        $.next = function() {
            var returnValue;
            if (this.position < this.length) {
                var index = (this.position + this.offset) % this.list.length;
                var item = this.list[index];
                var value = this.valueOf(item);
                if (value !== null) {
                    if (!item.next) {
                        this.position += 1;
                    }
                    returnValue = value;
                } else {
                    if (item.reset) {
                        item.reset();
                    }
                    this.position += 1;
                    returnValue = this.next();
                }
            }
            else {
                returnValue = null;
            }
            return returnValue;
        };
        
        return ListSequence;
    })();
    iterator.ListSequence = ListSequence;

    var ListShuffle = (function() {
        function ListShuffle(list, length, seed) {
            ListSequence.call(this, list, length, 0);

            if (seed) {
                var r = new timbre.modules.Random(seed);
                this.list.sort(function() {
                    return r.next() - 0.5;
                });
            } else {
                this.list.sort(function() {
                    return Math.random() - 0.5;
                });
            }
        }
        fn.extend(ListShuffle, ListSequence);

        ListShuffle.create = function(opts) {
            return new ListShuffle(opts.list, opts.length, opts.seed);
        };
        
        return ListShuffle;
    })();
    iterator.ListShuffle = ListShuffle;

    var ListChoose = (function() {
        function ListChoose(list, length, seed) {
            ListSequence.call(this, list, length);
            if (seed) {
                var r = new timbre.modules.Random(seed);
                this._rnd = r.next.bind(r);
            } else {
                this._rnd = Math.random;
            }
        }
        fn.extend(ListChoose, ListSequence);
        
        ListChoose.create = function(opts) {
            return new ListChoose(opts.list, opts.length, opts.seed);
        };
        
        var $ = ListChoose.prototype;
        
        $.next = function() {
            var returnValue;
            if (this.position < this.length) {
                var index = (this.list.length * this._rnd())|0;
                var item = this.list[index];
                var value = this.valueOf(item);
                if (value !== null) {
                    if (!item.next) {
                        this.position += 1;
                    }
                    returnValue = value;
                } else {
                    if (item.reset) {
                        item.reset();
                    }
                    this.position += 1;
                    returnValue = this.next();
                }
            }
            else {
                returnValue = null;
            }
            return returnValue;
        };
        
        return ListChoose;
    })();
    iterator.ListChoose = ListChoose;
    
    var Arithmetic = (function() {
        function Arithmetic(start, step, length) {
            Iterator.call(this);
            this.start    = start || 0;
            this.value    = this.start;
            this.step     = step  || 1;
            this.length  = length || Infinity;
        }
        fn.extend(Arithmetic, Iterator);
        
        Arithmetic.create = function(opts) {
            return new Arithmetic(opts.start, opts.step, opts.length);
        };
        
        var $ = Arithmetic.prototype;
        
        $.next = function() {
            var ret;
            if (this.position === 0) {
                ret = this.value;
                this.position += 1;
            } else if (this.position < this.length) {
                var step = this.valueOf(this.step);
                if (step !== null) {
                    this.value += step;
                    ret = this.value;
                    this.position += 1;
                } else {
                    ret = null;
                }
            } else {
                ret = null;
            }
            return ret;
        };
        
        return Arithmetic;
    })();
    iterator.Arithmetic = Arithmetic;

    var Geometric = (function() {
        function Geometric(start, grow, length) {
            Iterator.call(this);
            this.start    = start || 0;
            this.value    = this.start;
            this.grow     = grow  || 1;
            this.length  = length || Infinity;
        }
        fn.extend(Geometric, Iterator);
        
        Geometric.create = function(opts) {
            return new Geometric(opts.start, opts.grow, opts.length);
        };
        
        var $ = Geometric.prototype;
        
        $.next = function() {
            var ret;
            if (this.position === 0) {
                ret = this.value;
                this.position += 1;
            } else if (this.position < this.length) {
                var grow = this.valueOf(this.grow);
                if (grow !== null) {
                    this.value *= grow;
                    ret = this.value;
                    this.position += 1;
                } else {
                    ret = null;
                }
            } else {
                ret = null;
            }
            return ret;
        };
        
        return Geometric;
    })();
    iterator.Geometric = Geometric;

    var Drunk = (function() {
        function Drunk(start, step, length, min, max, seed) {
            Iterator.call(this);
            this.start  = start || 0;
            this.value  = this.start;
            this.step   = step  || 0;
            this.length = length || Infinity;
            this.min    = min   || -Infinity;
            this.max    = max   || +Infinity;
            if (seed) {
                var r = new timbre.modules.Random(seed);
                this._rnd = r.next.bind(r);
            } else {
                this._rnd = Math.random;
            }
        }
        fn.extend(Drunk, Iterator);
        
        Drunk.create = function(opts) {
            return new Drunk(opts.start, opts.step, opts.length, opts.min, opts.max, opts.seed);
        };

        var $ = Drunk.prototype;

        $.next = function() {
            var ret = 0;
            if (this.position === 0) {
                ret = this.value;
                this.position += 1;
            } else if (this.position < this.length) {
                var step = (this._rnd() * 2 - 1) * this.step;
                var value = this.value + step;
                ret = (value < this.min) ? this.min : (value > this.max) ? this.max : value;
                this.value = ret;
                this.position += 1;
            } else {
                ret = null;
            }
            return ret;
        };

        return Drunk;
    })();
    iterator.Drunk = Drunk;
    
    
    timbre.modules.iterator = iterator;
    
})(timbre);
