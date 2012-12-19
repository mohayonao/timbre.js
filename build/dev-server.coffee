fs       = require 'fs'
path     = require 'path'
express  = require 'express'
build_timbre = require './build-timbre'
build_html   = require './build-html'

app = express()

app.get '/examples/:name\.html', (req, res)->
    name = req.params.name
    res.send build_html.example name

app.get '/docs/:lang/:name\.html', (req, res)->
    lang = req.params.lang
    name = req.params.name
    res.send build_html.doc lang, name

app.get '/misc/doc-index-:lang\.html', (req, res)->
    lang = req.params.lang
    res.send build_html.doc_index lang

app.get /^\/timbre(\.dev)?.js$/, (req, res)->
    res.type '.js'
    res.send build_timbre()

app.get '*', (req, res)->
    filepath = path.normalize "#{__dirname}/../#{req.url}"
    res.sendfile filepath

app.listen process.env.PORT or 3000
