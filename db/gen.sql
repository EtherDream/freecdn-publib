USE db_cdn;

SELECT
  HEX(hash),
  -- 如果 hash 相同，找出最合理的资源（path 和 sites），参考 README.md#数据筛选
  -- 使用 limit 可避免 SUBSTRING_INDEX（https://mariadb.com/kb/en/group_concat/#limit）
  -- 注意两个 GROUP_CONCAT 中的 ORDER BY 保持一致
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