#!/bin/bash
# firefox extension development is lovely

if [ -d firefox ]; then
	rm firefox -r
fi

mkdir -p firefox/data/icons/

cp -r icons/ scripts/ styles/ firefox/data/
cp manifest.json firefox/data/manifest.json
cp package.json firefox/package.json

cd firefox/

jpm xpi
