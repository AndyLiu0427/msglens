import { Breadcrumb, Page, Prose } from "./Page";
import { AdSlot } from "@/components/ads/AdSlot";
import { getDictionary } from "@/lib/i18n";
import { faqSchema } from "@/lib/metadata";
import { SITE, type Locale } from "@/lib/site";

// One date per document: a change to one must not re-date the other.
const PRIVACY_UPDATED = "6 October 2026";
const PRIVACY_UPDATED_ZH = "2026 年 10 月 6 日";
const TERMS_UPDATED = "30 September 2026";
const TERMS_UPDATED_ZH = "2026 年 9 月 30 日";

export function FaqPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <Page locale={locale} path="/faq" schemas={[faqSchema(t.faq.items)]}>
      <Breadcrumb locale={locale} title={t.faq.title} />
      <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink sm:text-[36px]">
        {t.faq.title}
      </h1>

      <AdSlot slot={SITE.adSlots.faqTop} format="leaderboard" label={t.ads.label} className="mt-8" />

      <div className="mt-8 divide-y divide-line rounded-card border border-line bg-surface">
        {t.faq.items.map((item) => (
          <section key={item.q} className="px-5 py-5">
            <h2 className="text-[16px] font-semibold text-ink">{item.q}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{item.a}</p>
          </section>
        ))}
      </div>
    </Page>
  );
}

export function PrivacyPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const isZh = locale === "zh";

  return (
    <Page locale={locale} path="/privacy">
      <Breadcrumb locale={locale} title={t.nav.privacy} />
      <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink sm:text-[36px]">
        {isZh ? "隱私權政策" : "Privacy Policy"}
      </h1>
      <p className="mt-3 text-[13px] text-ink-subtle">
        {isZh ? `最後更新:${PRIVACY_UPDATED_ZH}` : `Last updated: ${PRIVACY_UPDATED}`}
      </p>

      <div className="mt-8">
        <Prose>{isZh ? <PrivacyZh /> : <PrivacyEn />}</Prose>
      </div>
    </Page>
  );
}

export function TermsPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const isZh = locale === "zh";

  return (
    <Page locale={locale} path="/terms">
      <Breadcrumb locale={locale} title={t.nav.terms} />
      <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink sm:text-[36px]">
        {isZh ? "使用條款" : "Terms of Use"}
      </h1>
      <p className="mt-3 text-[13px] text-ink-subtle">
        {isZh ? `最後更新:${TERMS_UPDATED_ZH}` : `Last updated: ${TERMS_UPDATED}`}
      </p>

      <div className="mt-8">
        <Prose>{isZh ? <TermsZh /> : <TermsEn />}</Prose>
      </div>
    </Page>
  );
}

