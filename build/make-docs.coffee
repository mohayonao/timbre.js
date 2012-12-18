fs     = require 'fs'
path   = require 'path'
jade   = require 'jade'
marked = require 'marked'

class DocFile
    re = /\/(\w+)\/(_?)(?:(tut|ext|uti|dev)-)?(?:(\d+)-)?([\w.]+?)\.md$/

    constructor: (@path)->
        if (m = re.exec @path)
            @lang     =   m[1]
            @dev      = !!m[2]
            @category =   m[3] or 'obj'
            @sort     =  +m[4] or Infinity
            @name     =   m[5]
        else @error = true

get_docfiles = (lang)->
    dirpath = path.normalize "#{__dirname}/../docs.md/#{lang}"
    unless fs.existsSync dirpath then return {}

    map = {}
    for filename in fs.readdirSync dirpath
        doc = new DocFile("#{dirpath}/#{filename}")
        if doc.dev and not isDev then continue
        map[doc.name] = doc
    map

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

sort_indexes = (docfiles)->
    map = tut:[], obj:[], ext:[], uti:[], dev:[]
    for name in Object.keys(docfiles)
        doc = docfiles[name]
        map[doc.category]?.push doc
    for name in Object.keys(map)
        map[name].sort (a, b)->
            a.sort - b.sort
        map[name] = map[name].map (x)-> x.name
    map

make_doc = (lang, name, docfiles=null, indexes=null)->
    template = jade.compile fs.readFileSync("#{__dirname}/make-docs.jade")

    unless docfiles
        docfiles = get_docfiles lang
    unless indexes
        indexes  = sort_indexes docfiles

    doc = docfiles[name]
    if doc
        title  = doc.name
        params =
            doc: lang_process marked fs.readFileSync(doc.path, 'utf-8')
            lang:lang, title:doc.name, index:[], indexes:indexes
            categories: [
                { key:'tut', caption:'Tutorial'   }
                { key:'obj', caption:'Objects'    }
                { key:'ext', caption:'Extentions' }
                { key:'uti', caption:'Utilities'  }
                { key:'dev', caption:'Developers' }
            ]
        template params
    else 'NOT FOUND'

if not module.parent
    dstpath = path.normalize "#{__dirname}/../docs/"
    if fs.existsSync dstpath
        for lang in ['en', 'ja']
            fs.mkdir "#{dstpath}/#{lang}"
            docfiles = get_docfiles lang
            indexes  = sort_indexes docfiles
            for name in Object.keys(docfiles)
                doc = docfiles[name]
                html = make_doc doc.lang, doc.name, docfiles
                htmlfilepath = "#{dstpath}/#{doc.lang}/#{doc.name}.html"
                fs.writeFileSync htmlfilepath, html, 'utf-8'
else
    isDev = true
    module.exports = make_doc
