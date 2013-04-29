fs     = require 'fs'
path   = require 'path'
jade   = require 'jade'
marked = require 'marked'

isDev = false

class DocFile
    re = /\/(?:(\w+)\/)?(_?)(?:([a-z]+)-)?(?:(\d+)-)?([\w.]+?)\.md$/i

    constructor: (@path)->
        if (m = re.exec @path)
            @lang     =   m[1] or 'en'
            @dev      = !!m[2]
            @category =   m[3] or '*'
            @sort     = +(m[4] ? 50)
            @name     =   m[5]
            @title    = getTitle @path
        else @error = true

    getTitle = (path)->
        fs.readFileSync(path, 'utf-8').split('\n')[0]

class HTMLBuilder
    constructor: (@dirpath)->
        @files = do =>
            unless fs.existsSync @dirpath then return {}

            map = {}
            for filename in fs.readdirSync @dirpath
                doc = new DocFile("#{@dirpath}/#{filename}")
                if doc.error or (doc.dev and not isDev) then continue
                doc.url = "./#{doc.name}.html"
                map[doc.name] = doc
            map

        filepath = path.normalize("#{@dirpath}/../timbre.dev.js")
        source = fs.readFileSync filepath, 'utf-8'
        @devsize = source.length
        for line in source.split('\n')
            if (m = /var _ver = "([\w.]+)";/.exec line)
                @version = m[1]
                break

    build: (name)->
        doc = @files[name]
        unless doc then return 'NOT FOUND'

        indexes = @get_indexes()
        indexes.D.unshift
            title:'Introduction', url:'./'

        html = marked_with_filtering_by_lang doc.path, @lang
        html = lang_process  html
        html = insert_canvas html
        html = insert_label  html
        html = jade.compile(fs.readFileSync("#{__dirname}/common.jade"))
            lang: doc.lang, title: doc.title, main: html
            version: @version
            indexes:indexes, categories:[
                {key:'D', caption:'Documents' }
                {key:'E', caption:'Examples'  }
                {key:'R', caption:'References'}
                {key:'X', caption:'Extra objects'}
            ]
        if name is 'index'
            html = html.replace '${VERSION}', @version
            html = html.replace '${DEVSIZE}', (@devsize / 1024).toFixed 2
            filepath = path.normalize "#{@dirpath}/../timbre.js"
            if fs.existsSync filepath
                source = fs.readFileSync filepath, 'utf-8'
                html = html.replace '${MINSIZE}', (source.length / 1024).toFixed 2
        html

    get  : (name)-> @files[name]
    names: -> Object.keys(@files)

    get_indexes: ()->
        indexes = {}
        for name in @names()
            doc = @get(name)
            unless indexes[doc.category]
                indexes[doc.category] = []
            indexes[doc.category].push doc

        for name in Object.keys(indexes)
            indexes[name].sort (a, b)->
                if a.sort is b.sort
                    if a.title.toLowerCase() < b.title.toLowerCase() then -1 else +1
                else a.sort - b.sort
            indexes[name] = indexes[name].map (x)->
                title:formatTitle(x.title), url:x.url, dev:x.dev
        unless indexes.D then indexes.D = []
        indexes

    formatTitle = (title)->
        title.replace /T\("?([\w\W]+?)"?\)/, '$1'

    marked_with_filtering_by_lang = (filepath, lang)->
        items = []
        for line in fs.readFileSync(filepath, 'utf-8').split '\n'
            if not (m = /^(en|ja):/.exec line)
                items.push line
            else if m[1] is lang
                items.push line.substr 3
        marked.parser marked.lexer items.join '\n'

    lang_process = (doc)->
        re  = /<pre><code class="lang-(timbre|js|html|sh)">([\w\W]+?)<\/code><\/pre>/g
        doc = doc.replace re, '<div class="codemirror" lang="$1" source="$2"></div>'

        re = /<pre><code class="lang-table">([\w\W]+?)<\/code><\/pre>/g
        while m = re.exec doc
            rep = marked_table m[1]
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
        src.replace re, '<canvas id="$1" style="width:$2px;height:$3px"></canvas>'

    insert_label = (src)->
        src = src.replace /{deferred}/ig, '<span class="label deferred">DEFERRED</span>'
        src = src.replace /{listener}/ig, '<span class="label listener">LISTENER</span>'
        src = src.replace /{timer}/ig   , '<span class="label timer">TIMER</span>'
        src = src.replace /{stereo}/ig  , '<span class="label stereo">STEREO</span>'
        src = src.replace /{kr}/ig   , '<span class="label kr">KR</span>'
        src = src.replace /{ar}/ig   , '<span class="label ar">AR</span>'
        src = src.replace /{arkr}/ig   , '<span class="label ar">AR/KR</span>'
        src = src.replace /{krar}/ig   , '<span class="label kr">KR/AR</span>'

class DocFileBuilder extends HTMLBuilder
    constructor: (@lang)->
        super path.normalize("#{__dirname}/../docs.md")

    @build_statics = (langlist=['en', 'ja'])->
        for lang in langlist
            dstpath = path.normalize("#{__dirname}/..")
            if lang != 'en' then dstpath += "/#{lang}"
            unless fs.existsSync dstpath
                fs.mkdir dstpath
            builder = new DocFileBuilder(lang)
            for name in builder.names()
                html = builder.build name
                htmlfilepath = "#{dstpath}/#{name}.html"
                fs.writeFileSync htmlfilepath, html, 'utf-8'

class TestBuilder
    build: (name)->
        testcode = if name then getTestCode(name) else getAllTestCode()
        name ?= 'all test'
        jade.compile(fs.readFileSync("#{__dirname}/test.jade"))
            name:name, testcode:testcode

    getTestCode = (name)->
        filepath = "#{__dirname}/../test/#{name}.js"
        if fs.existsSync filepath
            fs.readFileSync filepath

    getAllTestCode = ->
        dirpath = "#{__dirname}/../test/"
        testcode = for filename in fs.readdirSync dirpath
            unless /\.js$/.test filename then continue
            if filename is 'timbre.debug.js' then continue
            fs.readFileSync "#{dirpath}#{filename}", 'utf-8'
        testcode.join ''

if not module.parent
    DocFileBuilder.build_statics()
else
    isDev = true
    module.exports =
        DocFileBuilder: DocFileBuilder
        TestBuilder: TestBuilder
