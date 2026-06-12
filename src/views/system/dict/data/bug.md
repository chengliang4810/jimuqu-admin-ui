dict/data 页面是左右分栏结构——左边点击不同的字典类型，右边表格整体换一批数据。流程是：

1. 用户看到字典类型 A 的数据，位置 1 的行 dictCode=35
2. Popconfirm 已渲染，@confirm 绑定了 dictCode=35 的 row
3. 用户点击了左边另一个字典类型 B
4. emitter 触发，tableApi.query() 拉取新数据
5. 位置 1 现在变成了 dictCode="2047..."（完全不同的记录）
6. :title 响应式更新 → 显示新数据
7. @confirm 闭包里还是旧的 row → 删除的是 dictCode=35
