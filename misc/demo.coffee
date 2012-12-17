'use strict'

sinewave = new Float32Array( Math.sin(2 * Math.PI * (i/1024)) for i in [0...1024] )

class ToneGenerator
    constructor: ->
        @samplerate = pico.samplerate
        @velocity = 0.8
        @cell = new Float32Array(pico.cellsize)

    setVelocity: (val)->
        @velocity = val / 16

    setParams: (val)->
        @env?.setParams val

class FMSynthBass extends ToneGenerator
    constructor: ->
        super()
        @op = [
            {phase:0, phaseStep:0, amp:1}
            {phase:0, phaseStep:0, amp:1}
        ]
        @fb   = 0
        @fblv = 0.097

    setFreq: (val)->
        @op[0].phaseStep = (1024 * val / @samplerate) * 0.5
        @op[1].phaseStep = (1024 * val / @samplerate)
        @op[0].amp = 0.5
        @op[1].amp = 1

    process: ->
        cell = @cell
        op   = @op
        wave = @wave
        fb   = @fb
        fblv = @fblv * 1024
        velocity = @velocity * 0.15
        phase0     = op[0].phase
        phaseStep0 = op[0].phaseStep
        amp0       = op[0].amp
        phase1     = op[1].phase
        phaseStep1 = op[1].phaseStep
        amp1       = op[1].amp
        for i in [0...cell.length] by 1
            x0 = fb = sinewave[(phase0 + fb * fblv) & 1023] * amp0
            x1 = sinewave[(phase1 + x0 * 1024) & 1023] * amp1
            cell[i] = x1 * velocity
            phase0 += phaseStep0
            phase1 += phaseStep1
        op[0].phase = phase0
        op[1].phase = phase1
        op[0].amp *= 0.995
        @fb = fb
        cell

class FMSynthLead extends ToneGenerator
    constructor: ->
        super()
        @op = [
            {phase:0, phaseStep:0, amp:1}
            {phase:0, phaseStep:0, amp:1}
            {phase:0, phaseStep:0, amp:1}
            {phase:0, phaseStep:0, amp:1}
        ]
        @fb   = 0
        @fblv = 0.3
        @env = new Envelope()
        @delay = new pico.DelayNode(time:225,feedback:0.35,wet:0.3)

    setFreq: (val)->
        @op[0].phaseStep = (1024 * val / @samplerate)
        @op[1].phaseStep = (1024 * val / @samplerate)
        @op[2].phaseStep = (1024 * val / @samplerate)
        @op[3].phaseStep = (1024 * val / @samplerate)
        @op[0].amp = 0.5
        @op[1].amp = 1
        @op[2].amp = 8
        @op[3].amp = 1
        @env.bang()

    process: ->
        cell = @cell
        op   = @op
        wave = @wave
        fb   = @fb
        fblv = @fblv * 1024
        velocity = @velocity * 0.125
        phase0     = op[0].phase
        phaseStep0 = op[0].phaseStep
        amp0       = op[0].amp
        phase1     = op[1].phase
        phaseStep1 = op[1].phaseStep
        amp1       = op[1].amp
        phase2     = op[2].phase
        phaseStep2 = op[2].phaseStep
        amp2       = op[2].amp
        phase3     = op[3].phase
        phaseStep3 = op[3].phaseStep
        amp3       = op[3].amp
        for i in [0...cell.length] by 1
            x0 = fb = sinewave[(phase0 + fb * fblv) & 1023] * amp0
            x1 = sinewave[(phase1 + x0 * 1024) & 1023] * amp1
            x2 = sinewave[(phase2) & 1023] * amp2
            x3 = sinewave[(phase3 + x2 * 1024) & 1023] * amp3
            cell[i] = (x1 + x3) * velocity
            phase0 += phaseStep0
            phase1 += phaseStep1
            phase2 += phaseStep2
            phase3 += phaseStep3
        op[0].phase = phase0
        op[1].phase = phase1
        op[2].phase = phase2
        op[3].phase = phase3
        op[0].amp *= 0.9988
        op[2].amp *= 0.9998
        @fb = fb
        @env.process cell
        @delay.process cell, true
        cell

class PwmGenerator extends ToneGenerator
    constructor: ->
        super()
        @env = new Envelope()
        @phase     = 0
        @phaseStep = 0
        @width = 0.5

    setFreq: (val)->
        @phaseStep = val / @samplerate
        @env.bang()

    setWidth: (val)->
        @width = val * 0.01

    process: ->
        cell = @cell
        width = @width
        phase = @phase
        phaseStep = @phaseStep
        velocity  = @velocity
        for i in [0...cell.length] by 1
            x = if phase < width then +0.1 else -0.1
            cell[i] = x * velocity
            phase += phaseStep
            phase -= 1 while phase >= 1
        @phase = phase
        @env.process cell
        cell

