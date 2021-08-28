USE db_cdn;
SET GLOBAL local_infile=1;

LOAD DATA
  LOCAL INFILE 'var/list.txt'
INTO
  TABLE table_cdnjs
  (path, ver)
;

-- update existed libid
DROP TABLE IF EXISTS t;
CREATE TABLE t (
  `lib`    TEXT         NOT NULL,
  `id`     INT UNSIGNED NOT NULL,
  INDEX(`lib`(32))
);

LOAD DATA
  LOCAL INFILE 'var/lib-id.txt'
INTO TABLE
  t (lib, id)
;

UPDATE
  table_cdnjs
INNER JOIN
  t
ON
  SUBSTRING_INDEX(table_cdnjs.path, '/', 1) = t.lib AND
  table_cdnjs.libid <> t.id
SET
  table_cdnjs.libid = t.id
;

DROP TABLE t;