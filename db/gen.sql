USE db_cdn;

-- https://mariadb.com/kb/en/group_concat/#limit
SELECT
  HEX(hash),
  SUBSTRING_INDEX(
    GROUP_CONCAT(path
      ORDER BY
        BIT_COUNT(sites) DESC,
        libid,
        ver,
        sites,
        LENGTH(path),
        path
      SEPARATOR '\t'
    ),
    '\t', 1
  ),
  SUBSTRING_INDEX(
    GROUP_CONCAT(sites
      ORDER BY
        BIT_COUNT(sites) DESC,
        libid,
        ver,
        sites,
        LENGTH(path),
        path
      SEPARATOR '\t'
    ),
    '\t', 1
  )
FROM
  table_cdnjs
WHERE
  hash <> 0x0000000000000000000000000000000000000000000000000000000000000000 AND
  size <> 0 AND
  path NOT LIKE '%.map' AND
  path NOT LIKE '%.ts' AND
  path NOT LIKE '%.scss' AND
  path NOT LIKE '%.swf'
GROUP BY
  hash
ORDER BY
  hash
;