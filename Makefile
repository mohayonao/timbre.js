dev: timbre

all: hint test timbre minify

timbre: hint
	coffee build/timbre-builder.coffee

minify: timbre
	uglifyjs --unsafe -nc -nm -o ./timbre.js ./timbre.dev.js

test: hint
	mocha --reporter dot

# html: clear-html
# 	coffee build/html-builder.coffee

hint:
	jshint src/core.js src/objects/*.js src/modules/*.js src/extras/*.js

clear:
	rm -f timbre.dev.js
	rm -f timbre.js

# clear-html:
# 	rm -rf docs/*

.PHONY: test
