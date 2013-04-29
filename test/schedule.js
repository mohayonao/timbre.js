var T = require("./timbre.debug.js");
var assert = require("chai").assert;

describe('T("schedule")', function() {
    it("new", function() {
        assert.equal(T("schedule").toString(), "ScheduleNode");
    });
    it.skip("default properties", function() {
        var t = T("schedule");
        assert.equal(t.timeout,  1000);
        assert.equal(t.currentTime, 0);
    });
    it("fixed control-rate", function() {
        var t = T("schedule");
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
        t.ar();
        assert.isTrue(t.isKr );
        assert.isFalse(t.isAr);
    });
    it("sched()", function() {
        var t = T("schedule");
        var t1 = T(0);
        var t2 = T(0);
        var t3 = T(0);
        
        t.sched(10, t1);
        assert.deepEqual(t.queue,
                         [ [10, t1, undefined] ]);
        
        t.sched(30, t3, 100);
        assert.deepEqual(t.queue,
                         [ [10, t1, undefined], [30, t3, 100] ]);
        t.sched(20, t2, 200);
        assert.deepEqual(t.queue,
                         [ [10, t1, undefined], [20, t2, 200], [30, t3, 100] ]);
    });
    it("clear()", function() {
        var t = T("schedule");
        var t1 = T(0);
        t.sched(10, t1);
        
        assert.equal(t.remain, 1);
        t.clear();
        assert.equal(t.remain, 0);
    });
    
});