class NoiseGenerator extends ToneGenerator
    constructor: ->
        super()
        @env  = new Envelope()
        @phase     = 0
        @phaseStep = 1
        @value     = Math.random()

    setFreq: (val)->
        @env.bang()

    setNoise: (val)->
        if val > 0
            @phaseStep = 6 / val
        else
            @phaseStep = 0

    process: ->
        cell = @cell
        value = @value
        phase = @phase
        phaseStep = @phaseStep
        velocity  = @velocity
        for i in [0...cell.length] by 1
            cell[i] = value * 0.1
            phase += phaseStep
            if phase >= 1
                phase -= 1
                value = Math.random() * velocity
        @value = value
        @phase = phase
        @env.process cell
        cell

class Envelope
    constructor: ->
        @samplerate = pico.samplerate
        @a = 0
        @d = 64
        @s = 32
        @r = 0
        @samples = 0
        @status  = 0
        @x  = 1
        @dx = 0

    setParams: (params)->
        [@a, @d, @s, @r] = params

    bang: ->
        @samples = 0
        @status  = 0
        @x  = 1
        @dx = 0

    process: (cell)->
        while @samples <= 0
            switch @status
                when 0
                    @status = 1 # attack
                    @samples = @a * @samplerate * 0.005
                    @x  = 0
                    @dx = (1 / @samples) * cell.length
                when 1
                    @status = 2 # decay
                    @samples = @d * @samplerate * 0.005
                    @x  = 1
                    @dx = -(1 / @samples) * cell.length
                    if @s > 0 then @dx *= @s / 127
                when 2
                    @status = 3 # off
                    @samples = Infinity
                    @dx = 0
                    if @s is 0 then @x = 0
        x = @x
        for i in [0...cell.length] by 1
            cell[i] *= x
        @x += @dx
        @samples -= cell.length

class MMLTrack
    constructor: (mml)->
        @samplerate = pico.samplerate
        @tempo    = 120
        @len      = 4
        @octave   = 5
        @tie      = false
        @curFreq  = 0
        @index    = -1
        @samples  = 0
        @loopStack = []
        @commands  = @compile mml
        @toneGenerator = null

    compile: (mml)->
        commands = []
        checked  = {}
        for def in MMLCommands
            re = def.re
            while m = re.exec(mml)
                if not checked[m.index]
                    checked[m.index] = true
                    cmd = def.func m
                    cmd.index  = m.index
                    cmd.origin = m[0]
                    commands.push cmd
                    mask = (' ' for x in [0...m[0].length]).join ''
                    mml = mml.substr(0, m.index) + mask + mml.substr(m.index + mask.length)
        commands.sort (a, b)-> a.index - b.index
        commands

    doCommand: (cmd)->
        switch cmd?.name
            when '@'
                switch cmd.val
                    when 3
                        @toneGenerator = new PwmGenerator()
                    when 4
                        @toneGenerator = new NoiseGenerator()
                    when 5
                        @toneGenerator = new FMSynthBass()
                    when 6
                        @toneGenerator = new FMSynthLead()
            when '@w'
                @toneGenerator?.setWidth? cmd.val
            when '@n'
                @toneGenerator?.setNoise? cmd.val
            when '@e1'
                @toneGenerator?.setParams? cmd.val
            when 't' then @tempo  = cmd.val
            when 'l' then @len    = cmd.val
            when 'o' then @octave = cmd.val
            when '<' then @octave += 1
            when '>' then @octave -= 1
            when '&' then @tie = true
            when '/:'
                    @loopStack.push index:@index, count:cmd.val or 2, exit:0
            when ':/'
                peek = @loopStack[@loopStack.length-1]
                peek.exit = @index
                peek.count -= 1
                if peek.count <= 0
                    @loopStack.pop()
                else
                    @index = peek.index
            when '/'
                peek = @loopStack[@loopStack.length-1]
                if peek.count is 1
                    @loopStack.pop()
                    @index = peek.exit
            when 'v'
                @toneGenerator.setVelocity cmd.val
            when 'note', 'rest'
                len = cmd.len or @len
                @samples += ((60 / @tempo) * (4 / len) * @samplerate)|0
                @samples *= [1,1.5,1.75][cmd.dot] or 1
                freq = if cmd.name is 'rest' then 0 else
                        440 * Math.pow(Math.pow(2, 1/12), cmd.tone + @octave * 12 - 69 )
                if @curFreq != freq then @tie = false
                if not @tie
                    @toneGenerator.setFreq freq
                    @curFreq = freq
                else @tie = false

    process: ->
        while @samples <= 0
            @index += 1
            if @index >= @commands.length
                @samples = Infinity
            else @doCommand @commands[@index]
        @samples -= pico.cellsize
        if @samples != Infinity
            @toneGenerator?.process()

