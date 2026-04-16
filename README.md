# 鼠鼠说（rats-talk）

基于微信小程序云开发的交流社区项目，支持发帖、浏览、互动、个人中心与我的发布管理。

## 项目概览

`rats-talk` 由两部分组成：

- `miniprogram`：小程序前端，负责页面展示、交互与云函数调用
- `cloudfunctions`：后端云函数，负责帖子、用户、互动等数据处理

当前主要页面包括：

- `pages/index`：首页帖子流
- `pages/publish`：发帖页
- `pages/post`：帖子详情
- `pages/profile`：个人中心
- `pages/my-posts`：我的发布
- `pages/auth`：授权与登录相关页面

## 核心功能

- 用户登录与身份识别（基于微信 `openid`）
- 帖子发布、编辑、删除、浏览
- 帖子互动（有用/无用等互动状态）
- 浏览量统计与互动统计
- 个人发布列表与个人数据汇总

## 云函数说明

`cloudfunctions` 目录下包含以下核心能力：

- `getOpenid`：获取当前用户 `openid`
- `createUser`：创建用户信息
- `createPost`：创建帖子
- `updatePost`：更新帖子
- `deletePost`：删除帖子
- `getPosts`：分页获取帖子列表/帖子详情
- `getMyPosts`：获取当前用户的帖子与统计信息
- `interactPost`：处理帖子互动行为
- `updateViewCount`：更新帖子浏览量

## 本地开发

1. 使用微信开发者工具打开项目根目录
2. 在开发者工具中开通并绑定云开发环境
3. 右键 `cloudfunctions` 下各函数目录并执行“上传并部署（云端安装依赖）”
4. 编译 `miniprogram` 并在模拟器或真机中调试

## 目录结构

```text
rats-talk/
├── miniprogram/        # 小程序前端代码
├── cloudfunctions/     # 云函数代码
├── project.config.json # 小程序工程配置
└── README.md
```

