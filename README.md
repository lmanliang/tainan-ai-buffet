# 台南AI爽

一個針對 AI 的小型聚會。每一個主題，大家都能喊卡、都能聚焦。帶著你遇到的問題，一起聊聊。

[官方網站](https://lmanliang.github.io/tainan-ai-buffet/) · [第一場簡報：AI 說可以](https://lmanliang.github.io/tainan-ai-buffet/20260909/)

## 網站維護

官網沿用 GitHub Pages，「下一場」保留完整靜態 HTML，搜尋引擎可直接讀取；「聊過的」由前端 JavaScript 讀取同一份活動 JSON，依瀏覽當下的時間更新。不需要安裝套件或後端服務；產生首頁使用 Node.js 18 以上版本。

- `src/index.html`：首頁內容與版型。
- `assets/site.css`：首頁樣式。
- `data/events.json`：所有場次資料。
- `index.html`、`sitemap.xml`：產生後提交的網站檔案，請勿直接編輯。
- `20260909/index.html`：現有第一場簡報，網址維持不變。

### 新增場次

1. 將新簡報放入 `YYYYMMDD/index.html`，並加入返回 `../` 官網的連結。
2. 在 `data/events.json` 新增一筆場次（見下方格式）。未有簡報或報名網址時，對應欄位填 `null`。
3. 執行 `npm run build`，再執行 `npm run check`。
4. 將場次資料、新簡報以及產生的 `index.html`、`sitemap.xml` 一起提交，沿用現有 GitHub Pages 發布設定。

```json
{
  "date": "YYYY-MM-DD",
  "title": "本場主題",
  "summary": "本場介紹",
  "slides": null,
  "registration": null,
  "status": "upcoming",
  "topics": ["主題標籤"]
}
```

新活動使用 `endsAt` 記錄含台灣時區的結束時間，例如 `2026-10-06T21:00:00+08:00`。建置時依此時間分類為近期或歷次活動，不需要再手動修改狀態；舊資料仍支援 `status`。近期依日期由近到遠、歷次由新到舊排列。發布後，「聊過的」會在每次開啟頁面時讀取 JSON，將已結束的活動依日期由新到舊列出，不需要為活動結束重新建置、發布或修改狀態。「下一場」不受前端程式影響，保留發布時的靜態 HTML，等新增或修改活動時再建置更新。讀取 JSON 失敗時保留既有歷次內容。

`slides` 是相對於網站根目錄的簡報資料夾，例如 `20260909/`；`registration` 是該場 KKTIX 網址。歷次場次的 KKTIX 連結標為活動資訊，不當成新場次報名入口。

### 本機預覽

在專案根目錄執行 `python3 -m http.server 8080`，開啟 `http://localhost:8080/`。正式網站位於 `/tainan-ai-buffet/` 子路徑，因此內部連結使用相對網址。

### SEO 與正式上線

首頁與第一場簡報已設定繁體中文、標題、描述、canonical 與社群分享文字。首頁提供 WebSite 結構化資料；`sitemap.xml` 列出首頁和已有簡報的場次。

上線後可在 Search Console 新增網址前綴資源 `https://lmanliang.github.io/tainan-ai-buffet/`，完成擁有權驗證，再提交 `sitemap.xml`。此步需要網站擁有者的 Google 帳號。

GitHub Pages 專案站的 `robots.txt` 必須由網域根目錄管理，放在本專案子路徑下不會成為該網域的有效規則，因此本專案不另加無效的 robots 檔案。若更換正式網域，需同步更新首頁模板、簡報 metadata 與 `scripts/build.mjs` 的網站網址。

### 完整活動內容

新增或修改自辦活動只需維護 `data/events.json`，再執行 `npm run build` 與 `npm run check`。
10/6 場次可作為完整範例：`heading` 是近期區標題、`summary` 是摘要、`paragraphs` 是多段介紹（換行用 `\n`），`startTime`／`endTime` 是顯示時間，`endsAt` 是分類依據，`location`／`participation` 是地點與參加方式，`registrationLabel` 是報名按鈕文字。文字會跳脫 HTML。

歸入歷次後顯示摘要與既有連結；尚未有簡報時不會出現簡報按鈕。保留舊場次資料即可，之後取得簡報再填入 `slides`。
