# 本學期（1151）E3 課程功能使用調查

> 調查日期：2026-10-15（第 6 週）。來源：E3（Moodle 4.5.4+、theme `boost_union`）Mobile Web Service（REST）唯讀呼叫，以及 Playwright 以既有登入狀態 GET 3 門課程頁與 E3 自訂頁面。範圍：本帳號 1151 學期修的 10 門課（25066、25535、26454、26652、25294、25288、25283、25310、25309、27454）。原始彙整數據：`/private/tmp/claude-501/-Users-em-uwu-EM3/851f90ca-d82e-4e20-870a-c557e6445981/scratchpad/feat-cur/stats.json`（原始回應在同目錄 `raw/`，截圖在 `shots/`）。本文不含學號、人名與成績。

## TL;DR

- **課程結構非常扁平**：10 門課中有 8 門只有 section 0「一般」，所有東西堆在同一個 section。只有 2 門用 `Week N` 分節，其中一門把最新一週排最上面（倒序）。用不到 page、label、book、lti、h5p、choice、feedback。
- **E3 的「教材」就是 `folder`（+ `resource`）**：40 個 folder 對 7 個 resource；23 個 folder 只裝 1 個檔案；9 個 folder **沒有任何檔案**，被當成「說明頁＋內嵌影片」使用（內容在 folder 的 `intro`，`core_course_get_contents` **拿不到**）。
- **作業 100% 是檔案上傳**：19 份作業全部只開 `assignsubmission_file`，沒有任何 onlinetext、team submission、submission statement 或 draft 流程。預設上限是 30 個檔案、1 GB。
- **公告 = `type: "news"` 的 forum**：每門課剛好 1 個，名稱一律為「公告」。本學期共 43 則公告，回覆數都是 0（單向）。另外有 4 個一般討論區，用來找組員或問問題。
- **Calendar 只出現 `assign:due` 和 `quiz:close`**，每個 event 都帶完整 `course` 物件。沒看到 user、site 或 group event。
- **E3 自訂外掛**：`local_dcpcmail`（站內信，WS 可讀）、`block_dcpc_news`（跨課公告彙整，沒有專屬 WS，但可以用 forum WS 自己組）、`local_courseextension`（教材、作業、試卷、成績列表頁與課程綱要 iframe，沒有 WS）、`mod_supervideo`（影片，**沒有可取得影片來源的 WS**）。core messaging 已關閉（`messaging=0`）。
- **檔案下載**：WS 回傳的 URL 已經是 `/webservice/pluginfile.php/...`，只要附加 `token=` 即可。CORS 是 `*`、支援 Range、PDF 為 `inline`，靜態 SPA 可以直接用。

---

## 1. 課程內容（`core_course_get_contents`）

### 1.1 各課程統計

| courseid | 課程 | sections | modules | 組成 | 檔案副檔名 | folder 內檔案 / resource 檔案 | 空 folder | 單檔 folder |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25066 | 設計概論 | 1 | 10 | forum 1, resource 7, url 1, assign 1 | .pptx 6, .ppt 1 | 0 / 7 | 0 | 0 |
| 25535 | 專題探索(二) | 1 | 2 | forum 1, assign 1 | – | 0 / 0 | 0 | 0 |
| 26454 | 造型與繪圖 | 1 | 9 | forum 1, folder 4, assign 4 | .pptx 18, .mp4 6, .exe 2, .txt 1, .exportedui 1 | 28 / 0 | 0 | 0 |
| 26652 | 健走與慢跑 | 1 | 1 | forum 1 | – | – | – | – |
| 25294 | 網路程式設計概論 | 1 | 14 | forum 3, folder 7, assign 4 | .pdf 10 | 10 / 0 | 0 | 5 |
| 25288 | 機率 | 1 | 12 | forum 1, folder 10, assign 1 | .pdf 11 | 11 / 0 | 2 | 7 |
| 25283 | 演算法概論 | 1 | 8 | forum 1, folder 6, assign 1 | .pdf 6 | 6 / 0 | 0 | 6 |
| 25310 | 多媒體與人機互動總整與實作 | 1 | 2 | forum 2 | – | – | – | – |
| 25309 | 計算機系統管理 | 6 | 13 | forum 1, supervideo 12 | – | – | – | – |
| 27454 | AI 導入軟體專案流程 | 6 | 31 | forum 2, folder 13, assign 7, quiz 5, supervideo 3, url 1 | .pdf 7 | 7 / 0 | 7 | 5 |

### 1.2 整體統計

| 指標                                                                           | 數值                                                                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| sections 總數                                                                  | 20（8 門課只有 section 0）                                                                                    |
| modules 總數                                                                   | 102（全部 `visible=1`、`uservisible=true`，沒有隱藏或受限制的 module）                                        |
| modname 分布                                                                   | folder 40、assign 19、supervideo 15、forum 14、resource 7、quiz 5、url 2                                      |
| page / label / book / lti / h5pactivity / choice / feedback / glossary / scorm | 都是 0                                                                                                        |
| 檔案總數（folder＋resource）                                                   | 69（62 在 folder、7 在 resource）                                                                             |
| 副檔名                                                                         | .pdf 34、.pptx 24、.mp4 6、.exe 2、.ppt 1、.txt 1、.exportedui 1                                              |
| mimetype                                                                       | `application/pdf` 34、pptx 24、`video/mp4` 6、`text/plain` 2、`document/unknown` 2（.exe 與 .py 這類）、ppt 1 |
| 檔案大小                                                                       | 中位數約 1.6 MB，最大約 271 MB（mp4），總計約 0.99 GB                                                         |
| folder 內有子目錄                                                              | 2 個（`filepath` 例如 `/1009講義/`）                                                                          |
| completion tracking                                                            | 全部 `completion: 0`，沒有任何課程使用完成度追蹤                                                              |

