var T = require("./timbre.debug.js");
var assert = require("chai").assert;

var iterator = timbre.modules.iterator;

describe('timbre.modules.iterator', function() {
    describe("ListSequence", function() {
        it("new", function() {
            var iter = new iterator.ListSequence([]);
            assert.instanceOf(iter, iterator.ListSequence);
        });
        it("create()", function() {
            var list = [1,2,3];
            var iter = iterator.ListSequence.create({
                list:list, length:100, offset:5
            });
            assert.equal(iter.list  , list);
            assert.equal(iter.length,  100);
            assert.equal(iter.offset,    5);
        });
        it("next()", function() {
            var iter = iterator.ListSequence.create({
                list:[0,1,2,3], length:8, offset:1
            });
            assert.equal(iter.next(), 1);
            assert.equal(iter.next(), 2);
            assert.equal(iter.next(), 3);
            assert.equal(iter.next(), 0);
            assert.equal(iter.next(), 1);
            assert.equal(iter.next(), 2);
            assert.equal(iter.next(), 3);
            assert.equal(iter.next(), 0);
            assert.equal(iter.next(), null);
            assert.equal(iter.next(), null);
        });
    });
    describe("ListShuffle", function() {
        it("new", function() {
            var iter = new iterator.ListShuffle([]);
            assert.instanceOf(iter, iterator.ListShuffle);
        });
        it("create()", function() {
            var list = [1,2,3];
            var iter = iterator.ListShuffle.create({
                list:list, length:100
            });
            assert.equal(iter.list.length, list.length);
            assert.include(iter.list, list[0]);
            assert.include(iter.list, list[1]);
            assert.include(iter.list, list[2]);
            assert.equal(iter.length,  100);
            
        });
        it("next()", function() {
            var iter = iterator.ListShuffle.create({
                list:[0,1,2,3], length:8
            });
            var list = iter.list;
            assert.equal(iter.next(), list[0]);
            assert.equal(iter.next(), list[1]);
            assert.equal(iter.next(), list[2]);
            assert.equal(iter.next(), list[3]);
            assert.equal(iter.next(), list[0]);
            assert.equal(iter.next(), list[1]);
            assert.equal(iter.next(), list[2]);
            assert.equal(iter.next(), list[3]);
            assert.equal(iter.next(), null);
            assert.equal(iter.next(), null);
        });
        it("seed", function() {
            var iter1 = iterator.ListShuffle.create({
                list:[0,1,2,3,4,5,6,7,8,9], seed:103
            });
            var iter2 = iterator.ListShuffle.create({
                list:[0,1,2,3,4,5,6,7,8,9], seed:103
            });
            assert.deepEqual(iter1.list, iter2.list);
        });
    });
    describe("ListChoose", function() {
        it("new", function() {
            var iter = new iterator.ListChoose([]);
            assert.instanceOf(iter, iterator.ListChoose);
        });
        it("create()", function() {
            var list = [1,2,3];
            var iter = iterator.ListChoose.create({
                list:list, length:100
            });
            assert.equal(iter.list  , list);
            assert.equal(iter.length,  100);
        });
        it("next()", function() {
            var iter = iterator.ListChoose.create({
                list:[0,1,2,3], length:8
            });
            var list = iter.list;
            assert.include(iter.list, iter.next());
            assert.include(iter.list, iter.next());
            assert.include(iter.list, iter.next());
            assert.include(iter.list, iter.next());
            assert.include(iter.list, iter.next());
            assert.include(iter.list, iter.next());
            assert.include(iter.list, iter.next());
            assert.include(iter.list, iter.next());
            assert.equal(iter.next(), null);
            assert.equal(iter.next(), null);
        });
    });
    describe("Arithmetic", function() {
        it("new", function() {
            var iter = new iterator.Arithmetic();
            assert.instanceOf(iter, iterator.Arithmetic);
        });
        it("create()", function() {
            var iter = iterator.Arithmetic.create({
                start:100, grow:2, length:8
            });
            assert.equal(iter.start ,  100);
            assert.equal(iter.grow  ,    2);
            assert.equal(iter.length,    8);
        });
        it("next()", function() {
            var iter = iterator.Arithmetic.create({
                start:100, grow:2, length:8
            });
            assert.equal(iter.next(), 100);
            assert.equal(iter.next(), 102);
            assert.equal(iter.next(), 104);
            assert.equal(iter.next(), 106);
            assert.equal(iter.next(), 108);
            assert.equal(iter.next(), 110);
            assert.equal(iter.next(), 112);
            assert.equal(iter.next(), 114);
            assert.equal(iter.next(), null);
            assert.equal(iter.next(), null);
        });
    });
    describe("Geometric", function() {
        it("new", function() {
            var iter = new iterator.Geometric();
            assert.instanceOf(iter, iterator.Geometric);
        });
        it("create()", function() {
            var iter = iterator.Geometric.create({
                start:1, grow:2, length:8
            });
            assert.equal(iter.start , 1);
            assert.equal(iter.grow  , 2);
            assert.equal(iter.length, 8);
        });
        it("next()", function() {
            var iter = iterator.Geometric.create({
                start:1, grow:2, length:8
            });
            assert.equal(iter.next(), 1);
            assert.equal(iter.next(), 2);
            assert.equal(iter.next(), 4);
            assert.equal(iter.next(), 8);
            assert.equal(iter.next(), 16);
            assert.equal(iter.next(), 32);
            assert.equal(iter.next(), 64);
            assert.equal(iter.next(), 128);
            assert.equal(iter.next(), null);
            assert.equal(iter.next(), null);
        });
    });
    describe("Drunk", function() {
        it("new", function() {
            var iter = new iterator.Drunk();
            assert.instanceOf(iter, iterator.Drunk);
        });
        it("create()", function() {
            var iter = iterator.Drunk.create({
                start:1, step:2, length:8, min:0, max:9
            });
            assert.equal(iter.start , 1);
            assert.equal(iter.step  , 2);
            assert.equal(iter.length, 8);
            assert.equal(iter.min   , 0);
            assert.equal(iter.max   , 9);
        });
    });    
});
