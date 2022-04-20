-- 导出 CDNJS 下未扫描的 URL 列表
-- 记录 Hash 值以 CDNJS 为准，其他 CDN 只记录在 sites 字段的 bit 中
USE db_cdn;

SELECT
  path
FROM
  table_cdnjs
WHERE
  hash = 0x0000000000000000000000000000000000000000000000000000000000000000
ORDER BY
  rand()
;