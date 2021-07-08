mkdir -p var

node update-list.js
mysql --local-infile=1 < update-list.sql

./run.sh init