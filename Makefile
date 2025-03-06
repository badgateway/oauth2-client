SOURCE_FILES:=$(shell find src/ -type f -name '*.ts')
EXAMPLE_FILES:=$(shell find examples/ -type f -name '*.js')

.PHONY:build
build: dist/build browser/oauth2-client.min.js browser/oauth2-client.min.js.gz

.PHONY:test
test:
	#npx tsx --test test/*.ts
	node --experimental-strip-types --test test/*.ts

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

browser/oauth2-client.min.js: ${SOURCE_FILES} webpack.config.js
	mkdir -p browser
	./node_modules/.bin/webpack

browser/oauth2-client.min.js.gz: browser/oauth2-client.min.js
	gzip --keep -f browser/oauth2-client.min.js
	@# For some reason gzip makes the output file older than the input, so
	@# just making sure it gets a good mtime.
	touch browser/oauth2-client.min.js.gz
