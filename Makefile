all: hint timbre minify docs

timbre:
	coffee build/build-timbre.coffee

minify: timbre
	uglifyjs --unsafe -nc -o ./timbre.js ./timbre.dev.js

docs: clear-docs
	coffee build/make-docs.coffee

hint:
	jshint src/core.js src/objects/*.js

clear:
	rm -f timbre.dev.js
	rm -f timbre.js

clear-docs:
	rm -rf docs/*