### 1.3 Section 命名模式

- 8/10 門課只有 section 0，名稱是「一般」（英文介面的課顯示 `General`），`summary` 都是空的。**老師不分週，只把 module 按時間順序往下加。**
- 25309 用 `Week 1`、`Week 2`、`Week 3`、`Week 5`、`Week 6`（跳過 Week 4，所以不能用 section 序號推週次）。
- 27454 用 `Week 6`、`Week 5`、`Week 3`、`Week 2`、`Week 1`，**倒序排列，最新一週在 section 1**。
- 沒有出現 E3 專屬的 section 名稱（例如公告、大綱、教材）。這些詞是 E3 側邊選單上的「列表頁」，不是 section，見第 6 節。
- 課程 `format` 全部是 `topics`，`coursedisplay=0`。

### 1.4 Module 使用細節

- **folder**：`display=0`（在獨立頁面顯示），雖然 `showexpanded=1`，但課程頁上只會看到一個連結。名稱多半是章節名稱（`Ch. 5`、`03_Growth of Functions`），本質上就是「一章一份講義」。
  - 有 9 個空 folder（25288 有 2 個、27454 有 7 個），內容寫在 `intro` HTML 裡：例如 Google Docs 連結、Formative 加入碼、「Required Materials」說明，以及透過 `introfiles` 內嵌的 mp4（27454 的 self-paced 影片與課程錄影，單檔最大約 478 MB）。
  - **`core_course_get_contents` 的 folder 不含 `description`**（因為沒開 `showdescription`），所以這些內容只能從 `mod_folder_get_folders_by_courses` 的 `intro` 和 `introfiles` 取得。
- **resource**：只有 25066 使用（7 份 pptx 或 ppt）。`afterlink` 會帶 E3 自訂的「上傳於 2026/09/11 09:14」HTML，`customdata.displayoptions` 是 PHP serialize 字串。
- **url**：2 個，分別是 Google Form 與 E3 內部連結 `blocks/dcpc_news/news/news_view.php?...`。在 contents 裡是 `contents[0].type="url"`、`fileurl` 為外部網址。
- **supervideo**（第三方 `mod_supervideo`，E3 顯示為「超級影片」）：15 個，名稱帶 `(video)` 或 `Recorded Lecture`。contents 裡**沒有影片 URL**，WS 只有 `mod_supervideo_view_supervideo` 和 `mod_supervideo_progress_save_mobile`（都會寫入狀態，不可呼叫），沒有 get 類函式。
- **forum 描述**：`期末專題分組 徵人區` 有 `description`（課程頁上顯示「可以在這裡找組員」），其他 forum 都沒有。
- **`modplural` 是 E3 改過的語言字串**，UI 可以直接沿用或參考：

| modname    | E3 顯示（modplural） | purpose       |
| ---------- | -------------------- | ------------- |
| folder     | 教材                 | content       |
| resource   | 整包教材檔案         | content       |
| url        | 超連結               | content       |
| supervideo | 超級影片             | content       |
| assign     | 作業                 | assessment    |
| quiz       | 測驗卷               | assessment    |
| forum      | 討論區               | collaboration |

- `dates[]` 會附在 assign 和 quiz 上，`label` 是已在地化的字串（`開始：`、`到期：`、`關閉：`、`結束：`），並有 `dataid`（`allowsubmissionsfromdate`、`duedate`、`timeclose` 等）。**UI 應該用 `dataid` 判斷意義，不要依賴 `label`。**

---

## 2. 討論區與公告

### 2.1 Forum 清單（`mod_forum_get_forums_by_courses`）

| 類型 | 數量 | discussions | 特徵 |
| --- | --- | --- | --- |
| `news`（公告） | 10（每門課 1 個，名稱都是「公告」，intro「一般消息與公告」） | 43 | `cancreatediscussions=false`、`forcesubscribe=1`、`maxbytes=0` |
| `general` | 4 | 18 | 找組員（25294、25310、27454）、課堂問題（25294）。`cancreatediscussions=true`、`maxbytes=512000`（500 KB） |

`istracked=false`、`unreadpostscount=null`：**E3 沒開 forum 已讀追蹤，所以 API 拿不到「未讀公告數」**，client 要自己在本地記錄已讀狀態。

### 2.2 公告與討論內容（`mod_forum_get_forum_discussions`）

