fs   = require 'fs'
path = require 'path'

SRC_DIR = path.normalize "#{__dirname}/../src"
DST_DIR = path.normalize "#{__dirname}/../"

# build source code
build_timbre = (opts={})->

    from = (dirpath)->
        list = fs.readdirSync dirpath
        list = list.filter (x)-> /.*\.js$/.test(x)
        if not isDev
            list = list.filter (x)-> not /^_/.test(x)
        list.sort()
        list.map (x)->
            fs.readFileSync "#{dirpath}/#{x}", 'utf-8'

    source = [fs.readFileSync("#{SRC_DIR}/core.js", 'utf-8')]
    source = source.concat from "#{SRC_DIR}/modules"
    source = source.concat from "#{SRC_DIR}/objects"
    source = source.join ''

    if not opts.debug
        source = source.replace /\/\/debug--[\w\W]+\/\/--debug/g, ''

    source

if not module.parent
    source = build_timbre()
    fs.writeFileSync "#{DST_DIR}/timbre.dev.js", source, 'utf-8'
else
    isDev = true
    module.exports =
        build: build_timbre
