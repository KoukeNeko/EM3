# 訪談 05：交換學生 Lena（英文使用者／行動裝置／深色模式／鍵盤）

- 方法：以 persona 角色扮演的可用性測試。用 Playwright 操作真實學生帳號（已登入的 storageState），只瀏覽，沒有送出任何內容
- 日期：2026-10-15（台灣時間下午）
- 截圖目錄：`/private/tmp/claude-501/-Users-em-uwu-EM3/851f90ca-d82e-4e20-870a-c557e6445981/scratchpad/p5-exchange/`（下文只寫檔名）
  - 截圖含真實師生姓名，**不要複製進 repo**
- 隱私：本文不含學號、真實姓名或成績

## Persona

| 項目     | 內容                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------- |
| 名字     | Lena（虛構）                                                                                       |
| 背景     | 德國來的交換學生，讀英文，中文只認得幾個字                                                         |
| 裝置     | Android 手機（412×915，touch）；Linux 筆電（1366×768，系統深色模式，習慣鍵盤操作）                 |
| 在意的事 | 看懂中英雙語的課名與公告；無障礙（對比、字級、深色模式）；鍵盤導覽；不認得中文 UI 詞彙也能找到功能 |

> "I don't need everything translated. I need to know which button does what, and when my homework is due — in my time."

---

## 任務紀錄

### 任務 1：手機上的 Dashboard 與課程清單

**步驟**：開 `/my/`（m-dashboard.png、m-dashboard-full.png），再開 `/my/courses.php`（m-courses.png、m-courses-full.png）

**量測**

- `/my/` 每次載入 6.2 s、7.8 s、8.9 s、14.4 s（networkidle）
- `/my/courses.php` 3.4 s
- Dashboard 頁高 4382 px，約 4.8 個手機畫面
  - 「最新公告」區塊在 y≈2255（往下滑約 2.5 屏）
  - 「未來事件」區塊在 y≈3402（約 3.7 屏）

**觀察**

- 手機 header 只看得到 🔔、`EN`、`TW` 和頭像。**沒有 logo，也沒有漢堡選單**
  - DOM 裡其實有 navbar toggler，但 icon 和 sr-only 標籤都被寫死成 `display:none`
  - 結果視覺上看不到，螢幕閱讀器也讀不到
- 「當期課程」區塊最上方是一大塊灰色預設頭像（約 300 px），課程清單被擠到第一屏以外
- 課名格式是 `【115上】515516網路程式設計概論 Intro. to Network Programming`
  - Dashboard 上英文名稱**沒有被截斷**，會換行完整顯示
  - 但前面有 `【115上】` 和一串 6 位數課號
  - 英文名稱永遠排在中文後面，Lena 得先跳過一段看不懂的字
- 少數課程只有中文名稱，例如 `114學年度新生啟航-線上學習課程`、`ICT微學分課程_…`。「校內資源」幾乎全是中文
- `/my/courses.php`（我的課程）的問題：
  - 預設篩選是「全部」，排序是「按課程名稱排序」
  - **最先出現的是上一學年（1141）的舊課**，這學期的課要翻頁才找得到
  - 卡片標題超過兩行就用 `...` 截斷，例如 `計算機概論與程式設計 Introduction to Computers and ...`
  - **被截掉的剛好是英文部分**
- 學期代號 `115上` 或 `1151`：切成英文介面後顯示成 `115 Autumn`（en-m-dashboard.png）
  - 民國紀年從頭到尾沒有解釋
  - 同一門課在不同地方寫成 `【115上】515516…`、`1151.515516.…`、`115 Autumn`，有三種寫法

**Lena 的反應**

> "Okay, the English names are there — but they're always second. I'm reading past 【115上】515516 and a block of characters before I hit 'Network Programming'."

> "What is 115? Is that a room? A year? Oh — Taiwan calendar. Nobody told me."

> "On 'My courses' the first card is from last year. Why would I want that first?"

> "The card says 'Introduction to Computers and …' — the Chinese part survived, the English part got cut. That's exactly the half I need."

**點擊與載入**：從 Dashboard 進某一門課是 1 tap、1 次頁面載入。若改走「我的課程」：1 tap → 切篩選（下拉選單只有中文）→ 再 1 tap。