| forum（course）      | discussions | 有附件 | 內嵌圖片 | pinned | 回覆總數 | 純文字長度中位數 / 最大值 | 期間           |
| -------------------- | ----------- | ------ | -------- | ------ | -------- | ------------------------- | -------------- |
| 公告 25535           | 4           | 1      | 0        | 1      | 0        | 252 / 310                 | 09-03 至 10-04 |
| 公告 26454           | 1           | 0      | 0        | 0      | 0        | 434                       | 10-09          |
| 公告 25294           | 14          | 1      | 0        | 0      | 0        | 218 / 392                 | 09-09 至 10-15 |
| 公告 25288           | 3           | 0      | 0        | 0      | 0        | 1387 / 1436               | 09-09 至 10-14 |
| 公告 25283           | 1           | 0      | 0        | 1      | 0        | 204                       | 10-10          |
| 公告 25310           | 12          | 0      | 1        | 1      | 0        | 255 / 629                 | 09-16 至 10-14 |
| 公告 25309           | 3           | 1      | 0        | 1      | 0        | 94 / 200                  | 09-07 至 09-28 |
| 公告 27454           | 5           | 0      | 0        | 1      | 0        | 1284 / 1563               | 09-08 至 10-14 |
| 徵人區 25294         | 3           | 0      | 0        | 0      | 1        | 75 / 89                   | 09-18 至 10-01 |
| Team Formation 27454 | 15          | 0      | 1        | 0      | 19       | 428 / 1179                | 09-07 至 09-24 |

另有 25066 與 26652 的公告為 0 則。

觀察：

- **發文頻率**：活躍的課約每週 1 到 3 則公告（25294、25310），少的整學期 0 到 1 則。dashboard 的「最新公告」會把所有課的公告和站台公告混在一起，依時間排序。
- **附件很少**：43 則公告中只有 3 則有附件（pdf、Dockerfile、.py）。附件放在 `attachments[]`，URL 已經是 `webservice/pluginfile.php`。
- **HTML**：`messageformat` 全部是 1（HTML）。常見標籤有 `p`、`br`、`strong`、`a`、`ol`、`ul`、`li`、`span`、`div`、`img`、`u`。有些 `<p>` 只是空段落；有些網址是**純文字沒有包 `<a>`**（例如 `Assignment 1: https://...`），需要 linkify。
- **內嵌圖片**：`<img src="https://e3p.nycu.edu.tw/webservice/pluginfile.php/.../mod_forum/post/...png">` 沒有 token，**client 必須改寫 src 並加上 token**。
- **常見外部連結**：Google Forms、Docs、Sheets、Slides，Loom（25294 每週以 Loom 影片代替上課），Discord、Teams、claude.ai 邀請連結。
- **E3 內部連結**：`/mod/forum/view.php?f=`、`/mod/forum/discuss.php?d=…#p…`、`/mod/folder/view.php?id=`、`/user/view.php?id=…`、`/blocks/dcpc_news/news/news_view.php?d=<discussionid>&in=1`。client 應攔截這些連結並導到自己的路由。
- **作者名稱格式**：`userfullname` 會加上系所前綴「`系所中文 / 英文縮寫 姓名`」（E3 自訂 fullname 格式）。若要做乾淨的 UI，可以拆出系所前綴。
- **排序**：`mod_forum_get_discussion_posts` 預設依建立時間 **DESC** 排序（root post 在最後），要建立樹狀結構時需要自己依 `parentid` 處理。
- **站台公告**：forumid=1（site news，course id 1）也可以讀，6 則，dashboard 顯示的課程名稱欄為「系統」。會用到 `timestart`、`timeend` 控制顯示期間，`pinned` 也有使用，client 應過濾掉 `timeend` 已過的公告。

---

## 3. 作業（`mod_assign_get_assignments`、`mod_assign_get_submission_status`）

### 3.1 設定分布（共 19 份）

| 項目 | 結果 |
| --- | --- |
| 提交方式 | **19/19 只有 `assignsubmission_file`**（+ `assignsubmission_comments`）；onlinetext 為 0 |
| 回饋外掛 | 全部啟用 `assignfeedback_comments`、`assignfeedback_editpdf`、`assignfeedback_file` |
| `maxfilesubmissions` | 30（14 份）、1（2 份）、2、5、10 |
| `maxsubmissionsizebytes` | 1073741824（1 GB，18 份）、262144000（250 MB，1 份） |
| `filetypeslist` | 空字串（不限，9 份）、`.rar,.zip,.7z`（同義的排序變化共 3 份；另有一份加 `.pptx`）、`.pdf`、`document`、`document,.pdf`、`.zip`、`.txt`、`*` |
| `teamsubmission` / `requiresubmissionstatement` / `submissiondrafts` | 都是 0 |
| `maxattempts` / `attemptreopenmethod` | 1 / `untilpass`（預設值） |
| `allowsubmissionsfromdate` 有設 | 18 份 |
| `duedate` 有設 | 18 份（1 份沒有截止日） |
| `cutoffdate` 有設 | 6 份（其中 27454 的 cutoff 是 `17:04`、`06:10` 這類非整點時間，看起來是老師延長期限） |
| `gradingduedate` 有設 | 11 份 |
| 截止時刻 | `00:00` 7 份、`23:59` 5 份、`12:00` 4 份、`11:30`、`23:00` |
| intro | 6 份沒有 intro；6 份用 `introattachments` 附題目檔（pdf、pptx） |

