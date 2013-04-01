fs   = require 'fs'
path = require 'path'

SRC_DIR = path.normalize "#{__dirname}/../src"
DST_DIR = path.normalize "#{__dirname}/../"

# build source code
build_timbre = (opts={})->

    version = do ->
        for line in fs.readFileSync("#{DST_DIR}README.md", 'utf-8').split('\n')
            if (m = /\*\*(\d\d\.\d\d.\d\d\w*|WORKING)\*\*/.exec line) != null then return m[1]
        return null

    from = (dirpath)->
        list = fs.readdirSync dirpath
        list = list.filter (x)-> /.*\.js$/.test(x)
        if not isDev
            list = list.filter (x)-> not /^~?_/.test(x)
        list.sort()
        list.map (x)->
            fs.readFileSync "#{dirpath}/#{x}", 'utf-8'

    source = [fs.readFileSync("#{SRC_DIR}/core.js", 'utf-8')]
    source = source.concat from "#{SRC_DIR}/modules"
    source = source.concat from "#{SRC_DIR}/objects"
    source = source.join ''
    source = source.replace /\${VERSION}/g, version

    source:source, version:version, size:source.length

if not module.parent
    opts = build_timbre()
    fs.writeFileSync "#{DST_DIR}/timbre.dev.js", opts.source, 'utf-8'
    console.log "#{opts.version} - #{(opts.size / 1024).toFixed(2)}KB"

else
    isDev = true
    module.exports =
        build: build_timbre
