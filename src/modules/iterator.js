(function() {
    "use strict";
    
    var fn = timbre.fn;
    
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
    timbre.modules.Iterator = Iterator;
    
    var ListSequenceIterator = (function() {
        function ListSequenceIterator(list, length, offset) {
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
        fn.extend(ListSequenceIterator, Iterator);
        
        ListSequenceIterator.create = function(opts) {
            return new ListSequenceIterator(opts.list, opts.length, opts.offset);
        };
        
        var $ = ListSequenceIterator.prototype;
        
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
        
        return ListSequenceIterator;
    })();
    timbre.modules.ListSequenceIterator = ListSequenceIterator;
    
    var ListShuffleIterator = (function() {
        function ListShuffleIterator(list, length, seed) {
            ListSequenceIterator.call(this, list.slice(0), length, 0);

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
        fn.extend(ListShuffleIterator, ListSequenceIterator);

        ListShuffleIterator.create = function(opts) {
            return new ListShuffleIterator(opts.list, opts.length, opts.seed);
        };
        
        return ListShuffleIterator;
    })();
    timbre.modules.ListShuffleIterator = ListShuffleIterator;

    var ListChooseIterator = (function() {
        function ListChooseIterator(list, length, seed) {
            ListSequenceIterator.call(this, list, length);
            if (seed) {
                var r = new timbre.modules.Random(seed);
                this._rnd = r.next.bind(r);
            } else {
                this._rnd = Math.random;
            }
        }
        fn.extend(ListChooseIterator, ListSequenceIterator);
        
        ListChooseIterator.create = function(opts) {
            return new ListChooseIterator(opts.list, opts.length, opts.seed);
        };
        
        var $ = ListChooseIterator.prototype;
        
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
        
        return ListChooseIterator;
    })();
    timbre.modules.ListChooseIterator = ListChooseIterator;
    
    var ArithmeticIterator = (function() {
        function ArithmeticIterator(start, grow, length) {
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
        fn.extend(ArithmeticIterator, Iterator);
        
        ArithmeticIterator.create = function(opts) {
            return new ArithmeticIterator(opts.start, opts.grow, opts.length);
        };
        
        var $ = ArithmeticIterator.prototype;
        
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
        
        return ArithmeticIterator;
    })();
    timbre.modules.ArithmeticIterator = ArithmeticIterator;
    
    var GeometricIterator = (function() {
        function GeometricIterator(start, grow, length) {
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
        fn.extend(GeometricIterator, Iterator);
        
        GeometricIterator.create = function(opts) {
            return new GeometricIterator(opts.start, opts.grow, opts.length);
        };
        
        var $ = GeometricIterator.prototype;
        
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
        
        return GeometricIterator;
    })();
    timbre.modules.GeometricIterator = GeometricIterator;
    
    var DrunkIterator = (function() {
        function DrunkIterator(start, step, length, min, max, seed) {
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
        fn.extend(DrunkIterator, Iterator);
        
        DrunkIterator.create = function(opts) {
            return new DrunkIterator(opts.start, opts.step, opts.length, opts.min, opts.max, opts.seed);
        };
        
        var $ = DrunkIterator.prototype;
        
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
        
        return DrunkIterator;
    })();
    timbre.modules.DrunkIterator = DrunkIterator;
    
})();