重點：

- **截止時刻 `00:00` 很常見**（例如「09-21 00:00」）。對學生來說這其實是「09-20 當天結束」，UI 最好顯示成「9/20（日）24:00」或明確標示「9/21 00:00 前」，避免誤會。
- 有 `filetypeslist` 時要能解析 Moodle 的 filetype group（例如 `document` 是群組名，不是副檔名），可以用 `core_form_get_filetypes_browser_data` 展開（待確認此函式在 E3 可用）。
- 因為 `submissiondrafts=0`，上傳後直接算「已繳交」，`cansubmit` 永遠是 false。**判斷能不能繳交要看 `canedit`**。
- 沒有 cutoff 的作業過了 due 仍然 `canedit=true`（可以遲交）。API 沒有直接的「遲交」旗標，要自己比對 `duedate` 與 `submission.timemodified`。

### 3.2 Submission status 結構

19 份的狀態組合（只列結構，不列成績）：`submitted/notgraded` 9、`new/notgraded` 8、`new/graded` 1（沒交但被打分）、`submitted/graded` 1。

- 回應的 top-level 只有 `lastattempt`、`assignmentdata`、`warnings`；**有評分時才會出現 `feedback`**。本次沒有 `previousattempts` 與 `gradingsummary`（學生身分）。
- `lastattempt.submission.status`：`new`、`submitted`（可能還有 `draft` 和 `reopened`，本次沒有）。`lastattempt.gradingstatus`：`notgraded`、`graded`。
- 已上傳的檔案位於 `submission.plugins[type=file].fileareas[area=submission_files].files[]`。
- `feedback.gradefordisplay` 是 HTML 字串（含 `&nbsp;/&nbsp;`）。`feedback.plugins[type=comments].editorfields[0].text` 是評語。`editpdf` 有 9 個 fileareas，大多是空的；有批註時，`partial` 或 `download` 會有 `combined.pdf`，`pages`、`readonlypages` 會有每頁的 png。
- E3 的「作業列表」頁會顯示全班「N 個已繳、M 個未繳」，**這份數據學生無法透過 WS 取得**（需要 grader 權限）。

---

## 4. 行事曆

| API | 結果 |
| --- | --- |
| `core_calendar_get_action_events_by_timesort`（timesortfrom = 現在 −14 天） | 5 則，全部是 `assign:due`。**只包含還沒繳交的作業**（已繳交或已完成的 quiz 不會出現）。逾期但還能繳的作業會有 `overdue: true`、`action.actionable: true`；還沒開放的作業是 `actionable: false` |
| `core_calendar_get_calendar_upcoming_view` | 5 則：`assign:due` 4、`quiz:close` 1（已作答的 quiz 仍會出現）。這就是 dashboard「未來事件」區塊 |
| `core_calendar_get_calendar_monthly_view`（9 月與 10 月） | `assign:due` 17、`quiz:close` 3，`normalisedeventtype` 全部是 `course` |

- 每個 event 都帶完整的 `course` 物件（`fullname`、`shortname`、`viewurl`、`courseimage` 為 data URI 的 SVG、`coursecategory`）。不需要另外查課名，但 payload 偏大（upcoming 約 99 KB／5 則）。
- **Quirk：event 的 `instance` 實際上是 cmid**（例如 HW 1：`instance: 239512`，等於 cmid，而 assign id 是 44415）。要對應到作業，請用 cmid，或解析 `url` 的 `id=`。
- `name` 對 quiz 會附上後綴（例如 `... 關閉`）。純名稱請用 `activityname`。
- `formattedtime` 是 HTML，`description` 是作業 intro 的 HTML。
- 本學期沒有 user、site、group、category event，也沒有 quiz 的 `open` 事件（因為 quiz 都沒設 `timeopen`）。
- 相關：`message_popup_get_popup_notifications` 共 14 則通知，類型有 `assign_due_soon`、`assign_overdue`、`assign_due_digest`、`coursecontentupdated`。**沒有 forum 新貼文通知**，公告提醒似乎走 email 或 dcpcmail。`customdata` 有 `assignmentid` 與 `duedate`，`contexturl` 指向 assign view。

---

## 5. 其他活動

| 模組 | 數量 | 說明 |
| --- | --- | --- |
| quiz | 5（都在 27454） | 每週的 self-paced 題目，`timeopen=0`，部分有 `timeclose`，`timelimit=0`，`attempts=0`（不限次數），`deferredfeedback`。**已關閉的 quiz 在 `get_quizzes_by_courses` 回傳的欄位會變少**（`navmethod`、`hasquestions` 為 null）。`mod_quiz_get_user_attempts` 可以拿到 `state: finished` |
| supervideo | 15（25309 有 12、27454 有 3） | 見 1.4，WS 無法取得來源 |
| url | 2 | – |
| lti / h5pactivity / choice / feedback / page / label / book / glossary / workshop / scorm / lesson / data / wiki | 0 | site 有開這些 WS（例如 `mod_lti_get_ltis_by_courses`、`mod_choice_*`、`mod_feedback_*`、`mod_h5pactivity_*`），但本學期這幾門課都沒用到 |

