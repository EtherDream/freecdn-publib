USE db_cdn;

SELECT
  path
FROM
  table_cdnjs
WHERE
  (sites & ${bit}) = 0
ORDER BY
  rand()
;