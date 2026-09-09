import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "zh")}>{children}</Link>
);

/** 第一手技術內容的中文版。見 en-technical.tsx 的說明。 */
export const zhTechnical = {
  rtfBody: {
    title: "為什麼大多數 Outlook 郵件裡根本沒有 HTML",
    description:
      "以 20 封真實商務 .msg 實測:其中 17 封的內文只存在壓縮 RTF 裡。這代表什麼、Outlook 為何這樣做,以及多數檢視器在哪裡壞掉。",
    intro:
      "如果你打開一個 .msg 檔、預期在裡面找到 HTML,多數時候你找不到。Outlook 會把內文存在最多三個不同的地方,而大家第一個去找的那個通常是空的。這是 .msg 檢視器顯示空白頁最主要的原因。",
    body: (
      <>
        <h2>那個數字</h2>
        <p>
          我們拿 20 封真實的商務 <code>.msg</code> 來實測 —— 錄取通知、發票、報價單、
          轉寄的討論串,一個實際在用的信箱裡會有的東西 ——
          結果<strong>其中 17 封完全沒有 HTML 內文</strong>,排版過的訊息只以壓縮 RTF 的形式存在。
        </p>
        <p>
          那是 85%。一個只讀 <code>PidTagHtml</code>、找不到就放棄的檢視器,
          在每五個檔案裡會有超過四個顯示空白頁。這不是邊緣案例,這是常態 ——
          也是為什麼那麼多 <code>.msg</code> 工具用測試郵件跑起來完美,一碰到真實郵件就像壞掉。
        </p>
        <p>
          這個數字值得精確地講出來,因為它幾乎從來沒有被講過。
          多數文件只把三個內文屬性並列為「選項」,卻沒說你實際上會遇到哪一個。
        </p>

        <h2>內文可能存在的三個地方</h2>
        <p>
          <code>.msg</code> 檔本身是一個 Compound File Binary 容器 ——
          跟 Office 早年 <code>.doc</code>、<code>.xls</code> 用的 OLE2 結構相同 ——
          裡面把 MAPI 屬性存成一個個獨立的內部資料流。內文可能出現在其中三個:
        </p>
        <ul>
          <li>
            <strong><code>PidTagHtml</code></strong>(0x1013)—— HTML 內文的原始位元組。
            大家都讀這個。它經常不存在。
          </li>
          <li>
            <strong><code>PidTagRtfCompressed</code></strong>(0x1009)—— 壓縮過的 RTF 內文。
            幾乎每一封有任何排版的郵件都有。
          </li>
          <li>
            <strong><code>PidTagBody</code></strong>(0x1000)—— 純文字。幾乎一定有,
            也幾乎一定不夠用:表格塌掉、強調消失,引用的回覆串變成一整片沒有層次的文字。
          </li>
        </ul>
        <p>
          正確的後備順序是:HTML → 把 RTF 反封裝回 HTML → 純文字。
          跳過中間那一步,就是丟掉 85% 的還原度。
        </p>

        <h2>「壓縮 RTF」實際上是什麼</h2>
        <p>
          那個壓縮不是 gzip 也不是 deflate,而是微軟自己的 LZ77 變體,規格是{" "}
          <strong>MS-OXRTFCP</strong>。它最不尋常的地方是:壓縮視窗一開始就預載了一段
          207 位元組的字典,裡面是常見的 RTF 控制字,例如 <code>{"\\viewkind"}</code>、
          <code>{"\\par"}</code>、<code>{"\\pard"}</code>。
        </p>
        <p>
          因為那些 token 在你的郵件第一個位元組被讀到之前就已經在視窗裡了,
          一份很短的 RTF 文件能壓得比通用演算法好得多。
          但這也表示你**沒辦法用任何標準工具解開它** —— 少了那份確切的字典,
          資料流開頭的回頭參照會指向不存在的位置。
        </p>
        <p>
          這個資料流也可能是未壓縮的,由標頭裡的魔術值 <code>MELA</code>(而非{" "}
          <code>LZFu</code>)標示。無條件假設「一定有壓縮」的讀取器會在這種檔案上失敗。
        </p>

        <h2>會讓人意外的部分:RTF 裡面包著 HTML</h2>
        <p>
          當 Outlook 寄出一封 HTML 郵件時,它<strong>不會</strong>把 HTML 丟掉再用 RTF 重寫一次,
          而是把它<em>包起來</em>。RTF 資料流裡帶著原本的 HTML,並加上標記,
          讓 RTF 讀取器和 HTML 讀取器各自看到自己需要的東西。
          這個機制叫 <strong>MS-OXRTFEX</strong>,靠三個裝置運作:
        </p>
        <ul>
          <li>
            標頭裡的 <code>{"\\fromhtml1"}</code>,宣告這份 RTF 是被封裝的 HTML,
            而不是原生的 RTF。
          </li>
          <li>
            <code>{"{\\*\\htmltag<N> ... }"}</code> 目的地,每一個裡面逐字保存了
            原始 HTML 的一個片段。那個數字編碼了片段的種類。
          </li>
          <li>
            <code>{"\\htmlrtf"}</code> / <code>{"\\htmlrtf0"}</code> 開關,
            用來框住「只為了讓 RTF 讀取器看到合理東西」而存在的 RTF。
            HTML 反封裝器必須忽略這兩者之間的一切。
          </li>
        </ul>
        <p>
          要把 HTML 重組回來,得走過整份 RTF,輸出 <code>htmltag</code> 目的地的內容、
          遵守那些開關,並解開字元跳脫 —— <code>{"\\'hh"}</code> 是宣告 code page 裡的一個位元組,
          <code>{"\\uN"}</code> 是一個 Unicode 碼位、後面跟著 <code>N</code> 個要跳過的
          後備字元。跳過的數量算錯,每一封非拉丁文郵件都會塞滿雜字。
        </p>

        <h2>一個值得知道的陷阱</h2>
        <p>
          在 HTML 反封裝中,一個單獨的 <code>{"\\par"}</code> 屬於 RTF 那一側的排版。
          真正的段落結構已經在 <code>htmltag</code> 目的地所攜帶的 <code>&lt;p&gt;</code>{" "}
          標籤裡了,所以為 <code>{"\\par"}</code> 輸出一個換行只會造成重複。正確做法是丟掉它。
        </p>
        <p>
          但在 <code>{"\\*\\htmltag"}</code> 目的地<strong>裡面</strong>,它的意思正好相反 ——
          那裡它編碼的是原始 HTML 原始碼中真實存在的一個換行,
          Outlook 會寫成 <code>{"{\\*\\htmltag4 \\par }"}</code>。
          HTML 會把那個換行摺疊成一個空格。丟掉它,相鄰的兩個詞就會黏在一起。
        </p>
        <p>
          症狀一看就認得出來:一句話變成 <em>「the prevailing9% GST」</em>,
          而原文在 <em>prevailing</em> 和 <em>9%</em> 之間有一個換行。
          同一個控制字,兩種規則,由上下文決定。
        </p>

        <h2>還原度問題的另外一半</h2>
        <p>
          把 HTML 取回來還不算完。Outlook 把排版寫在 <code>&lt;head&gt;</code> 裡的一個{" "}
          <code>&lt;style&gt;</code> 區塊,而不是寫成每個元素上的 inline{" "}
          <code>style</code> 屬性。
        </p>
        <p>
          任何一個在消毒郵件之後只保留 <code>&lt;body&gt;</code> 片段的檢視器 ——
          而那正是大多數 HTML 消毒工具的預設行為,包含 DOMPurify ——
          都會靜靜地把那份樣式表丟掉。文字會留下來;表格框線、字型、顏色與間距不會。
          在真實郵件上,這就是「一張排版好的報價表」和「一串沒有格式的數字」的差別。
        </p>
        <p>
          這是一種安靜的失敗。沒有錯誤、文字也沒有少,結果看起來合理 ——
          直到你把它跟 Outlook 並排比較。
        </p>

        <h2>怎麼檢查你自己的檔案</h2>
        <p>
          <code>.msg</code> 是複合檔案,所以任何 OLE2 瀏覽工具都能列出它的資料流。
          內文屬性會顯示為 <code>__substg1.0_1013</code>(HTML)、
          <code>__substg1.0_1009</code>(壓縮 RTF)與 <code>__substg1.0_1000</code>(純文字),
          後面接一個表示資料型別的後綴。
        </p>
        <p>
          如果 <code>1013</code> 不存在而 <code>1009</code> 存在,你手上的就是那 85% 之一;
          任何能正確顯示這封郵件的工具,都做了上面描述的那些 RTF 工作。
        </p>

        <h2>挑選檢視器時這代表什麼</h2>
        <p>有兩個問題可以分辨「能處理真實郵件的工具」和「只能處理測試郵件的工具」:</p>
        <ul>
          <li>
            <strong>它會不會反封裝壓縮 RTF?</strong>
            打開一封你確定有排版的郵件。如果內文是空白或純文字,它不會。
          </li>
          <li>
            <strong>它會不會保留郵件自己的樣式表?</strong>
            打開一封有表格的。如果框線不見了,它把 <code>&lt;head&gt;&lt;style&gt;</code> 丟掉了。
          </li>
        </ul>
        <p>
          兩件事用你手邊已經有的檔案,大約三十秒就能驗證。
          {L("/", "本站的檢視器")}兩件都做,那也是它當初被寫出來的原因 ——
          {L("/what-is-a-msg-file", ".msg 檔是什麼")}更詳細地說明了容器格式,
          而{L("/msg-file-wont-open", "打不開的排查指南")}處理的是那些跟內文無關的失敗。
        </p>
      </>
    ),
  },
} as const;