---

## 6. Web UI：E3 課程頁版面與用語對應

截圖（scratchpad）：`.../feat-cur/shots/course_25294.png`、`course_27454.png`、`course_25309.png`、`e3_dashboard.png`、`e3_materials.png`、`e3_assignments.png`、`e3_quizzes.png`、`e3_newslist.png`、`e3_forums.png`、`e3_syllabus.png`、`e3_history.png`。

### 6.1 版面

- **頂部**：藍色 navbar，左側是「國立陽明交通大學 數位教學平臺」logo；primary nav 只有「更多」下拉選單（公告、我的郵件、歷年課程）、通知鈴鐺（未讀數）、EN/TW 語言切換與使用者選單。
- **課程頁標題**：`【115上】515516網路程式設計概論 Intro. to Network Programming`。這是 E3 從 shortname `1151.515516` 轉換出來的：`1151` 代表 115 學年上學期，接著是課號。WS 的 `fullname` 則是 `1151.515516.網路程式設計概論 …`，**client 需要自己轉換**。
- **左側 drawer** 取代 Moodle 原本的 course index，分成三組 E3 自訂選單，下方才是原本的 course index（section → module 樹）：
  - **課程資訊**：課程綱要、成員、公告列表、我的郵件
  - **內容**：大綱列表、教材列表、作業列表、討論區列表、試卷列表
  - **評量**：成績
- **主區**：標準的 Moodle 4.x topics 格式。每個 section 是一張卡片（可收合，有「全部收合」），activity 列出 icon、名稱，以及 `dates`（開始、到期）。folder 不會在課程頁展開。
- **Course blocks**：`core_block_get_course_blocks` 回傳空陣列，課程頁沒有側邊 block。
- **Dashboard「焦點綜覽」（`/my/`）**：由 E3 自訂 block 組成，依序為 `dcpc_courses`（「當期課程」，左側有當期課程、行事曆、校內資源三個按鈕；先列出 `【115上】…`，分隔線下再列出長期課程如新生啟航、性別平等）、`dcpc_news`（最新公告：跨課程與站台公告，每則顯示時間、課名、標題與摘要，可分頁）、`calendar_upcoming`（未來事件）、`myprofile`。

### 6.2 E3 用語與資料來源對應

| E3 UI 用語 | 實際頁面 | 對應的 Moodle 資料與 WS |
| --- | --- | --- |
| 焦點綜覽 | `/my/` | `core_course_get_enrolled_courses_by_timeline_classification` + 各課的 news forum discussions + `core_calendar_get_calendar_upcoming_view` |
| 當期課程 | dcpc_courses block | 已選修課程中 shortname 以當期學期代碼（如 `1151.`）開頭者；長期課程（`ICT.*`、`GEEOC2022`、`114.freshman`）另外列出。注意 `classification=inprogress` 也會回傳長期課程 |
| 歷年課程 | `local/courseextension/course_history.php` | 依 shortname 前綴（`1141`、`1142`、`114X` …）分組的已選修課程；112 上學期以前的課程在舊站 |
| 課程綱要 | `local/courseextension/timetable.php` | **iframe** 嵌入 `https://timetable.nycu.edu.tw/?r=main/crsoutline&Acy=115&Sem=1&CrsNo=515516&lang=zh-tw`，參數可以從 shortname 推出。E3 本身沒有 syllabus 資料 |
| 成員 | `user/index.php` | `core_enrol_get_enrolled_users`（未測試，要注意隱私） |
| 公告 / 公告列表 / 最新公告 | `blocks/dcpc_news/news/news_items.php?id=` | 該課 `type=news` 的 forum → `mod_forum_get_forum_discussions`。站台公告是 forumid=1。`news_view.php?d=<discussionid>` 等同於 forum discussion |
| 我的郵件 | `local/dcpcmail/view.php?c=&t=inbox` | `local_dcpcmail_*`（見 6.3） |
| 大綱列表 | `course/view.php?id=&scopec=1` | 就是一般的課程頁 → `core_course_get_contents` |
| 教材列表 | `local/courseextension/index.php?courseid=` | **folder + resource**（不含 supervideo 和 url），分成「課程講義」與「參考資料」兩張表，欄位為名稱、附件（直接列出檔名連結）、異動時間、功能（檢視、QR code）。本學期所有教材都在「課程講義」，「參考資料」都是空的；名稱有 `[參考資料]` 前綴的 folder 仍然歸在「課程講義」，所以分類依據不是名稱，可能是 E3 自訂欄位，WS 拿不到 |
| 作業列表 | `...index.php?courseid=&scope=assignment` | assign，分成**進行中、已繳、逾期未繳、預告**四組，可以用 `allowsubmissionsfromdate`、`duedate`、`cutoffdate` 加上 submission status 自行計算 |
| 討論區列表 | `mod/forum/index.php?id=&scope=forum` | `mod_forum_get_forums_by_courses` |
| 試卷列表 | `...index.php?courseid=&scope=quiz` | quiz，分成進行中、已繳、逾期未繳、預告 → `mod_quiz_get_quizzes_by_courses` + `mod_quiz_get_user_attempts` |
| 成績 | `local/courseextension/grade/report/user/index.php` | 欄位：評分項目、計算後權量、成績、全距、回饋 → `gradereport_user_get_grade_items`（未呼叫） |
| 超級影片 | `mod/supervideo/view.php` | 沒有 get WS，只能開網頁 |
| 整包教材檔案 | `mod/resource` | `contents[0]` |

