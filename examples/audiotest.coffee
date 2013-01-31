T = require '..'

(T "audio").load "../misc/audio/amen.wav", ->
    do @play
