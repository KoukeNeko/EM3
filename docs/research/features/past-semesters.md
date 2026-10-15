# 過往學期課程的 Moodle 功能使用調查（1141 / 1142 / 114X）

> 調查日期：2026-10-15　環境：NYCU E3（Moodle 4.5.4, `e3p.nycu.edu.tw`, theme `boost_union`）方法：以學生帳號的 mobile web service token 唯讀呼叫 WS，加上 Playwright 以 GET 截圖官方頁面。未呼叫任何 `view_*` / 寫入函式，未點擊任何改變狀態的按鈕。原始統計：`/private/tmp/claude-501/-Users-em-uwu-EM3/851f90ca-d82e-4e20-870a-c557e6445981/scratchpad/feat-past/stats.json`（raw 回應在同目錄 `raw/`）。本報告不含學號、人名與成績數值。

## TL;DR

- **24 門學期課程全部是 `topics` format，其中 19 門只有一個 section「一般」**。週次 / 主題分段幾乎沒人用，課程頁就是一條平鋪的活動清單。
- **教材 100% 用 `folder` 模組上傳**（136 個 folder、242 個檔案），`resource` / `page` / `label` 數量為 0，`url` 只有 1 個。folder 內沒有子目錄（`filepath` 全是 `/`），而且多半只放 1 到 3 個檔案，等於把 folder 當成「單一檔案」來用。
- **14 個「空 folder」其實是外部連結容器**：檔案數 0，Google Docs / 雲端硬碟連結寫在 folder 的 `intro` 裡。`core_course_get_contents` 拿不到 intro，必須另外呼叫 `mod_folder_get_folders_by_courses`。
- 作業：15 門課共 75 個 assign，以 `file` 繳交為主（66 個），預設值多半沒改（maxfiles 30、1 GB、不限檔案類型）。**52% 的作業說明檔放在 `introattachments`**。截止時間有 51% 落在 23 點，75% 落在 21 到 23 點；另有一群截止在上課時段（12:00 到 13:30、17:00 到 17:20、21:30）。
- 每門課都剛好有一個 news forum「公告」。每學期每門課的公告中位數約 5 則，**1/3 的課程一則都沒有**，最多 27 則。約 20% 的公告帶附件（幾乎都是 PDF）。
- **課程 metadata 沒有上課時間或教室**：`summary` 全空、`customfields` 全空。教室資訊只會出現在公告文字裡。
- **學期最可靠的來源是 shortname（`1142.515501`）**，其次是 category tree 的第一層（`114下學期`），日期只能當備援，因為各學期的 enddate 互相重疊。
- 成績：`gradereport_user_get_grade_items` 要帶 `userid` 才能用（不帶會回 `nopermissions`）；`gradereport_overview_get_course_grades` 一次回傳所有課程的總分。

---

## 1. 逐課統計

縮寫：Sec = section 數；Fold/檔 = folder 數 / folder 內檔案數；Asg = 作業數；News = 公告則數（帶附件數）；Other forum = 非公告討論區數（討論串數）。

### 1142（114 下）與 114X（114 暑）