function PrivacyEn() {
  return (
    <>
      <h2>The short version</h2>
      <p>
        {SITE.name} works in two modes, and they have opposite privacy properties. The
        difference is the most important thing on this page, so it comes first.
      </p>
      <p>
        <strong>The viewer, which is what you get without an account, never uploads
        anything.</strong> It parses <code>.msg</code>, <code>.eml</code> and{" "}
        <code>winmail.dat</code> files entirely inside your browser using JavaScript. It has
        no upload endpoint, so we have no technical means of receiving, storing or reading
        those messages — that is a property of how the site is built, not a policy we could
        quietly change.
      </p>
      <p>
        You can verify it: open your browser&apos;s developer tools, switch to the Network
        tab, and open a file. No request carries your data. Or disconnect from the internet
        after the page loads — the viewer keeps working.
      </p>
      <p>
        <strong>The workspace, which requires signing in, does upload — but only the files
        you explicitly save.</strong> That is the whole point of it: a message has to reach
        our servers for a colleague to be able to open it. Opening a file in the viewer never
        saves it. Nothing is stored unless you press Save.
      </p>

      <h2>What we do not collect</h2>
      <ul>
        <li>The contents of any file you open in the viewer without saving it.</li>
        <li>File names or file sizes, anywhere, ever.</li>
        <li>Email addresses, names or any other personal data from messages you only view.</li>
      </ul>
      <p>
        The viewer sends one thing, and it is worth being exact about what: when a file is
        opened, a single event records its format — <code>msg</code>, <code>eml</code>,{" "}
        <code>tnef</code> — and whether it parsed. Not its name, not its size, none of its
        contents. It exists so we know which formats fail, and it is the only request the
        viewer makes.
      </p>
      <p>
        <strong>The file itself still never leaves your tab</strong>, and that is still
        checkable: open the Network tab and open a file. You will see one small event go out
        and no request carrying the file. Turn your connection off and the viewer keeps
        working, because parsing never needed the network.
      </p>

      <h2>What is measured, and where</h2>
      <p>
        Two places, neither of them the viewer.
      </p>
      <p>
        <strong>The pricing page</strong> loads two measurement tools, because it is the one
        page with a question worth asking about it: how many people press a buy button and
        do not finish.
      </p>
      <p>
        <strong>The workspace</strong> reports two things from the server, and only for
        files you chose to save: that a file was saved, and that a saved file was opened.
        Each carries its format, its size and your account id — nothing about the message
        itself, no subject, no sender, no contents. This is a count of actions the server
        already performs on your behalf; it stores these files and serves them back, so
        counting the request sees nothing it did not already see. Nothing is reported for a
        file you only view without saving.
      </p>
      <ul>
        <li>
          <strong>Mixpanel</strong> receives four events: that the page was viewed, that a
          plan button was pressed, and whether the checkout then opened or failed. Each
          carries the plan name and an identifier that is generated fresh for the visit and
          discarded when the tab closes. No email address, no account id, nothing that
          survives the session.
        </li>
        <li>
          <strong>Hotjar</strong> records how the page is used — scrolling, clicks, mouse
          movement. It is scoped to the pricing page for the reason above: it captures the
          screen, and no screen with a message on it will ever have it loaded.
        </li>
      </ul>
      <p>
        Both are third parties with their own policies (
        <a href="https://mixpanel.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
          Mixpanel
        </a>
        ,{" "}
        <a href="https://www.hotjar.com/legal/policies/privacy/" target="_blank" rel="noopener noreferrer">
          Hotjar
        </a>
        ). Blocking them changes nothing about what the site does — the prices, the checkout
        and the viewer all work with both blocked.
      </p>

      <h2>If you sign in and save files</h2>
      <p>
        Signing in uses Google. We receive your Google account identifier, email address,
        display name and profile picture, and we store them so we can show you the right
        workspace and let colleagues see who saved what. We never receive your Google
        password, and we ask for no access to your Gmail, Drive or contacts.
      </p>
      <p>
        We may occasionally email you to ask how MsgLens is working for you. These are
        personal messages, not a newsletter, and they contain no tracking. Reply &quot;no&quot;
        and we will not write again.
      </p>
      <p>When you save a message, we store:</p>
      <ul>
        <li>
          <strong>The file itself</strong>, in Cloudflare R2 object storage, encrypted at
          rest. Only members of the team you saved it to can retrieve it.
        </li>
        <li>
          <strong>Its subject, sender name and address, date and size</strong>, in a
          database, in readable form. This is what makes the list searchable and sortable
          without downloading every file. If that matters to you, the viewer stores none of
          it — use the viewer.
        </li>
        <li>
          <strong>Who saved it and when</strong>, so a team can tell where a file came from.
        </li>
      </ul>
      <p>
        Deleting a file removes both the stored object and its database row. Deleting a
        folder does the same for everything inside it. Neither is recoverable afterwards, and
        we keep no backup copy from which we could restore one.
      </p>
      <p>
        We do not read stored files, do not use them to train anything, and do not share them
        with anyone outside the team they belong to. If you want your account and everything
        in it removed, email{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> from the address you
        signed in with.
      </p>

      <h2>What is stored on your device</h2>
      <p>
        One <code>localStorage</code> entry, <code>theme</code>, records whether you chose
        light or dark mode. It never leaves your browser and you can clear it at any time
        through your browser settings. Opened messages are held in memory only and are gone
        when you close or reload the tab.
      </p>

      <h2>Hosting and server logs</h2>
      <p>
        The site is served as static files from Cloudflare Pages. As with any web server,
        Cloudflare records standard request logs (IP address, user agent, requested URL,
        timestamp) for delivery and abuse prevention. These are subject to{" "}
        <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
          Cloudflare&apos;s privacy policy
        </a>
        . Because the viewer makes no requests while parsing, nothing about the files you
        open appears in those logs.
      </p>

      <h2>Advertising</h2>
      <p>
        This site is free and is funded by advertising served by Google AdSense. Google and
        its partners may use cookies or similar technologies to serve and measure ads, and
        may personalise them based on your prior visits to this and other sites.
      </p>
      <ul>
        <li>
          Google&apos;s use of advertising cookies is described in{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            How Google uses information from sites that use its services
          </a>
          .
        </li>
        <li>
          You can opt out of personalised advertising at{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Ads Settings
          </a>
          , or opt out of third-party vendors&apos; use of cookies at{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>
          .
        </li>
        <li>
          Advertising has no access to the contents of files you open. Message parsing
          happens in an isolated frame that runs no scripts at all, and no message data is
          ever placed in the page&apos;s URL, storage or global state.
        </li>
      </ul>
      <p>
        If you are in the European Economic Area, the United Kingdom or Switzerland,
        a consent message appears before personalised advertising cookies are used.
        You can accept, decline, or open the detailed controls, and you can change
        your choice at any time from that same message. Declining does not restrict
        any part of this site.
      </p>
      <p>
        If you use an ad blocker, the site works normally. Nothing is gated behind ads.
      </p>

      <h2>Remote images in messages</h2>
      <p>
        Images hosted on external servers are blocked by default, because senders routinely
        use them as tracking pixels. If you choose <strong>Load images</strong>, your browser
        requests those images directly from the sender&apos;s server, which reveals your IP
        address and approximate time of reading to that server. That request goes to the
        sender, not to us. The choice is per-message and resets when you open a different
        message.
      </p>

      <h2>Children</h2>
      <p>
        This site is a general-purpose utility and is not directed at children under 13. We
        do not knowingly collect personal information from anyone, including children.
      </p>

      <h2>Your rights</h2>
      <p>
        Because we do not collect personal data, there is generally nothing for us to access,
        correct, export or delete. For advertising data held by Google, use the Google
        controls linked above. If you have a question about this policy, contact us at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the &quot;last updated&quot; date above changes with it.
        Material changes to how the site handles data will be described here rather than
        made silently.
      </p>
    </>
  );
}

function PrivacyZh() {
  return (
    <>
      <h2>簡短版</h2>
      <p>
        {SITE.name} 有兩種模式,而它們的隱私性質是相反的。這個差別是本頁最重要的一件事,
        所以放在最前面。
      </p>
      <p>
        <strong>檢視器 —— 也就是不需要帳號就能用的那個 —— 不會上傳任何東西。</strong>
        它完全在你的瀏覽器中以 JavaScript 解析 <code>.msg</code>、<code>.eml</code> 與{" "}
        <code>winmail.dat</code> 檔案。它沒有上傳端點,因此我們在技術上就無從接收、儲存或
        讀取那些郵件 —— 這是網站架構本身的性質,而不是一條我們可以私下更改的政策。
      </p>
      <p>
        你可以自行驗證:打開瀏覽器開發者工具的「網路」分頁再開啟檔案,不會有任何請求帶著
        你的資料。或是在頁面載入後直接斷網 —— 檢視器照常運作。
      </p>
      <p>
        <strong>工作區 —— 需要登入的那個 —— 會上傳,但只上傳你主動儲存的檔案。</strong>
        這正是它存在的意義:郵件必須到得了我們的伺服器,同事才打得開。在檢視器裡開啟檔案
        永遠不等於儲存它。你沒有按下儲存,就不會有任何東西被存下來。
      </p>

      <h2>我們不會蒐集的資料</h2>
      <ul>
        <li>你在檢視器中開啟、但沒有儲存的任何檔案內容。</li>
        <li>檔名或檔案大小,任何地方、任何時候都不會。</li>
        <li>你僅供閱覽的郵件中的電子郵件地址、姓名或其他個人資料。</li>
      </ul>

            <p>
        檢視器會送出一件事,值得把它講精確:開啟檔案時,一筆事件記錄它的格式 ——
        <code>msg</code>、<code>eml</code>、<code>tnef</code> —— 以及有沒有解析成功。
        不含檔名、不含大小、不含任何內容。它存在的目的是讓我們知道哪些格式會失敗,
        而且那是檢視器唯一發出的請求。
      </p>
      <p>
        <strong>檔案本身仍然不會離開你的分頁</strong>,而這件事仍然可以驗證:打開 Network
        分頁再開一個檔案,你會看到一筆很小的事件送出,以及沒有任何請求夾帶那個檔案。
        把網路關掉,檢視器照常運作,因為解析從來就不需要網路。
      </p>

      <h2>我們測量什麼、在哪裡測量</h2>
      <p>兩個地方,都不是檢視器。</p>
      <p>
        <strong>定價頁</strong>會載入兩個測量工具,因為那是唯一有值得一問的問題的頁面:
        有多少人按了購買按鈕卻沒有完成。
      </p>
      <p>
        <strong>工作區</strong>由伺服器回報兩件事,而且只針對你主動儲存的檔案:檔案被
        儲存了、儲存的檔案被開啟了。每筆帶有格式、大小與你的帳號 id —— 不含郵件本身的
        任何內容,沒有主旨、沒有寄件者、沒有內文。這只是統計伺服器本來就代你執行的動作:
        它儲存這些檔案、也把檔案送回給你,所以統計這個請求並沒有看到它原本看不到的東西。
        只檢視而未儲存的檔案不會產生任何回報。
      </p>
      <ul>
        <li>
          <strong>Mixpanel</strong> 會收到四個事件:頁面被開啟、方案按鈕被按下,以及結帳
          隨後是開啟了還是失敗了。每個事件帶有方案名稱,以及一組每次造訪重新產生、分頁
          關閉即丟棄的識別碼。沒有 email、沒有帳號 id,沒有任何跨造訪留存的東西。
        </li>
        <li>
          <strong>Hotjar</strong> 記錄這頁怎麼被使用 —— 捲動、點擊、滑鼠移動。之所以只用在
          定價頁,理由同上:它會擷取畫面,而任何可能出現郵件內容的畫面都不會載入它。
        </li>
      </ul>
      <p>
        兩者都是第三方,各有自己的政策(
        <a href="https://mixpanel.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
          Mixpanel
        </a>
        、
        <a href="https://www.hotjar.com/legal/policies/privacy/" target="_blank" rel="noopener noreferrer">
          Hotjar
        </a>
        )。把它們擋掉不會改變本站的任何功能 —— 價格、結帳與檢視器在兩者都被擋的情況下
        都正常運作。
      </p>

<h2>如果你登入並儲存檔案</h2>
      <p>
        登入使用 Google。我們會取得你的 Google 帳號識別碼、電子郵件地址、顯示名稱與個人
        頭像,並儲存它們,以便顯示正確的工作區,以及讓同事知道是誰儲存了哪個檔案。我們
        不會取得你的 Google 密碼,也不會要求存取你的 Gmail、雲端硬碟或聯絡人。
      </p>
      <p>
        我們可能偶爾寫信問你使用 MsgLens 的情況。這些是個人寄出的信,不是電子報,也不含任何
        追蹤。回覆「不要」,我們就不會再寫信給你。
      </p>
      <p>當你儲存一封郵件時,我們會存下:</p>
      <ul>
        <li>
          <strong>檔案本身</strong>,存放於 Cloudflare R2 物件儲存,靜態加密。只有你儲存
          到的那個團隊的成員才能取得它。
        </li>
        <li>
          <strong>它的主旨、寄件者姓名與地址、日期與大小</strong>,以可讀形式存在資料庫中。
          這是清單能夠搜尋與排序、而不必把每個檔案都下載回來的原因。如果你在意這一點,
          檢視器完全不會存這些 —— 那就用檢視器。
        </li>
        <li>
          <strong>是誰在什麼時候儲存的</strong>,讓團隊知道檔案的來源。
        </li>
      </ul>
      <p>
        刪除檔案會同時移除儲存的物件與資料庫紀錄。刪除資料夾會對裡面所有內容做同樣的事。
        兩者事後都無法復原,我們也沒有保留任何可以還原它們的備份。
      </p>
      <p>
        我們不會閱讀已儲存的檔案、不會拿它們訓練任何東西,也不會分享給該團隊以外的任何人。
        如果你想刪除帳號與其中所有內容,請用你登入時使用的地址寄信到{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>。
      </p>

      <h2>儲存在你裝置上的資料</h2>
      <p>
        只有一筆 <code>localStorage</code> 紀錄 <code>theme</code>,用來記住你選擇的是
        淺色還是深色模式。它不會離開你的瀏覽器,你也可以隨時透過瀏覽器設定清除。已開啟的
        郵件僅存在於記憶體中,關閉或重新整理分頁後即消失。
      </p>

      <h2>主機與伺服器紀錄</h2>
      <p>
        本站以靜態檔案形式由 Cloudflare Pages 提供。如同任何網頁伺服器,Cloudflare 會為了
        內容傳遞與濫用防範記錄標準請求日誌(IP 位址、瀏覽器識別、請求網址、時間戳記),
        這些資料適用{" "}
        <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
          Cloudflare 的隱私權政策
        </a>
        。由於檢視器在解析過程中不發出任何請求,你開啟的檔案不會出現在這些日誌中。
      </p>

      <h2>廣告</h2>
      <p>
        本站免費提供,營運費用來自 Google AdSense 投放的廣告。Google 及其合作夥伴可能使用
        Cookie 或類似技術來投放與衡量廣告,並可能依你先前造訪本站與其他網站的紀錄提供
        個人化廣告。
      </p>
      <ul>
        <li>
          Google 對廣告 Cookie 的使用方式,說明於
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            《Google 如何使用您在使用我們合作夥伴網站時的資訊》
          </a>
          。
        </li>
        <li>
          你可以在{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google 廣告設定
          </a>
          停用個人化廣告,或在{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>{" "}
          停用第三方供應商的 Cookie。
        </li>
        <li>
          廣告無法存取你所開啟檔案的內容。郵件解析在一個完全不執行任何指令碼的隔離框架中
          進行,郵件資料也絕不會被放進網址、儲存空間或全域狀態。
        </li>
      </ul>
      <p>
        若你位於歐洲經濟區、英國或瑞士,在使用個人化廣告 Cookie 之前會先看到一則同意
        聲明訊息。你可以選擇同意、不同意,或開啟詳細控制選項,而且隨時可以透過同一則
        訊息更改決定。選擇不同意不會限制本站的任何功能。
      </p>
      <p>若你使用廣告封鎖器,本站一樣正常運作,沒有任何功能被鎖在廣告後面。</p>

      <h2>郵件中的外部圖片</h2>
      <p>
        存放在外部伺服器上的圖片預設會被封鎖,因為寄件者經常把這類圖片當成追蹤像素。
        若你選擇<strong>載入圖片</strong>,你的瀏覽器會直接向寄件者的伺服器請求這些圖片,
        因而向該伺服器揭露你的 IP 位址與大致的閱讀時間。這個請求送往的是寄件者,而不是
        我們。這個選擇以單封郵件為單位,切換到其他郵件時會重設。
      </p>

      <h2>兒童</h2>
      <p>
        本站為一般用途工具,並非以未滿 13 歲的兒童為對象。我們不會在知情的情況下蒐集任何人
        (包含兒童)的個人資訊。
      </p>

      <h2>你的權利</h2>
      <p>
        由於我們不蒐集個人資料,通常也就沒有可供存取、更正、匯出或刪除的內容。關於 Google
        持有的廣告資料,請使用上方連結的 Google 控制項。若對本政策有疑問,請來信{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>。
      </p>

      <h2>變更</h2>
      <p>
        本政策如有變更,上方的「最後更新」日期會一併更新。涉及資料處理方式的重大變更會在
        此說明,不會私下進行。
      </p>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <h2>Acceptance</h2>
      <p>
        By using {SITE.name} you agree to these terms. If you do not agree with them, please
        do not use the site.
      </p>

      <h2>What the service is</h2>
      <p>
        {SITE.name} is a free browser-based tool that reads Outlook <code>.msg</code> and
        standard <code>.eml</code> email files and displays their contents. All processing
        happens on your own device. We provide the software; we do not process, store or
        transmit your files.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to use the site to:</p>
      <ul>
        <li>open files you do not have the right to access;</li>
        <li>break any applicable law, or infringe anyone&apos;s privacy or rights;</li>
        <li>
          attempt to disrupt or overload the service, or to circumvent its technical
          limits;
        </li>
        <li>
          redistribute the site as your own service, or remove attribution and advertising
          in a copy of it.
        </li>
      </ul>
      <p>
        You are responsible for the files you open and for holding whatever authorisation
        your jurisdiction or employer requires to view them.
      </p>

      <h2>No warranty</h2>
      <p>
        The service is provided &quot;as is&quot;, without warranty of any kind. Email
        formats are complex and inconsistently produced; while the viewer aims for faithful
        rendering, we do not warrant that every message will display completely or
        correctly, that every attachment will extract, or that the service will be available
        without interruption.
      </p>
      <p>
        <strong>Do not rely on this tool as your only copy of anything.</strong> Keep the
        original files. For legal, regulatory, forensic or evidentiary purposes, verify
        results against the original message in Outlook or with tooling validated for that
        purpose.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we are not liable for any indirect,
        incidental, consequential or special damages, or for any loss of data, revenue or
        profit, arising from your use of or inability to use the service — including
        decisions made on the basis of how a message was displayed.
      </p>

      <h2>Advertising</h2>
      <p>
        The site is funded by third-party advertising. We do not endorse advertised products
        or services and are not responsible for the content of advertisements or of any site
        they link to. See the privacy policy for how advertising data is handled.
      </p>

      <h2>Paid plans and cancellation</h2>
      <p>
        Paid plans are sold by Paddle.com, our merchant of record, which handles payment,
        tax and refunds. You can cancel a monthly or yearly plan at any time from the
        workspace (<strong>Manage billing</strong>), or by writing to{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. Cancelling stops the
        next renewal; you keep access until the end of the period already paid for.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The site&apos;s design, text and code are owned by their respective authors.
        Microsoft, Outlook and Exchange are trademarks of Microsoft Corporation. This site
        is not affiliated with, endorsed by or sponsored by Microsoft.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may change. Continued use after a change constitutes acceptance of the
        revised terms. The &quot;last updated&quot; date above reflects the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        .
      </p>
    </>
  );
}

function TermsZh() {
  return (
    <>
      <h2>條款接受</h2>
      <p>
        使用 {SITE.name} 即表示你同意本使用條款。若你不同意,請勿使用本站。
      </p>

      <h2>服務內容</h2>
      <p>
        {SITE.name} 是一個免費的瀏覽器工具,可讀取 Outlook 的 <code>.msg</code> 與標準的{" "}
        <code>.eml</code> 郵件檔並顯示其內容。所有處理都在你自己的裝置上進行。我們提供的是
        軟體本身,並不處理、儲存或傳輸你的檔案。
      </p>

      <h2>可接受的使用方式</h2>
      <p>你同意不利用本站進行下列行為:</p>
      <ul>
        <li>開啟你無權存取的檔案;</li>
        <li>違反任何適用法律,或侵害他人的隱私與權利;</li>
        <li>試圖干擾或癱瘓本服務,或規避其技術限制;</li>
        <li>將本站重新散布為你自己的服務,或在副本中移除來源標示與廣告。</li>
      </ul>
      <p>
        你必須對自己開啟的檔案負責,並自行確保持有你所在司法管轄區或所屬機構所要求的
        檢視授權。
      </p>

      <h2>免責聲明</h2>
      <p>
        本服務以「現狀」提供,不附帶任何形式的擔保。郵件格式相當複雜,各家軟體的產出也
        並不一致;雖然本檢視器以忠實還原為目標,我們仍無法保證每封郵件都能完整或正確顯示、
        每個附件都能成功取出,或服務永不中斷。
      </p>
      <p>
        <strong>請勿把本工具當成任何資料的唯一副本。</strong>請保留原始檔案。
        用於法律、法遵、數位鑑識或證據用途時,請以 Outlook 中的原始郵件,或以經過該用途
        驗證的工具核對結果。
      </p>

      <h2>責任限制</h2>
      <p>
        在法律允許的最大範圍內,對於因使用或無法使用本服務而產生的任何間接、附帶、衍生或
        特殊損害,或任何資料、營收或利潤的損失 —— 包含基於郵件顯示結果所做的決策 ——
        我們概不負責。
      </p>

      <h2>廣告</h2>
      <p>
        本站營運費用來自第三方廣告。我們不為廣告中的商品或服務背書,亦不對廣告內容或其
        連往的網站負責。廣告資料的處理方式請參閱隱私權政策。
      </p>

      <h2>付費方案與取消</h2>
      <p>
        付費方案由我們的代理商 Paddle.com 銷售,並由其處理付款、稅務與退款。月繳或年繳方案可隨時在
        工作區(<strong>管理訂閱</strong>)取消,或寄信至{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>。取消後將不再續訂,
        已付費期間結束前仍可繼續使用。
      </p>

      <h2>智慧財產權</h2>
      <p>
        本站的設計、文字與程式碼由其各自作者擁有。Microsoft、Outlook 與 Exchange 為
        Microsoft Corporation 的商標。本站與 Microsoft 並無隸屬關係,亦未獲其背書或贊助。
      </p>

      <h2>條款變更</h2>
      <p>
        本條款可能變更。變更後繼續使用即視為接受修訂後的條款。上方的「最後更新」日期代表
        目前版本。
      </p>

      <h2>聯絡方式</h2>
      <p>
        關於本條款的問題,請來信{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>。
      </p>
    </>
  );
}
