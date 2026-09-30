import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "zh")}>{children}</Link>
);

/** Same rule as the English page: every claim is checked and dated; untested says so. */
export const zhCompare = {
  title: "免費線上 .msg 檢視器比較:哪些會上傳你的郵件?",
  description:
    "2026 年 9 月 30 日實測四個免費 .msg 檢視器:哪些會把郵件送到伺服器、檔案大小上限與支援格式,以及如何自己檢查任何一個檢視器。",
  intro:
    "簡短答案:四個之中有兩個會先把檔案上傳到自家伺服器才顯示;另外兩個在你的瀏覽器裡讀取,不會送出任何東西。如果郵件內容需要保密,請使用不上傳的那兩個,或花一分鐘自己檢查。",
  body: (
    <>
      <h2>比較結果</h2>
      <p>
        於 <strong>2026 年 9 月 30 日</strong>查證,方法是閱讀各網站自己的頁面與上傳程式碼。製作這張表時,沒有上傳任何檔案到任何服務。
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>工具</th>
              <th>檔案去哪裡</th>
              <th>大小上限</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MsgLens(本站)</td>
              <td>留在你的瀏覽器</td>
              <td>100 MB</td>
              <td>.msg、.eml、winmail.dat;附件;可匯出 PDF 與 .eml。開源(MIT)。</td>
            </tr>
            <tr>
              <td>msg-viewer.pages.dev</td>
              <td>留在你的瀏覽器;程式碼中沒有上傳呼叫</td>
              <td>未標示</td>
              <td>.msg;程式碼包含附件處理。開源。</td>
            </tr>
            <tr>
              <td>Encryptomatic Viewer</td>
              <td>上傳到其伺服器(表單上傳)</td>
              <td>75 MB</td>
              <td>.msg、.eml、winmail.dat;附件。</td>
            </tr>
            <tr>
              <td>CoolUtils MSG to PDF</td>
              <td>上傳到其伺服器;官方表示上傳檔案 24 小時內刪除</td>
              <td>50 MB</td>
              <td>是轉檔工具而非檢視器:輸出 PDF、DOC、HTML、JPG 或 TXT。</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        兩個本地工具都會載入第三方 script:msg-viewer.pages.dev 載入 Google Analytics,本站載入 Google
        AdSense。兩者都不會送出檔案。至於其他工具能否正確顯示「內文只存成壓縮 RTF」的郵件,<strong>沒有測試</strong>
        ——要測就得把郵件上傳給它們。
      </p>

      <h2>為什麼郵件特別需要在意</h2>
      <p>
        存下來的 .msg 很少是電子報。它通常是轉寄的錄取通知、合約往來、簽名檔裡帶著客戶資料的申訴信。為了閱讀而上傳,等於把完整副本(含郵件標頭與附件)交給一個你一無所知的伺服器。刪除承諾也許會被遵守,但那終究是承諾;根本不送出檔案的檢視器,不需要做這個承諾。
      </p>

      <h2>如何自己檢查任何一個檢視器</h2>
      <ol>
        <li>
          打開檢視器,再開啟瀏覽器的開發者工具(F12,Mac 上是 Cmd+Option+I),切到 <strong>Network</strong> 分頁。
        </li>
        <li>在檢視器中開啟一個 .msg 檔。</li>
        <li>
          找一個大小跟你的檔案差不多的請求,通常是 <code>POST</code>。如果有,檔案就被上傳了;如果只有載入 script 或廣告的小請求,就是在本機讀取。
        </li>
        <li>更嚴格的測試:載入檢視器後中斷網路,再開啟檔案。本地檢視器照樣能用,會上傳的就不行。</li>
      </ol>

      <h2>什麼時候上傳也無妨</h2>
      <p>
        如果是你願意公開貼出來的郵件,這些工具都可以用;像 CoolUtils 這樣的轉檔工具還提供檢視器沒有的輸出格式。只有在內容屬於私人資料時,選擇才重要——而存下來的郵件,大多數都是。
      </p>

      <h2>相關文章</h2>
      <ul>
        <li>{L("/how-to-open-msg-files", "不用 Outlook 怎麼開 .msg 檔")}</li>
        <li>{L("/outlook-msg-no-html-body", "為什麼大多數 Outlook 郵件沒有 HTML 內文")}</li>
        <li>{L("/about", "MsgLens 如何在瀏覽器中讀取檔案,以及如何自己驗證")}</li>
      </ul>
    </>
  ),
};