| id    | shortname   | 課名                            | Sec | Fold/檔 | 主要副檔名    | Asg | Quiz | News (附件) | Other forum         | 備註                                                      |
| ----- | ----------- | ------------------------------- | --- | ------- | ------------- | --- | ---- | ----------- | ------------------- | --------------------------------------------------------- |
| 21108 | 1142.514002 | 數位設計與製造                  | 1   | 9/13    | pdf, f3d, dxf | 5   | 0    | 0           | 0                   | folder 以日期命名（`0304課程講義`）；1 個 onlinetext 作業 |
| 21647 | 1142.534009 | 科學教育專題研究-認知多媒體研究 | 1   | 0/0     | –             | 2   | 0    | 0           | 0                   | 截止時間 17:00                                            |
| 21587 | 1142.519504 | 專題探索(一)                    | 1   | 0/0     | –             | 2   | 0    | 6           | 0                   | filetypes=`document`，maxfiles 5                          |
| 22485 | 1142.561059 | 認同與文化                      | 1   | 8/8     | pptx          | 1   | 0    | 0           | 1（1 串，16 回覆）  | 用 forum 收分組名單                                       |
| 22642 | 1142.563009 | 大一體育                        | 1   | 0/0     | –             | 0   | 0    | 0           | 0                   | 空殼課程                                                  |
| 21327 | 1142.515505 | 資料結構與物件導向程式設計      | 1   | 10/10   | zip, pptx     | 14  | 0    | 9           | 0                   | 週四 21:30 截止（課後 lab）                               |
| 21324 | 1142.515502 | 數位電路設計                    | 1   | 13/14   | pdf           | 16  | 0    | 8 (2)       | 1（2 串）           | 16 個作業中有數個是「不需繳交」的成績項                   |
| 21323 | 1142.515501 | 離散數學                        | 1   | 15/53   | mp4 38, pdf   | 1   | 0    | 26 (13)     | 0                   | 課程錄影 mp4，單檔最大約 130 MB                           |
| 21356 | 1142.515614 | 統計學                          | 10  | 13/14   | pdf           | 3   | 0    | 1           | 0                   | 唯一真的分 section 的課（Ch0 到 Ch5、Homework…）          |
| 21353 | 1142.515611 | 高效能計算概論                  | 1   | 1/0     | –             | 2   | 0    | 22 (1)      | 6（46 串，66 回覆） | Q&A 討論區最活躍的課                                      |
| 21351 | 1142.515609 | 生涯規劃及導師時間              | 1   | 1/1     | pptx          | 1   | 0    | 8           | 0                   |                                                           |
| 21909 | 1142.535526 | 敏捷軟體工程                    | 1   | 2/13    | pdf           | 1   | 0    | 1           | 0                   |                                                           |
| 22825 | 1142.565009 | 物理(二)                        | 1   | 0/0     | –             | 0   | 2    | 7 (4)       | 0                   | quiz 沒有開放時間、不限次數                               |
| 23650 | 114X.564000 | 微積分甲(一)（暑修）            | 2   | 0/0     | –             | 0   | 1    | 13 (6)      | 0                   | 唯一的 `url` 模組（連到系上網站）                         |

### 1141（114 上）

| id    | shortname   | 課名                   | Sec | Fold/檔 | 主要副檔名  | Asg | Quiz | News (附件) | Other forum | 備註                                  |
| ----- | ----------- | ---------------------- | --- | ------- | ----------- | --- | ---- | ----------- | ----------- | ------------------------------------- |
| 18841 | 1141.574006 | 前端網頁系統開發概論   | 1   | 2/2     | pdf         | 7   | 0    | 0           | 0           | 7 個成績項有 feedback                 |
| 17073 | 1141.514028 | 高齡設計               | 1   | 0/0     | –           | 0   | 0    | 0           | 0           | 空殼課程                              |
| 17568 | 1141.534012 | 數位學習專案管理與評鑑 | 4   | 8/26    | pdf, docx   | 5   | 0    | 1           | 0           | section：課程資料 / 參考資料 / 作業區 |
| 18590 | 1141.563009 | 大一體育               | 1   | 0/0     | –           | 0   | 0    | 0           | 0           | 空殼課程                              |
| 17260 | 1141.515508 | 計算機網路概論         | 1   | 11/7    | pdf         | 4   | 0    | 4           | 0           | 週二 13:20 截止（上課開始時間）       |
| 17256 | 1141.515504 | 線性代數               | 1   | 8/42    | mp4 31, pdf | 0   | 0    | 11 (5)      | 1（1 串）   | 課程錄影                              |
| 17253 | 1141.515501 | 計算機概論與程式設計   | 2   | 25/27   | pdf         | 11  | 0    | 20 (8)      | 0           | 一章一個 folder；Lab 作業限 `.c`      |
| 17289 | 1141.515616 | 生涯規劃及導師時間     | 1   | 10/12   | pptx, pdf   | 0   | 0    | 27 (4)      | 0           | 公告最多的課                          |
| 18758 | 1141.564016 | 微積分甲(一)           | 1   | 0/0     | –           | 0   | 0    | 0           | 0           | 只有成績（manual items）              |
| 18773 | 1141.565008 | 物理(一)               | 1   | 0/0     | –           | 0   | 4    | 1 (1)       | 0           | quiz 不限時、不限次數                 |

## 2. 彙總

### 2.1 模組使用（24 門課）

| modname                                                                                                      | 總數  | 使用的課程數        |
| ------------------------------------------------------------------------------------------------------------ | ----- | ------------------- |
| folder                                                                                                       | 136   | 15                  |
| assign                                                                                                       | 75    | 15                  |
| forum                                                                                                        | 33    | 24（每門都有 news） |
| quiz                                                                                                         | 7     | 3                   |
| url                                                                                                          | 1     | 1                   |
| resource / page / label / book / lti / h5pactivity / choice / feedback / questionnaire / workshop / glossary | **0** | 0                   |