---

### 任務 2：在手機上找最新公告與下一份作業（課程 25294 網路程式設計概論、25288 機率）

**課程頁**（m-course-25294-full.png、m-course-25288-full.png）

- 載入 1.7–3.3 s，沒有水平捲動
- 活動用圖示加名稱列出，作業下方有「開始／到期」兩行
- 活動類型的文字（`討論區`、`教材`、`作業`）只存在 sr-only，**而且是中文**
  - 視覺上只靠圖示顏色區分：紫色對話框是討論區，青色資料夾是教材，粉紅上傳是作業
- 課程導覽在左下角一顆浮動的 ☰ 按鈕裡（m-course-drawer.png）。打開後全是中文：
  - 課程資訊：課程綱要、成員、公告列表、我的郵件
  - 內容：大綱列表、教材列表、作業列表、討論區列表、試卷列表
  - 評量：成績
  - **沒有任何英文 tooltip**

**最新公告：網路程式設計概論**

- 路徑：課程頁 → 點「公告」（1 tap，3.7 s）→ 討論串清單 → 點第一篇（1 tap，1.8 s）。合計 2 tap、2 次載入，從 Dashboard 起算是 3 tap
- 討論串清單（m-forum-np.png）在手機上是 622 px 寬的表格，塞在 396 px 容器裡，要在表格內橫向捲動
  - 標題欄被擠成每行 1–2 個字（`About / Assignment / 1`）
  - 日期格式是 `15 10月 2026`，英文日序加中文月份的混合體
- 貼文本身（m-post-np.png）：
  - 一行很長的 URL 撐出 422/325 px，被裁切而不是換行
  - 麵包屑被截成 `焦點綜… / 1151.5155… / 一… / 公… / Assignment 1: U…`
  - 「顯示模式」下拉選單和「設定」按鈕都是中文，而且排在內容前面

**最新公告：機率**（m-forum-prob.png、m-post-prob-full.png）

- 中英對照寫得很好，字級 14.6 px、行高 22 px，手機上可讀
- **但內容與作業頁互相矛盾**
  - 10/14 22:58 的公告寫 "HW1 is due by 11:59 PM on Thursday, October 15"
  - HW 1 作業頁的到期日卻是 `2026年 10月 14日(週三) 23:59`，作業說明內文也寫 `Due: 2026/10/14 23:59`
  - 作業頁目前顯示紅字 `已經超過應繳交時間: 15 小時 36 分鐘`
  - E3 沒有任何機制幫學生發現兩邊不一致

> "The announcement says Thursday the 15th. The assignment page says I'm already 15 hours late. Which one do I trust? I'd have to email the TA — in Chinese?"

**下一份作業**

- 網路程式設計概論
  - 課程頁往下滑約 1.5 屏，就能看到 `Assignment 1 After-Class Upload`，到期 `2026年 10月 21日(週三) 23:59`
  - 點進去（m-assign-np-a1-full.png）有 `剩餘時間 剩下6 日 8 小時`。從課程頁算是 1 tap
- Dashboard「未來事件」區塊列出 `Assignment 1 After-Class Upload / 10月 21日 星期三, PM 11:59`
  - **沒有寫是哪一門課**
  - 而且要往下滑約 3.7 屏才看得到
- 「作業列表」頁（`local/courseextension`，m-assignlist-25294.png）
  - **整頁寬 625 px，在 412 px 手機上整頁水平溢出**
  - header 右側的鈴鐺、語言、頭像被推出畫面，看起來只剩一條藍色色帶
  - 「結束時間」欄被切掉，標題是 `進行中作業／已繳作業／逾期未繳作業／預告作業`，全中文

**內容可讀性**

- 作業說明（m-assign-prob-hw1-full.png）的長段 HTML 在手機上排版良好
- 附件 `HW1.pdf` 的回應標頭是 `Content-Disposition: attachment`，**一律強制下載，不能在頁內預覽**
- 本次樣本中沒有內嵌 PDF 或 iframe
- 狀態表（繳交狀態／評分狀態／剩餘時間）在手機上沒有溢出

> "Long English text is actually fine on my phone. Tables and URLs are not — and every PDF goes straight into my Downloads folder."

---

