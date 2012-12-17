fs     = require 'fs'
path   = require 'path'
jade   = require 'jade'
marked = require 'marked'

get_filelist = (lang)->
    dirpath = path.normalize "#{__dirname}/../src/docs/#{lang}"
    dstpath = path.normalize "#{__dirname}/../docs/#{lang}"
    fs.mkdir dstpath
    list = fs.readdirSync dirpath
    list = list.filter (x)-> /\.md$/.test x
    list = list.map    (x)-> x.replace /\.md$/, ''
    list.sort()
    list

make_doc = (lang, name, index=null)->
    template = jade.compile fs.readFileSync("#{__dirname}/make-docs.jade")
    filepath = path.normalize "#{__dirname}/../src/docs/#{lang}/#{name}.md"
    if fs.existsSync(filepath)
        if index is null
            list  = get_filelist lang
            index = list.map (x)-> x.replace /^(\d)+\./, ''

        lang    = if lang is '' then 'en' else lang
        title   = "#{name}"
        params =
            doc :marked fs.readFileSync(filepath, 'utf-8')
            lang:lang, title:title, index:index
        template params
    else 'NOT FOUND'

if not module.parent
    for lang in ['en', 'ja']
        dstpath = path.normalize "#{__dirname}/../docs/#{lang}"
        list  = get_filelist lang
        index = list.map (x)-> x.replace /^(\d)+\./, ''

        for name in list
            name = name.replace /^(\d)+\./, ''
            html = make_doc lang, name, index
            htmlfilepath = "#{dstpath}/#{name}.html"
            fs.writeFileSync htmlfilepath, html, 'utf-8'
else
    module.exports = make_doc