> `mod_lti_get_ltis_by_courses`、`mod_h5pactivity_get_h5pactivities_by_courses`、`mod_choice_get_choices_by_courses`、`mod_feedback_get_feedbacks_by_courses` 不帶 `courseids`（等於涵蓋全部 42 門已選課程，包含 1151）時，結果也都是空陣列。

### 2.2 Section 與命名

- format：24/24 都是 `topics`，`courseformatoptions.coursedisplay=0`（單頁顯示）。
- 19/24 只有 section 0「一般」。有分 section 的只有 4 門，命名全是自訂：`Homework` / `References and files` / `Ch0`…、`114-1課程資料` / `參考資料` / `作業區`、`Lab`、`課程說明` / `課堂安排`。**沒有任何一門用「第 N 週」或日期當 section 名稱。**
- 實際的「週次」資訊寫在 **folder 名稱**裡：`0304課程講義`、`第二章課程錄影`、`0. Computer History`、`Ch3 Random variables`。
- 20 個 folder 名稱帶 `[參考資料]` 前綴（另有 `[Reference]`、`[Ln_0]` 各 1）。看起來是舊 E3 搬遷時留下的「教材分類」標籤。

### 2.3 檔案

- 242 個檔案全部在 folder 裡，沒有子目錄，也沒有頂層 `resource`。
- 副檔名：pdf 132、mp4 69、pptx 22、zip 7、docx 4、f3d 3、png / dxf / cpp / doc / ppt 各 1。
- mp4 集中在兩門課（離散數學、線性代數），單檔 14 到 130 MB。
- mimetype 不完全可靠：`.f3d` 會被判成 `application/zip`，`.dxf` 被判成 `text/plain`。
- folder 設定：`display=0`（另開頁面顯示）130 個、`showexpanded=1` 116 個、`showdownloadfolder=1` 118 個、`forcedownload=1`。
- **空 folder 14 個**，`intro` 全部含外部連結（Google Docs、雲端硬碟），`core_course_get_contents` 回傳的 `description` 是空的。

### 2.4 作業（75 個，15 門課；每門平均 5 個，最多 16 個）

| 項目                             | 分佈                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| submission plugins               | `file` 66、只有 `comments`（不需繳交，純成績項）8、`onlinetext` 1                                      |
| feedback plugins                 | `comments+editpdf+file` 70、`comments+editpdf` 4                                                       |
| maxfilesubmissions               | 30（預設）44、未設定 9、5×6、1×5、2×4、20×4、3×2、10×1                                                 |
| filetypeslist                    | 不限 57、`.c` 6、`document` 4、`*` 3、`archive,document,presentation` 2、`.pdf,.docx,.doc` 1、`.zip` 1 |
| maxsubmissionsizebytes           | 1 GB 57、500 MB 3、100 MB 2、1 / 2 / 10 MB 各 1                                                        |
| teamsubmission                   | 5 個                                                                                                   |
| submissiondrafts                 | 0/75：上傳即視為繳交，沒有「送出評分」這一步                                                           |
| introattachments（作業說明附檔） | **39/75（52%）**                                                                                       |
| allowsubmissionsfromdate         | 66/75 有設定                                                                                           |
| gradingduedate                   | 33/75 有設定                                                                                           |

**截止時間（67 個有 due date；Asia/Taipei）：**

| 時刻                                              | 次數 |     | 星期 | 次數 |
| ------------------------------------------------- | ---- | --- | ---- | ---- |
| 23:59                                             | 25   |     | 四   | 29   |
| 21:30                                             | 10   |     | 二   | 10   |
| 00:00                                             | 5    |     | 一   | 9    |
| 23:55                                             | 5    |     | 三   | 6    |
| 23:00                                             | 4    |     | 日   | 6    |
| 12:00 / 12:30 / 13:20 / 17:00                     | 各 2 |     | 五   | 5    |
| 其他（13:30、17:01、17:20、21:35、22:00、22:10…） | 12   |     | 六   | 2    |

- 依小時統計：23 時 34 個（51%）、21 時 13 個、22 時 3 個，合計 21 到 23 時佔 75%。中午到下午（12 到 13 時、17 時）共 11 個，對應上課開始或下課時間，例如計網週二 13:20、數位設計 12:30。
- **5 個截止在 `00:00`**：學生很容易誤會是哪一天。UI 應顯示成「週四 24:00」或「週三深夜」並附上相對時間。
- cutoffdate：51 個沒設定（逾期仍可交，只會標記遲交）；6 個在 due 後 12 小時內；其餘 1 到 21 天，另有 1 個 259 天的異常值。

