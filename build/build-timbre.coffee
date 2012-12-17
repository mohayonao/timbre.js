fs   = require 'fs'
path = require 'path'

SRC_DIR = path.normalize "#{__dirname}/../src"
DST_DIR = path.normalize "#{__dirname}/../"

object_json = JSON.parse fs.readFileSync("#{SRC_DIR}/objects.json", 'utf-8')

object_files = do ->
    dirpath = "#{SRC_DIR}/objects"
    list = fs.readdirSync dirpath
    list = list.filter (x)-> /.*\.js$/.test(x)
    list = list.map (x)-> x.replace /\.js$/, ''
    list.sort()
    list

# sort by dependencies
dependencies = object_json.dependencies or []
for i of dependencies
    list = dependencies[i]
    if not Array.isArray(list)
        list = [list]
    for j in list
        a = object_files.indexOf(i)
        b = object_files.indexOf(j)
        if a < b
            object_files.splice b, 1
            object_files.splice a, 0, j

# build source code
build_timbre = ->
    source_core = fs.readFileSync("#{SRC_DIR}/core.js", 'utf-8')
    source = [source_core].concat object_files.map (x)->
        fs.readFileSync "#{SRC_DIR}/objects/#{x}.js", 'utf-8'
    source.join ''

if not module.parent
    source = build_timbre()
    fs.writeFileSync "#{DST_DIR}/timbre.dev.js", source, 'utf-8'
else
    module.exports = build_timbre
