SOURCE_FILES:=$(shell find src/ -type f -name '*.ts')
EXAMPLE_FILES:=$(shell find examples/ -type f -name '*.js')

.PHONY:build
build: fetch-mw-oauth2.zip dist/build browser/fetch-mw-oauth2.min.js

.PHONY:test
test:
	# No tests yet

.PHONY:lint
lint:
	./node_modules/.bin/eslint --quiet 'src/**/*.ts'

.PHONY:fix
fix:
	./node_modules/.bin/eslint --quiet 'src/**/*.ts' --fix

.PHONY:watch
watch:
	./node_modules/.bin/tsc --watch


.PHONY:clean
clean:
	rm -r browser/
	rm -r dist/

dist/build:
	./node_modules/.bin/tsc
	touch dist/build

.PHONY: browserbuild
browserbuild: dist/build
	mkdir -p browser
	./node_modules/.bin/webpack

browser/fetch-mw-oauth2.min.js: browserbuild