### 2.5 討論區與公告

- 24/24 門課都有一個 `type=news`、名稱「公告」的 forum（`forcesubscribe=1`、`maxattachments=9`），學生 `cancreatediscussions=false`。
- 一般討論區只出現在 4 門課，共 9 個（例如 `Lab0 討論區`、`HW1 Discussion Board`、`分組名單上傳`），高效能計算一門就有 6 個。
- 公告數量（每門課每學期）：0 則 8 門、1 則 4 門、4 到 13 則 7 門、20 到 27 則 4 門。**中位數約 5，平均 6.9**；1142+114X 合計 101 則，1141 合計 64 則。
- 所有 215 個討論串中有 44 個帶附件（pdf 41、docx 6、pptx 3…），20 個內嵌圖片，32 個發布後被編輯過。內文長度中位數 178 字，p90 667 字，最長 5223 字。
- 發布時間分散，從早上 9 點到深夜都有，凌晨 0 到 2 點也有 14 則。
- 置頂（`pinned`）很常見：13 門有公告的課裡，有 11 門至少置頂 1 則。
- 討論串回應裡有 `starred`、`numunread`、`pinned`、`timestart`/`timeend`，可以直接拿來做「未讀」和「星號」的呈現，不需要寫入。

### 2.6 Quiz 與其他

- quiz 7 個，分布在 3 門課。物理(一)、物理(二)：沒有 `timeopen`/`timeclose`、`timelimit=0`、`attempts=0`（不限次數）。暑修微積分：有時間窗（07-01 到 07-13），10 次嘗試。
- 沒有 LTI、H5P、choice、feedback、questionnaire。第三方 client 第一版可以不實作這些模組，顯示「在 E3 開啟」連結即可。

### 2.7 成績（只檢查 API 是否可用與資料形狀，不含數值）

| 函式                                          | 結果                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `gradereport_user_get_grade_items courseid=N` | 不帶 userid 會回 `required_capability_exception / nopermissions`。**帶 `userid=<siteinfo.userid>` 就可以用**，24 門都成功 |
| `gradereport_overview_get_course_grades`      | 一次回傳所有課程 `{courseid, grade, rawgrade}`；沒有成績時 `grade="-"`、`rawgrade=null`                                   |
| `gradereport_user_get_grades_table`           | 回傳 HTML 片段的 table（`{class, colspan, content}`），不適合直接拿來用                                                   |
| `gradereport_user_get_access_information`     | `canviewusergradereport=true, canviewmygrades=true, canviewallgrades=false`                                               |

`get_grade_items` 的形狀：`usergrades[0].gradeitems[]`，包含 `itemname, itemtype(mod|manual|category|course), itemmodule, cmid, graderaw, gradeformatted, grademin, grademax, percentageformatted, gradeishidden, gradehiddenbydate, gradedategraded, feedback`。

- 每門課都有 3 到 10 個 **`manual` 成績項**（期中、期末、平時分數等，不對應任何活動），再加 `course` 總分。
- 24 門中有 12 門至少有一個已公布的成績項；`feedback` 不為空的成績項很少。
- 成績頁要能顯示「沒有對應活動的 manual 項目」，以及「尚未公布」（`graderaw=null`）的狀態。

## 3. 課程 metadata

### 3.1 `core_course_get_courses_by_field field=ids value=<csv>`

- 一次可以查多門課（32 個 id 一次查完，回應 53 KB）。
- `summary` 32/32 為空，`customfields` 32/32 為空，`overviewfiles` 為空。`courseimage` 是 Moodle 自動產生的 SVG。
- **沒有上課時間或教室欄位**。唯一的線索是公告內文（例如 1151 某課公告「上課教室更改通知」）。官方使用者選單有一個外部連結「選課系統」指向 `course.nycu.edu.tw`；若要提供課表，得另外串接學校的課程系統（本次未驗證）。
- `contacts[]` 只有 `{id, fullname}`，fullname 格式為 `<系所中文> / <系所英文縮寫> <姓名>`（例如 `資工系 / DCP …`）。行政單位則沒有英文縮寫（`教學發展中心 …`）。
- `categoryname` 可能帶尾端空白（`"資工系     "`），使用前要 trim。
- `enrollmentmethods` 幾乎都是 `["manual"]`，由選課系統同步。
- 不回傳 `idnumber`；timeline 回傳的 `idnumber` 也是空字串。

修剪後的回應範例：