### 任務 3：深色模式、對比、字級

**設定**：筆電，`colorScheme: "dark"`，`matchMedia('(prefers-color-scheme: dark)')` 為 true

**深色模式**

- **E3 完全不理會這個系統設定**
  - `body` 背景是 `rgb(255,255,255)`，文字是 `rgb(29,33,37)`
  - `color-scheme` 為 `normal`，也沒有 `<meta name="color-scheme">`
- CSS 裡其實有 `@media (prefers-color-scheme: dark) { [data-bs-theme="auto"] … }`
  - 但 `<html>` 沒有 `data-bs-theme` 屬性，所以這段規則從不生效
- 看截圖 d-dashboard-laptop.png、d-course-25294.png、d-forum-np.png 就知道：凌晨在暗房裡，整個螢幕一片白

**對比**（用全頁文字節點自動算 WCAG 對比）

| 位置                                       | 前景／背景     | 對比         | 標準                     |
| ------------------------------------------ | -------------- | ------------ | ------------------------ |
| Dashboard「最新公告」的日期與課名（14 處） | `#C0C0C0` / 白 | **1.82 : 1** | 需要 4.5 : 1，嚴重不合格 |
| Dashboard Turnitin 紅字提示（13 px）       | `#FF0000` / 白 | 4.0 : 1      | 不合格                   |
| 課程頁、公告列表                           | —              | 未發現不合格 | —                        |

- 通知徽章 `#fff` / `#CA3120` 字級 11 px，對比勉強過，但字太小

**字級**

- 內文 15 px，行高 22.5 px；手機貼文內容 14.6 px
- 活動日期 13.1 px，徽章 11–11.25 px
- 筆電 Dashboard 以字元數計，約 2% 文字小於 14 px；課程頁約 39%，主要是日期與 sr 文字
- `meta viewport` 是 `width=device-width, initial-scale=1.0`，沒有禁止縮放（這點不錯）

> "Light grey on white for the dates — I literally can't see when an announcement was posted. And no dark mode in 2026? My eyes at 1 a.m. disagree."

---

### 任務 4：鍵盤（筆電）

**從頁首開始按 Tab**

- **Dashboard：按 9 次 Tab 才到第一門課**。順序：
  1. 跳至主內容
  2. logo
  3. 通知
  4. EN
  5. TW
  6. 使用者選單
  7. 跳過當期課程區塊
  8. 個人頭像連結（無文字）
  9. 第一門課
- **課程頁：按 29 次 Tab 才到第一份作業**
  - 前 17 個停點是 header 與左側課程導覽：課程綱要…成績，共 10 個連結
- 有 skip link：`跳至主內容`，加上每個區塊的 `跳過…區塊`
  - 平時用 `sr-only` 隱藏，聚焦時會出現（k-dashboard-tab1.png）。這是好的
  - **但文字全是中文**

**焦點可見性**（k-course-tab2.png、k-course-tab6.png、k-course-tab8.png）

| 元素                 | 焦點樣式                               | 可見度                                                    |
| -------------------- | -------------------------------------- | --------------------------------------------------------- |
| 左側導覽連結         | 明顯藍框                               | 良好                                                      |
| logo                 | 藍色 box-shadow 疊在同色藍底 navbar 上 | 幾乎看不見                                                |
| 使用者選單           | `outline:none`，box-shadow 透明        | **完全看不見**                                            |
| 「關閉課程索引」按鈕 | 沒有焦點樣式                           | 看不見；`title` 被 tooltip 套件搬走，**無障礙名稱是空的** |
| Dashboard 第一門課   | 瀏覽器預設 1 px outline                | 很淡（k-dashboard-tab-first-target.png）                  |

**完全無法用鍵盤操作的部分**

- Dashboard 左側的「當期課程／行事曆／校內資源」三顆切換按鈕都是 `<div>` 加 click handler
  - 沒有 `tabindex`，也沒有 `role="button"`
  - **鍵盤使用者切換不到「行事曆」與「校內資源」**
- 頁面上沒有任何 `accesskey` 或快捷鍵

> "Nine tabs to my first course is okay-ish. Twenty-nine to the first assignment is not. And when I tab to the user menu the focus just… disappears."