class MMLSequencer
    constructor: (mml)->
        @tracks = for mml in mml.split(';').filter((x)->x)
            new MMLTrack(mml)
        @cell   = new Float32Array(pico.cellsize)

    process: (L, R)->
        cell = @cell
        for i in [0...cell.length] by 1
            cell[i] = 0
        for track in @tracks
            tmp = track.process()
            if tmp then for i in [0...cell.length] by 1
                cell[i] += tmp[i]
        for i in [0...cell.length] by 1
            L[i] = R[i] = cell[i]
        undefined

MMLCommands = [
    { re:/@e1,(\d+,\d+,\d+,\d+)/g, func:(m)->
        name:'@e1', val:m[1].split(',').map (x)->x|0
    }
    { re:/@w(\d*)/g, func:(m)->
        name:'@w',val:m[1]|0
    }
    { re:/@n(\d*)/g, func:(m)->
        name:'@n',val:m[1]|0
    }
    { re:/@(\d*)/g, func:(m)->
        name:'@', val:m[1]|0
    }
    { re:/t(\d*)/g, func:(m)->
        name:'t', val:m[1]|0
    }
    { re:/l(\d*)/g, func:(m)->
        name:'l', val:m[1]|0
    }
    { re:/v(\d*)/g, func:(m)->
        name:'v', val:m[1]|0
    }
    { re:/o(\d*)/g, func:(m)->
        name:'o', val:m[1]|0
    }
    { re:/[<>]/g, func:(m)->
        name:m[0]
    }
    { re:/\/:(\d*)/g, func:(m)->
        name:'/:', val:m[1]|0
    }
    { re:/:\//g, func:(m)->
        name:':/'
    }
    { re:/\//g, func:(m)->
        name:'/'
    }
    { re:/([cdefgab])([-+]?)(\d*)(\.*)/g, func:(m)->
        name:'note', note:m[1], len:m[3]|0, dot:m[4].length,
        tone:{c:0,d:2,e:4,f:5,g:7,a:9,b:11}[m[1]] + ({'-':-1,'+':+1}[m[2]]|0)
    }
    { re:/([r])([-+]?)(\d*)(\.*)/g, func:(m)->
        name:'rest', note:m[1], len:m[3]|0, dot:m[4].length
    }
    { re:/&/g, func:(m)->
        name:'&'
    }
]

demo = ->
    new MMLSequencer(mmldata)

if typeof module != 'undefined' and module.exports
    module.exports = demo
else
    window.demo = demo