```json
{
	"courses": [
		{
			"id": 21323,
			"fullname": "1142.515501.離散數學 Discrete Mathematics",
			"displayname": "1142.515501.離散數學 Discrete Mathematics",
			"shortname": "1142.515501",
			"courseimage": "https://e3p.nycu.edu.tw/pluginfile.php/<ctx>/course/generated/course.svg",
			"categoryid": 1706,
			"categoryname": "資訊共同",
			"summary": "",
			"summaryformat": 1,
			"summaryfiles": [],
			"overviewfiles": [],
			"contacts": [{ "id": 0, "fullname": "資工系 / DCP <teacher>" }],
			"enrollmentmethods": ["manual"],
			"format": "topics",
			"showgrades": 1,
			"newsitems": 5,
			"startdate": 1771776000,
			"enddate": 1789142400,
			"visible": 1,
			"enablecompletion": 1,
			"courseformatoptions": [
				{ "name": "hiddensections", "value": 0 },
				{ "name": "coursedisplay", "value": 0 },
				{ "name": "indentation", "value": "0" }
			]
		}
	],
	"warnings": []
}
```

### 3.2 Category tree：學期的第二來源

`core_course_get_categories criteria[0][key]=ids criteria[0][value]=<csv>` 可以一次查完；`key=parent value=0` 會列出所有頂層 category：

```
113暑期, 114上學期, 114下學期, 114暑期, 115上學期, 112下學期, 112暑期, 113上學期, 113下學期, 測試區, 學校業務支援
```

結構是 `/<學期>/<學院>/<系所或開課單位>`，例如 `/1571(114下學期)/1705(資訊學院)/1706(資訊共同)`。每個學期都會重建一套 category，所以同一個系在不同學期的 categoryid 不同（人社學院在 1141 是 1403，在 1142 是 1697）。非學期課程放在 `學校業務支援`（ICT 微學分、新生、性平、TA 培訓）或 `測試區`（ICT.0112-NN 子課程）。

### 3.3 `core_course_get_enrolled_courses_by_timeline_classification`

| classification                     | 筆數 | 內容                                                                            |
| ---------------------------------- | ---- | ------------------------------------------------------------------------------- |
| `all` / `allincludinghidden`       | 42   | 1141×10、1142×13、114X×1、1151×10、ICT×5、新生、CTLD_TA、GEEOC2022              |
| `inprogress`                       | 13   | 1151×10 + ICT.0112（到 2026-12-31）+ CTLD_TA（enddate=0）+ GEEOC2022（到 2040） |
| `past`                             | 29   | 1141、1142、114X、4 個 ICT、新生                                                |
| `future` / `hidden` / `favourites` | 0    |                                                                                 |

- 不帶 `limit` 時回傳 `nextoffset = 總數`（42）。
- 每筆欄位：`id, fullname, shortname, idnumber, summary, startdate, enddate, visible, fullnamedisplay, viewurl, courseimage, progress, hasprogress, isfavourite, hidden, showshortname, coursecategory, pdfexportfont…`。
- **`courseimage` 是 base64 SVG data URI（每筆約 4 到 15 KB），42 筆共約 500 KB**，佔了回應大部分大小。client 應該丟掉這個欄位，自己用 hash 產生色塊，不要把它存進 cache。
- `coursecategory` 只有最底層的名稱（例如 `資訊共同`），沒有學期。
- `isfavourite` 和 `hidden` 是使用者在官方「我的課程」設定的狀態（目前都沒有使用），可以唯讀顯示。
- 預設排序不是依學期（ICT → 新生 → 1141 → 1142 → 114X → 1151），client 必須自己排序。
- **日期分類會在學期交界時出錯**。各學期的實際區間：

| 學期 | startdate  | enddate    |
| ---- | ---------- | ---------- |
| 1141 | 2025-09-01 | 2026-02-28 |
| 1142 | 2026-02-23 | 2026-09-12 |
| 114X | 2026-06-29 | 2026-09-30 |
| 1151 | 2026-09-07 | 2027-02-28 |

1142 的 enddate 一路延到 9 月中，所以 9/7 到 9/12 之間 1142 和 1151 會同時是 `inprogress`，暑修課程也會跨越兩邊。另外常駐課程（GEEOC2022 到 2040、CTLD_TA 沒有 enddate）永遠是 `inprogress`。

修剪後的回應範例：