> "There are three big buttons on the dashboard I cannot reach with Tab at all. They look like buttons. They aren't."

---

### 任務 5：作業頁的到期時間

（m-assign-np-a1-full.png、m-assign-prob-hw1-full.png、m-assign-np-proj-full.png）

**到期時間清不清楚**

- 頁首兩行 `開始：` 和 `到期：`，格式是 `2026年 10月 21日(週三) 23:59`
- 數字看得懂，`年／月／日／週三` 要猜
- 「剩餘時間」寫成 `剩下6 日 8 小時`，或紅字 `已經超過應繳交時間: 15 小時 36 分鐘`
  - **有相對時間**，但只在作業頁、而且藏在狀態表第三列
  - 課程頁、Dashboard、作業列表都沒有相對時間

**時區**

- **沒有任何地方標示時區**
  - 我把瀏覽器時區設成 `Europe/Berlin`，E3 仍以伺服器或帳號時區（台北）輸出，也沒有提示
  - Lena 寒假回德國時，會誤以為 `23:59` 是當地時間

**午夜歧義**

- `期末專題構想更新` 到期 `10月 22日(週四) 00:00`，在 Dashboard 上顯示成 `10月 22日 星期四, AM 12:00`
- 這其實是 21 號晚上結束

> "'AM 12:00 on the 22nd' — is that the start or the end of Thursday? I'll just submit on Wednesday to be safe."

**同一個時間有四種格式**

| 位置      | 格式                           |
| --------- | ------------------------------ |
| 作業頁    | `2026年 10月 21日(週三) 23:59` |
| Dashboard | `10月 21日 星期三, PM 11:59`   |
| 作業列表  | `2026/10/21 23:59`             |
| 討論區    | `15 10月 2026`                 |

**其他**

- 最醒目的元素是藍色的 `繳交作業` 按鈕，排在狀態表上面
- 對不懂中文的人來說，這是一顆「不知道會不會直接送出」的按鈕
  - 實際上是進入編輯頁，但看不出來
  - 本次測試沒有按

---

### 任務 6：其他 i18n 與無障礙問題

**語言切換**

- Header 的 `EN / TW` 其實是 `?lang=en` / `?lang=zh_tw` 連結
- **實測發現這不是只影響這次 session**
  - 在獨立 session 點 EN 之後，另開一個全新登入也直接是英文介面
  - 所以它會改寫帳號的偏好語言
- 連結本身沒有 `aria-current`、`lang` 或 `hreflang`，目前語言只用半透明樣式表示
- 見下方〈測試過程備註〉

**英文介面不完整**（en-m-dashboard.png）

- 學期顯示成 `115 Autumn`
- 「最新公告」中，系統類標題仍是中文
- 課程內容（教師輸入的）當然不會翻譯
- 課程導覽和作業列表頁屬於自訂外掛 `local/courseextension`、`blocks/dcpc_news`，很可能沒有英文字串
  - 這次為了不再改動帳號偏好，沒有在英文模式下驗證

**`lang` 屬性**

- `<html lang="zh">`（不是 `zh-Hant`），但頁面有大量英文段落
- 英文公告沒有 `lang="en"` 標記，螢幕閱讀器會用中文語音念英文

**必須認得中文詞才能用的地方**

- 側欄：`課程綱要`、`公告列表`、`作業列表`、`討論區列表`、`試卷列表`、`成績`
- 篩選與排序：`全部`、`按課程名稱排序`、`卡片`
- 討論區：`顯示模式`、`設定`
- 作業狀態：`繳交狀態`、`評分狀態`、`剩餘時間`、`作業加備註`、`繳交作業`
- 頁尾：`寫信給 E3平台管理員`、`切換到標準的佈景單元`
- Logo 圖片是純中文字樣，內容為「國立陽明交通大學 數位教學平臺」

**其他**

- Dashboard 的公告摘要：`…(看更多)` 是唯一的展開入口，中文、字小、沒有按鈕外觀
- 活動類型只靠圖示顏色加中文 sr-only 文字區分，色覺障礙或不懂中文的使用者都難分辨
- 頭像連結沒有文字（Tab 8），使用者選單觸發器在手機上也沒有可見文字

---

## 痛點排名

