import { Breadcrumb, Page, Prose } from "./Page";
import { getDictionary } from "@/lib/i18n";
import { aboutSchema, breadcrumbSchema, contactSchema } from "@/lib/metadata";
import { localizedPath, SITE, type Locale } from "@/lib/site";
import Link from "next/link";

/**
 * About and Contact.
 *
 * Both exist because a site carrying ads is expected to say plainly who runs
 * it and how to reach them — AdSense names these two pages specifically — and
 * because a tool that asks you to open confidential mail in it should be
 * willing to explain how it works and what it does not do.
 *
 * Written to be checkable rather than reassuring: every claim here is one a
 * reader can verify from their own browser.
 */

const L = (path: string, locale: Locale, children: React.ReactNode) => (
  <Link href={localizedPath(path, locale)}>{children}</Link>
);

export function AboutPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <Page
      locale={locale}
      path="/about"
      schemas={[
        breadcrumbSchema(locale, [
          { name: t.nav.viewer, path: "/" },
          { name: t.nav.about, path: "/about" },
        ]),
        aboutSchema(locale, t.seo.about),
      ]}
    >
      <Breadcrumb locale={locale} title={t.nav.about} />
      <h1 className="mb-5 text-[32px] leading-tight font-semibold tracking-tight text-ink">
        {t.nav.about}
      </h1>
      <Prose>{locale === "zh" ? <AboutZh /> : <AboutEn />}</Prose>
    </Page>
  );
}

export function ContactPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <Page
      locale={locale}
      path="/contact"
      schemas={[
        breadcrumbSchema(locale, [
          { name: t.nav.viewer, path: "/" },
          { name: t.nav.contact, path: "/contact" },
        ]),
        contactSchema(locale, t.seo.contact),
      ]}
    >
      <Breadcrumb locale={locale} title={t.nav.contact} />
      <h1 className="mb-5 text-[32px] leading-tight font-semibold tracking-tight text-ink">
        {t.nav.contact}
      </h1>
      <Prose>{locale === "zh" ? <ContactZh /> : <ContactEn />}</Prose>
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function AboutEn() {
  return (
    <>
      <h2>What this is</h2>
      <p>
        {SITE.name} opens Outlook <code>.msg</code> files, standard{" "}
        <code>.eml</code> files and <code>winmail.dat</code> (TNEF) attachments in a browser,
        without Outlook and without installing anything. It reads the message the way Outlook
        would: formatted body, inline images, attachments, and the raw internet headers.
      </p>

      <h2>Why it exists</h2>
      <p>
        <code>.msg</code> is a Microsoft-only container format, so a file that arrives from a
        colleague on Windows is unopenable on a Mac, a phone, or in Gmail. The tools that
        already answered this either upload your file to a server you know nothing about, or
        show the message body and nothing else.
      </p>
      <p>
        Business email is a bad thing to post to an unknown server. So this was built the
        other way round: the parsing runs in your browser, and there is no upload endpoint for
        it to be posted to.
      </p>

      <h2>How it works, and how to check</h2>
      <p>
        The viewer has no server side. Your file is read by JavaScript in your own tab, and
        you can verify that in two ways that do not require trusting this page:
      </p>
      <ul>
        <li>Open your browser&apos;s developer tools, switch to the Network tab, and open a file. One small event goes out recording the file&apos;s format and whether it parsed; no request carries the file.</li>
        <li>Disconnect from the internet after the page has loaded, then open a file. It still works.</li>
      </ul>
      <p>
        There is one exception and it is opt-in: if you sign in and choose{" "}
        <strong>Save to workspace</strong>, that file is uploaded so your colleagues can open
        it. Opening a message never saves it. The{" "}
        {L("/privacy", "en", "privacy policy")} sets out exactly what is stored in that case.
      </p>

      <h2>What it does not do</h2>
      <p>Worth being explicit about, because the gaps are not obvious from the outside:</p>
      <ul>
        <li>
          It cannot decrypt S/MIME-encrypted messages. That needs the recipient&apos;s private
          certificate, which a browser has no access to. Signed messages read normally.
        </li>
        <li>
          It does not connect to a mailbox. It reads files you already have; it is not a mail
          client and has no access to any account.
        </li>
        <li>
          It cannot recover a recipient list from a <code>winmail.dat</code>, because that
          information was never in the file — see{" "}
          {L("/open-winmail-dat", "en", "the winmail.dat guide")}.
        </li>
      </ul>

      <h2>Who runs it</h2>
      <p>
        {SITE.name} is built and maintained by <strong>Andy Liu</strong>, working
        independently under the name <strong>{SITE.operator}</strong>. It is not a company,
        and it is not affiliated with, endorsed by or sponsored by Microsoft in any way.
        Microsoft, Outlook and Exchange are trademarks of Microsoft Corporation.
      </p>
      <p>
        Payments are handled by <strong>Paddle</strong>, who are the merchant of record and
        the seller on your receipt. Receipts and refund notices come from{" "}
        <strong>{SITE.operator}</strong>; a card statement shows{" "}
        <strong>{SITE.statementDescriptor}</strong>, which is the same name with the space
        and the lower case removed — card networks allow ten characters. Worth knowing before
        an unfamiliar line on a statement sends anyone to their bank.
      </p>
      <p>
        One person reads the mail, writes the guides and fixes the bugs. That is worth knowing
        both ways: a reply takes a few days rather than an hour, and there is nobody to hide
        behind if something here is wrong.
      </p>
      <p>
        Running costs are covered by advertising, which is why you will see ads on the guides
        and around the viewer. Ads never appear inside a message you have opened, and no
        message content is ever passed to an advertiser — there is no mechanism by which it
        could be, since the content never leaves your browser.
      </p>
      <p>
        Questions, bug reports and corrections are welcome:{" "}
        {L("/contact", "en", "get in touch")}.
      </p>
    </>
  );
}

