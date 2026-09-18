# Nico Draw Panel

nico 系列角色抽屉面板（SillyTavern 扩展）：从页面顶部向下拉展开角色资料卡（头像/名称/身高/年龄/简介/高光相册）+ 音乐播放器（搜歌名/歌手搜歌、曲目列表/定时暂停/切歌）+ 图片墙，底部拖拽条收起。

## 安装

推荐用 **Git 方式安装**（支持在酒馆内一键更新）：

1. 打开 SillyTavern，进入顶部 **Extensions（扩展）** 面板
2. 选择 **Install Extension（安装扩展）**
3. 粘贴仓库地址：
   ```
   https://github.com/miaccj9-maker/nicoDrawPanel.git
   ```
4. 点击安装，扩展会自动下载并加载，重启/刷新酒馆后生效

> 手动拷贝方式（把文件夹放进 `data/<用户名>/extensions/`）也可以使用，但**无法使用酒馆的更新按钮**。

## 更新

- **Git 方式安装**：进入 Extensions → **Manage Extensions（管理扩展）** → 找到 Nico Draw Panel → 点击 **Update** 按钮即可更新
- 命令行方式：在扩展目录执行 `git pull`
- 手动拷贝安装：需重新下载最新文件覆盖

## 功能

- 角色资料卡：头像、名称、身高、年龄、简介、高光相册
- 音乐播放器：
  - 按歌名/歌手搜歌（网易云 / QQ / 酷狗 / 酷我 / qijieya / Joox 多引擎并行）
  - 曲目列表、单曲循环/顺序/随机播放、定时暂停、进度条拖动
  - 死链自动按原歌曲 ID 精确重解析并续播
  - 弹幕歌词（按歌曲 ID 直拉，可拖动、换色）
- 图片墙：可收藏/替换角色图片

## 许可

[MIT](LICENSE) © 2026 miaccj9-maker