```json
{
	"courses": [
		{
			"id": 25283,
			"fullname": "1151.515505.演算法概論 Introduction to Algorithms",
			"shortname": "1151.515505",
			"idnumber": "",
			"summary": "",
			"startdate": 1788710400,
			"enddate": 1803744000,
			"visible": true,
			"fullnamedisplay": "1151.515505.演算法概論 Introduction to Algorithms",
			"viewurl": "https://e3p.nycu.edu.tw/course/view.php?id=25283",
			"courseimage": "data:image/svg+xml;base64,PD94bWwg…(~7 KB)",
			"progress": 0,
			"hasprogress": false,
			"isfavourite": false,
			"hidden": false,
			"showshortname": false,
			"coursecategory": "資訊共同"
		},
		{
			"id": 7528,
			"fullname": "性別平等教育線上課程 Gender Equity Education Online Course",
			"shortname": "GEEOC2022",
			"startdate": 1659283200,
			"enddate": 2227449600,
			"coursecategory": "性別平等教育委員會",
			"…": "…"
		}
	],
	"nextoffset": 42
}
```

### 3.4 角色

timeline 不包含使用者在該課的角色。`core_user_get_course_user_profiles userlist[i][userid]=<me>&userlist[i][courseid]=<id>` 可以批次取得 `roles[]`（`student`、`editingteacher`…）。注意 `name` 欄位帶有未處理的 `{mlang zh_tw}教師{mlang}{mlang en}Teacher{mlang}`，請改用 `shortname` 判斷。本帳號在 3 門 ICT 課程是教師或助教，其中 2 門是 `ICT.0112-NN` 個人子課程，**fullname 是「人名 + 學號」**。

## 4. 學期與課名解析規則

### 4.1 觀察到的格式

| 類型                  | shortname                              | fullname                                                                                                  |
| --------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 一般學期課            | `1142.515501`                          | `1142.515501.離散數學 Discrete Mathematics`                                                               |
| 暑修                  | `114X.564000`                          | `114X.564000.微積分甲(一) Calculus A (I)`                                                                 |
| 只有中文 / 含全形標點 | `1142.535526`                          | `1142.535526.敏捷軟體工程：產品探索、開發流程與測試實務 Agile Software Engineering: Product Discovery, …` |
| 中文名含 ASCII        | `1142.565009`                          | `…物理(二) Physics(II)`                                                                                   |
| ICT 微學分            | `ICT.0106`、`ICT.0112`、`ICT.20260316` | `ICT微學分課程_Python×LLM：AI 應用開發入門 Introduction to Python Programming`                            |
| ICT 子課程（個人）    | `ICT.0112-09`、`ICT.0112-12`           | `<人名> <學號>`（隱私，不可直接顯示給第三人）                                                             |
| 新生                  | `114.freshman`                         | `114學年度新生啟航-線上學習課程`（沒有英文名）                                                            |
| TA 培訓               | `CTLD_TA`                              | `教學助理線上培訓課程`                                                                                    |
| 性平                  | `GEEOC2022`                            | `性別平等教育線上課程 Gender Equity Education Online Course`                                              |

官方頁面自己的呈現方式（可以當作 client 的命名參考）：dashboard「當期課程」顯示為 `【115上】514005設計概論 Introduction to Design`；「歷年課程」頁顯示為 `[學生]【114下】515501離散數學 Discrete Mathematics`、`【114暑】564000…`。

### 4.2 建議規則（依序嘗試）

