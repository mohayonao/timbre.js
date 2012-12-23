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
            @category =   m[3] or '*'
            @sort     =  +m[4] or 50
            @name     =   m[5]
        else @error = true


class HTMLBuilder
    constructor: (dirpath, urlpath)->
        @files = do =>
            unless fs.existsSync dirpath then return {}

            map = {}
            for filename in fs.readdirSync dirpath
                doc = new DocFile("#{dirpath}/#{filename}")
                if doc.error or (doc.dev and not isDev) then continue
                doc.url = "/timbre.js/#{urlpath}/#{doc.name}.html"
                map[doc.name] = doc
            map

    build: (name)->
        doc = @files[name]
        unless doc then return 'NOT FOUND'

        html = marked fs.readFileSync(doc.path, 'utf-8')
        html = lang_process  html
        html = insert_canvas html
        html = insert_height html
        jade.compile(fs.readFileSync("#{__dirname}/common.jade"))
            lang: doc.lang, title: doc.name
            main: html

    get  : (name)-> @files[name]
    names: -> Object.keys(@files)

    get_indexes: (indexes, def='def')->
        for name in @names()
            doc = @get(name)
            if doc.category is '*' then doc.category = def
            unless indexes[doc.category]
                indexes[doc.category] = []
            indexes[doc.category].push doc

    lang_process = (doc)->
        re = /<pre><code class="lang-(.+)">([\w\W]+?)<\/code><\/pre>/g
        while m = re.exec doc
            rep = switch m[1]
                when 'js', 'javascript'
                    "<pre class=\"lang-js prettyprint\">#{m[2]}</pre>"
                when 'timbre'
                    "<pre class=\"click-to-play lang-js prettyprint linenums\">#{m[2]}</pre>"
                when 'codemirror'
                    """<div class=\"codemirror\" source=\"#{m[2]}\"></div>"""
                when 'table'
                    marked_table m[2]
            if rep
                doc = replace doc, m.index, m[0].length, rep
        doc

    replace = (src, start, length, dst)->
        head = src.substr 0, start
        tail = src.substr start + length
        head + dst + tail

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

    insert_canvas = (src)->
        re = /<p>\s*\(canvas\s+([\-\w]+) w:(\d+) h:(\d+)\)\s*<\/p>/g
        while (m = re.exec(src))
            rep = "<canvas id=\"#{m[1]}\" style=\"width:#{m[2]}px;height:#{m[3]}px\" class=\"pull-right\"></canvas>"
            src = replace src, m.index, m[0].length, rep
        src

    insert_height = (src)->
        re = /<p>\s*\(height\s+(\d+)\)\s*<\/p>/g
        while (m = re.exec(src))
            rep = "<div style=\"height:#{m[1]}px\"></div>"
            src = replace src, m.index, m[0].length, rep
        src


class DocFileBuilder extends HTMLBuilder
    constructor: (@lang)->
        super path.normalize("#{__dirname}/../docs.md/#{@lang}"), "docs/#{lang}"

    get_indexes: (indexes)->
        super indexes, 'ref'

    @build_statics = (langlist=['en', 'ja'])->
        dstpath = path.normalize "#{__dirname}/../docs/"
        unless fs.existsSync dstpath
            fs.mkdir dstpath
        miscpath = path.normalize "#{__dirname}/../misc/"

        for lang in langlist
            fs.mkdir "#{dstpath}/#{lang}"
            builder = new DocFileBuilder(lang)
            for name in builder.names()
                doc = builder.get(name)
                html = builder.build name
                htmlfilepath = "#{dstpath}/#{lang}/#{name}.html"
                fs.writeFileSync htmlfilepath, html, 'utf-8'


class ExampleFileBuilder extends HTMLBuilder
    constructor: ->
        super path.normalize("#{__dirname}/../examples.md"), "examples"

    get_indexes: (indexes)->
        super indexes, 'exa'

    @build_statics = ->
        dstpath = path.normalize "#{__dirname}/../examples/"
        unless fs.existsSync dstpath
            fs.mkdir dstpath
        miscpath = path.normalize "#{__dirname}/../misc/"

        builder = new ExampleFileBuilder()
        for name in builder.names()
            doc = builder.get(name)
            html = builder.build name
            htmlfilepath = "#{dstpath}/#{name}.html"
            fs.writeFileSync htmlfilepath, html, 'utf-8'


class IndexFileBuilder extends HTMLBuilder
    constructor: (@lang)->
        @doc      = new DocFileBuilder(@lang)
        @examples = new ExampleFileBuilder()

    build: (categories=[])->
        indexes = {}
        @doc     .get_indexes(indexes)
        @examples.get_indexes(indexes)

        for name in Object.keys(indexes)
            indexes[name].sort (a, b)->
                if a.sort is b.sort
                    if a.name < b.name then -1 else +1
                else a.sort - b.sort
            indexes[name] = indexes[name].map (x)-> {name:x.name, url:x.url, dev:x.dev}
        jade.compile(fs.readFileSync("#{__dirname}/index.jade"))
            indexes:indexes, categories: [
                { key:'tut', caption:'Tutorials'     }
                { key:'exa', caption:'Examples'      }
                { key:'ref', caption:'References'    }
            ]

    @build_statics = ->
        null # TODO: implements

if not module.parent
    DocFileBuilder.build_statics()
    ExampleFileBuilder.build_statics()
    IndexFileBuilder.build_statics()
else
    isDev = true
    module.exports =
        DocFileBuilder: DocFileBuilder
        ExampleFileBuilder: ExampleFileBuilder
        IndexFileBuilder: IndexFileBuilder
