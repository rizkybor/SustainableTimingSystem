# SustainableTimingSystem
Sustainable Timing System Desktop App with VueJS


with Node v16.20.2
with Node v20.19.5

-rm -rf node_modules
-rm -rf package_log.json

install packages : yarn install

install vue-router : yarn vue-router@2

Start System on dev

Start mongo DB on terminal
-brew services start mongodb/brew/mongodb-community
-brew services stop mongodb/brew/mongodb-community

Connect mongodb compass
-open mongodb compass
-connect

Run on terminal in folder app
serve : yarn electron:serve

yarn electron:build (.dmg)
yarn electron:build --win --x64 (.exe)