```ts
// 1) 學期課：以 shortname 為準（fullname 前綴與 shortname 相同，可以用來交叉驗證）
const SEM_RE = /^(\d{3})([12X])\.([0-9A-Z]{6})$/; // shortname
const FULL_RE = /^(\d{3}[12X])\.([0-9A-Z]{6})\.(.+)$/s; // fullname
// term: '1' => 上（秋）, '2' => 下（春）, 'X' => 暑；排序鍵：year*10 + {1:1, 2:2, X:3}
// 若之後出現 '3'（其他學校常用來表示暑期），也視為暑期，排序鍵同 X

// 2) 中英文分割（套用在 FULL_RE 的 rest 或非學期課的 fullname）
//    英文名 = 從某個空白之後開始、且到字串結尾都「不含 CJK 字元與全形標點」的最長後綴
const CJK = /[\p{Script=Han}　-〿＀-￯]/u;
function splitName(rest: string) {
	const t = rest.trim();
	for (let i = 0; i < t.length; i++) {
		if (t[i] === " " && !CJK.test(t.slice(i + 1)) && CJK.test(t.slice(0, i))) {
			return { zh: t.slice(0, i).trim(), en: t.slice(i + 1).trim() || null };
		}
	}
	return CJK.test(t) ? { zh: t, en: null } : { zh: null, en: t };
}
// 會從左到右找，第一個成立的位置就是最長的英文後綴：
// 「Python×LLM：AI 應用開發入門 Introduction to Python Programming」
//   → zh 的開頭含 ASCII 也沒關係（因為後綴檢查會失敗，直到「入門」之後）
// 「物理(二) Physics(II)」→ zh="物理(二)", en="Physics(II)"
// 「114學年度新生啟航-線上學習課程」→ en=null

// 3) 非學期課：ICT 前綴
//    /^ICT\.(\d{4}|\d{8})(-\d+)?$/  → kind='ict'；fullname 去掉 'ICT微學分課程_' 前綴再做 splitName
//    有 '-NN' 的是個人子課程（category 在「測試區」）：預設收在「其他」，名稱只顯示 shortname
// 4) 其他（114.freshman / CTLD_TA / GEEOC2022 …）→ kind='other'，分到「校務 / 常駐課程」群組

// 5) shortname 解析失敗時的學期備援：
//    a. category path 的根節點名稱  /^(\d{3})(上|下|暑)(學期|期)$/  → 上=1, 下=2, 暑=X
//       （需要 core_course_get_categories key=ids，一次批次查詢，結果可以長期 cache）
//    b. 根節點是「學校業務支援」或「測試區」→ 非學期
//    c. 最後才用 startdate 推算：08/01 到 01/31 開始 → 該學年上；02/01 到 06/15 → 下；06/15 到 07/31 → 暑
//       （民國學年 = 西元年 − 1911，2 月到 7 月開始的課屬於前一學年）
```

- 課程代碼目前看到的都是 6 位數字（例如 `515501`）。不要假設前 3 碼一定是系所代碼：資工系、資訊共同等不同單位都用 515xxx，`514xxx` 則是人社院。
- **「目前學期」的判定**：取 `inprogress` 課程中最大的學期碼，而不是全部 `inprogress` 課程，這樣可以避開學期交界重疊和常駐課程。
- 顯示時建議用 `115 上`、`114 下`、`114 暑` 這類標籤，和官方 dashboard 以及歷年課程頁一致。

## 5. 官方 UI 觀察

截圖：

- `/private/tmp/claude-501/-Users-em-uwu-EM3/851f90ca-d82e-4e20-870a-c557e6445981/scratchpad/feat-past/courses.png`（另有 `courses-mobile.png`）
- `/private/tmp/claude-501/-Users-em-uwu-EM3/851f90ca-d82e-4e20-870a-c557e6445981/scratchpad/feat-past/dashboard.png`（另有 `dashboard-mobile.png`）
- `/private/tmp/claude-501/-Users-em-uwu-EM3/851f90ca-d82e-4e20-870a-c557e6445981/scratchpad/feat-past/course_history.png`

注意：dashboard 截圖的「已登入使用者」區塊含有使用者本人的姓名與 email，請勿外流。

### 5.1 `/my/courses.php`「我的課程」

這是 Moodle 原生的 `block_myoverview`。篩選選單有：全部 / 進行中 / 未來 / 過去 / 星號標記 / 已移除顯示；排序有：課程名稱 / 最後存取；檢視方式有：卡片 / 清單 / 摘要；每頁 12 筆。

令人困惑的地方：

1. 預設是「全部 + 按課程名稱排序」，因為名稱以學期碼開頭，**第一頁全是最舊的 1141 課程，本學期的課要翻到第 3 到 4 頁**。
2. 沒有依學期分組，卡片上也沒有學期標籤，只能從名稱前綴 `1141.` 自己判斷。卡片下方顯示的是系所（`資訊共同`），不是學期。
3. 課名會被截斷（`Introduction to Computers and ...`），而且 fullname 本身就重複了一次課號。
4. 封面是隨機生成的幾何色塊，沒有提供任何資訊。只有少數卡片顯示「0%完成」，因為只有部分課程開了 completion。
5. ICT 個人子課程的卡片標題是「人名 + 學號」。
6. 「進行中」篩選依賴 enddate，所以會混入常駐課程，學期交界時也會同時出現兩個學期。

### 5.2 `/my/`「焦點綜覽」（dashboard）

這頁使用學校自製的 block：

