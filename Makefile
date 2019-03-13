PATH:=./node_modules/.bin:$(PATH)

.PHONY:build
build: dist/build browser/fetch-mw-oauth2.min.js

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


dist/build:
	tsc
	touch dist/build

browser/fetch-mw-oauth2.min.js: dist/build
	mkdir -p browser
	webpack \
		--optimize-minimize \
		-p \
		--display-modules \
		--sort-modules-by size
