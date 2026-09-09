import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "zh")}>{children}</Link>
);

export const zhGuides2 = {
  toEml: {
    title: ".msg 轉 .eml 怎麼做?",
    description:
      "在瀏覽器中把 Outlook 的 .msg 轉成標準 .eml 格式 —— 不上傳、免安裝。哪些資訊會保留、哪些會遺失,以及什麼時候該留著原檔。",
    intro:
      "轉成 .eml 是讓 Outlook 郵件能在其他地方被讀取的做法。.eml 是純文字的 RFC 822 格式,Apple Mail、Thunderbird、Windows 郵件與 Gmail 全都原生支援;而 .msg 是只有微軟看得懂的二進位格式。",
    steps: [
      {
        name: "開啟 .msg 檔",
        text: "把檔案拖到本站的檢視器上。解析在你的瀏覽器內完成,檔案不會被上傳到任何地方。",
      },
      {
        name: "選擇「匯出 → 另存為 .eml」",
        text: "轉出的檔案會立即下載。轉換在本機執行,所以離線也能用。",
      },
      {
        name: "用任何郵件軟體開啟",
        text: "點兩下下載的檔案,Apple Mail、Thunderbird 與 Windows 郵件都能直接開啟,之後可拖進信箱保存。",
      },
    ],
    body: (
      <>
        <h2>為什麼需要轉檔</h2>
        <p>
          <code>.msg</code> 是 Outlook 自己的容器格式,微軟生態系以外沒有東西讀得懂。
          <code>.eml</code> 則是郵件在網路上實際傳輸的格式,轉檔等於把一個只有 Outlook 開得了
          的檔案,變成所有郵件軟體、封存系統與電子證據工具都接受的檔案。
        </p>
        <p>以下情況建議轉檔:</p>
        <ul>
          <li>要在 Mac、Linux 或手機上閱讀;</li>
          <li>要匯入非微軟的郵件軟體或封存系統;</li>
          <li>要交給不使用 Outlook 的人;</li>
          <li>要長期保存,確保十年後仍打得開。</li>
        </ul>

        <h2>操作方式</h2>
        <ol>
          <li>
            開啟{L("/", "檢視器")},把 <code>.msg</code> 檔拖進去。
          </li>
          <li>
            選擇<strong>匯出 → 另存為 .eml</strong>。
          </li>
          <li>點兩下下載的檔案。</li>
        </ol>
        <p>一次最多可拖入 50 個檔案,再從清單逐一匯出。</p>

        <h2>轉出的檔案包含什麼</h2>
        <p>
          匯出的 <code>.eml</code> 是一份符合規格的 MIME 郵件,內含:
        </p>
        <ul>
          <li>寄件者、收件者、副本與原始寄出時間;</li>
          <li>
            <strong>同時含</strong>純文字與 HTML 兩種內文,讓偏好任一種的軟體都能正確顯示;
          </li>
          <li>所有附件,重新編碼為 base64 的 MIME 分段;</li>
          <li>
            內嵌圖片保留原本的 <code>Content-ID</code>,所以簽名檔與 logo 仍會顯示在內文中,
            而不會變成散落的附件。
          </li>
        </ul>

        <h2>轉檔會遺失什麼</h2>
        <p>
          在刪掉原檔之前值得先知道這件事。<code>.eml</code> 描述的是一封網際網路郵件,
          <code>.msg</code> 描述的是一個 Outlook 項目,後者多知道的那些資訊沒有地方可以放:
        </p>
        <ul>
          <li>
            <strong>Exchange 內部位址。</strong>內部寄件者的{" "}
            <code>/O=…/OU=…/CN=…</code> legacy DN —— 有時那是某個內部信箱屬於誰的唯一紀錄。
          </li>
          <li>
            <strong>項目類型。</strong>約會、聯絡人或工作轉成 <code>.eml</code> 後,
            會變成一封普通郵件。
          </li>
          <li>
            <strong>投票回覆、旗標、分類與後續追蹤狀態。</strong>
          </li>
          <li>
            <strong>草稿的路由資訊</strong> —— 未寄出的郵件本來就沒有網際網路標頭。
          </li>
        </ul>
        <p>
          若該項目是證物、不是一般郵件,或 Exchange 內部細節很重要,請保留原始的{" "}
          <code>.msg</code>。詳見{L("/msg-vs-eml", "格式完整比較")}。
        </p>

        <h2>不會上傳任何東西</h2>
        <p>
          轉換完全在你的瀏覽器中進行,沒有伺服器參與。這一點很重要,因為會拿來轉檔的幾乎
          都是商務往來信件。你可以在瀏覽器的「網路」分頁驗證,或是等頁面載入後直接斷網 ——
          匯出照樣可以完成。
        </p>

        <h2>轉完之後的標頭區塊長什麼樣</h2>
        <p>
          轉出來的檔案是一份真正的 RFC 822 郵件,所以到哪裡都打得開 ——
          但值得知道哪些是真的被重建了、哪些不是。
        </p>
        <p>
          <strong>會重建:</strong>From、To、Cc、Subject、Date、MIME-Version,
          以及一個承載各種內文版本與每一個附件的 multipart 結構;
          每個附件都帶著自己的 Content-Type,內嵌圖片還會帶 Content-ID,
          所以 <code>cid:</code> 參照仍然解得開。
        </p>
        <p>
          <strong>不會重建:</strong>原始的 <code>Received</code> 鏈。
          那幾行記錄了郵件實際經過哪些伺服器,而從 Outlook 存出來的 <code>.msg</code>
          可能根本沒有保留它們。沒有的東西無法被憑空生出來 ——
          所以如果你需要傳遞路徑、SPF 或 DKIM 的證據,請保留原始檔案並直接讀它的原始標頭。
        </p>

        <h2>反過來轉呢?</h2>
        <p>
          本站不提供 <code>.eml</code> 轉回 <code>.msg</code>,而且你通常也不需要:Outlook
          原生就能開啟 <code>.eml</code>,沒有什麼要修的。點兩下 <code>.eml</code>,
          Outlook 就會顯示它。
        </p>
      </>
    ),
  },

  windows: {
    title: "Windows 10 / 11 怎麼開啟 .msg 檔?",
    description:
      "沒有 Outlook 的 Windows 沒有內建 .msg 處理程式。有 Outlook、沒有 Outlook 的做法,以及被錯誤程式開啟時如何修正檔案關聯。",
    intro:
      "在 Windows 上,.msg 算是原生地盤 —— 但前提是裝了 Outlook。沒裝的話,Windows 完全不知道這是什麼;就算裝了,檔案關聯也很容易被別的程式搶走。",
    steps: [
      {
        name: "有 Outlook:點兩下",
        text: "若已安裝 Outlook 且檔案關聯正確,點兩下就會直接開啟郵件。",
      },
      {
        name: "沒有 Outlook:用瀏覽器",
        text: "把檔案拖到本站的檢視器上。免安裝、不需系統管理員權限 —— 在受管制的公司電腦上特別有用。",
      },
      {
        name: "被錯誤程式開啟:修正關聯",
        text: "在檔案上按右鍵 → 開啟檔案 → 選擇其他應用程式 → 指定 Outlook,並勾選「一律使用此應用程式」。",
      },
    ],
    body: (
      <>
        <h2>已安裝 Outlook 的情況</h2>
        <p>
          點兩下應該就能開。開不了的話,通常是檔案關聯被別的程式搶走了 ——
          常見的是文字編輯器,或後來安裝的某個不相干軟體。
        </p>
        <ol>
          <li>
            在 <code>.msg</code> 檔上按右鍵。
          </li>
          <li>
            選<strong>開啟檔案</strong> → <strong>選擇其他應用程式</strong>。
          </li>
          <li>
            指定 <strong>Outlook</strong>。若清單中沒有,選
            <strong>在這部電腦上尋找其他應用程式</strong>,瀏覽到 Program Files 底下的{" "}
            <code>OUTLOOK.EXE</code>。
          </li>
          <li>
            勾選<strong>一律使用此應用程式開啟 .msg 檔案</strong>。
          </li>
        </ol>
        <p>
          Windows 11 也可以在<strong>設定 → 應用程式 → 預設應用程式</strong>中搜尋{" "}
          <code>.msg</code> 檔案類型來設定。
        </p>

        <h2>沒有 Outlook 的情況</h2>
        <p>
          Windows 本身沒有內建處理程式。「郵件」App、記事本、WordPad 與 Word 都不支援這個
          格式,而且微軟也沒有提供免費的擴充套件 —— Outlook 屬於付費的 Office 或
          Microsoft 365 授權。
        </p>
        <p>
          實務上的答案是用瀏覽器開。前往{L("/", "檢視器")},把檔案拖進去,郵件就會連同排版、
          內嵌圖片與附件一起顯示。不需安裝、不會上傳,因此在無法安裝軟體、也沒有系統管理員
          權限執行安裝程式的公司電腦上一樣能用。
        </p>

        <h2>為什麼網頁版 Outlook 幫不上忙</h2>
        <p>
          光有 Microsoft 365 訂閱是不夠的:
          <strong>outlook.office.com 無法開啟 <code>.msg</code> 檔</strong>。把檔案寄給
          自己也沒用 —— 到了信箱還是那個網頁版無法呈現的附件。你需要的是桌面版應用程式。
        </p>

        <h2>不想為了一封信開啟整個 Outlook</h2>
        <p>
          就算裝了 Outlook,也有理由避開它:點兩下 <code>.msg</code> 會啟動整個應用程式,
          速度慢;而在一台登入別人信箱的電腦上,你可能根本不想打開它。用瀏覽器讀取可以
          同時避開這兩件事。
        </p>

        <h2>Windows 上常見的問題</h2>
        <ul>
          <li>
            <strong>檔案被記事本開啟、顯示亂碼。</strong>
            關聯指向了文字編輯器。用上面的步驟修正即可 —— 檔案本身沒問題。
          </li>
          <li>
            <strong>Windows 隱藏副檔名。</strong>在檔案總管開啟
            <strong>檢視 → 顯示 → 副檔名</strong>,才能確認檔案是不是真的 <code>.msg</code>。
          </li>
          <li>
            <strong>檔案是從 ZIP 裡開的,結果打不開。</strong>
            請先正確解壓縮;有些程式是從暫存位置開啟壓縮檔「裡面」的檔案,而那個位置會在
            讀取中途被清掉。
          </li>
          <li>
            <strong>檔案被封鎖的警告。</strong>從網路下載的檔案會被標記。按右鍵 →
            <strong>內容</strong> → 勾選<strong>解除封鎖</strong>。
          </li>
        </ul>
        <p>
          若檔案打得開但畫面不對 —— 內文空白、圖片消失、中文亂碼 ——
          {L("/msg-file-wont-open", "疑難排解教學")}會逐一對應症狀。
        </p>
      </>
    ),
  },

  gmail: {
    title: "Gmail 怎麼開啟 .msg 附件?",
    description:
      "Gmail 無法開啟 .msg 附件。原因是什麼,以及兩種可靠的閱讀方式 —— 包含轉成 Gmail 顯示得出來的格式。",
    intro:
      "有人在 Gmail 裡轉寄一個 .msg 附件給你,點下去卻只跳出下載,或顯示「無法預覽」。Gmail 不支援 .msg,而且不會支援。以下是替代做法。",
    steps: [
      {
        name: "下載附件",
        text: "在 Gmail 的附件上點下載圖示,檔案會存到下載資料夾。",
      },
      {
        name: "在檢視器中開啟",
        text: "前往本站的檢視器,把下載的檔案拖進去,直接在瀏覽器中閱讀 —— 反正你本來就在切分頁。",
      },
      {
        name: "(選用)轉成 .eml",
        text: "選「匯出 → 另存為 .eml」,就能得到一個轉寄給別人也開得了的檔案。",
      },
    ],
    body: (
      <>
        <h2>為什麼 Gmail 無法預覽 .msg</h2>
        <p>
          Gmail 只能預覽它看得懂的格式 —— PDF、Office 文件、圖片 —— 靠的是 Google 自己的
          轉換器。<code>.msg</code> 是 Outlook 專屬的二進位容器,不是文件格式,Google 從未
          實作過支援。所以你只會看到「無法預覽」與一個下載按鈕。
        </p>
        <p>把檔案上傳到 Google 雲端硬碟也一樣沒用,原因相同:存得下,但無法呈現。</p>

        <h2>最快的做法</h2>
        <ol>
          <li>從 Gmail 下載附件。</li>
          <li>
            在另一個分頁開啟{L("/", "檢視器")}。
          </li>
          <li>把檔案拖進去。</li>
        </ol>
        <p>
          郵件會連同排版、內嵌圖片與附件完整開啟。檔案在瀏覽器內解析,不會上傳到我們這裡 ——
          當這封信是寄到公司信箱時,這一點值得留意。
        </p>

        <h2>如果你需要它回到 Gmail 裡</h2>
        <p>
          Gmail 可以顯示 <code>.eml</code> 附件,所以轉檔能真正解決問題:
        </p>
        <ol>
          <li>
            在檢視器中開啟 <code>.msg</code> 檔。
          </li>
          <li>
            選擇<strong>匯出 → 另存為 .eml</strong>。
          </li>
          <li>
            改成把 <code>.eml</code> 附加到 Gmail 郵件中。
          </li>
        </ol>
        <p>
          收件者就能直接開啟。{L("/msg-to-eml", "轉檔教學")}說明了哪些資訊會保留、哪些會遺失。
        </p>

        <h2>要轉寄 .msg 給別人時</h2>
        <p>
          如果你原封不動轉寄 <code>.msg</code>,對方除非有 Outlook,否則會撞上完全一樣的牆。
          先轉成 <code>.eml</code> 是比較體貼的做法 —— 幾乎所有人都能原生開啟,包含用手機
          看信的人。
        </p>

        <h2>Gmail 在過程中對檔案做了什麼</h2>
        <p>
          在怪罪檢視器之前值得先知道:Gmail 不會修改 <code>.msg</code> 附件,
          但它的介面會讓你覺得好像有東西被動過。
        </p>
        <ul>
          <li>
            <strong>預覽窗格打不開它</strong>,所以 Gmail 退回顯示一個通用檔案圖示。
            那不代表檔案損壞 —— Gmail 根本沒有 <code>.msg</code> 的算繪器。
          </li>
          <li>
            <strong>一次下載多個附件會拿到 ZIP。</strong>裡面的 <code>.msg</code> 是完整的,
            但你必須先解壓縮;直接從壓縮檔檢視器裡開啟往往會失敗。
          </li>
          <li>
            <strong>Gmail 可能改掉檔名。</strong>重複的名稱會被加上 <code>(1)</code>,
            某些主旨產生的檔名會被作業系統截斷。內容不受影響 ——
            格式是靠位元組辨識的,不是靠副檔名。
          </li>
        </ul>

        <h2>附件裡面還有附件的情況</h2>
        <p>
          轉寄的 Outlook 郵件經常在裡面又夾著其他郵件。Gmail 只會顯示最外層那個檔案,
          所以一整串被打包轉寄的討論串,看起來就只是一個附件。
        </p>
        <p>
          用支援內嵌郵件的檢視器開啟,才會看到其餘的部分。
          當你真正需要的是最裡面那一封時 —— 一份被轉寄的核准、一封客訴的原始信 ——
          這件事就特別重要,而 Gmail 永遠不會主動把它顯示出來。
        </p>

        <h2>為什麼一開始會收到 .msg</h2>
        <p>
          通常是因為寄件者把郵件從 Outlook 拖到桌面,或用了<strong>檔案 → 另存新檔</strong>,
          而後者預設就是產生 <code>.msg</code>。Outlook 自己的
          <strong>以附件方式轉寄</strong>也是用這個格式夾帶郵件。這些都不是刻意為之 ——
          多數寄件者根本不知道這個檔案在 Outlook 之外讀不了。
        </p>
      </>
    ),
  },
} as const;
