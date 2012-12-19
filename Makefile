all: hint timbre minify docs

timbre:
	coffee build/build-timbre.coffee

minify: timbre
	uglifyjs --unsafe -nc -o ./timbre.js ./timbre.dev.js

html: clear-html
	coffee build/build-html.coffee

hint:
	jshint src/core.js src/objects/*.js src/extras/*.js

clear:
	rm -f timbre.dev.js
	rm -f timbre.js

clear-html:
	rm -rf docs/*
