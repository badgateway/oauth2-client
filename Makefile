PATH:=./node_modules/.bin:$(PATH)
SOURCE_FILES:=$(shell find src/ -type f -name '*.ts')

.PHONY:build
build: fetch-mw-oauth2.zip dist/build browser/fetch-mw-oauth2.min.js

.PHONY:test
test:
	# No tests yet

.PHONY:lint
lint:
	tslint -p .

.PHONY:lint-fix
lint-fix: fix

.PHONY:fix
fix:
	tslint -p . --fix

.PHONY:watch
watch:
	tsc --watch


dist/build: $(SOURCE_FILES)
	tsc
	@# Touching this file so Makefile knows aboutt the last
	@# build time.
	touch dist/build

browser/fetch-mw-oauth2.min.js: dist/build
	mkdir -p browser
	webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size

fetch-mw-oauth2.zip: browser/fetch-mw-oauth2.min.js
	cd browser; zip -r ../fetch-mw-oauth2.zip *.js *.map
