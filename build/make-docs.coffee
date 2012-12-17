fs     = require 'fs'
path   = require 'path'
jade   = require 'jade'
marked = require 'marked'

get_filelist = (lang)->
    dirpath = path.normalize "#{__dirname}/../src/docs/#{lang}"
    dstpath = path.normalize "#{__dirname}/../docs/#{lang}"
    unless fs.existsSync dirpath then return []
    fs.mkdir dstpath
    list = fs.readdirSync dirpath
    list = list.filter (x)-> /\.md$/.test x
    if not isDev
        list = list.filter (x)-> not /^_/.test x
    list = list.map (x)-> x.replace /\.md$/, ''
    list.sort()
    list

find_path = (lang, name)->
    dirpath = path.normalize "#{__dirname}/../src/docs/#{lang}"
    filepath = "#{dirpath}/#{name}.md"
    if fs.existsSync(filepath)
        return filepath
    for i in [0..99]
        num = "0#{i}".substr -2
        filepath = "#{dirpath}/#{num}.#{name}.md"
        console.log filepath
        if fs.existsSync(filepath)
            return filepath

make_doc = (lang, name, index=null)->
    template = jade.compile fs.readFileSync("#{__dirname}/make-docs.jade")
    filepath = find_path lang, name
    if filepath
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
    isDev = true
    module.exports = make_doc
