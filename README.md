# 台南AI爽

一個針對 AI 的小型聚會。每一個主題，大家都能喊卡、都能聚焦。帶著你遇到的問題，一起聊聊。

[官方網站](https://lmanliang.github.io/tainan-ai-buffet/) · [第一場簡報：AI 說可以](https://lmanliang.github.io/tainan-ai-buffet/20260909/)

## 網站維護

官網沿用 GitHub Pages，首頁是完整的靜態 HTML，不需要瀏覽器執行 JavaScript 才能讀到活動資料。不需要安裝套件或後端服務；產生首頁使用 Node.js 18 以上版本。

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

`status` 使用 `upcoming`（近期活動）或 `past`（歷次分享）。近期活動依日期由近到遠排列，歷次分享由新到舊排列；沒有近期活動時，首頁自動省略該區塊。活動結束或取消時，請更新資料並重新產生網站；狀態不會依瀏覽者時間自動改變。

`slides` 是相對於網站根目錄的簡報資料夾，例如 `20260909/`；`registration` 是該場 KKTIX 網址。歷次場次的 KKTIX 連結標為活動資訊，不當成新場次報名入口。

### 本機預覽

在專案根目錄執行 `python3 -m http.server 8080`，開啟 `http://localhost:8080/`。正式網站位於 `/tainan-ai-buffet/` 子路徑，因此內部連結使用相對網址。

### SEO 與正式上線

首頁與第一場簡報已設定繁體中文、標題、描述、canonical 與社群分享文字。首頁提供 WebSite 結構化資料；`sitemap.xml` 列出首頁和已有簡報的場次。

上線後可在 Search Console 新增網址前綴資源 `https://lmanliang.github.io/tainan-ai-buffet/`，完成擁有權驗證，再提交 `sitemap.xml`。此步需要網站擁有者的 Google 帳號。

GitHub Pages 專案站的 `robots.txt` 必須由網域根目錄管理，放在本專案子路徑下不會成為該網域的有效規則，因此本專案不另加無效的 robots 檔案。若更換正式網域，需同步更新首頁模板、簡報 metadata 與 `scripts/build.mjs` 的網站網址。
