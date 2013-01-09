T = require './timbre.debug.js'

Random = timbre.modules.Random;
N = 2048;


rndtest = (rnd=Math.random)->
    s1 = x0 = xprev = rnd() - 0.5;
    s2 = x0 * x0;
    r  = 0;

    for i in [0...N]
        x = rnd() - 0.5

        s1 += x
        s2 += x * x
        r  += xprev * x
        xprev = x
    r = (N * (r + x * x0) - s1 * s1) / (N * s2 - s1 * s1)

    console.log "------------"
    console.log "average    :", s1 * Math.sqrt(12.0 / N)
    console.log "correlation:", ((N-1) * r+1) * Math.sqrt((N+1) / (N*(N-3)))


class BetterRandom
    POOLSIZE = 97

    constructor: ->
        @random = new Random
        @pool = for i in [0...POOLSIZE]
            @random.next()
        @i = POOLSIZE - 1

    next: ->
        @i = (POOLSIZE * @pool[@i])|0
        r  = @pool[@i]
        @pool[@i] = @random.next()
        r


console.log '===== Math.random ====='
for i in [0...3]
    rndtest()

console.log '===== modules.Random ====='
for i in [0...3]
    r = new Random
    rnd = r.next.bind r
    rndtest rnd

console.log '===== BetterRandom ====='
for i in [0...3]
    r = new BetterRandom
    rnd = r.next.bind r
    rndtest rnd

r = new Random()
max = -Infinity
min = +Infinity

for i in [0...1000000]
    x = r.next()
    if max < x then max = x
    if min > x then min = x
console.log "min", min
console.log "max", max
