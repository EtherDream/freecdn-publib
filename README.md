[![npm version](https://img.shields.io/npm/v/freecdn-publib.svg?style=flat)](https://www.npmjs.com/package/freecdn-publib)

# 项目简介

本项目为 [freecdn](https://github.com/EtherDream/freecdn) 提供公共资源 Hash/URL 存储、查询和导出功能。


# 数据来源

公共资源 URL 列表来源于 [cdnjs](https://cdnjs.com/)，其收录了数千个前端开源项目，并提供数百万个资源 URL。

cdnjs 存在诸多镜像站点，例如官方提供的站点（以 jquery 文件为例）：

* https://ajax.cdnjs.com/ajax/libs/jquery/3.2.1/jquery.js

* https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.js

cdnjs 所在的 GitHub 项目，可通过 jsdelivr 加速：

* https://cdn.jsdelivr.net/gh/cdnjs/cdnjs/ajax/libs/jquery/3.2.1/jquery.js

国内的镜像：

* https://lf6-cdn-tos.bytecdntp.com/cdn/expire-6-M/jquery/3.2.1/jquery.js

* https://lib.baomitu.com/jquery/3.2.1/jquery.js

* https://cdn.staticfile.org/jquery/3.2.1/jquery.js

* https://cdn.bootcss.com/jquery/3.2.1/jquery.js

* https://cdn.bootcdn.net/ajax/libs/jquery/3.2.1/jquery.js

有些站点较长时间未更新，所以不完整；有些站点对 JS、CSS、图片进行了压缩，导致 Hash 和官方版本不一致。这些缺失或损坏的资源未收录。

此外，有些站点虽不是 cdnjs 的镜像，但资源路径的格式和 cdnjs 一致：

* https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.js

* https://g.alicdn.com/code/lib/jquery/3.2.1/jquery.js

* https://pagecdn.io/lib/jquery/3.2.1/jquery.js

这些站点的资源数量不多，只有几千至几万个。

也有些站点不仅不是 cdnjs 的镜像，并且路径格式也不一致：

* https://ajax.aspnetcdn.com/ajax/jquery/jquery-3.2.1.js

* https://unpkg.com/jquery@3.2.1/dist/jquery.js

为了节省存储空间，本项目只存储 cdnjs 格式的路径，对于不一致但存在转换规律的路径，使用 [rewrite](src/siteinfo.ts) 方案进行转换。

还有些站点只用于特定项目，例如：

* jquery: https://code.jquery.com/jquery-3.2.1.js

* bootstrap: https://stackpath.bootstrapcdn.com/

* datatables: https://cdn.datatables.net/

* twemoji: https://twemoji.maxcdn.com/v/

这些站点也被采纳，可为特定项目的资源加速。（同样使用路径 rewrite 方案）


# 数据筛选

本项目排除了一些不常用的文件，例如 `.map`、`.ts`、`.scss` 等开发文件，例如已被禁用的 `.swf` 文件。

对于内容相同的文件，只需选择其中一个即可。目前的选择策略是：

1. 站点越多越好（备用 URL 更多，稳定性更高）

2. 项目越流行越好（排名根据 [cdnjs libraries](https://api.cdnjs.com/libraries?output=human) 的顺序）

3. 版本号越小越好（版本号会升级，但最旧的版本号是固定的）

4. 站点越流行越好（排名靠前的站点大多是 cdnjs 的镜像。顺序参考 [db/sites.txt](db/sites.txt)）

5. 路径越短越好（节省空间）

6. 按路径字符串排序（以上都相同时，使用路径区分。因为路径是唯一的）

细节参考 [db/gen.sql](db/gen.sql)。去重后可减少 80% 以上的记录，大幅节省存储空间。


# 存储格式

本项目使用自定义的格式编码数据，直接打包在 NPM 包里。（相比 SQLite 可节省需数百 MB 空间）

数据存放在 assets 目录：

* `hash-prefixes.br` Hash 前缀（4 字节）集合，已排序，存在重复。已压缩

* `hash-suffixes` Hash 后缀（28 字节）集合，对应 prefixes 的顺序

* `data.br` 文件路径及站点 bits 集合，对应 prefixes 的顺序。已压缩

查询时根据 Hash 的前缀，通过 prefixes 快速找到位置；然后 seek suffixes 文件到相应位置，校验 Hash 后缀是否相同；最后从 data 相应位置获取 URL 列表。


# 更新日志

[CHANGELOG.md](CHANGELOG.md)