function AboutZh() {
  return (
    <>
      <h2>這是什麼</h2>
      <p>
        {SITE.name} 讓你在瀏覽器中開啟 Outlook 的 <code>.msg</code> 檔、標準的{" "}
        <code>.eml</code> 檔,以及 <code>winmail.dat</code>(TNEF)附件 —— 不需要 Outlook,
        也不需要安裝任何東西。它會像 Outlook 一樣呈現郵件:排版後的內文、內嵌圖片、附件,
        以及原始的網際網路標頭。
      </p>

      <h2>為什麼會有這個網站</h2>
      <p>
        <code>.msg</code> 是微軟專有的容器格式,所以同事從 Windows 寄來的檔案,在 Mac、
        手機或 Gmail 上都打不開。既有的工具不是要你把檔案上傳到一台你一無所知的伺服器,
        就是只顯示內文、其他什麼都沒有。
      </p>
      <p>
        商務郵件不該被丟到不明的伺服器上。所以這個站反過來做:解析在你的瀏覽器裡執行,
        而且根本沒有可以上傳的端點。
      </p>

      <h2>運作方式,以及怎麼自己驗證</h2>
      <p>
        檢視器沒有伺服器端。你的檔案是由你自己分頁裡的 JavaScript 讀取的,而且你可以用
        兩種方式驗證 —— 都不需要相信這一頁寫了什麼:
      </p>
      <ul>
        <li>打開瀏覽器開發者工具的「網路」分頁,再開啟檔案。會有一筆很小的事件送出,記錄檔案格式與是否解析成功;沒有任何請求帶著檔案本身。</li>
        <li>頁面載入後直接斷網,再開啟檔案。照樣能用。</li>
      </ul>
      <p>
        只有一個例外,而且由你主動選擇:如果你登入並選擇<strong>儲存到工作區</strong>,
        那個檔案才會被上傳,好讓同事也打得開。開啟郵件永遠不等於儲存它。
        {L("/privacy", "zh", "隱私權政策")}詳細說明了那種情況下究竟存了什麼。
      </p>

      <h2>它做不到的事</h2>
      <p>值得明講,因為這些限制從外面看不出來:</p>
      <ul>
        <li>
          無法解開 S/MIME 加密的郵件。那需要收件者的私密憑證,瀏覽器無從取得。
          數位簽章的郵件則可以正常閱讀。
        </li>
        <li>
          不會連接任何信箱。它讀的是你手上已經有的檔案;它不是郵件用戶端,
          也沒有任何帳號的存取權。
        </li>
        <li>
          無法從 <code>winmail.dat</code> 還原收件者清單,因為那份資訊從來就不在那個檔案裡
          —— 詳見{L("/open-winmail-dat", "zh", "winmail.dat 指南")}。
        </li>
      </ul>

      <h2>誰在經營</h2>
      <p>
        {SITE.name} 由 <strong>Andy Liu</strong> 以 <strong>{SITE.operator}</strong> 的
        名義獨立建置與維護。這不是一家公司,也與微軟沒有任何從屬、背書或贊助關係。
        Microsoft、Outlook 與 Exchange 是 Microsoft Corporation 的商標。
      </p>
      <p>
        付款由 <strong>Paddle</strong> 處理,他們是 merchant of record,也是你收據上的
        賣方。收據與退款通知的署名是 <strong>{SITE.operator}</strong>;信用卡帳單上則顯示
        <strong>{SITE.statementDescriptor}</strong> —— 同一個名字,只是拿掉了空格和小寫,
        因為卡片系統只允許十個字元。先講清楚,免得帳單上出現不認得的名字讓人直接打給銀行。
      </p>
      <p>
        信件、指南與錯誤修正都是同一個人在做。這件事兩面都值得知道:回覆通常要幾天而不是
        幾小時,但如果這裡有任何地方寫錯了,也沒有人可以躲。
      </p>
      <p>
        營運成本由廣告支應,這也是為什麼你會在指南頁與檢視器周圍看到廣告。廣告不會出現在
        你已開啟的郵件內容中,郵件內容也永遠不會被傳給廣告商 —— 事實上沒有任何機制能做到,
        因為那些內容從未離開你的瀏覽器。
      </p>
      <p>
        歡迎提出問題、回報錯誤或指正:{L("/contact", "zh", "與我聯絡")}。
      </p>
    </>
  );
}