| # | 痛點 | 嚴重度 | 證據 |
| --- | --- | --- | --- |
| 1 | **到期時間不可信、不在地化**：沒有時區、格式有 4 種、`AM 12:00` 午夜歧義、公告與作業頁到期日互相矛盾 | 高 | m-assign-prob-hw1-full.png、m-post-prob-full.png、m-dashboard-full.png |
| 2 | **導覽與狀態詞彙只有中文**：側欄、篩選、作業狀態、skip link 都是中文，英文切換又會改寫帳號偏好、而且不完整 | 高 | m-course-drawer.png、m-courses.png、en-m-dashboard.png |
| 3 | **手機版排版失敗**：作業列表整頁溢出、討論串表格要橫向捲、長 URL 被裁切、沒有可見的主選單 | 高 | m-assignlist-25294.png、m-forum-np.png、m-post-np.png |
| 4 | **沒有深色模式**，且最新公告的日期與課名對比只有 1.82 : 1 | 高 | d-dashboard-laptop.png |
| 5 | **鍵盤可及性破洞**：Dashboard 三顆 div 按鈕無法 Tab、使用者選單與 logo 焦點看不見、無名稱的按鈕、課程頁要 29 次 Tab 才到作業 | 中高 | k-course-tab6.png、k-course-tab2.png |
| 6 | **課名雜訊**：`【115上】`、課號、民國年、三種寫法；英文永遠在後面，卡片截斷時先被截掉 | 中 | m-courses.png、m-dashboard.png |
| 7 | 「我的課程」預設顯示上一學年的課；「未來事件」不顯示課名、在第 3.7 屏 | 中 | m-courses.png、m-dashboard-full.png |
| 8 | PDF 一律強制下載，不能在頁內預覽 | 中 | 回應標頭 `Content-Disposition: attachment` |
| 9 | Dashboard 載入慢，6–14 s | 中 | — |

## Lena 的願望

> "Show me the English course name first — or only — if that's my language."

> "Every deadline: absolute time in _my_ time zone, the Taipei time next to it, and 'in 6 days' in big letters."

> "Dark mode that just follows my system."

> "A keyboard shortcut to jump to any course or assignment. Like Ctrl+K in every other tool I use."

> "One list: everything due this week, across all courses, with the course name on each line."

> "Open PDFs in the browser. Let me read slides on the bus."

> "If an announcement changes a deadline, tell me — on the assignment itself."

---

## 給新 E3 client 的具體建議

### i18n

- 介面語言用**本地設定**，存在 client 端，不改寫 Moodle 帳號的 `lang` 偏好
  - 預設跟隨 `navigator.language`
- **雙語課名拆欄**
  - 把 `【115上】515516網路程式設計概論 Intro. to Network Programming` 解析成：學期（`2026 Fall`）、課號（`515516`）、中文名、英文名
  - 依介面語言決定主標題，另一語言用小字副標
  - 截斷時保留主語言
- 學期一律轉西元，可以 hover 顯示 `民國 115 學年上學期`。全站只用一種課程識別寫法
- 所有內建 UI 字串都要有英文，包括側欄、狀態、篩選、空狀態、skip link
  - 每個 Moodle 中文術語建一張對照表（`繳交狀態` 對應 Submission status，依此類推）
- 教師輸入的內容如果偵測為英文，包上 `lang="en"`；`<html lang>` 要跟隨介面語言（`zh-Hant` / `en`）
- 可以考慮「顯示原文／機器翻譯」切換，只針對公告內容，並清楚標示「機器翻譯」

### 時間與到期日

- 單一格式化函式，用 `Intl.DateTimeFormat` 輸出。範例：`Wed, 21 Oct, 23:59 (Taipei, UTC+8) · in 6 days`
- 使用者時區和 `Asia/Taipei` 不同時，兩個都顯示
- 午夜到期一律寫成「前一天 24:00」或「23:59」，不出現 `AM 12:00`
- 相對時間（in 6 days / 15 h overdue）要出現在每一處作業列表，並依急迫程度用顏色加圖示表示，不能只靠顏色
- **「到期日異動」提示**
  - 掃描同一課程的公告文字，找出與作業 `duedate` 不同的日期，在作業卡上提示 "An announcement mentions a different date"
  - 以 Moodle 的 `duedate` 為準，但提醒使用者確認

