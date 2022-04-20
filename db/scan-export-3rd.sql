-- 导出指定 CDN 下未扫描的 URL 列表
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