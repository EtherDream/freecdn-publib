-- 导入 CDNJS 的扫描结果，更新 Hash 值
-- size 字段只用于调试使用，最终不写入生成的数据文件中
USE db_cdn;

DROP TABLE IF EXISTS t;
CREATE TABLE t (
  `hash`    BINARY(32)    NOT NULL,
  `size`    INT UNSIGNED  NOT NULL,
  `path`    TEXT          NOT NULL
);

LOAD DATA
  LOCAL INFILE '${output}'
INTO TABLE
  t (@hashHex, size, path)
  SET hash = UNHEX(@hashHex)
;

UPDATE
  table_cdnjs
INNER JOIN
  t
ON
  table_cdnjs.path = t.path AND
  table_cdnjs.hash = 0x0000000000000000000000000000000000000000000000000000000000000000
SET
  table_cdnjs.hash = t.hash,
  table_cdnjs.size = t.size
;

DROP TABLE t;