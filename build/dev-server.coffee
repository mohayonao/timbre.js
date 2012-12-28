fs       = require 'fs'
path     = require 'path'
express  = require 'express'
jade     = require 'jade'
timbre_builder = require './timbre-builder'
html_builder   = require './html-builder'

app = express()

app.get /^\/timbre\.js\/(?:(ja)\/)?(?:([.\w]+)\.html)?$/, (req, res)->
    lang     = req.params[0] or 'en'
    name     = req.params[1] or 'index'
    builder = new html_builder.DocFileBuilder(lang)
    html = builder.build(name)
    res.send html

app.get '/timbre.js/misc/index.html', (req, res)->
    builder = new html_builder.IndexFileBuilder()
    html = builder.build()
    res.send html

app.get /^\/timbre\.js\/timbre(?:\.(dev|debug))?.js$/, (req, res)->
    debug = req.params[0] is 'debug'
    res.type '.js'
    res.send timbre_builder.build debug:debug

app.get '/timbre.js/*', (req, res)->
    filename = req.url.replace '/timbre.js/', ''
    filepath = path.normalize "#{__dirname}/../#{filename}"
    res.sendfile filepath

app.get '/test/:name?', (req, res)->
    builder = new html_builder.TestBuilder()
    html = builder.build(req.params.name)
    res.send html

app.listen process.env.PORT or 3000
