<div align="center">

<img alt="EM3" src="public/favicon.svg" width="88" />

# EM3

**交大 E3 拉完了，寫個給人用的吧。**

給人用的 E3 客戶端，學生、老師、助教都能用：這週要交什麼、這堂課的教材、三步交作業、J/K 改作業，一打開就看得到。

[**打開 e3.emtech.cc**](https://e3.emtech.cc) · [在 GitHub 上給顆星 ⭐](https://github.com/elvisdragonmao/EM3)

[![GitHub stars](https://img.shields.io/github/stars/elvisdragonmao/EM3?style=social)](https://github.com/elvisdragonmao/EM3/stargazers)

</div>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/screens/dashboard-dark.webp">
  <img alt="EM3 首頁：上課中的課程、這週行事曆、即將截止的作業" src="public/screens/dashboard-light.webp">
</picture>

## 為什麼要做這個

E3 打開毫無重點，什麼都找不到。新生分不清「總攬、公告、大綱、教材」差在哪；首頁要往下捲整個畫面才看得到沒有課名的「未來事件」；午夜截止的作業顯示成隔天的「AM 12:00」；交一份作業要經過維基圖庫和八種授權條款。老師那邊也沒好到哪去：評分表一列都塞不下，下載的作業對不回學號，出一份小考要填 136 個欄位。

做 EM3 之前，我們先統計了 42 門課實際用了哪些 E3 功能，再模擬五種學生、五位老師、五位助教把 E3 走過一輪，記錄會卡在哪裡。過程和結果都放在 [docs/research](docs/research/README.md)（學生）和 [docs/research/teacher-interviews](docs/research/teacher-interviews/README.md)（老師與助教）。

## 有什麼不一樣

### 打開就知道今天要做什麼

首頁第一個畫面就是這週：每份作業都標出是哪門課、交了沒、還剩多久。設定課表之後，正在上的那堂課會放在最上面，附上下課倒數，以及教材、作業、公告的捷徑。

### 時間用講的

| E3 上的寫法                  | EM3                  |
| ---------------------------- | -------------------- |
| `10月 22日 星期四, AM 12:00` | 下星期三 10/21 24:00 |
| `10月 21日 星期三, PM 11:59` | 下星期三 10/21 23:59 |
| `10月 14日`                  | 昨天 星期三          |
| `10 10月 2026`               | 10/10 上星期六       |

### 一個檔案，就是一個檔案

E3 的「教材」其實是資料夾，而大部分資料夾裡只有一份投影片。EM3 把它們攤平，最新的放最上面，一週內的新檔案會標出來。PDF、圖片、影片直接在旁邊預覽。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/screens/materials-dark.webp">
  <img alt="課程教材" src="public/screens/materials-light.webp">
</picture>

### 上傳檔案，交出去，很難嗎？

允許的檔案類型寫在拖放區裡，選錯當場提醒。按下繳交前會列出 E3 上最後會有哪些檔案，逾期也會先告訴你。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/screens/submit-dark.webp">
  <img alt="繳交作業" src="public/screens/submit-light.webp">
</picture>

### 學期過了，課程就不見了是三小

所有學期一頁列完，本學期在最上面，微學分和線上課程分開放。每門課有自己的顏色和圖示，可以取簡稱、置頂或隱藏。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/screens/courses-dark.webp">
  <img alt="課程列表" src="public/screens/courses-light.webp">
</picture>

### 給老師和助教

在 E3 當老師或助教的課，課程頁會多一個「教學」分頁，首頁也會出現「待批改」。

- **評分工作台**：左邊名單（含學號），右邊作業內容；打分數、寫評語，`⌘↵` 存檔跳下一位，`J` / `K` 換人。評語可以用按鈕排版或寫 Markdown，常用句子存成片語。選課已失效但有交的學生也會列出來，E3 自己的評分表會漏掉他們。
- **下載 → 離線批改 → 送回**：zip 依「學號_姓名」分資料夾並附成績表；改好的檔案拖回來自動對回學生，成績用 CSV 匯入（UTF-8 或 Big5 都可以），寫入前先看新舊對照。
- **延長期限、複製未繳名單**：一鍵 +1、+3、+7 天，名單直接貼到 LINE。
- **發公告**：Milkdown 編輯器，有按鈕列，也能寫 Markdown；發布前先預覽學生看到的樣子。
- **小考出題**：打題目或從 Excel 貼上，匯出 Moodle XML 到 E3 題庫匯入。
- **寫教材**：E3 沒開放新增教材的 API，所以在 EM3 寫好、一鍵複製貼回 E3。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/screens/grading-dark.webp">
  <img alt="評分工作台" src="public/screens/grading-light.webp">
</picture>

<table>
  <tr>
    <td width="50%">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/screens/quiz-dark.webp">
        <img alt="小考出題" src="public/screens/quiz-light.webp">
      </picture>
    </td>
    <td width="50%">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/screens/announce-dark.webp">
        <img alt="發布公告" src="public/screens/announce-light.webp">
      </picture>
    </td>
  </tr>
</table>

### 課表、信件、鍵盤、手機、主題

- **課表**：貼上課綱上的時間代碼（例如 `T34R7-EC022`），或直接在格子上點。
- **信件**：E3 站內信直接在 EM3 讀，可以依課程分類、搜尋、標回未讀。E3 沒開放寄信的 API，所以回信會打開 E3。
- **鍵盤**：`⌘K` 跳到任何一門課，`1`–`8` 切換頁面，`J` / `K` 上下移動，`⌘/` 列出全部快捷鍵。
- **手機**：底部導覽列、精簡週曆，PDF 交給手機自己的檢視器開。
- **主題**：daisyUI 的全部主題，加上 EM3 自己的淺色和深色。設定可以匯出成 JSON 帶到別台電腦。

<table>
  <tr>
    <td width="66%">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/screens/timetable-dark.webp">
        <img alt="課表" src="public/screens/timetable-light.webp">
      </picture>
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/screens/shortcuts-dark.webp">
        <img alt="鍵盤快捷鍵" src="public/screens/shortcuts-light.webp">
      </picture>
    </td>
    <td width="34%">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/screens/mobile-dashboard-dark.webp">
        <img alt="手機版首頁" src="public/screens/mobile-dashboard-light.webp">
      </picture>
    </td>
  </tr>
</table>

## 使用

打開 [e3.emtech.cc](https://e3.emtech.cc)，用原本的 E3 學號和密碼登入，不用安裝任何東西。

如果 EM3 讓你少遲交了一次作業，請到 [GitHub](https://github.com/elvisdragonmao/EM3) 按一顆 ⭐，讓更多同學找到它。發現問題或有想要的功能，歡迎開 [issue](https://github.com/elvisdragonmao/EM3/issues)。

## 隱私

- **沒有後端。** EM3 是靜態網頁，瀏覽器直接呼叫 `e3p.nycu.edu.tw` 的 Moodle 行動版 API，中間沒有任何伺服器。
- **不存密碼。** 密碼只用來向 E3 換一組登入憑證，憑證放在這個網站的 cookie，登出就清掉。
- **不替你按已讀。** 公告的已讀狀態只記在你的瀏覽器（站內信例外：打開時會像在 E3 一樣標為已讀）；EM3 在你按下「確定繳交」之前不會動你的作業，老師的評分也要按下儲存才會寫入。
- 個人設定存在 `localStorage`，E3 資料的快取存在 IndexedDB，登出時一併清除。

README 和首頁的截圖使用測試帳號拍攝，姓名、學號、作者都在拍攝時換成假資料（見 `scripts/capture-screens.mjs`）。

## 開發

需要 Node.js 24 以上與 pnpm。

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 型別檢查並輸出到 dist/
pnpm format       # Prettier
pnpm run deploy   # 部署到 Cloudflare（需要 wrangler 登入）
```

技術：React 19、Vite、TypeScript、Tailwind CSS 4、daisyUI 5、TanStack Query、TanStack Router（hash history）、Zustand、motion、Phosphor Icons。

E3 的 `login/token.php`、`webservice/rest/server.php`、`webservice/upload.php`、`webservice/pluginfile.php` 都回應 `Access-Control-Allow-Origin: *`，所以 `dist/` 可以放在任何靜態主機上，不需要 proxy。

### 專案結構

功能導向，每個 feature 自己擁有頁面、元件與資料存取：

```
src/
  app/             路由、App 外殼、Query client、主題同步
  lib/moodle/      E3 Web Service client、型別、檔案 URL 與 HTML 處理
  lib/time/        相對時間與截止時間的寫法
  shared/          共用 UI、Milkdown 編輯器、鍵盤快捷鍵、hooks
  features/
    landing/       未登入時的介紹頁
    auth/          登入、token cookie
    dashboard/     今天
    assignments/   待辦、作業頁、繳交
    announcements/ 公告收件匣、單篇公告
    calendar/      行事曆
    courses/       課程列表、課名解析、顏色與圖示
    course/        課程頁（教材、作業、公告、成績）、檔案預覽
    timetable/     課表與節次
    mail/          E3 站內信
    teaching/      教學分頁、評分工作台、批次工具、公告、小考出題、寫教材
    preferences/   localStorage 設定
    settings/      設定頁、主題清單
docs/
  research/        E3 功能統計、學生訪談、教師與助教訪談
  design.md        設計決定
scripts/           給開發與 agent 用的唯讀 E3 工具、截圖腳本
```

### 更新截圖

```sh
pnpm dev
NODE_PATH=$(npm root -g) node scripts/capture-screens.mjs /tmp/em3-screens
python3 scripts/screens-to-webp.py /tmp/em3-screens
```

需要 `.env.local` 裡的 `E3_USERNAME` / `E3_PASSWORD`，以及全域安裝的 Playwright。桌機截圖是 1920×1080 的 2 倍；手機截圖用 iPhone 17 Pro 的尺寸（402×874 @3x）拍，再合成進 `scripts/assets/iphone17pro.png` 的外框。

## 授權

[Apache License 2.0](LICENSE)。EM3 是非官方專案，與國立陽明交通大學無關。