### 主題與深色模式

- 用 CSS 變數定義 token，預設 `prefers-color-scheme`，加上手動 Light / Dark / System 三段切換，存在本地
- 宣告 `color-scheme: light dark`，讓表單、捲軸跟著變
- 所有文字至少 4.5 : 1（大字 3 : 1）。灰色日期改用 `--text-muted`，並確保在兩種主題下都過關
- 使用者 HTML 內容（公告、作業說明）在深色模式下要處理 inline 顏色：例如移除白底、對過暗的文字做最低亮度修正

### 無障礙

- 基本字級 16 px，次要文字不小於 13 px；支援瀏覽器縮放到 200% 不破版
- 所有互動元素用原生 `<button>` 或 `<a>`，不再有 div 按鈕
- 統一 `:focus-visible` 樣式：2–3 px 高對比外框，在藍色 header 上用白色或黃色
- 圖示按鈕一定要有 `aria-label`，同時有可見 tooltip
- 活動類型用「圖示＋文字標籤」（Assignment / Forum / Folder），不只靠顏色
- Skip link 保留並翻譯；地標用 `<nav aria-label>`、`<main>`

### 鍵盤快捷鍵與指令面板

**`Ctrl/⌘+K` 指令面板**

- 模糊搜尋課程，中英文名、課號都能搜
- 搜作業、公告、檔案
- 動作類指令：「Go to Dashboard」、「Switch theme」、「Switch language」

**單鍵快捷鍵**（不在輸入框時生效，按 `?` 顯示說明）

| 按鍵           | 動作             |
| -------------- | ---------------- |
| `g d`          | Dashboard        |
| `g c`          | 課程清單         |
| `g a`          | 所有待辦作業     |
| `g n`          | 通知             |
| `j` / `k`      | 在列表中上下移動 |
| `o` 或 `Enter` | 開啟             |
| `/`            | 聚焦搜尋         |

**Tab 順序**：課程頁先到內容，課程導覽改成可收合，或放在主內容之後。目標是 5 次 Tab 內到第一份作業

### 行動版

- 首頁改成「This week」單一時間軸：跨課程列出到期作業與最新公告，每列都有課程短名
  - 第一屏就能看到下一份作業，不用滑 3.7 屏
- 下方 tab bar：Home / Courses / Calendar / Notifications，取代隱藏的漢堡選單和浮動 ☰
- 課程清單預設「本學期」，舊學期收進 filter；卡片不放裝飾圖，改成文字列表
- 討論串與作業列表在手機上改成卡片列表，不用表格。長 URL 用 `overflow-wrap: anywhere`
- PDF 用內建 viewer（PDF.js）或至少 `inline` 開啟，另外提供「下載」按鈕
- 觸控目標至少 44×44 px。目前 Dashboard 有 30 個小於 24 px 的可點元素
- 「繳交作業」這類會進入寫入流程的按鈕，加上說明文字（"Opens the upload page — nothing is submitted yet"）

---

## 測試過程備註

**語言偏好事件**

- 原本預期 `?lang=en` 只影響 session，所以先另開一個獨立登入 session 測試，沒有用共用的 storageState
- 在該 session 打開 `/my/?lang=en` 後，再開一個全新登入，結果仍是英文
  - 這代表 E3 的 EN/TW 切換會**寫入帳號的偏好語言**
- 我當下用同樣方式切回 `?lang=zh_tw`，再用第三個全新登入確認已回到 `zh_tw`
  - 也讀了 `/user/language.php`，欄位值是 `zh_tw`，沒有按儲存
- 共用 session 在這段期間一直維持 `zh_tw`，未受影響
- 用來測試的 session 檔已刪除
- **這個行為本身就是一項發現**：Lena 點 EN 會改到帳號設定，而介面沒有任何提示

**討論區已讀狀態**

- 為了完成任務 2，打開了兩則公告貼文（各課程最新一則）
- 如果該討論區有開啟已讀追蹤，這兩則可能因此被標成已讀

**沒有做的操作**

- 沒有按任何送出、儲存、上傳、回覆、刪除按鈕
- 沒有開教材資源，避免觸發完成度追蹤
