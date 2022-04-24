mysql --skip-column-names < gen.sql > var/gen.txt
mkdir -p ../assets
node gen.js