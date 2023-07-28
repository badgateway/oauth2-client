SOURCE_FILES:=$(shell find src/ -type f -name '*.ts')
EXAMPLE_FILES:=$(shell find examples/ -type f -name '*.js')

.PHONY:build
build: dist/build browser/oauth2-client.min.js

.PHONY:test
test:
	npx mocha

.PHONY:lint
lint:
	./node_modules/.bin/eslint --quiet 'src/**/*.ts' 'test/**/*.ts'

.PHONY:fix
fix:
	./node_modules/.bin/eslint --quiet 'src/**/*.ts' 'test/**/*.ts' --fix

.PHONY:watch
watch:
	./node_modules/.bin/tsc --watch


.PHONY:clean
clean:
	rm -r browser/
	rm -r dist/

dist/build: ${SOURCE_FILES}
	./node_modules/.bin/tsc
	touch dist/build

.PHONY: browserbuild
browserbuild: dist/build
	mkdir -p browser
	./node_modules/.bin/webpack

browser/oauth2-client.min.js: browserbuild