### 6.3 E3 自訂外掛與 WS 可用性

| 外掛 | 用途 | WS |
| --- | --- | --- |
| `local_dcpcmail` | E3 站內信（取代被關閉的 core messaging），可依課程分類 | `get_unread_count` → 純數字；`get_menu` → `{unread, drafts, courses[{id, shortname, fullname, unread, visible}], labels[]}`；`get_index(type=inbox, itemid=0, offset, limit)` → `{totalcount, messages[{id, subject, attachments, draft, time, unread, starred, course{id, shortname}, sender{id, fullname, pictureurl}, recipients[{type, id, fullname, pictureurl}], labels}]}`；`search_index`；`get_message`（**可能會標記為已讀，未呼叫**）；`set_unread`（寫入）。API 形狀看起來跟開源的 `local_mail` 相同，可以參考它的 mobile addon |
| `block_dcpc_news` | 跨課公告彙整（dashboard 與課程內「公告列表」） | 沒有專屬 WS，用 forum WS 自己組 |
| `block_dcpc_courses` | dashboard 的「當期課程」 | 沒有，用 enrolled courses 自己組 |
| `local_courseextension` | 教材、作業、試卷列表、成績頁、課程綱要 iframe、歷年課程、QR code | 沒有，全部可以用 core WS 重建（只有全班繳交統計拿不到） |
| `mod_supervideo` | 影片 | 只有 view 和 progress_save（會寫入），**拿不到影片 URL** |

---

## 7. API client 需要知道的事

1. **檔案 URL**：WS 回傳的 `fileurl` 都是 `https://e3p.nycu.edu.tw/webservice/pluginfile.php/...`，有些已經帶 `?forcedownload=1`。請依照有沒有 `?` 用 `?` 或 `&` 附加 `token=<wstoken>`。
   - 沒有 token 時回傳 **HTTP 200 + JSON** `{"error":"缺少必須要的參數(token)","errorcode":"missingparam"}`，不是 4xx。
   - 非 WS 的 `/pluginfile.php/...?token=` 會被 303 導到登入頁，所以 HTML 中的 `/pluginfile.php/` 都要改寫成 `/webservice/pluginfile.php/`。
   - Response header：`access-control-allow-origin: *`、`access-control-allow-headers: range`、`accept-ranges: bytes`（mp4 可以直接串流）。PDF 是 `content-disposition: inline`（即使加了 forcedownload=1 也一樣），其他類型（例如 text/plain）是 `attachment`。
2. **HTML 內嵌資源**：forum message、folder intro、assign intro 中的 `<img src>` 和 `<a href>` 都指向沒有 token 的 `webservice/pluginfile.php`，渲染前要統一改寫。WS 不會回傳 `@@PLUGINFILE@@`，已經展開成完整 URL。
3. **REST 與 CORS**：`/webservice/rest/server.php` 的 preflight 與一般請求都會回 `access-control-allow-origin: *`，靜態 SPA 可以直接 POST（`application/x-www-form-urlencoded` 屬於 simple request）。
4. **錯誤格式**：HTTP 一律是 200，body 是 `{"exception":"core\\exception\\…","errorcode":"…","message":"<中文>"}`。例子：無效 token 是 `invalidtoken`，沒有權限是 `requireloginerror`（「課程或活動無法使用」），參數錯誤是 `invalidparameter`。`message` 會跟著使用者語言（`zh_tw`）。
5. **時間**：全部是 Unix 秒，學校時區 Asia/Taipei（+08:00）。`00:00` 截止很常見（見 3.1）。`timesort` 與 `timestart` 相同，`timeusermidnight` 可以用來把事件分組到同一天。
6. **格式欄位**：`*format` 幾乎都是 1（HTML）。assign 的 feedback comments 可能是 `format: 0`（MOODLE）或 1。`gradefordisplay`、`formattedtime`、`afterlink` 都是 HTML 片段。
7. **字串 quirk**：
   - `coursecategory` 和 `categoryname` 尾端可能有空白（例如 `"資工系    "`），要 trim。
   - 作者名稱前面會加上系所（例如「`系所 / 縮寫 姓名`」）。
   - 課程 `fullname` 開頭帶學期與課號，需要自行轉換成「【115上】課號 課名」。
   - `customdata` 是 JSON 字串，裡面還可能有 PHP serialize 字串。
