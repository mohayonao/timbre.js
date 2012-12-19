fs     = require 'fs'
path   = require 'path'
jade   = require 'jade'
marked = require 'marked'

isDev = false

class DocFile
    re = /\/(?:(\w+)\/)?(_?)(?:([a-z]{3})-)?(?:(\d+)-)?([\w.]+?)\.md$/

    constructor: (@path)->
        if (m = re.exec @path)
            @lang     =   m[1] or 'en'
            @dev      = !!m[2]
            @category =   m[3] or 'def'
            @sort     =  +m[4] or 50
            @name     =   m[5]
        else @error = true


class HTMLBuilder
    constructor: (dirpath)->
        @files = do =>
            unless fs.existsSync dirpath then return {}

            map = {}
            for filename in fs.readdirSync dirpath
                doc = new DocFile("#{dirpath}/#{filename}")
                if doc.error or (doc.dev and not isDev) then continue
                map[doc.name] = doc
            map
        @index_url = null

    build: (name)->
        doc = @files[name]
        unless doc then return 'NOT FOUND'

        html = marked fs.readFileSync(doc.path, 'utf-8')
        html = lang_process html
        if @index_url
            script = "$(function() { $(\"#index\").load(\"../../misc/#{@index_url}.html\"); });"
        jade.compile(fs.readFileSync("#{__dirname}/common.jade"))
            lang: doc.lang, title: doc.name
            main: html, script: script

    get  : (name)-> @files[name]
    names: -> Object.keys(@files)

    build_indexes: (categories=[])->
        indexes = {}
        for kv in categories then indexes[kv.key] = []
        for name in Object.keys(@files)
            doc = @files[name]
            indexes[doc.category]?.push doc
        for name in Object.keys(indexes)
            indexes[name].sort (a, b)->
                if a.sort is b.sort
                    if a.name < b.name then -1 else +1
                else a.sort - b.sort
            indexes[name] = indexes[name].map (x)-> x.name
        jade.compile(fs.readFileSync("#{__dirname}/index.jade"))
            indexes:indexes, categories: categories

    lang_process = (doc)->
        re = /<pre><code class="lang-(.+)">([\w\W]+?)<\/code><\/pre>/g
        while m = re.exec doc
            rep = switch m[1]
                when 'js', 'javascript'
                    "<pre class=\"lang-js prettyprint linenums\">#{m[2]}</pre>"
                when 'timbre'
                    "<pre class=\"click-to-play lang-js prettyprint linenums\">#{m[2]}</pre>"
                when 'codemirror'
                    """<div class=\"codemirror\" source=\"#{m[2]}\"></div>"""
                when 'table'
                    marked_table m[2]
            if rep
                head = doc.substr 0, m.index
                tail = doc.substr m.index + m[0].length
                doc  = head + rep + tail
        doc

    marked_table = (src)->
        [theads, tbodies]  = [[],[]]
        list = theads
        for line in src.split '\n'
            if /^[\-+]+$/.test line
                list = tbodies
                continue
            list.push line
        if tbodies.length is 0
            [tbodies, theads] = [theads, tbodies]
        items = []
        items.push "<table class=\"table\">"
        if theads.length
            items.push "<thead>"
            items.push "<tr><th>#{x.split('|').map(table_td).join('</th><th>')}</th></tr>" for x in theads
            items.push "</thead>"
        if tbodies.length
            items.push "<tbody>"
            items.push "<tr><td>#{x.split('|').map(table_td).join('</td><td>')}</td></tr>" for x in tbodies
            items.push "</tbody>"
        items.push "</table>"
        items.join ''

    table_td = (x)->
        x = x.trim()
        m = /^md:\s*([\w\W]+)$/.exec x
        if m then marked m[1] else x


class DocFileBuilder extends HTMLBuilder
    constructor: (@lang)->
        super path.normalize "#{__dirname}/../docs.md/#{@lang}"
        @index_url = 'index-doc-" + navigator.language + "'

    build: (name)->
        super name

    build_indexes: ->
        super [ { key:'tut', caption:'Tutorial'   }
                { key:'def', caption:'Objects'    }
                { key:'ext', caption:'Extentions' }
                { key:'uti', caption:'Utilities'  }
                { key:'dev', caption:'Developers' } ]

    @build_statics = (langlist=['en', 'ja'])->
        dstpath = path.normalize "#{__dirname}/../docs/"
        unless fs.existsSync dstpath then return
        miscpath = path.normalize "#{__dirname}/../misc/"

        for lang in langlist
            fs.mkdir "#{dstpath}/#{lang}"
            builder = new DocFileBuilder(lang)
            for name in builder.names()
                doc = builder.get(name)
                html = builder.build name
                htmlfilepath = "#{dstpath}/#{lang}/#{name}.html"
                fs.writeFileSync htmlfilepath, html, 'utf-8'
            html = builder.build_indexes()
            htmlfilepath = "#{miscpath}/index-doc-#{lang}.html"
            fs.writeFileSync htmlfilepath, html, 'utf-8'


class ExampleFileBuilder extends HTMLBuilder
    constructor: ->
        super path.normalize "#{__dirname}/../examples.md"
        @index_url = 'index-example'

    build: (name)->
        super name

    build_indexes: ->
        super [ { key:'def', caption:'Examples' } ]

    @build_statics = ->
        dstpath = path.normalize "#{__dirname}/../examples/"
        unless fs.existsSync dstpath then return
        miscpath = path.normalize "#{__dirname}/../misc/"

        builder = new ExampleFileBuilder()
        for name in builder.names()
            doc = builder.get(name)
            html = builder.build name
            htmlfilepath = "#{dstpath}/#{name}.html"
            fs.writeFileSync htmlfilepath, html, 'utf-8'
        html = builder.build_indexes()
        htmlfilepath = "#{miscpath}/index-example.html"
        fs.writeFileSync htmlfilepath, html, 'utf-8'


if not module.parent
    DocFileBuilder.build_statics()
    ExampleFileBuilder.build_statics()
else
    isDev = true
    module.exports =
        DocFileBuilder    : DocFileBuilder
        ExampleFileBuilder: ExampleFileBuilder
