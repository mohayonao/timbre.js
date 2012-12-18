fs       = require 'fs'
path     = require 'path'
express  = require 'express'
build_timbre = require './build-timbre'
make_doc     = require './make-docs'

app = express()

app.get '/docs/:lang/:name\.html', (req, res)->
    lang = req.params.lang
    name = req.params.name
    res.send make_doc lang, name

app.get /^\/timbre(\.dev)?.js$/, (req, res)->
    res.type '.js'
    res.send build_timbre()

app.get '*', (req, res)->
    filepath = path.normalize "#{__dirname}/../#{req.url}"
    res.sendfile filepath

app.listen process.env.PORT or 3000