mmldata = '''
t200l8 @6 @w60 @e1,0,64,64,10 v15o4
r4. /:2
efga4.>a4 <c+dee4ede r1 r1 <c+>ab-gafge b-gafgefd c+defgab-<c+ ec+>b-<f>c+b-r4 >g2.ab- <c+2.ef gfefgab-<c+ ee4.f4g4
fecd&d2&d2>a<cdc fecd&d2&d2>agfe f4.d4.f4 g4.e4.g4 a4.f4.d4 e4.g4.b-4
a1 <defgagfe g4.e4.c4 >g4.<c4.e4 fd>afda<df ec>gecg<ce >dfa<c+dfa<c+d1
>fecd&d2&d2>a<cdc fecd&d2&d2>agfe f4.d4.f4 g4.e4.g4 a4.f4.d4 e4.g4.b-4
a1 <defgagfe g4.e4.c4 >g4.<c4.e4 fd>afda<df ec>gecg<ce >e-4.e-g4.e-16g16 b-4.g16b-16<e-2
/
a2dfg a&a4g4fg4 <d&d4>a4gf4 e&e4f4.g4. a2dfg a&a4g4fg4 <d&d2e4d4 d2c+2
> /:2 /:4dfa:/ e-gb-g /:4dfa:/cceg :/ > :/

arrar4aa;

t200l8 @3@w40 v10 o5
r4. /:2
e1 g1 /:2d+16e16d+16e16:/</:2d+16e16d+16e16:/ > efg+fefg+a /:4r4.e&e2 / r1:/ c+c+c+c+ddee
/:2dc>ga&a2 <a4g4f4e4:/ d4.>b-4.<d4 e4.c4.e4 f4.d4.>a4 a4.<e4.g4
d1 >a2<d2 e1 c1 f1 e1 d1 d4c+4>b4<c+4
/:2dc>ga&a2 <a4g4f4e4:/ d4.>b-4.<d4 e4.c4.e4 f4.d4.>a4 a4.<e4.g4
d1 >a2<d2 e1 c1 f1 e1 b-1&b-1
/
>a1&a1 b-1 a1 < /:2v6ffv2fv6fv2fv6fff:/ b-b-v5b-v10b-v5b-v10b-b-b- aav5av10av5av10aec+
> /:2 /:4fa<d>:/gb-<d+>b- /:4fa<d>:/gg<ce> :/ < :/

drrdr4dd;

t200l8 @3@w40 v10 o4
r4. /:2
a1 < c+1 > /:2g+16a16g+16a16:/ <  /:2g+16a16g+16a16:/ >ab-<c+>b-ab-<c+d >/:4r4.a&a2 / r1:/ aaaabb<c+c+
> /:2agef&f2 <f4e4d4c4>:/ b-4.f4.b-4 <c4.>g4.<c4 d4.>a4.f4 e4.<c+4.e4
>a1 f2a2 <c1 >g1 <d1 c1 r1 <d4c+4>b4<c+4>
> /:2agef&f2 <f4e4d4c4>:/ b-4.f4.b-4 <c4.>g4.<c4 d4.>a4.f4 e4.<c+4.e4
>a1 f2a2 <c1 >g1 <d1 c1 g1&g1>
/
f1&f1 f1 e1 < /:2v6ddv2dv6dv2dv6ddd:/ ggv5gv10gv5gv10ggg eev5ev10ev5ev10ec+>a
/:8r1:/ :/

>arrar4aa;

t200l8 @5 v11o3
r4. /:2
aaaaaa<e>a aa<e>a<g>a<f>a aa<g>a<f>a<e>a <c+>ab-<c+>b-agb- /:4a4r2<a4 / ae>a4a4<c+e >:/ >a4<a4>b4<c+4
/:16d:/ /:16c:/ >b-b-<fb-<d>b-fb- ccg<cec>g<c >ddfa<d>afd >a<aec+>aaaa
</:16d:/ /:16c:/ >b-b-<fb-<d>b-fb- ccg<cec>g<c >ddfa<d>afd >a<aec+>aaaa
</:16d:/ /:16c:/ >b-b-<fb-<d>b-fb- ccg<cec>g<c >ddfa<d>afd >a<aec+>aaaa
</:16d:/ /:16c:/ >b-b-<fb-<d>b-fb- ccg<cec>g<c >e-e-b-e-ge-b-f ge-b-e-<e->e-<g>e- >
/
< /:2dd<d>dga<cd >ff<f>fff<f>f b-b-<b->b-b-b-<b->b- aa<a>a / <g>a<a>a :/ <aec+>a
/:2 drrdr4<c&d >rdfde-e-gb- drrdr4<c&d >rdfdccec :/ > :/

dd<d>dga<cd;

t200l8 @4 @n5 @e1,0,5,0,8 v11
r4.
/:4r1:/ /:7cccrr2:/ cr4.r2 /:15ccrc:/ r2 /:14ccrc:/ cr4.r2 /:15ccr4:/ r2 /:14ccr4:/ cr4.r2
/:15ccr4:/ r2 /:4rccrccr4 r1:/
/:4r1:/ /:7cccrr2:/ cr4.r2 /:15ccrc:/ r2 /:14ccrc:/ cr4.r2 /:15ccr4:/ r2 /:14ccr4:/ cr4.r2
r1;

t200l8 @4 @n100 @e1,0,35,0,40 v10
r8 cr
/:8r4cr:/ /:3r4.crcr4:/ r4.crccc /:3r4.crcr4:/ r8ccccccc /:15r4cr:/cccc /:14r4cr:/ rccrccrc /:15r4cr:/cccc /:14r4cr:/ r@n105c@n100c@n105c @n110c16c16c16c16 @n120c16c16c16c16@n100
/:15r4cr:/r2 /:4 r2.cr r4crr4cr :/
/:8r4cr:/ /:3r4.crcr4:/ r4.crccc /:3r4.crcr4:/ r8ccccccc /:15r4cr:/cccc /:14r4cr:/ rccrccrc /:15r4cr:/cccc /:14r4cr:/ r@n105c@n100c@n105c @n110c16c16c16c16 @n120c16c16c16c16@n100

crrcr4cc;

t200l8 @4@n127 @e1,0,15,0,10 v15
cr4
/:8crr4:/ /:7crr4crcc:/ cr4.r2 /:64crr4:/
/:15crr4:/ cccc /:4 crrcr2 ccrccccc :/
/:8crr4:/ /:7crr4crcc:/ cr4.r2 /:64crr4:/

rccrccr4;
'''
