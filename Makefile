dev: hint timbre

all: hint timbre minify html

timbre:
	coffee build/timbre-builder.coffee

minify: timbre
	uglifyjs --unsafe -nc -nm -o ./timbre.js ./timbre.dev.js

html: clear-html
	coffee build/html-builder.coffee

hint:
	jshint src/core.js src/objects/*.js src/modules/*.js src/extras/*.js

clear:
	rm -f timbre.dev.js
	rm -f timbre.js

clear-html:
	rm -rf docs/*
