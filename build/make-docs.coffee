fs     = require 'fs'
path   = require 'path'
jade   = require 'jade'
marked = require 'marked'

get_filelist = (lang)->
    dirpath = path.normalize "#{__dirname}/../docs.md/#{lang}"
    unless fs.existsSync dirpath then return []

    list = fs.readdirSync dirpath
    list = list.filter (x)-> /\.md$/.test x
    if not isDev
        list = list.filter (x)-> not /^_/.test x
    list = list.map (x)-> x.replace /\.md$/, ''
    list.sort()
    list

find_path = (lang, name)->
    dirpath = path.normalize "#{__dirname}/../docs.md/#{lang}"
    filepath = "#{dirpath}/#{name}.md"
    if fs.existsSync(filepath)
        return filepath
    for i in [0..99]
        num = "0#{i}".substr -2
        filepath = "#{dirpath}/#{num}.#{name}.md"
        console.log filepath
        if fs.existsSync(filepath)
            return filepath

lang_process = (doc)->
    re = /<pre><code class="lang-(.+)">([\w\W]+?)<\/code><\/pre>/g
    while m = re.exec doc
        rep = switch m[1]
            when 'js', 'javascript'
                "<pre class=\"lang-js prettyprint linenums\">#{m[2]}</pre>"
            when 'timbre'
                "<pre class=\"timbre lang-js prettyprint linenums\">#{m[2]}</pre>"
            when 'table'
                table m[2]
        if rep
            head = doc.substr 0, m.index
            tail = doc.substr m.index + m[0].length
            doc  = head + rep + tail
    doc

table_td = (x)->
    x = x.trim()
    m = /^md:\s*([\w\W]+)$/.exec x
    if m then marked m[1] else x

table = (src)->
    theads  = []
    tbodies = []
    list = theads
    for line in src.split '\n'
        if /^[\-+]+$/.test line
            list = tbodies
            continue
        list.push line
    if tbodies.length is 0
        tbodies = theads
        theads  = []
    items = []
    items.push "<table class=\"table\">"
    if theads.length
        items.push "<thead>"
        for x in theads
            items.push "<tr>"
            x = x.split('|').map(table_td).join('</th><th>')
            items.push "<th>#{x}</th>"
            items.push "</tr>"
        items.push "</thead>"
    if tbodies.length
        items.push "<tbody>"
        for x in tbodies
            items.push "<tr>"
            x = x.split('|').map(table_td).join('</td><td>')
            items.push "<td>#{x}</td>"
            items.push "</tr>"
        items.push "</tbody>"
    items.push "</table>"
    items.join ''

make_doc = (lang, name, index=null)->
    template = jade.compile fs.readFileSync("#{__dirname}/make-docs.jade")
    filepath = find_path lang, name
    if filepath
        if index is null
            list  = get_filelist lang
            index = list.map (x)-> x.replace /^(\d)+\./, ''

        lang  = if lang is '' then 'en' else lang
        title = "#{name}"
        doc   = lang_process marked fs.readFileSync(filepath, 'utf-8')
        params =
            doc :doc
            lang:lang, title:title, index:index
        template params
    else 'NOT FOUND'

if not module.parent
    dstpath = path.normalize "#{__dirname}/../docs/"
    if fs.existsSync dstpath
        for lang in ['en', 'ja']
            fs.mkdir "#{dstpath}/#{lang}"
            list  = get_filelist lang
            index = list.map (x)-> x.replace /^(\d)+\./, ''
            for name in list
                name = name.replace /^(\d)+\./, ''
                html = make_doc lang, name, index
                htmlfilepath = "#{dstpath}/#{lang}/#{name}.html"
                fs.writeFileSync htmlfilepath, html, 'utf-8'
else
    isDev = true
    module.exports = make_doc
