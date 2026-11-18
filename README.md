# 桌面输入保护

这是一款供 Windows 上的 DeepSeek Harness 使用的本地 Cordis 插件。它在工具执行前检查调用参数，命中规则时向 Harness 返回拒绝理由。

- 拦截通过常见 Windows API 或脚本库模拟全局鼠标和键盘输入。
- 拦截对 Windows 计划任务的变更、提权或隐藏进程启动，以及对本次实验遗留的桌面控制脚本或任务的调用。
- 拦截常见命令对资源管理器、输入服务、NVIDIA 叠加层和 UU远程进程的干预，以及对鼠标相关注册表设置的变更。
- 普通文件和文档工作可继续进行。例如，查询 explorer 进程、列出 Word 文件，以及在 Markdown 报告里引用 API 名称，都通过了测试。

## 安装到 DeepSeek Harness Desktop

1. 解压插件，把 `dsh-desktop-input-guard` 文件夹放到之后会保留的位置。
2. 备份并打开 `%USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml`。
3. 在现有 YAML 列表末尾追加下方条目，把 `name` 改成解压后 `index.js` 的绝对路径。示例使用正斜线，便于复制到 YAML。

```yaml
- insert:
    - id: desktop-input-guard
      name: 'C:/plugins/dsh-desktop-input-guard/index.js'
```

如果配置原本只有空列表 `[]`，用上方条目替换该空列表。保存后重新打开 Harness。可以在 Harness 的 Cordis 插件列表中确认 `desktop-input-guard` 已加载。卸载时删掉这条插入项，再重新打开 Harness。

若需要限制脚本的系统访问，建议在 Harness 中选择「工作区写入」并保留审批。

## 验证范围

已验证的 Harness 运行时版本为 `0.2.1-rc.3`。在隔离环境中使用该版本自带的 Cordis 和工具运行时，通过了 15 项检查，涵盖允许、拒绝和卸载后解除守卫。检查使用无副作用的工具替身。

插件是针对常见操作和本次事故路径的参数规则。规则无法看见已存在或被间接调用的脚本内部行为，也无法约束其他应用或 UU远程客户端。插件本身不会启动服务、注册计划任务或向外发送数据。

接口参考：[DeepSeek Harness 工具执行守卫](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/core/tools) · [Cordis 配置和打包](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)
