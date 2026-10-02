import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "zh")}>{children}</Link>
);

export const zhContent = {
  howTo: {
    title: ".msg 檔案如何開啟?不用 Outlook 的 5 種方法",
    description:
      "Windows、Mac、iPhone、Android 開啟 Outlook .msg 檔的五種做法,包含不用安裝軟體、在瀏覽器線上開啟 msg 檔(檔案不上傳)的方法。",
    intro:
      "有人寄給你一個副檔名是 .msg 的檔案,你點兩下,電腦不是毫無反應,就是用文字編輯器打開後跑出一整片亂碼。這不是檔案壞了,而是因為它是 Microsoft Outlook 的專有格式 —— 微軟生態系以外的軟體幾乎都讀不懂。",
    steps: [
      {
        name: "用瀏覽器開啟",
        text: "把 .msg 檔拖到本站首頁的檢視器上,郵件會連同原始排版、圖片與附件一起顯示。檔案不會上傳,而是由你自己電腦上的 JavaScript 解析。",
      },
      {
        name: "用 Outlook 開啟",
        text: "如果已安裝 Outlook,點兩下即可。Windows 上可能需要先按右鍵,選擇「開啟檔案」再指定 Outlook。",
      },
      {
        name: "改成 .txt 副檔名(僅供確認)",
        text: "把 message.msg 改名成 message.txt 再用文字編輯器打開,可以在二進位雜訊中看到零星的內文片段。這只能用來確認檔案不是空的,不是閱讀郵件的方法。",
      },
      {
        name: "轉存成 .eml",
        text: "在檢視器中開啟後選擇「匯出 → 另存為 .eml」。轉出的檔案可以直接被 Apple Mail、Thunderbird、Windows 郵件等大多數郵件軟體開啟。",
      },
    ],
    body: (
      <>
        <h2>為什麼 .msg 打不開</h2>
        <p>
          <code>.msg</code> 並不是換了副檔名的文字檔,而是一個{" "}
          <strong>Compound File Binary Format</strong> 容器 —— 跟舊版{" "}
          <code>.doc</code>、<code>.xls</code> 使用的是同一種 OLE2 結構。主旨、寄件者、
          收件者、內文與每個附件,都以獨立的內部資料流儲存,並用 MAPI 屬性標籤編號索引。
        </p>
        <p>
          因為微軟從未把它提交為交換標準,Apple Mail、Gmail、Thunderbird 與各種手機郵件
          App 都不支援。在 macOS 上點兩下通常會跳出
          <em>「沒有應用程式可以打開這份文件」</em>;在 Android 與 iOS 上則多半下載完就
          放在那裡動不了。
        </p>

        <h2>方法一 —— 用瀏覽器開啟(免安裝)</h2>
        <p>
          這是最快的做法,在所有作業系統上表現一致,包含手機與不允許安裝軟體的公司電腦。
        </p>
        <ol>
          <li>前往{L("/", "首頁的檢視器")}。</li>
          <li>
            把 <code>.msg</code> 檔拖進虛線框,或點擊選擇檔案。
          </li>
          <li>郵件會立即開啟,排版、內嵌圖片、收件者與附件都完整保留。</li>
        </ol>
        <p>
          由於解析完全在瀏覽器內執行,檔案不會經過網路。你可以自行驗證:打開開發者工具的
          「網路」分頁再開啟檔案,不會看到任何上傳請求;或是等頁面載入後直接斷網,檢視器
          照樣能用。並不是每個線上檢視器都這樣運作,請參考
          {L("/msg-viewer-comparison", "哪些免費 .msg 檢視器會上傳你的檔案")}。
        </p>

        <h2>方法二 —— 用 Outlook 開啟</h2>
        <p>
          若已安裝 Windows 或 Mac 版 Outlook,點兩下通常就能開。如果 Windows 用錯程式開啟,
          在檔案上按右鍵選<strong>開啟檔案</strong>,指定 <strong>Outlook</strong>,
          並勾選<em>永遠使用此應用程式</em>。
        </p>
        <p>
          網頁版 Outlook(outlook.office.com)無法開啟 <code>.msg</code> 檔。把檔案寄給自己
          這個常見的變通做法也沒用 —— 附件仍然是網頁版無法呈現的 <code>.msg</code>。
        </p>

        <h2>方法三 —— 轉成 .eml,用平常的郵件軟體開</h2>
        <p>
          <code>.eml</code> 是所有郵件軟體都看得懂的 RFC 822 標準格式。轉檔後你會得到一個
          能直接開啟、轉寄與封存的檔案。
        </p>
        <ol>
          <li>
            在{L("/", "檢視器")}中開啟 <code>.msg</code> 檔。
          </li>
          <li>
            選擇<strong>匯出 → 另存為 .eml</strong>。
          </li>
          <li>點兩下下載後的檔案,Apple Mail、Thunderbird 與 Windows 郵件都能直接開啟。</li>
        </ol>
        <p>
          兩種格式各自保留與遺失了什麼,可以參考
          {L("/msg-vs-eml", ".msg 與 .eml 的完整比較")}。
        </p>

        <h2>方法四 —— 存成 PDF</h2>
        <p>
          要分享、歸檔,或附在法務與客服工單上時,PDF 通常才是最終目的地。
          {L("/convert-msg-to-pdf", "這篇教學")}會說明如何產生一份保留標頭區塊、
          並展開連結網址的乾淨 PDF。
        </p>

        <h2>方法五 —— 改成 .txt(僅供診斷)</h2>
        <p>
          把檔案改成 <code>.txt</code> 再用記事本或文字編輯開啟,只會在二進位雜訊中看到
          零星可讀片段。附件、排版與中日韓字元都救不回來。請把它當成「確認檔案不是空的」
          的手段,而不是閱讀郵件的方法。
        </p>

        <h2>各平台專門說明</h2>
        <p>
          上面的做法到處都適用。Windows、macOS、手機與 Gmail 各有夠多的眉角,
          各自值得一節,就接在下面。
        </p>
        <p>
          如果檔案打得開但畫面不對 —— 內文空白、圖片破圖、中文亂碼 ——
          {L("/msg-file-wont-open", "疑難排解教學")}會逐一對應症狀。
        </p>
        <h2>一次很多個檔案怎麼辦?</h2>
        <p>
          一次最多可以拖入 50 個檔案。它們會排成一份可篩選的清單,用 <code>J</code> 與{" "}
          <code>K</code> 就能逐封切換,比一個一個開匯出的郵件封存快得多。
        </p>
      </>
    ),
  },

  whatIs: {
    title: "msg 是什麼檔案?Outlook .msg 格式與開啟方式",
    description:
      ".msg 是 Outlook 把單封郵件、約會或聯絡人存成檔案的格式。說明它的結構、為什麼其他程式打不開,以及不裝 Outlook 怎麼開啟。",
    body: (
      <>
        <p>
          <code>.msg</code> 是 Microsoft Outlook 用來把單一項目存成獨立檔案的格式。雖然名字
          叫 msg,它裝的不只是郵件 —— 從 Outlook 存出的約會、聯絡人、工作、記事與會議邀請,
          產生的都是 <code>.msg</code> 檔。
        </p>
        <p>
          <strong>想直接打開檔案?</strong>把 <code>.msg</code> 拖進{L("/", "線上檢視器")}
          就能看到內文和附件,檔案在你的瀏覽器裡解析,不會上傳。其他做法見
          {L("/how-to-open-msg-files", "開啟 .msg 檔的 5 種方法")}。
        </p>

        <h2>外層容器:Compound File Binary Format</h2>
        <p>
          <code>.msg</code> 本質上是一個 <strong>OLE2 複合文件</strong> —— 等於在單一檔案
          裡塞了一套小型檔案系統,有目錄(storage)也有檔案(stream)。這類檔案開頭一定
          是同樣的八個簽章位元組 <code>D0 CF 11 E0 A1 B1 1A E1</code>,因此就算副檔名被改過,
          解析器依然認得出來。
        </p>
        <p>
          舊版的 <code>.doc</code>、<code>.xls</code>、<code>.ppt</code> 用的是同一種容器,
          差別在於內部資料流的命名與意義 —— <code>.msg</code> 的部分由{" "}
          <strong>[MS-OXMSG]</strong> 規格定義。
        </p>

        <h2>裡面存了什麼</h2>
        <p>
          每個郵件屬性各自存成一個資料流,名稱就是 MAPI 屬性標籤(16 位元屬性編號 + 16 位元
          型別)。例如:
        </p>
        <table>
          <thead>
            <tr>
              <th>屬性</th>
              <th>標籤</th>
              <th>內容</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PidTagSubject</td>
              <td><code>0037001F</code></td>
              <td>主旨</td>
            </tr>
            <tr>
              <td>PidTagBody</td>
              <td><code>1000001F</code></td>
              <td>純文字內文</td>
            </tr>
            <tr>
              <td>PidTagHtml</td>
              <td><code>10130102</code></td>
              <td>HTML 內文(原始位元組)</td>
            </tr>
            <tr>
              <td>PidTagRtfCompressed</td>
              <td><code>10090102</code></td>
              <td>壓縮過的 RTF 內文</td>
            </tr>
            <tr>
              <td>PidTagSenderEmailAddress</td>
              <td><code>0C1F001F</code></td>
              <td>寄件者位址</td>
            </tr>
          </tbody>
        </table>
        <p>
          收件者與附件則不是屬性,而是子儲存區 —— 例如{" "}
          <code>__recip_version1.0_#00000000</code> 與{" "}
          <code>__attach_version1.0_#00000000</code> —— 各自內部再放自己的屬性資料流。
        </p>

        <h2>內文的三種存法</h2>
        <p>
          這正是多數簡易檢視器出錯的地方,也是同一個檔案在某個工具裡完美、在另一個工具裡
          卻空白的原因。Outlook 可能把內文存成:
        </p>
        <ul>
          <li>
            <strong>純文字</strong>,放在 <code>PidTagBody</code>。
          </li>
          <li>
            <strong>HTML</strong>,放在 <code>PidTagHtml</code>,是必須依{" "}
            <code>PidTagInternetCodepage</code> 指定的字碼頁去解碼的原始位元組。
            一律當成 UTF-8 解碼,正是中文、日文、韓文、西里爾文與希臘文郵件變成亂碼的主因。
          </li>
          <li>
            <strong>壓縮 RTF</strong>,放在 <code>PidTagRtfCompressed</code>。當原始郵件
            是 HTML 時,Outlook 會依 <strong>[MS-OXRTFEX]</strong> 規格把 HTML 封裝進 RTF
            裡。要還原就得先解壓縮,再處理 <code>\htmltag</code> 與 <code>\htmlrtf</code>{" "}
            控制字進行反封裝。跳過這一步的檢視器,在相當比例的真實 Outlook 郵件上都會顯示
            空白內文。
          </li>
        </ul>

        <h2>內嵌圖片與 cid: 參照</h2>
        <p>
          出現在內文中的圖片,其實是帶有 <code>PidTagAttachContentId</code> 的一般附件,
          HTML 內文再以{" "}
          <code>&lt;img src=&quot;cid:image001.png@01D9…&quot;&gt;</code> 參照它們。
          檢視器必須把每個 <code>cid:</code> 對應回附件並換成可用的網址,否則簽名檔與
          公司 logo 的位置就只會剩下破圖圖示。
        </p>

        <h2>手動讀取那些資料流</h2>
        <p>
          每一個屬性都存在一個名字本身就編碼了「它是什麼」的資料流裡:
          <code>__substg1.0_XXXXYYYY</code>,其中 <code>XXXX</code> 是十六進位的屬性標籤,
          <code>YYYY</code> 是它的型別。所以主旨(標籤 <code>0x0037</code>)以 Unicode
          (<code>0x001F</code>)儲存時,會出現為 <code>__substg1.0_0037001F</code>。
          同一個標籤結尾是 <code>001E</code> 的話,就是同一個欄位的八位元版本。
        </p>
        <p>
          這套命名正是「不用 Outlook 也讀得到 <code>.msg</code>」的全部原因。
          只要有一個 OLE2 函式庫,你就能列舉資料流、查表對照標籤,
          檔案會自己交出結構,過程中不需要任何微軟的程式碼。
        </p>
        <p>
          還有兩個慣例很重要。收件者<strong>不是</strong>存在單一資料流裡的清單 ——
          每一位收件者是一個獨立的<em>子儲存區</em>,叫做
          <code>__recip_version1.0_#00000000</code>、<code>#00000001</code> 以此類推,
          各自帶著自己的一整組屬性流。附件用同樣的模式,放在
          <code>__attach_version1.0_#...</code> 底下。而固定長度的屬性 ——
          布林值、整數、時間戳 —— 根本不是資料流,它們被打包在
          <code>__properties_version1.0</code> 這張表裡。
        </p>

        <h2>字元編碼,以及它是怎麼壞掉的</h2>
        <p>
          以 <code>001F</code> 儲存的屬性是 UTF-16LE,沒有歧義。
          以 <code>001E</code> 儲存的則是某個 code page 下的位元組,而檔案必須告訴你是哪一個:
          <code>PidTagInternetCodepage</code>(<code>0x3FDE</code>),
          或退而求其次的 <code>PidTagMessageCodepage</code>。
        </p>
        <p>
          忽略這些、直接假設 UTF-8 的讀取器,會弄壞每一封用繁體中文、日文、韓文、
          西里爾字母或希臘文寫的郵件 —— 這也是「郵件打得開,但文字全是替代字元」
          最常見的解釋。那封郵件沒有損毀,只是被用錯的對照表解碼了。
        </p>

        <h2>「這是一個 OLE2 檔案」的實際後果</h2>
        <p>
          外層容器是複合檔案這件事有一個值得知道的後果:它是一個小型檔案系統,
          有磁區配置表、目錄樹和可用空間。用文字編輯器編輯 <code>.msg</code>
          不只是把某些文字弄亂 —— 它會**破壞磁區鏈**,而檔案會變成任何工具都救不回來的狀態。
          真的需要檢查一個檔案時,請對副本動手。
        </p>
        <p>
          這也表示同一封郵件存成 <code>.msg</code> 通常比存成 <code>.eml</code> 大,
          有時大得多。它把內文存了不只一次 —— HTML、RTF、純文字都有 ——
          再加上一堆傳輸格式裡根本沒有位置放的 MAPI 記帳資料。
        </p>

        <h2>為什麼其他軟體不支援</h2>
        <p>
          微軟雖然公開了規格,卻從未把它推為交換標準;而且格式中編入了大量 Exchange 專屬
          概念 —— legacy DN、投票按鈕、委派資訊、訊息類別 —— 在標準網際網路郵件中根本沒有
          對應物。要支援它就等於實作一份微軟規格,對競爭者自家格式毫無好處,所以幾乎沒人做。
        </p>
        <p>
          標準的替代方案是純文字的 <code>.eml</code>。可以{" "}
          {L("/msg-vs-eml", "比較兩種格式")},看看轉檔會得到什麼、失去什麼。
        </p>
      </>
    ),
  },

  msgVsEml: {
    title: "eml 和 msg 差異比較:Outlook 郵件該存哪一種?",
    description:
      ".eml 與 .msg 差在哪?一張表看懂:.msg 保留 Exchange 寄件人、旗標、約會等 Outlook 專屬資料,.eml 任何郵件軟體都能開。附存檔建議。",
    faq: [
      {
        q: "Outlook 郵件該存成 .eml 還是 .msg?",
        a: "郵件要在 Outlook 以外開啟(Mac、手機、Gmail、Thunderbird 或歸檔系統)就存 .eml。要當作證據,或是約會、聯絡人、工作項目,就保留 .msg,因為它保留了 .eml 會丟掉的 Outlook 專屬資料。不確定時先留 .msg:之後隨時能轉成 .eml,反過來則會有資料補不回來。",
      },
      {
        q: "長期保存郵件,用 .eml 還是 .msg 比較好?",
        a: "長期保存建議用 .eml。它是公開的純文字標準,任何郵件軟體、歸檔系統或搜尋工具都讀得懂。若郵件可能要當作證據,也一併保留 .msg,因為它有 Exchange 寄件人資訊、旗標與類別,這些 .eml 沒有地方存。",
      },
      {
        q: "Outlook 可以開 .eml 檔嗎?",
        a: "可以。Windows 與 Mac 版 Outlook 都能開啟 .eml:直接點兩下,或拖進 Outlook。大多數其他郵件軟體也能開 .eml,這也是分享時偏好它的主要原因。",
      },
      {
        q: ".msg 轉 .eml 會遺失附件或圖片嗎?",
        a: "不會。附件會以 MIME 區段完整保留,內嵌圖片保有 Content-ID,所以在內文中仍會正常顯示。會遺失的是 Outlook 專屬資料:Exchange 內部位址、旗標、類別與投票狀態。",
      },
      {
        q: "為什麼 .eml 檔比 .msg 小?",
        a: ".msg 常把內文存兩三份(HTML、壓縮 RTF、純文字),再加上 Outlook 的內部紀錄。.eml 每個部分只存一份。郵件內容沒有遺失,少掉的是重複的部分。",
      },
      {
        q: "沒有 Outlook 怎麼把 .msg 轉成 .eml?",
        a: "在 msglens.app 的檢視器開啟 .msg,選「匯出」再選「另存為 .eml」。轉檔在你的瀏覽器裡進行,檔案不會上傳。",
      },
    ],
    body: (
      <>
        <p>
          兩種格式都是把一封郵件存成一個檔案。差別在於 <code>.eml</code> 是公開的網際網路
          標準,而 <code>.msg</code> 是流出到外界的微軟內部實作細節。
        </p>

        <h2>簡短結論:該存哪一種?</h2>
        <ul>
          <li>
            <strong>存成 .eml</strong>:郵件要在 Outlook 以外開啟時,例如 Mac、手機、Gmail、
            Thunderbird 或歸檔系統。
          </li>
          <li>
            <strong>保留 .msg</strong>:檔案要當作證據,或要完整保留 Outlook 項目時。它保留
            Exchange 寄件人資訊、旗標與類別,也是兩者中唯一能存約會、聯絡人和工作的格式。
          </li>
          <li>
            <strong>不確定時</strong>:先留 .msg。之後隨時可以轉成 .eml,反過來則補不回 .eml
            已經丟掉的資訊。
          </li>
        </ul>

        <h2>Outlook 會給你哪一種格式</h2>
        <p>
          很多時候你沒得選。Windows 傳統版 Outlook 不論用「檔案 → 另存新檔」或直接把郵件拖到
          桌面,存出的都是 <code>.msg</code>,沒有 <code>.eml</code> 選項。Mac 版 Outlook
          把郵件拖出來會得到 <code>.eml</code>,新版 Outlook for Windows 與 Outlook 網頁版
          下載郵件時也是存成 <code>.eml</code>。
        </p>

        <h2>一覽表</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>.msg</th>
              <th>.eml</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>擁有者</td>
              <td>微軟(Outlook)</td>
              <td>IETF 標準(RFC 5322 / MIME)</td>
            </tr>
            <tr>
              <td>結構</td>
              <td>二進位 OLE2 複合文件</td>
              <td>純文字 + MIME 分段</td>
            </tr>
            <tr>
              <td>文字編輯器可讀</td>
              <td>否</td>
              <td>是</td>
            </tr>
            <tr>
              <td>Apple Mail / Thunderbird 可開</td>
              <td>否</td>
              <td>是</td>
            </tr>
            <tr>
              <td>可存非郵件項目</td>
              <td>可 —— 聯絡人、約會、工作</td>
              <td>否 —— 僅郵件</td>
            </tr>
            <tr>
              <td>Exchange 專屬資訊</td>
              <td>保留</td>
              <td>遺失</td>
            </tr>
            <tr>
              <td>檔案大小</td>
              <td>較大</td>
              <td>較小</td>
            </tr>
          </tbody>
        </table>

        <h2>.msg 保留了哪些 .eml 做不到的東西</h2>
        <p>
          <code>.msg</code> 是 Outlook 項目的快照,而不是網際網路郵件的快照,所以它保留了
          許多從未走過 SMTP 的資訊:
        </p>
        <ul>
          <li>
            <strong>訊息類別</strong> —— 這個項目究竟是郵件、約會、聯絡人還是工作。
          </li>
          <li>
            <strong>Exchange 位址</strong> —— 內部寄件者與收件者的{" "}
            <code>/O=…/OU=…/CN=…</code> legacy DN,常常是某個內部信箱屬於誰的唯一紀錄。
          </li>
          <li>
            <strong>投票回覆、旗標、分類與後續追蹤狀態。</strong>
          </li>
          <li>
            <strong>草稿</strong> —— 未寄出的郵件根本沒有網際網路標頭,轉檔時遺失的是
            一開始就不存在的路由資訊。
          </li>
        </ul>

        <h2>.eml 的優勢</h2>
        <ul>
          <li>
            <strong>到處都能開</strong>,所有平台的郵件軟體都原生支援,見{L("/open-eml-file", ".eml 檔怎麼開")}。
          </li>
          <li>
            <strong>可以直接 grep</strong>。純文字表示能用一般命令列工具搜尋、比對與處理。
          </li>
          <li>
            <strong>檔案更小</strong>,不需要背負複合文件的額外結構,也不會同時存 RTF 與
            HTML 兩份內文。
          </li>
          <li>
            <strong>更耐久</strong>。有文件、基於文字的標準,在今天的軟體都消失之後仍然
            讀得懂。
          </li>
        </ul>

        <h2>為什麼同一封郵件在兩種格式下大小不同</h2>
        <p>
          轉檔之後檔案通常會變小,有時小一半。那並不是像第一眼看起來的那種資料遺失 ——
          大部分只是重複的部分消失了。
        </p>
        <p>
          一個 <code>.msg</code> 常常把內文存了兩三份:HTML、壓縮 RTF、純文字。
          它還帶著一堆網際網路郵件根本沒有欄位可以放的 MAPI 記帳資料。
          <code>.eml</code> 只保留一棵 MIME 樹,所以那些替代版本會收斂成郵件用戶端真正需要的部分。
        </p>

        <h2>封存或電子證據系統期待的是哪一種</h2>
        <p>
          如果你轉檔的理由是下游有系統要吃這封信,那兩種格式的待遇並不相同:
        </p>
        <ul>
          <li>
            <strong>封存與案件管理系統</strong>幾乎一律接受 <code>.eml</code>,
            因為那是郵件實際傳輸的格式。對 <code>.msg</code> 的支援很常見但不保證,
            而且往往是要另外付費的模組。
          </li>
          <li>
            <strong>全文索引工具</strong>可以直接讀 <code>.eml</code>。
            要索引 <code>.msg</code> 則需要一個懂壓縮 RTF 的解析器 ——
            少了它的索引器會記錄一段空白內文,同時回報「成功」。
          </li>
          <li>
            <strong>長期保存</strong>偏好 <code>.eml</code>,理由很單純:
            那是二十年後用任何編輯器都讀得懂的文字。
            <code>.msg</code> 則需要一個能運作的 OLE2 實作才有任何意義。
          </li>
        </ul>

        <h2>什麼時候該把 .msg 轉成 .eml</h2>
        <p>以下情況建議轉檔:</p>
        <ul>
          <li>要在沒有 Outlook 的 Mac、Linux 或手機上開啟郵件;</li>
          <li>要匯入非微軟的郵件軟體或封存系統;</li>
          <li>要長期保存,並確保未來仍讀得懂;</li>
          <li>要把郵件交給不使用 Outlook 的人。</li>
        </ul>
        <p>
          但若該項目是證物、是約會或聯絡人而非郵件,或 Exchange 內部寄件者資訊很重要時,
          請一併保留原始的 <code>.msg</code>。
        </p>

        <h2>怎麼轉</h2>
        <p>
          在{L("/", "檢視器")}中開啟檔案,選擇<strong>匯出 → 另存為 .eml</strong>。
          轉換在你的瀏覽器內完成,產生的 MIME 郵件會同時包含純文字與 HTML 兩種內文,
          每個附件重新編碼為 base64 分段,內嵌圖片也保留原本的 Content-ID,因此在內文中
          依然顯示得出來。
        </p>
      </>
    ),
  },

  toPdf: {
    title: "如何把 .msg 檔轉成 PDF",
    description:
      "在瀏覽器裡把 Outlook 的 .msg 檔轉成乾淨、可分享的 PDF —— 不需要 Outlook、不上傳、沒有浮水印。",
    steps: [
      {
        name: "開啟郵件",
        text: "把 .msg 檔拖到首頁的檢視器上,它會立即開啟,並在你自己的裝置上完成解析。",
      },
      {
        name: "選擇「列印 / PDF」",
        text: "點郵件工具列上的「列印 / PDF」按鈕。系統會在新視窗開啟一份為列印準備的郵件副本,接著跳出瀏覽器的列印對話框。若沒有反應,請允許本站顯示彈出式視窗。",
      },
      {
        name: "選擇「儲存為 PDF」",
        text: "把目的地設為「儲存為 PDF」(Chrome、Edge),或使用 PDF 選單(Safari、Firefox),然後儲存。",
      },
    ],
    body: (
      <>
        <p>
          PDF 通常是 <code>.msg</code> 檔的最終歸宿:附在工單上、隨案件歸檔、寄給沒有
          Outlook 的人,或存進一個十年後仍讀得懂的地方。在瀏覽器裡完成這件事,就不必把
          往來信件上傳到轉檔服務。
        </p>

        <h2>操作步驟</h2>
        <ol>
          <li>
            開啟{L("/", "檢視器")},把 <code>.msg</code> 檔拖進去。
          </li>
          <li>
            點郵件工具列的<strong>列印 / PDF</strong>。
          </li>
          <li>
            在列印對話框把目的地設為<strong>儲存為 PDF</strong>。
          </li>
          <li>儲存檔案。</li>
        </ol>

        <h2>PDF 會包含什麼</h2>
        <p>
          列印時不會直接印你正在看的頁面,而是另開一份專為列印製作的郵件副本。這樣長信才能
          依需要延展成多頁,而不會被截斷在第一頁。若沒有視窗跳出,請允許本站顯示彈出式視窗
          後再試一次。
        </p>
        <p>輸出結果會:</p>
        <ul>
          <li>在最上方保留完整的標頭區塊 —— 寄件者、收件者、日期與主旨;</li>
          <li>展開完整內文,而不是只截取畫面上捲動區域的那一段;</li>
          <li>列出附件名稱與大小,即使 PDF 無法內嵌附件,紀錄上仍看得出附了什麼;</li>
          <li>在連結文字後面完整印出網址,列印出來後依然可以查證;</li>
          <li>移除網站介面 —— 導覽列、按鈕、提示列與廣告都不會出現在 PDF 中;</li>
          <li>無論你是否使用深色模式,一律以白底深色文字列印。</li>
        </ul>

        <h2>讓成品更乾淨</h2>
        <ul>
          <li>
            <strong>先載入外部圖片</strong>,如果 PDF 需要它們。外部圖片預設被封鎖,
            被封鎖的圖片列印出來會是空白框。
          </li>
          <li>
            <strong>關閉頁首頁尾</strong>,可以拿掉每一頁上瀏覽器加的標題與網址。
          </li>
          <li>
            <strong>開啟背景圖形</strong>,若郵件仰賴彩色表格背景 —— 許多行銷信件少了它
            會變得難以閱讀。
          </li>
        </ul>

        <h2>要一次轉很多封</h2>
        <p>
          一次最多可拖入 50 個檔案,再按郵件清單上方的<strong>全部存成 PDF</strong>。
          所有已開啟的郵件會存進同一個 PDF,每封從新的一頁開始,並保留各自的排版。
          檔案有好幾百個時,請以 50 個為一批分次處理。
        </p>
        <p>
          若需要每封各自一個 PDF,請用 <code>J</code> 與 <code>K</code> 逐封切換,
          並在每封按<strong>列印 / PDF</strong>。
        </p>

        <h2>為什麼直接列印頁面沒有用</h2>
        <p>
          有一個看起來很直覺的做法在這裡行不通,值得說明以免你浪費時間。
          郵件內文是算繪在 iframe 裡的,理由很充分:郵件 HTML 會夾帶全域 CSS,
          不隔離的話會把整個頁面的樣式改掉。但 iframe 的內容
          <strong>無法跨頁分頁</strong> —— 瀏覽器只會列印框內裝得下的部分,其餘裁掉。
        </p>
        <p>
          所以對一封長郵件按 Ctrl+P,你會得到一頁,以及一段被截斷的內文 ——
          而且沒有任何警告告訴你東西少了。「列印 / PDF」按鈕會另外開一份只含這封郵件的文件,
          那一份可以正常分頁。一串長討論會印成八頁,而不是一頁。
        </p>

        <h2>讓這份 PDF 足以作為紀錄</h2>
        <p>
          如果這份 PDF 要進案件檔案、稽核或爭議處理,光有內文通常不夠。
          真正讓它站得住的是周邊那些資訊:
        </p>
        <ul>
          <li>
            <strong>標頭區塊</strong> —— 寄件者、所有收件者(含副本),以及確切的寄送時間。
            少了這些,一段內文證明不了多少事。
          </li>
          <li>
            <strong>附件名稱</strong>,讓紀錄顯示有哪些東西跟著這封信走 ——
            即使 PDF 本身裝不下那些檔案。
          </li>
          <li>
            <strong>原始網際網路標頭</strong>,如果真實性可能會被質疑的話。
            <code>Received</code> 各行、<code>Message-ID</code> 以及 SPF 與 DKIM 的結果,
            才是調查人員會要的東西,而它們不在列印出來的內文裡。
          </li>
        </ul>
        <p>
          同時請保留原始的 <code>.msg</code>。PDF 是一份呈現;原始檔案才是證據,
          而且只有它還帶著標頭與附件。
        </p>

        <h2>如果附件也要保留</h2>
        <p>
          PDF 無法夾帶原始附件。請用附件區的<strong>全部下載</strong>取得 ZIP,與 PDF 放在
          一起。或者把郵件匯出成 {L("/msg-vs-eml", ".eml")},就能把內文與所有附件保存在
          同一個標準檔案裡。
        </p>
      </>
    ),
  },
} as const;