8. **ID 混用**：calendar event 的 `instance` 實際上是 cmid。`mod_assign_get_submission_status` 用的是 assign `id`，不是 cmid。forum 用的是 `forumid`，contents 裡的是 cmid（`instance` 才是 forumid）。
9. **未讀狀態**：forum 沒開 tracking，WS 不提供公告未讀數。dcpcmail 有未讀數。popup notification 有 `read` 與 `timeread`（標記已讀屬於寫入操作）。
10. **增量同步**：`core_course_get_updates_since(courseid, since)` 可以用。它會回傳 `instances[{contextlevel: module, id: cmid, updates[{name: discussions|configuration|submissions|grades|gradeitems, itemids, timeupdated}]}]`，適合做「自上次之後有什麼新東西」的提示和快取失效。
11. **會記錄 log 或改變狀態、不能呼叫的函式**：所有 `*_view_*`、`mod_supervideo_*`、`local_dcpcmail_get_message`（疑似會標記已讀）、`local_dcpcmail_set_unread`、`core_message_mark_*`、`tool_mobile_get_autologin_key`（有頻率限制）。
12. **site 設定**（`core_webservice_get_site_info`）：release `4.5.4+ (Build: 20250417)`，`usermaxuploadfilesize=1073741824`，`userquota=104857600`，`messaging=0`，`enableblogs=0`，`enablebadges=0`，`enableglobalsearch=0`，`usetags=0`，`enablecompletion=1`（但課程都沒用）。

---

## 8. 對 client UI 與資料層的具體建議

1. **不要照搬 section 結構**：8 成課程只有一個「一般」section，照搬會變成一長串清單。建議以**類型分頁**為主（公告、教材、作業、測驗、討論、影片），也就是 E3 側邊選單「列表頁」的模式。「大綱」頁再提供原始 section 順序，並支援 27454 這種倒序週次。
2. **教材頁要把 folder 攤平**：大多數 folder 只有 1 個檔案，UI 應該直接列出檔案（檔名、類型 icon、大小、更新時間），不要多一層「資料夾」點擊。
   - 空 folder 要顯示它的 `intro`（HTML + 內嵌 mp4），等於一則「單元說明」。
   - 有子目錄的 folder（`filepath != "/"`）才顯示樹狀結構。
   - 要同時呼叫 `mod_folder_get_folders_by_courses` 才拿得到 intro。
3. **檔案預覽**：PDF 佔一半（inline、支援 CORS 和 Range），可以直接嵌入 pdf.js 或 `<iframe>`。pptx 與 ppt 佔三分之一，只能下載，或用 Office 線上預覽（需要公開 URL，含 token 有洩漏風險，**不建議**）。mp4 可以用 `<video>` 直接串流。
4. **作業頁只需要做好「檔案上傳」這條路**：重點在顯示允許的檔案類型、數量與大小上限，以及「已繳、未繳、逾期、可遲交、未開放」狀態。分組參考 E3 的「進行中、已繳、逾期未繳、預告」。不需要做 onlinetext 編輯器、team 或 statement。批改結果要能顯示 `editpdf` 產生的批註 PDF。
5. **待辦與首頁**：用 `get_action_events_by_timesort` 取得「未完成待辦」（它已經排除已繳交的作業），再用 `upcoming_view` 或 monthly view 取得完整時間軸（包含已繳交的作業和 quiz 關閉時間）。event 內已附 course，不需要另外 join。要特別處理 `00:00` 截止的顯示方式。
6. **公告彙整**：先用 `get_forums_by_courses` 找出所有 `type=news` 的 forum，再平行抓取 discussions，並加上 site forum（id 1，過濾 `timeend`），合併成一個跨課程的公告 feed（等於 dcpc_news）。未讀狀態要在本地（IndexedDB）記錄。
7. **HTML sanitize 與改寫管線**：在 DOMPurify 之後加入這幾步：改寫 pluginfile URL 並附加 token、把 E3 內部連結（forum、discuss、folder、dcpc_news、news_view）轉成 SPA 路由、linkify 純文字網址、外部連結加上 `target=_blank rel=noopener`。
8. **課名與學期處理**：解析 `shortname` 的 `^(\d{3})([12X])\.(\d+)` 得到學年、學期（1=上、2=下、X=暑期？）與課號，用來分組「當期」、「歷年」與「長期課程」，也可以產生課程綱要的外部連結（timetable.nycu.edu.tw）。
9. **E3 專屬功能**：
   - dcpcmail 收件匣可以用 `get_menu` 和 `get_index` 做成唯讀列表。開信要確認 `get_message` 的副作用，或明確告訴使用者「開信會標記已讀」。
   - supervideo 只能顯示成「在 E3 開啟」的外部連結。
10. **快取**：course contents 與 forum 列表可以快取，再用 `core_course_get_updates_since` 決定要失效哪些資料。calendar 的 payload 很大（每個 event 都附 course 和 data URI 圖片），建議只抓需要的時間範圍。

---

## 附錄：常用回應形狀（已裁剪）

**core_course_get_contents → module（folder）**

```json
{
	"id": 237668,
	"url": "https://e3p.nycu.edu.tw/mod/folder/view.php?id=237668",
	"name": "2. 錯覺篇",
	"instance": 85366,
	"contextid": 429155,
	"visible": 1,
	"uservisible": true,
	"modname": "folder",
	"modplural": "教材",
	"purpose": "content",
	"afterlink": null,
	"customdata": "\"\"",
	"completion": 0,
	"dates": [],
	"contents": [
		{
			"type": "file",
			"filename": "….mp4",
			"filepath": "/1009講義/",
			"filesize": 42929879,
			"fileurl": "https://e3p.nycu.edu.tw/webservice/pluginfile.php/429155/mod_folder/content/3/…mp4?forcedownload=1",
			"timemodified": 1791512137,
			"mimetype": "video/mp4",
			"isexternalfile": false,
			"author": "…",
			"license": "unknown"
		}
	]
}
```

