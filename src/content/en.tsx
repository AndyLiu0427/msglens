import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "en")}>{children}</Link>
);

/**
 * Long-form content, authored rather than templated.
 *
 * These pages carry the organic search traffic and are also what an ad
 * network reviews when deciding whether the site is a thin tool wrapper or a
 * real resource — so they answer the question properly instead of padding.
 */
export const enContent = {
  howTo: {
    title: "How to open a .msg file without Outlook",
    description:
      "Five ways to open Outlook .msg files on Windows, macOS, Linux, iPhone and Android — including a browser method that needs no software at all.",
    intro:
      "You have been sent a file ending in .msg, you double-click it, and your computer either does nothing or offers to open it in a text editor that shows a wall of binary garbage. This is not a broken file. It is Microsoft Outlook's private format, and almost nothing outside the Microsoft ecosystem knows how to read it.",
    steps: [
      {
        name: "Open it in your browser",
        text: "Drag the .msg file onto the viewer on this site's home page. The message renders with its original formatting, images and attachments. Nothing is uploaded — the file is parsed by JavaScript on your own machine.",
      },
      {
        name: "Open it in Outlook",
        text: "If you have Outlook installed, double-clicking the file is enough. On Windows you may first need to right-click, choose Open with, and select Outlook.",
      },
      {
        name: "Rename it to .txt as a last resort",
        text: "Renaming message.msg to message.txt and opening it in a text editor will show fragments of the message body among binary data. Use this only to confirm a file is not empty; it is not a way to read a message.",
      },
      {
        name: "Convert it to .eml",
        text: "Open the file in the viewer and choose Export → Save as .eml. The resulting file opens natively in Apple Mail, Thunderbird, Windows Mail and most other mail clients.",
      },
    ],
    body: (
      <>
        <h2>Why .msg files will not open</h2>
        <p>
          A <code>.msg</code> file is not a text file with a different extension. It is a{" "}
          <strong>Compound File Binary Format</strong> container — the same OLE2 structure
          that older <code>.doc</code> and <code>.xls</code> files use. Inside it, the
          subject, sender, recipients, body, and every attachment are stored as separate
          internal streams, each keyed by a numeric MAPI property tag.
        </p>
        <p>
          Because Microsoft never published it as an interchange standard, Apple Mail,
          Gmail, Thunderbird and mobile mail apps all decline to open it. On macOS, double-
          clicking a <code>.msg</code> file typically produces{" "}
          <em>&quot;There is no application set to open the document&quot;</em>. On Android
          and iOS it usually downloads and then sits there, untouchable.
        </p>

        <h2>Method 1 — Open it in your browser (no software)</h2>
        <p>
          This is the fastest route and works identically on every operating system,
          including phones and locked-down work machines where you cannot install anything.
        </p>
        <ol>
          <li>Go to the {L("/", "viewer on the home page")}.</li>
          <li>Drag your <code>.msg</code> file onto the drop zone, or click to browse.</li>
          <li>
            The message opens immediately, with formatting, inline images, recipients and
            attachments intact.
          </li>
        </ol>
        <p>
          Because parsing runs entirely in your browser, the file never travels over the
          network. You can confirm this yourself: open your browser&apos;s developer tools,
          switch to the Network tab, and open a file — you will see no upload request. Or
          simply disconnect from the internet after the page has loaded and keep working.
          Not every online viewer works this way; see{" "}
          {L("/msg-viewer-comparison", "which free .msg viewers upload your file")}.
        </p>

        <h2>Method 2 — Open it in Outlook</h2>
        <p>
          If you have Outlook for Windows or Mac installed, double-clicking usually works.
          If Windows opens the wrong program, right-click the file, choose{" "}
          <strong>Open with</strong>, pick <strong>Outlook</strong>, and tick{" "}
          <em>Always use this app</em>.
        </p>
        <p>
          The web version of Outlook (outlook.office.com) cannot open <code>.msg</code>{" "}
          files. A common workaround — attaching the file to an email to yourself — does not
          help either, because the attachment stays a <code>.msg</code> that the web client
          will not render.
        </p>

        <h2>Method 3 — Convert to .eml and use your normal mail app</h2>
        <p>
          <code>.eml</code> is the standard RFC 822 format that every mail client
          understands. Converting gives you a file you can open natively, forward, archive
          or import.
        </p>
        <ol>
          <li>Open the <code>.msg</code> file in the {L("/", "viewer")}.</li>
          <li>
            Choose <strong>Export → Save as .eml</strong>.
          </li>
          <li>
            Double-click the downloaded file. Apple Mail, Thunderbird and Windows Mail all
            open it directly.
          </li>
        </ol>
        <p>
          See {L("/msg-vs-eml", "the full comparison of .msg and .eml")} for what is
          preserved and what is not.
        </p>

        <h2>Method 4 — Save it as a PDF</h2>
        <p>
          For sharing, filing or attaching to a legal or support ticket, PDF is usually the
          right destination. The {L("/convert-msg-to-pdf", "step-by-step guide")} covers
          how to get a clean PDF that keeps the header block and expands link URLs.
        </p>

        <h2>Method 5 — Rename to .txt (diagnostic only)</h2>
        <p>
          Renaming the file to <code>.txt</code> and opening it in Notepad or TextEdit will
          show scattered readable fragments among binary noise. Attachments, formatting and
          non-Latin characters are unrecoverable this way. Treat it as a way to check that a
          file is not empty, not as a way to read a message.
        </p>

        <h2>Platform-specific notes</h2>
        <p>
          The methods above work everywhere. Windows, macOS, phones and Gmail each have
          enough of their own quirks to be worth their own section, and those follow below.
        </p>
        <p>
          If the file opens but something looks wrong — a blank body, broken images, mojibake
          — {L("/msg-file-wont-open", "the troubleshooting guide")} works through each
          symptom.
        </p>
        <h2>What about multiple files?</h2>
        <p>
          You can drop up to 50 files at once. They appear in a list you can filter and
          step through with <code>J</code> and <code>K</code>, which is considerably faster
          than opening an exported mail archive one file at a time.
        </p>
      </>
    ),
  },

  whatIs: {
    title: "What is a .msg file?",
    description:
      "How Outlook's .msg format works: the OLE2 container, MAPI property streams, where the body is stored, and why other applications cannot read it.",
    body: (
      <>
        <p>
          A <code>.msg</code> file is Microsoft Outlook&apos;s format for storing a single
          Outlook item as a standalone file. Despite the name, it holds more than email: an
          appointment, contact, task, note or meeting request saved from Outlook all produce
          a <code>.msg</code> file.
        </p>

        <h2>The container: Compound File Binary Format</h2>
        <p>
          Internally, a <code>.msg</code> file is an{" "}
          <strong>OLE2 Compound File</strong> — effectively a small filesystem inside a
          single file, with directories (&quot;storages&quot;) and files (&quot;streams&quot;).
          Every such file begins with the same eight signature bytes,{" "}
          <code>D0 CF 11 E0 A1 B1 1A E1</code>, which is how a reader can identify one
          regardless of its extension.
        </p>
        <p>
          The same container format underlies legacy <code>.doc</code>, <code>.xls</code>{" "}
          and <code>.ppt</code> files. What differs is the naming and meaning of the streams
          inside, which for <code>.msg</code> is specified by{" "}
          <strong>[MS-OXMSG]</strong>.
        </p>

        <h2>What is stored inside</h2>
        <p>
          Each message property lives in its own stream named after a MAPI property tag —
          a 16-bit property id plus a 16-bit type. For example:
        </p>
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Tag</th>
              <th>Holds</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PidTagSubject</td>
              <td><code>0037001F</code></td>
              <td>The subject line</td>
            </tr>
            <tr>
              <td>PidTagBody</td>
              <td><code>1000001F</code></td>
              <td>Plain-text body</td>
            </tr>
            <tr>
              <td>PidTagHtml</td>
              <td><code>10130102</code></td>
              <td>HTML body, as raw bytes</td>
            </tr>
            <tr>
              <td>PidTagRtfCompressed</td>
              <td><code>10090102</code></td>
              <td>Compressed RTF body</td>
            </tr>
            <tr>
              <td>PidTagSenderEmailAddress</td>
              <td><code>0C1F001F</code></td>
              <td>Sender address</td>
            </tr>
          </tbody>
        </table>
        <p>
          Recipients and attachments are not properties but sub-storages —{" "}
          <code>__recip_version1.0_#00000000</code>,{" "}
          <code>__attach_version1.0_#00000000</code> and so on — each with its own property
          streams inside.
        </p>

        <h2>The three ways a body can be stored</h2>
        <p>
          This is where most simple viewers fail, and why the same file can look perfect in
          one tool and blank in another. Outlook may store the body as:
        </p>
        <ul>
          <li>
            <strong>Plain text</strong> in <code>PidTagBody</code>.
          </li>
          <li>
            <strong>HTML</strong> in <code>PidTagHtml</code>, as raw bytes that must be
            decoded using the code page named in <code>PidTagInternetCodepage</code>.
            Decoding these as UTF-8 by default is what produces mojibake in Chinese,
            Japanese, Korean, Cyrillic and Greek messages.
          </li>
          <li>
            <strong>Compressed RTF</strong> in <code>PidTagRtfCompressed</code>. When the
            message was originally HTML, Outlook wraps that HTML inside the RTF using the{" "}
            <strong>[MS-OXRTFEX]</strong> encapsulation scheme. Recovering it requires
            decompressing the stream and then de-encapsulating <code>\htmltag</code> and{" "}
            <code>\htmlrtf</code> control words. Viewers that skip this step show an empty
            body for a large share of real-world Outlook mail.
          </li>
        </ul>

        <h2>Inline images and cid: references</h2>
        <p>
          Images that appear inside the message body are stored as ordinary attachments
          carrying a <code>PidTagAttachContentId</code>. The HTML body then references them
          as <code>&lt;img src=&quot;cid:image001.png@01D9…&quot;&gt;</code>. A viewer has to
          match each <code>cid:</code> reference to its attachment and substitute a usable
          URL; otherwise the message renders with broken image placeholders where the
          signature and logos should be.
        </p>

        <h2>Reading the streams by hand</h2>
        <p>
          Every property lives in a stream whose name encodes what it is:{" "}
          <code>__substg1.0_XXXXYYYY</code>, where <code>XXXX</code> is the property tag in
          hex and <code>YYYY</code> is its type. So the subject, tag <code>0x0037</code>,
          stored as Unicode (<code>0x001F</code>), appears as{" "}
          <code>__substg1.0_0037001F</code>. The same tag ending <code>001E</code> would be
          the eight-bit version of the same field.
        </p>
        <p>
          That naming is the whole reason a <code>.msg</code> can be read at all without
          Outlook. Given an OLE2 library, you can enumerate the streams and look up the tags,
          and the file gives up its structure without any Microsoft code being involved.
        </p>
        <p>
          Two more conventions matter. Recipients are not a list inside one stream; each one
          is a <em>sub-storage</em> named <code>__recip_version1.0_#00000000</code>,{" "}
          <code>#00000001</code> and so on, each containing its own set of property streams.
          Attachments follow the same pattern under{" "}
          <code>__attach_version1.0_#...</code>. A fixed-size property — a boolean, an
          integer, a timestamp — is not a stream at all; it is packed into the{" "}
          <code>__properties_version1.0</code> table alongside the others.
        </p>

        <h2>Character encoding, and how it goes wrong</h2>
        <p>
          A property stored as <code>001F</code> is UTF-16LE and unambiguous. One stored as{" "}
          <code>001E</code> is bytes in some code page, and the file has to tell you which:{" "}
          <code>PidTagInternetCodepage</code> (<code>0x3FDE</code>) or, failing that,{" "}
          <code>PidTagMessageCodepage</code>.
        </p>
        <p>
          A reader that ignores those and assumes UTF-8 will mangle every message written in
          Traditional Chinese, Japanese, Korean, Cyrillic or Greek — which is the usual
          explanation when a message opens but the text is replacement characters. The
          message is not corrupt; it was decoded with the wrong table.
        </p>

        <h2>What it means that this is an OLE2 file</h2>
        <p>
          The container being a Compound File has one consequence worth knowing: it is a
          little filesystem, with a sector allocation table, a directory tree and free space.
          Editing a <code>.msg</code> in a text editor does not merely garble some text — it
          breaks the sector chain, and the file becomes unopenable in a way no tool can
          recover. If you need to inspect one, work on a copy.
        </p>
        <p>
          It also means a <code>.msg</code> is usually larger than the same message as{" "}
          <code>.eml</code>, sometimes substantially. It stores the body more than once — HTML
          and RTF and plain text — plus MAPI bookkeeping that the wire format has no place
          for.
        </p>

        <h2>Why other applications will not open it</h2>
        <p>
          Microsoft documented the format but never proposed it as an interchange standard,
          and it encodes Exchange-specific concepts — legacy distinguished names, voting
          buttons, delegate information, message classes — that have no equivalent in
          standard internet mail. Supporting it means implementing a Microsoft
          specification with no benefit to a competitor&apos;s own format, so almost nobody
          does.
        </p>
        <p>
          The standard alternative is <code>.eml</code>, which is plain RFC 822 text.{" "}
          {L("/msg-vs-eml", "Compare the two formats")} to see what you gain and lose by
          converting.
        </p>
      </>
    ),
  },

  msgVsEml: {
    title: "EML vs MSG: the differences, and which to save as",
    description:
      "EML vs MSG in one table. .msg keeps Outlook-only data such as Exchange senders, flags and appointments; .eml opens in any mail app. Which to choose when saving from Outlook.",
    faq: [
      {
        q: "Should I save Outlook emails as .eml or .msg?",
        a: "Save as .eml if the message has to open outside Outlook: on a Mac, a phone, Gmail, Thunderbird or an archive system. Keep .msg if it is evidence or an appointment, contact or task, because .msg keeps Outlook-only data that .eml drops. If unsure, keep the .msg: you can convert it to .eml later, but not the other way round without loss.",
      },
      {
        q: "Is .eml or .msg better for archiving?",
        a: "For long-term archiving, .eml. It is a documented plain-text standard that any mail client, archive or search tool can read. Keep the .msg as well when the message may be needed as evidence, since it holds Exchange sender details, flags and categories that .eml has no place for.",
      },
      {
        q: "Can Outlook open .eml files?",
        a: "Yes. Outlook on Windows and Mac opens .eml files: double-click the file or drag it into Outlook. Most other mail apps open .eml too, which is the main reason to prefer it for sharing.",
      },
      {
        q: "Does converting .msg to .eml lose attachments or images?",
        a: "No. Attachments are carried over as MIME parts, and inline images keep their Content-ID so they still appear in the body. What is lost is Outlook-only data: internal Exchange addresses, flags, categories and voting state.",
      },
      {
        q: "Why is the .eml smaller than the .msg?",
        a: "A .msg often stores the body two or three times, as HTML, compressed RTF and plain text, plus Outlook bookkeeping. The .eml keeps one copy of each part. The message content is not lost; the duplication is.",
      },
      {
        q: "How do I convert .msg to .eml without Outlook?",
        a: "Open the .msg in the MsgLens viewer at msglens.app and choose Export, then Save as .eml. The conversion runs in your browser; the file is not uploaded.",
      },
    ],
    body: (
      <>
        <p>
          Both formats store a single email message in a single file. The difference is that{" "}
          <code>.eml</code> is a published internet standard and <code>.msg</code> is a
          Microsoft implementation detail that escaped into the wild.
        </p>

        <h2>Short answer: which should you save as?</h2>
        <ul>
          <li>
            <strong>Save as .eml</strong> if the message has to open somewhere other than
            Outlook: a Mac, a phone, Gmail, Thunderbird, or an archive system.
          </li>
          <li>
            <strong>Keep .msg</strong> if the file is evidence or a record of an Outlook item. It
            keeps Exchange sender details, flags and categories, and it is the only one of the
            two that can hold an appointment, contact or task.
          </li>
          <li>
            <strong>Not sure?</strong> Keep the .msg. You can convert it to .eml at any time;
            converting back cannot restore what .eml dropped.
          </li>
        </ul>

        <h2>Which format Outlook gives you</h2>
        <p>
          Often you do not get to choose. Classic Outlook for Windows saves <code>.msg</code>,
          whether you use File, Save As or drag a message to the desktop, and has no{" "}
          <code>.eml</code> option. Outlook for Mac produces <code>.eml</code> when you drag a
          message out, and the new Outlook for Windows and Outlook on the web download messages
          as <code>.eml</code>.
        </p>

        <h2>At a glance</h2>
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
              <td>Owner</td>
              <td>Microsoft (Outlook)</td>
              <td>IETF standard (RFC 5322 / MIME)</td>
            </tr>
            <tr>
              <td>Structure</td>
              <td>Binary OLE2 compound file</td>
              <td>Plain text with MIME parts</td>
            </tr>
            <tr>
              <td>Readable in a text editor</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Opens in Apple Mail / Thunderbird</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Stores non-mail items</td>
              <td>Yes — contacts, appointments, tasks</td>
              <td>No — mail only</td>
            </tr>
            <tr>
              <td>Exchange-specific data</td>
              <td>Preserved</td>
              <td>Lost</td>
            </tr>
            <tr>
              <td>Typical size</td>
              <td>Larger</td>
              <td>Smaller</td>
            </tr>
          </tbody>
        </table>

        <h2>What .msg preserves that .eml cannot</h2>
        <p>
          <code>.msg</code> is a snapshot of an Outlook item, not of an internet message, so
          it keeps things that never travel over SMTP:
        </p>
        <ul>
          <li>
            <strong>Message class</strong> — whether the item is a note, appointment,
            contact or task.
          </li>
          <li>
            <strong>Exchange addresses</strong> — the internal{" "}
            <code>/O=…/OU=…/CN=…</code> distinguished names of internal senders and
            recipients, which is often the only record of who an internal address belonged
            to.
          </li>
          <li>
            <strong>Voting responses, flags, categories and follow-up state.</strong>
          </li>
          <li>
            <strong>Drafts</strong> — an unsent message has no internet headers at all, so
            converting it loses the routing metadata that was never there.
          </li>
        </ul>

        <h2>What .eml gives you that .msg does not</h2>
        <ul>
          <li>
            <strong>It opens everywhere.</strong> Mail clients on every platform read it
            natively; see {L("/open-eml-file", "how to open an .eml file")}.
          </li>
          <li>
            <strong>It is greppable.</strong> Being plain text, it can be searched,
            diffed, and processed with ordinary command-line tools.
          </li>
          <li>
            <strong>It is smaller</strong>, because it does not carry the compound-file
            overhead or duplicate RTF and HTML copies of the same body.
          </li>
          <li>
            <strong>It is future-proof.</strong> A documented, text-based standard will
            still be readable when today&apos;s applications are gone.
          </li>
        </ul>

        <h2>Why the same message is a different size in each format</h2>
        <p>
          Convert a message and the file usually shrinks, sometimes by half. That is not data
          loss in the way it first appears — it is mostly the duplication going away.
        </p>
        <p>
          A <code>.msg</code> commonly stores the body two or three times over: as HTML, as
          compressed RTF, and as plain text. It also carries MAPI bookkeeping that internet
          mail has no field for. An <code>.eml</code> keeps one MIME tree, so the alternatives
          collapse to what a mail client actually needs.
        </p>

        <h2>What an archive or e-discovery system expects</h2>
        <p>
          If the reason for converting is that something downstream has to ingest the message,
          the two formats are not equally welcome:
        </p>
        <ul>
          <li>
            <strong>Archives and case management systems</strong> almost universally accept{" "}
            <code>.eml</code>, because it is the format mail travels in. Support for{" "}
            <code>.msg</code> is common but not guaranteed, and is often an extra-cost module.
          </li>
          <li>
            <strong>Full-text indexers</strong> read <code>.eml</code> directly. Indexing a{" "}
            <code>.msg</code> requires a parser that knows about compressed RTF, and an
            indexer without one records an empty body while reporting success.
          </li>
          <li>
            <strong>Long-term preservation</strong> favours <code>.eml</code> for a plain
            reason: it is text you can read with any editor in twenty years. A{" "}
            <code>.msg</code> needs a working OLE2 implementation to make any sense at all.
          </li>
        </ul>

        <h2>When to convert .msg to .eml</h2>
        <p>Convert when you need to:</p>
        <ul>
          <li>open a message on a Mac, Linux machine or phone without Outlook;</li>
          <li>import messages into a non-Microsoft mail client or archive;</li>
          <li>store correspondence long-term in a format that will remain readable;</li>
          <li>hand a message to someone who does not use Outlook.</li>
        </ul>
        <p>
          Keep the original <code>.msg</code> as well when the item is evidence, when it is
          an appointment or contact rather than mail, or when Exchange-internal sender
          details matter.
        </p>

        <h2>How to convert</h2>
        <p>
          Open the file in the {L("/", "viewer")} and choose{" "}
          <strong>Export → Save as .eml</strong>. The conversion runs in your browser and
          produces a MIME message with the body (as both plain text and HTML) and every
          attachment re-encoded as base64 parts, with inline images keeping their
          Content-ID so they still display in the body.
        </p>
      </>
    ),
  },

  toPdf: {
    title: "How to convert a .msg file to PDF",
    description:
      "Turn an Outlook .msg file into a clean, shareable PDF from your browser — no Outlook, no upload, no watermark.",
    steps: [
      {
        name: "Open the message",
        text: "Drag the .msg file onto the viewer on the home page. It opens instantly and is parsed on your own device.",
      },
      {
        name: "Choose Print / PDF",
        text: "Click the Print / PDF button in the message toolbar. A print-ready copy of the message opens in a new window, followed by your browser's print dialog. Allow pop-ups for this site if nothing appears.",
      },
      {
        name: "Select Save as PDF",
        text: "Set the destination to \"Save as PDF\" (Chrome, Edge) or use the PDF menu (Safari, Firefox), then save.",
      },
    ],
    body: (
      <>
        <p>
          PDF is usually where a <code>.msg</code> file needs to end up: attached to a
          ticket, filed with a case, sent to someone who does not use Outlook, or archived
          somewhere that will still be readable in ten years. Doing it in the browser avoids
          uploading correspondence to a conversion service.
        </p>

        <h2>Steps</h2>
        <ol>
          <li>
            Open the {L("/", "viewer")} and drop your <code>.msg</code> file onto it.
          </li>
          <li>
            Click <strong>Print / PDF</strong> in the message toolbar.
          </li>
          <li>
            In the print dialog, set the destination to <strong>Save as PDF</strong>.
          </li>
          <li>Save the file.</li>
        </ol>

        <h2>What the PDF contains</h2>
        <p>
          Printing opens a purpose-built copy of the message in a new window rather than
          printing the page you are looking at. That is what lets a long message flow
          across as many pages as it needs instead of being clipped at one. If nothing
          opens, allow pop-ups for this site and try again.
        </p>
        <p>The output:</p>
        <ul>
          <li>
            keeps the full header block — sender, recipients, date and subject — at the
            top;
          </li>
          <li>
            expands the complete message body rather than clipping it to the on-screen
            scroll area;
          </li>
          <li>
            lists attachment names and sizes, so the record shows what was attached even
            though PDF cannot embed them;
          </li>
          <li>
            prints link destinations in full after the link text, so a URL in the message is
            still verifiable on paper;
          </li>
          <li>
            omits the site interface — no navigation, buttons, banners or ads appear in the
            PDF;
          </li>
          <li>
            prints on white with dark text whether or not you are using dark mode.
          </li>
        </ul>

        <h2>Getting a cleaner result</h2>
        <ul>
          <li>
            <strong>Load remote images first</strong> if you need them in the PDF. They are
            blocked by default, and blocked images print as empty placeholders.
          </li>
          <li>
            <strong>Turn off headers and footers</strong> in the print dialog to remove the
            browser&apos;s page title and URL from each page.
          </li>
          <li>
            <strong>Enable background graphics</strong> if the message relies on coloured
            table backgrounds — many marketing emails become unreadable without them.
          </li>
        </ul>

        <h2>Converting several messages</h2>
        <p>
          Drop up to 50 files at once, then choose <strong>Save all as PDF</strong> above the
          message list. Every open message goes into one PDF, each starting on a new page,
          with its own formatting kept. For hundreds of files, work in batches of 50.
        </p>
        <p>
          If you need a separate PDF per message instead, step through them with{" "}
          <code>J</code> and <code>K</code> and use <strong>Print / PDF</strong> on each.
        </p>

        <h2>Why printing the page does not work</h2>
        <p>
          An obvious-looking approach fails here, and it is worth explaining so you do not
          waste time on it. Message bodies are rendered inside an iframe, for the good reason
          that email HTML ships global CSS that would otherwise restyle the whole page. But
          iframe content <strong>cannot paginate across printed pages</strong>: the browser
          prints what fits in the frame and clips the rest.
        </p>
        <p>
          Pressing Ctrl+P on a long message therefore gives you one page and a truncated body
          — silently, with no warning that anything was lost. The Print / PDF button opens a
          separate document containing the message on its own, which does paginate. A long
          thread comes out as eight pages rather than one.
        </p>

        <h2>Making the PDF admissible as a record</h2>
        <p>
          If the PDF is going into a case file, an audit or a dispute, the body alone is
          rarely enough. What makes it defensible is the material around it:
        </p>
        <ul>
          <li>
            <strong>The header block</strong> — sender, all recipients including Cc, and the
            exact send time. A body without them proves very little.
          </li>
          <li>
            <strong>The attachment names</strong>, so the record shows what travelled with the
            message even though the PDF cannot contain the files themselves.
          </li>
          <li>
            <strong>The raw internet headers</strong>, if authenticity is likely to be
            questioned. <code>Received</code> lines, <code>Message-ID</code> and the SPF and
            DKIM results are what an investigator will ask for, and they are not in the
            printed body.
          </li>
        </ul>
        <p>
          Keep the original <code>.msg</code> as well. A PDF is a rendering; the original file
          is the evidence, and only it still carries the headers and the attachments.
        </p>

        <h2>If you need the attachments too</h2>
        <p>
          A PDF cannot carry the original attachments. Use{" "}
          <strong>Download all</strong> in the attachments section to get them as a ZIP, and
          keep it alongside the PDF. Alternatively, export the message as{" "}
          {L("/msg-vs-eml", ".eml")}, which keeps the body and every attachment in one
          standard file.
        </p>
      </>
    ),
  },
} as const;
