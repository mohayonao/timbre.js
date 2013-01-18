dev: timbre

all: hint test timbre

timbre: hint
	@coffee build/timbre-builder.coffee

test: hint
	@mocha --reporter dot

hint:
	@jshint src/core.js src/objects/*.js src/modules/*.js src/extras/*.js

clear:
	@rm -f timbre.dev.js

.PHONY: test
