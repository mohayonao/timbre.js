fs       = require 'fs'
path     = require 'path'
express  = require 'express'
timbre_builder = require './timbre-builder'
html_builder   = require './html-builder'

app = express()

app.get '/docs/:lang/:name\.html', (req, res)->
    builder = new html_builder.DocFileBuilder(req.params.lang)
    html = builder.build(req.params.name)
    res.send html

app.get '/misc/index-doc-:lang\.html', (req, res)->
    builder = new html_builder.DocFileBuilder(req.params.lang)
    html = builder.build_indexes()
    res.send html

app.get '/examples/:name\.html', (req, res)->
    builder = new html_builder.ExampleFileBuilder()
    html = builder.build(req.params.name)
    res.send html

app.get '/misc/index-example.html', (req, res)->
    builder = new html_builder.ExampleFileBuilder()
    html = builder.build_indexes()
    res.send html

app.get /^\/timbre(\.dev)?.js$/, (req, res)->
    res.type '.js'
    res.send timbre_builder.build()

app.get '*', (req, res)->
    filepath = path.normalize "#{__dirname}/../#{req.url}"
    res.sendfile filepath

app.listen process.env.PORT or 3000
