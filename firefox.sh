#!/bin/bash
# firefox extension development is lovely

echo Creating necessary folders

rm data -r
mkdir data/
mkdir data/icons/

echo Copying files

cp -r scripts/ styles/ data/
cp icons/white.svg data/white.svg
cp manifest.json data/manifest.json
rm data/scripts/firefox.js

echo Creating a package

cfx xpi
