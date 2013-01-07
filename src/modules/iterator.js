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
            length = (typeof length === "number") ? length : 1;
            if (length < 0) {
                length = 0;
            }
            offset = (typeof offset === "number") ? offset : 0;
            if (offset < 0) {
                offset = 0;
            }
            this.list   = list;
            this.length = length;
            this.offset = offset;
        }
        fn.extend(ListSequence, Iterator);
        
        ListSequence.create = function(opts) {
            return new ListSequence(opts.list, opts.length, opts.offset);
        };
        
        var $ = ListSequence.prototype;
        
        $.next = function() {
            if (this.position >= this.length) {
                return null;
            }
            var index = (this.position + this.offset) % this.list.length;
            var item  = this.list[index];
            var value = this.valueOf(item);
            if (value !== null) {
                if (typeof item.next !== "function") {
                    this.position += 1;
                }
                return value;
            } else {
                if (typeof item.reset === "function") {
                    item.reset();
                }
                this.position += 1;
                return this.next();
            }
        };
        
        return ListSequence;
    })();
    iterator.ListSequence = ListSequence;
    
    var ListShuffle = (function() {
        function ListShuffle(list, length, seed) {
            ListSequence.call(this, list.slice(0), length, 0);

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
            if (this.position >= this.length) {
                return null;
            }
            var index = (this.list.length * this._rnd())|0;
            var item  = this.list[index];
            var value = this.valueOf(item);
            if (value !== null) {
                if (typeof item.next !== "function") {
                    this.position += 1;
                }
                return value;
            } else {
                if (typeof item.reset === "function") {
                    item.reset();
                }
                this.position += 1;
                return this.next();
            }
        };
        
        return ListChoose;
    })();
    iterator.ListChoose = ListChoose;
    
    var Arithmetic = (function() {
        function Arithmetic(start, grow, length) {
            Iterator.call(this);
            start = (typeof start === "number") ? start : 0;
            length = (typeof length === "number") ? length : Infinity;
            if (length < 0) {
                length = 0;
            }
            this.start  = start;
            this.value  = this.start;
            this.grow   = grow || 1;
            this.length = length;
        }
        fn.extend(Arithmetic, Iterator);
        
        Arithmetic.create = function(opts) {
            return new Arithmetic(opts.start, opts.grow, opts.length);
        };
        
        var $ = Arithmetic.prototype;
        
        $.next = function() {
            if (this.position === 0) {
                this.position += 1;
                return this.value;
            } else if (this.position < this.length) {
                var grow = this.valueOf(this.grow);
                if (grow !== null) {
                    this.value += grow;
                    this.position += 1;
                    return this.value;
                }
            }
            return null;
        };
        
        return Arithmetic;
    })();
    iterator.Arithmetic = Arithmetic;
    
    var Geometric = (function() {
        function Geometric(start, grow, length) {
            Iterator.call(this);
            start = (typeof start === "number") ? start : 0;
            length = (typeof length === "number") ? length : Infinity;
            if (length < 0) {
                length = 0;
            }
            this.start  = start;
            this.value  = this.start;
            this.grow   = grow || 1;
            this.length = length;
        }
        fn.extend(Geometric, Iterator);
        
        Geometric.create = function(opts) {
            return new Geometric(opts.start, opts.grow, opts.length);
        };
        
        var $ = Geometric.prototype;
        
        $.next = function() {
            if (this.position === 0) {
                this.position += 1;
                return this.value;
            } else if (this.position < this.length) {
                var grow = this.valueOf(this.grow);
                if (grow !== null) {
                    this.value *= grow;
                    this.position += 1;
                    return this.value;
                }
            }
            return null;
        };
        
        return Geometric;
    })();
    iterator.Geometric = Geometric;

    var Drunk = (function() {
        function Drunk(start, step, length, min, max, seed) {
            Iterator.call(this);
            start = (typeof start === "number") ? start : 0;
            length = (typeof length === "number") ? length : Infinity;
            if (length < 0) {
                length = 0;
            }
            min = (typeof min === "number") ? min : -Infinity;
            max = (typeof max === "number") ? max : +Infinity;
            this.start  = start;
            this.value  = this.start;
            this.step   = step || 1;
            this.length = length;
            this.min = min;
            this.max = max;
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
            if (this.position === 0) {
                this.position += 1;
                return this.value;
            } else if (this.position < this.length) {
                var step = this.valueOf(this.step);
                if (step !== null) {
                    step = (this._rnd() * 2 - 1) * step;
                    var min   = this.min, max = this.max;
                    var value = this.value + step;
                    value = (value < min) ? min : (value > max) ? max : value;
                    this.value = value;
                    this.position += 1;
                    return this.value;
                }
            }
            return null;
        };
        
        return Drunk;
    })();
    iterator.Drunk = Drunk;
    
    timbre.modules.iterator = iterator;
    
})(timbre);
