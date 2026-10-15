<div align=center>

<img alt="EM3" src="public/favicon.svg" width="72"/>

# EM3

更快、更清楚的陽明交大 E3 客戶端

</div>

EM3 是 [NYCU E3](https://e3p.nycu.edu.tw/) 的非官方第三方客戶端：一個純靜態的 React SPA，直接在瀏覽器裡呼叫 E3（Moodle 4.5）的行動版 Web Service API，沒有中間伺服器。

- **今天**：這堂課、這週要交的東西、新教材、新公告，一頁看完。
- **時間講人話**：「昨天 星期三」「10/5 上星期五」「明天 星期四 23:59」，`00:00` 截止顯示成前一天 24:00。
- **課表**：知道你現在在上哪堂課，把它放在最前面。
- **教材**：攤平只有一個檔案的資料夾，PDF 直接在 App 裡預覽。
- **繳交**：拖檔案、確認、繳交，三步完成。
- **課程**：依學期篩選，每門課可以自訂顏色、圖示和簡稱。
- **主題**：daisyUI 全部主題加上 EM3 自己的深淺色主題；設定可以匯出成 JSON。

設計理由見 [docs/design.md](docs/design.md)，使用者研究見 [docs/research/](docs/research/README.md)。

## 開發

需要 Node.js 24 以上與 pnpm。

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 輸出到 dist/
pnpm preview
pnpm format       # Prettier
pnpm test         # TypeScript 型別檢查
```

技術：React 19、Vite、TypeScript、Tailwind CSS 4、daisyUI 5、TanStack Query、TanStack Router（hash history）、Zustand、motion、Phosphor Icons。

### 專案結構

功能導向，每個 feature 自己擁有頁面、元件與資料存取：

```
src/
  app/            路由、App 外殼、Query client、主題同步
  lib/moodle/     E3 Web Service client、型別、檔案 URL 與 HTML 處理
  lib/time/       相對時間與截止時間的寫法
  shared/         共用 UI（快速跳轉、時間、狀態、Logo）與 hooks
  features/
    auth/         登入、token cookie
    dashboard/    今天
    assignments/  待辦、作業頁、繳交
    announcements/ 公告收件匣、單篇公告
    calendar/     行事曆
    courses/      課程列表、課名解析、顏色與圖示
    course/       課程頁（教材、作業、公告、成績）、檔案預覽
    timetable/    課表與節次
    preferences/  localStorage 設定
    settings/     設定頁、主題清單
```

## 部署

`dist/` 是純靜態檔案，用相對路徑與 hash 路由，可以放在任何靜態主機上：GitHub Pages（`.github/workflows/deploy.yml`）、Cloudflare Workers Assets（`wrangler.jsonc`），或任何子路徑。

E3 的 `login/token.php`、`webservice/rest/server.php`、`webservice/upload.php`、`webservice/pluginfile.php` 都回應 `Access-Control-Allow-Origin: *`，所以不需要 proxy。

## 隱私

- 密碼只用來向 `e3p.nycu.edu.tw/login/token.php` 換取 token，不會儲存。
- token 存在這個網站的 cookie；個人設定存在 `localStorage`；E3 回應快取在 IndexedDB，登出時清除。
- 公告的已讀狀態只記在本地，不會在 E3 上標記已讀。

## 授權條款

本專案採用 Apache License 2.0 授權，詳情請參閱 [LICENSE](./LICENSE) 檔案。