function ContactEn() {
  return (
    <>
      <h2>Email</h2>
      <p>
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
      </p>
      <p>
        One person reads this, so replies are usually within a few days rather than the same
        hour. Everything below goes to the same address.
      </p>

      <h2>A file will not open</h2>
      <p>
        This is the most useful thing to report, and the hardest to act on without detail.
        What helps:
      </p>
      <ul>
        <li>The exact message shown on screen.</li>
        <li>Where the file came from — Outlook for Windows, Outlook for Mac, a web client, an archive export, a ticketing system.</li>
        <li>Its extension and rough size.</li>
        <li>Your browser and operating system.</li>
      </ul>
      <p>
        <strong>Please do not attach the message itself unless you are sure it contains
        nothing confidential.</strong> Most failures can be diagnosed from the description
        alone, and a real business message is not something to send to a stranger. If a file
        is genuinely needed, it will be asked for explicitly.
      </p>
      <p>
        Before writing, {L("/msg-file-wont-open", "en", "the troubleshooting guide")} covers
        the common causes, including files that are cloud placeholders rather than real
        downloads.
      </p>

      <h2>Billing, refunds and cancelling</h2>
      <p>
        Payments are handled by <strong>Paddle</strong>, who are the merchant of record — the
        legal seller on your receipt, and the party that collects the tax. Receipts come from{" "}
        <strong>{SITE.operator}</strong>; a card statement shows{" "}
        <strong>{SITE.statementDescriptor}</strong>. If you are here because an unfamiliar
        line showed up on a statement, that is what it was.
      </p>
      <p>
        <strong>Refunds:</strong> within 30 days, for any reason. Email and say the word
        refund — there is no form and no questions to answer.
      </p>
      <p>
        <strong>Cancelling a subscription:</strong> the receipt Paddle sends carries a link to
        manage it. If you cannot find that email, write and it will be cancelled for you.
        Cancelling stops the next renewal; the time already paid for runs to its end.
      </p>
      <p>
        Whatever happens to a plan, <strong>the files stay readable</strong>. Reading and
        downloading what is already saved is never behind a payment — a plan buys the ability
        to put more in, not the ability to get back what is already there. See the{" "}
        {L("/pricing", "en", "pricing page")} for what each plan covers.
      </p>

      <h2>Privacy and your data</h2>
      <p>
        To delete an account and everything saved in it, email from the address you signed in
        with and say so. See the {L("/privacy", "en", "privacy policy")} for what is held.
      </p>

      <h2>Corrections</h2>
      <p>
        The guides make specific technical claims about the <code>.msg</code>, MIME and TNEF
        formats. If one of them is wrong, saying so is genuinely appreciated — corrections get
        made and the page updated.
      </p>
    </>
  );
}