- `dcpc_courses`「當期課程」：列出 `【115上】514005設計概論 …`，分隔線下方是常駐課程（新生啟航、性平），左側有「當期課程 / 行事曆 / 校內資源」按鈕。**這是官方唯一有學期標籤的課程清單，但只列當期。**
- `dcpc_news`「最新公告」：跨課程彙整的公告（課名、標題、摘要、看更多），9 頁分頁，和「系統」公告（例如 E3 使用手冊）混在一起。連結指向 `blocks/dcpc_news/news/news_view.php?d=<discussionid>`，不是原生的 forum discussion 頁面。
- `calendar_upcoming`「未來事件」：只有標題和時間，沒有顯示課名。截止時間用 `PM 11:59`、`AM 12:00` 這種 12 小時制，`AM 12:00` 特別容易讓人誤判是哪一天。
- 使用者選單另有「公告」（`mod/dcpc_news/news/index.php`）、「我的郵件」（`local/dcpcmail`，站內信）、「歷年課程」、「選課系統」等自製入口。這些都是 plugin 頁面，**不一定有對應的 WS 函式**。

### 5.3 「歷年課程」（`local/courseextension/course_history.php`）

依學期排序的扁平清單，格式為 `[學生]【114上】514028高齡設計 …`，帶有角色前綴，最上方是「112 上學期及更舊的課程」的外部連結（舊站）。非學期課程排在最後，ICT 個人子課程直接以人名呈現。

所以官方把「當期」「歷年」「全部」拆成三個不同頁面，各自用不同的命名格式。

## 6. 對 client 設計的影響

1. **課程清單要依學期分組**：預設展開最新學期，舊學期摺疊，另設「校務 / 常駐」和「其他（測試區 / 個人子課程）」群組。學期由 shortname 解析，category root 當備援，不要依賴 timeline classification（它只能當「是否已結束」的提示）。
2. **課程頁不要照搬 section 結構**。因為 80% 的課只有一個 section，比較好的做法是依模組類型分頁籤（教材 / 作業 / 公告 / 測驗 / 成績），教材依 folder 的 `timemodified` 或名稱中的日期、章節號排序。只有一個檔案的 folder 應該直接顯示成檔案列，不要多一層。
3. **教材索引需要兩個呼叫**：`core_course_get_contents`（檔案列表與大小）加上 `mod_folder_get_folders_by_courses`（intro 裡的外部連結）。空 folder 要顯示成「外部連結」卡片。folder 名稱的 `[參考資料]` 前綴可以轉成標籤。
4. **檔案預覽**：PDF 佔一半以上，應內建預覽；mp4 動輒上百 MB，要用串流播放（`<video>` 搭配 token 化的 `pluginfile` URL），不能先下載整個檔案。`.f3d` 這類檔案的 mimetype 不準，判斷類型時以副檔名為準。
5. **作業**：顯示 `introattachments`（有一半的題目放在這裡）。截止時間統一用 24 小時制加相對時間，`00:00` 要特別標示是哪一天。標示「是否允許遲交」（沒有 cutoff 的佔 76%），以及只有 `comments` plugin 的「不需繳交」作業（這類不應出現在待辦清單）。filetypes 和 maxfiles 多半是預設值，上傳 UI 不需要針對它們做太多處理（而且 client 本身唯讀，或將來才支援上傳）。
6. **公告**：跨課程的「全部公告」時間軸是剛需，官方 dashboard 也是這樣做的。每門課每學期 0 到 27 則，用 `mod_forum_get_forum_discussions` 逐課抓取後合併即可，`perpage` 設到 50 已經涵蓋所有課程。要支援附件（PDF）、置頂、內嵌圖片（`pluginfile.php` 需要附上 token）。
7. **成績**：呼叫時務必帶 `userid`。列表頁用 `gradereport_overview_get_course_grades`（1 次呼叫取得所有課程），詳情頁用 `get_grade_items`。manual 項目很多，要能處理「沒有對應活動」和「尚未公布」的項目。
8. **上課時間與教室在 E3 取不到**。課表功能需要外部資料來源（選課系統），或讓使用者自行輸入；目前不要承諾這項功能。
9. **效能**：timeline 回應約 526 KB，其中約 500 KB 是 `courseimage` 的 data URI；`courses_by_field` 則是 URL。cache 前應剝掉 `courseimage`，封面在 client 端生成。
10. **隱私**：ICT 個人子課程的 fullname 含人名與學號，client 在截圖分享或公開 demo 時要遮蔽。顯示角色時用 `roles[].shortname`，不要直接顯示 `name`（含 mlang 標記）。
11. 不需要為 LTI、H5P、choice、feedback、questionnaire、page、label、book 投入心力。quiz 只要能列出並導到 E3 即可（7 個裡有 6 個不限時）。