**mod_assign_get_assignments → assignment**

```json
{
	"id": 44415,
	"cmid": 239512,
	"course": 25288,
	"name": "HW 1",
	"nosubmissions": 0,
	"submissiondrafts": 0,
	"duedate": 1791993540,
	"allowsubmissionsfromdate": 1790697600,
	"cutoffdate": 0,
	"gradingduedate": 1792512000,
	"grade": 100,
	"teamsubmission": 0,
	"requiresubmissionstatement": 0,
	"maxattempts": 1,
	"attemptreopenmethod": "untilpass",
	"configs": [
		{ "plugin": "file", "subtype": "assignsubmission", "name": "enabled", "value": "1" },
		{ "plugin": "file", "subtype": "assignsubmission", "name": "maxfilesubmissions", "value": "30" },
		{ "plugin": "file", "subtype": "assignsubmission", "name": "maxsubmissionsizebytes", "value": "1073741824" },
		{ "plugin": "file", "subtype": "assignsubmission", "name": "filetypeslist", "value": "" }
	],
	"intro": "<p dir=\"ltr\">…</p>",
	"introformat": 1,
	"introattachments": [{ "filename": "HW1.pdf", "fileurl": "https://e3p.nycu.edu.tw/webservice/pluginfile.php/431044/mod_assign/introattachment/0/HW1.pdf", "mimetype": "application/pdf" }]
}
```

**mod_assign_get_submission_status**

```json
{
	"lastattempt": {
		"submission": {
			"id": 0,
			"attemptnumber": 0,
			"timemodified": 1790934360,
			"status": "submitted",
			"assignment": 45073,
			"latest": 1,
			"plugins": [
				{
					"type": "file",
					"name": "上傳檔案",
					"fileareas": [
						{
							"area": "submission_files",
							"files": [
								{
									"filename": "<redacted>.pdf",
									"filesize": 28964,
									"fileurl": "https://e3p.nycu.edu.tw/webservice/pluginfile.php/433843/assignsubmission_file/submission_files/…/<redacted>.pdf",
									"mimetype": "application/pdf"
								}
							]
						}
					]
				},
				{ "type": "comments", "name": "作業加備註" }
			]
		},
		"submissionsenabled": true,
		"locked": false,
		"graded": false,
		"canedit": true,
		"cansubmit": false,
		"extensionduedate": null,
		"gradingstatus": "notgraded",
		"usergroups": []
	},
	"feedback": {
		"grade": { "grade": "…" },
		"gradefordisplay": "…&nbsp;/&nbsp;100.00",
		"gradeddate": 1791402831,
		"plugins": [
			{ "type": "comments", "editorfields": [{ "name": "comments", "text": "…", "format": 1 }] },
			{ "type": "editpdf", "fileareas": [{ "area": "partial", "files": [{ "filename": "combined.pdf" }] }] },
			{ "type": "file", "fileareas": [{ "area": "feedback_files", "files": [] }] }
		]
	},
	"assignmentdata": { "attachments": { "intro": [] } },
	"warnings": []
}
```

（`feedback` 只在有評分時出現。）

**core_calendar_get_action_events_by_timesort → event**

```json
{
	"id": 74962,
	"name": "HW 1",
	"component": "mod_assign",
	"modulename": "assign",
	"activityname": "HW 1",
	"activitystr": "作業",
	"instance": 239512,
	"eventtype": "due",
	"timestart": 1791993540,
	"timesort": 1791993540,
	"timeduration": 0,
	"timeusermidnight": 1791907200,
	"overdue": true,
	"normalisedeventtype": "course",
	"purpose": "assessment",
	"course": { "id": 25288, "fullname": "1151.515510.機率 Probability", "shortname": "1151.515510", "coursecategory": "資訊共同", "courseimage": "data:image/svg+xml;base64,…" },
	"action": { "name": "繳交作業", "url": "https://e3p.nycu.edu.tw/mod/assign/view.php?id=239512&action=editsubmission", "itemcount": 1, "actionable": true },
	"url": "https://e3p.nycu.edu.tw/mod/assign/view.php?id=239512"
}
```

（`instance` 實際上是 cmid。）

**mod_forum_get_forum_discussions → discussion**

```json
{"id":172589,"name":"Assignment 1: URL","discussion":134494,"parent":0,"created":1792039041,"modified":1792039041,
 "timestart":0,"timeend":0,"subject":"Assignment 1: URL",
 "message":"<p>Assignment 1: https://people.cs.nycu.edu.tw/~lhyen/np/ass1/np26f_ass1v.html</p>\r\n<p></p>",
 "messageformat":1,"attachment":false,"attachments":[…],"userfullname":"<系所> / <縮寫> <姓名>","numreplies":0,"numunread":0,
 "pinned":false,"locked":false,"starred":false,"canreply":false}
```
