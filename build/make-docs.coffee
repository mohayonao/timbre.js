fs     = require 'fs'
path   = require 'path'
jade   = require 'jade'
marked = require 'marked'

make_doc = (lang, name, index=[])->
    template = jade.compile fs.readFileSync("#{__dirname}/make-docs.jade")
    filepath = path.normalize "#{__dirname}/../src/docs/#{lang}/#{name}.md"
    if fs.existsSync(filepath)
        lang    = if lang is '' then 'en' else lang
        title   = "#{name}"
        params =
            doc :marked fs.readFileSync(filepath, 'utf-8')
            lang:lang, title:title, index:index
        template params
    else 'NOT FOUND'

if not module.parent
    for lang in ['en', 'ja']
        dirpath = path.normalize "#{__dirname}/../src/docs/#{lang}"
        dstpath = path.normalize "#{__dirname}/../docs/#{lang}"
        fs.mkdir dstpath
        list = fs.readdirSync dirpath
        list = list.filter (x)-> /\.md$/.test x
        list = list.map    (x)-> x.replace /\.md$/, ''
        list.sort()
        index = list.map   (x)-> x.replace /^(\d)+\./, ''

        for name in list
            name = name.replace /^(\d)+\./, ''
            html = make_doc lang, name, index
            htmlfilepath = "#{dstpath}/#{name}.html"
            fs.writeFileSync htmlfilepath, html, 'utf-8'
else
    module.exports = make_doc
