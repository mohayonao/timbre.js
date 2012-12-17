all: hint timbre minify

timbre:
	coffee build/build-timbre.coffee

minify: timbre
	uglifyjs --unsafe -nc -o ./timbre.js ./timbre.dev.js

hint:
	jshint src/core.js src/objects/*.js

clear:
	rm -f timbre.dev.js
	rm -f timbre.js
