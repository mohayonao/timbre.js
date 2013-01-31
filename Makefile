dev: timbre

all: hint test timbre

timbre: hint
	@coffee build/timbre-builder.coffee

test: hint
	@mocha --reporter dot

hint:
	@jshint src/core.js src/objects/*.js src/modules/*.js src/extras/*.js

clear:
	@rm -f timbre.js
	@rm -rf ./ja
	@rm -f ./*.html

gh-pages: clear
	@uglifyjs --unsafe -nc -nm --source-map ./timbre.js.map -o ./timbre.js ./timbre.dev.js
	@coffee build/html-builder.coffee

.PHONY: test