function ContactZh() {
  return (
    <>
      <h2>電子郵件</h2>
      <p>
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
      </p>
      <p>
        這個信箱由一個人閱讀,所以通常是幾天內回覆,而不是當下就回。以下所有情況都寄到
        同一個地址。
      </p>

      <h2>檔案打不開</h2>
      <p>這是最有用的回報,但沒有細節就最難處理。以下資訊很有幫助:</p>
      <ul>
        <li>畫面上顯示的確切訊息。</li>
        <li>檔案的來源 —— Windows 版 Outlook、Mac 版 Outlook、網頁版、封存匯出,或工單系統。</li>
        <li>副檔名與大致的檔案大小。</li>
        <li>你的瀏覽器與作業系統。</li>
      </ul>
      <p>
        <strong>除非你確定那封郵件不含任何機密內容,否則請不要把郵件本身附上來。</strong>
        大多數的失敗光靠描述就能診斷,而一封真正的商務郵件不該寄給一個陌生人。如果真的
        需要檔案,我會明確跟你要。
      </p>
      <p>
        寫信之前,{L("/msg-file-wont-open", "zh", "排查指南")}涵蓋了常見成因,
        包含「檔案其實是雲端佔位檔、還沒真的下載下來」這種情況。
      </p>

      <h2>付款、退款與取消</h2>
      <p>
        付款由 <strong>Paddle</strong> 處理,他們是 merchant of record —— 收據上的法律賣方,
        也是代收稅金的一方。收據的署名是 <strong>{SITE.operator}</strong>,信用卡帳單上
        則顯示 <strong>{SITE.statementDescriptor}</strong>。如果你是因為帳單上出現不認得的
        名字才找到這裡,就是這個。
      </p>
      <p>
        <strong>退款:</strong>30 天內,不問原因。寫信說要退款就可以,沒有表單、不用回答問題。
      </p>
      <p>
        <strong>取消訂閱:</strong>Paddle 寄的收據裡有管理連結。找不到那封信的話寫信給我們,
        我們幫你取消。取消只會停止下次扣款,已經付過的期間會用到結束為止。
      </p>
      <p>
        無論方案怎麼變動,<strong>檔案都還讀得到</strong>。讀取和下載已經存進去的東西
        永遠不需要付費 —— 方案買的是「能再放進去」,不是「能把已經放進去的拿回來」。
        各方案的內容見{L("/pricing", "zh", "定價頁")}。
      </p>

      <h2>隱私與你的資料</h2>
      <p>
        若要刪除帳號與其中所有內容,請用你登入時使用的地址寄信說明。
        {L("/privacy", "zh", "隱私權政策")}說明了我們持有哪些資料。
      </p>

      <h2>指正</h2>
      <p>
        本站的指南對 <code>.msg</code>、MIME 與 TNEF 格式提出了不少具體的技術主張。
        如果其中有錯,非常歡迎指出 —— 我會更正並更新該頁面。
      </p>
    </>
  );
}
