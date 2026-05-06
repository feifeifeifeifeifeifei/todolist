# TodoList Desktop (macOS)

Electron 壳子，把同目录下的 `to-do-list/`（React + Vite 网页应用）封装成 macOS 桌面应用。

> 不修改 `to-do-list/` 里的任何文件，所有桌面化逻辑都在本目录下。

## 目录结构

```
todolist/
├── to-do-list/         # 原有的 web 项目（保持不动）
└── desktop/            # 桌面应用壳子（本目录）
    ├── main.js         # Electron 主进程
    ├── preload.js      # 预加载脚本（含动态调整窗口高度逻辑）
    ├── scripts/
    │   └── build-icon.js   # 把 favicon.svg 渲染成 1024x1024 PNG
    ├── build/
    │   └── icon.png    # electron-builder 用来生成 .icns 的源图
    ├── release/        # 打包产物（.dmg / .zip / .app）
    └── package.json
```

## 第一次安装

```bash
cd desktop
npm install
```

> 同时也需要 `to-do-list/` 已经 `npm install` 过（看一眼有没有 `node_modules` 即可）。

## 开发模式（边改边看）

```bash
cd desktop
npm run dev
```

会做这几件事：

1. 在 `../to-do-list` 启动 Vite 开发服务器（`http://localhost:5173`）
2. 等端口起来后启动 Electron，加载该地址
3. 自动打开 DevTools

修改 `to-do-list/src/...` 会触发热更新，桌面窗口会同步刷新。

## 直接以「桌面 App」形态运行（用打包后的静态文件）

```bash
cd desktop
npm start
```

会先 `vite build` 一下 `to-do-list/`，然后 Electron 通过自定义 `app://` 协议直接加载 `to-do-list/dist/index.html`，不依赖任何本地服务器。

## 打包成 `.app` / `.dmg`

```bash
cd desktop
npm run build           # arm64 + x64 都打（dmg + zip）
# 或者只要 dmg：
npm run build:dmg
```

打包流程一条龙：

1. `npm run build:icon`：调 Electron 把 `to-do-list/public/favicon.svg` 渲染成 `build/icon.png`（1024×1024）
2. `npm run build:web`：在 `to-do-list/` 里跑 `vite build`，产物到 `to-do-list/dist`
3. `electron-builder --mac`：把 Electron 框架 + `main.js` + 上面那份 `dist`（拷贝到 `Contents/Resources/web`）打成 `.app`，再做成 `.dmg`

第一次打包要下载 Electron 二进制（每个 arch 约 100 MB），后续会缓存。

### 产物在哪里

`desktop/release/` 下：

| 文件 | 用途 |
|---|---|
| `TodoList-0.1.0-arm64.dmg` | Apple Silicon（M1/M2/M3…）的 DMG 安装包 |
| `TodoList-0.1.0.dmg` | Intel Mac 的 DMG 安装包 |
| `TodoList-0.1.0-arm64-mac.zip` | arm64 的 zip（自动更新备用） |
| `TodoList-0.1.0-mac.zip` | x64 的 zip |
| `mac-arm64/TodoList.app` | arm64 的原始 `.app`，可以直接拖进 Applications |
| `mac/TodoList.app` | x64 的原始 `.app` |

双击 DMG → 把 TodoList 拖到 `Applications` 文件夹 → Launchpad 里就能找到。

### Bundle metadata

| 字段 | 值 |
|---|---|
| `CFBundleIdentifier` | `com.feiren.todolist` |
| `CFBundleName` / DisplayName | `TodoList` |
| `CFBundleShortVersionString` | `0.1.0`（跟 `package.json` 的 `version` 同步） |
| Category | `public.app-category.productivity` |
| Icon | `Contents/Resources/icon.icns`（自动从 `build/icon.png` 派生出多个分辨率） |

### 没签名怎么办？

`mac.identity: null` 显式跳过了苹果签名，所以这是个未签名 App：

- 自己电脑上用：第一次双击会被 Gatekeeper 拦下来，**右键 → 打开**，确认一次后以后就能直接双击了。或者：

  ```bash
  xattr -dr com.apple.quarantine /Applications/TodoList.app
  ```

- 想分发给别人：需要苹果开发者账号（$99/年）配置 `mac.identity` 用 Developer ID 签名 + 公证（notarize），electron-builder 文档里有完整步骤。

## 后续可以改的方向

- 系统菜单 / 快捷键：在 `main.js` 用 `Menu.setApplicationMenu(...)` 自定义。
- 数据持久化：当前还是网页里那套 `localStorage`；要写到本地文件可以经 `preload.js` 用 `contextBridge` 暴露 `ipcRenderer`，主进程那边读写文件。
- 关闭时驻留 Dock / 状态栏：用 `Tray` API。
- 全局快捷键：`globalShortcut.register(...)`。
- 自动更新：electron-builder 自带 `electron-updater`，可以挂到自己服务器或 GitHub Releases。
