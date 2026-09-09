import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "en")}>{children}</Link>
);

/**
 * Conversion- and destination-specific guides.
 *
 * These answer "how do I get this file into X", which is a different intent
 * from "how do I read it" — the reader already knows what a .msg is and wants
 * an outcome. Kept short and procedural for that reason.
 */
export const enGuides2 = {
  toEml: {
    title: "How to convert a .msg file to .eml",
    description:
      "Convert Outlook .msg to standard .eml in your browser — no upload, no software. What is preserved, what is lost, and when to keep the original.",
    intro:
      "Converting to .eml is how you make an Outlook message readable everywhere else. .eml is plain RFC 822 text, which Apple Mail, Thunderbird, Windows Mail and Gmail all understand natively — where .msg is a Microsoft-only binary format.",
    steps: [
      {
        name: "Open the .msg file",
        text: "Drag it onto the viewer on this site. Parsing happens in your browser, so the file is not uploaded anywhere.",
      },
      {
        name: "Choose Export → Save as .eml",
        text: "The converted file downloads immediately. Conversion runs locally, so it also works offline.",
      },
      {
        name: "Open it in any mail client",
        text: "Double-click the downloaded file. Apple Mail, Thunderbird and Windows Mail open it directly; you can then drag it into a mailbox to keep it.",
      },
    ],
    body: (
      <>
        <h2>Why convert at all</h2>
        <p>
          <code>.msg</code> is Outlook&apos;s own container format and nothing outside the
          Microsoft ecosystem reads it. <code>.eml</code> is the format email actually
          travels in, so converting turns a file only Outlook can open into one that every
          mail client, archive system and e-discovery tool accepts.
        </p>
        <p>Convert when you need to:</p>
        <ul>
          <li>read the message on a Mac, Linux machine or phone;</li>
          <li>import it into a non-Microsoft mail client or archive;</li>
          <li>hand it to someone who does not use Outlook;</li>
          <li>store correspondence in a format that will still open in ten years.</li>
        </ul>

        <h2>How to convert</h2>
        <ol>
          <li>Open the {L("/", "viewer")} and drop your <code>.msg</code> file on it.</li>
          <li>
            Choose <strong>Export → Save as .eml</strong>.
          </li>
          <li>Double-click the downloaded file.</li>
        </ol>
        <p>
          You can drop up to 50 files at once and export them one at a time from the list.
        </p>

        <h2>What the converted file contains</h2>
        <p>The exported <code>.eml</code> is a proper MIME message carrying:</p>
        <ul>
          <li>sender, recipients, Cc and the original send date;</li>
          <li>
            the body as <strong>both</strong> plain text and HTML, so clients that prefer
            either one display it correctly;
          </li>
          <li>every attachment, re-encoded as base64 MIME parts;</li>
          <li>
            inline images with their original <code>Content-ID</code>, so signatures and
            logos still appear inside the body rather than as loose attachments.
          </li>
        </ul>

        <h2>What does not survive the conversion</h2>
        <p>
          This is worth knowing before you delete the original. <code>.eml</code> describes
          an internet message; <code>.msg</code> describes an Outlook item, and the extra
          things it knows have nowhere to go:
        </p>
        <ul>
          <li>
            <strong>Exchange internal addresses.</strong> The{" "}
            <code>/O=…/OU=…/CN=…</code> distinguished names of internal senders, which are
            sometimes the only record of who an internal mailbox belonged to.
          </li>
          <li>
            <strong>Item type.</strong> An appointment, contact or task converted to{" "}
            <code>.eml</code> becomes an ordinary message.
          </li>
          <li>
            <strong>Voting responses, flags, categories and follow-up state.</strong>
          </li>
          <li>
            <strong>Draft routing data</strong> — an unsent message never had internet
            headers to begin with.
          </li>
        </ul>
        <p>
          Keep the original <code>.msg</code> when the item is evidence, when it is not
          ordinary mail, or when Exchange-internal details matter.{" "}
          {L("/msg-vs-eml", "The full format comparison")} goes into more detail.
        </p>

        <h2>Nothing is uploaded</h2>
        <p>
          Conversion happens entirely in your browser. There is no server involved, which
          matters because the files people convert are almost always business
          correspondence. You can verify it in your browser&apos;s Network tab, or simply
          disconnect from the internet after the page has loaded — the export still works.
        </p>

        <h2>What the header block looks like afterwards</h2>
        <p>
          A converted file is a real RFC 822 message, so it opens anywhere — but it is worth
          knowing what is genuinely reconstructed and what is not.
        </p>
        <p>
          <strong>Reconstructed:</strong> From, To, Cc, Subject, Date, MIME-Version and a
          multipart structure carrying the body alternatives and every attachment, each with
          its own Content-Type and, for inline images, its Content-ID so{" "}
          <code>cid:</code> references still resolve.
        </p>
        <p>
          <strong>Not reconstructed:</strong> the original <code>Received</code> chain. Those
          lines record the servers a message actually passed through, and a{" "}
          <code>.msg</code> saved from Outlook may not have kept them. Where they are absent,
          they cannot be invented — so if you need delivery path, SPF or DKIM evidence, keep
          the original file and read its raw headers instead.
        </p>

        <h2>Converting the other way</h2>
        <p>
          Going from <code>.eml</code> back to <code>.msg</code> is not offered here, and
          you rarely want it: Outlook opens <code>.eml</code> files natively, so there is
          nothing to fix. Double-click the <code>.eml</code> and Outlook will display it.
        </p>
      </>
    ),
  },

  windows: {
    title: "How to open a .msg file in Windows 10 and 11",
    description:
      "Windows cannot open a .msg without Outlook. How to read one anyway, and how to fix the file association when the wrong program takes over.",
    intro:
      "On Windows the .msg format is native territory — but only if Outlook is installed. Without it, Windows has no idea what the file is, and even with it, the file association is easy to break.",
    steps: [
      {
        name: "With Outlook: double-click",
        text: "If Outlook is installed and associated with the format, double-clicking opens the message straight away.",
      },
      {
        name: "Without Outlook: use your browser",
        text: "Drag the file onto the viewer on this site. It needs nothing installed and no administrator rights — useful on a managed work machine.",
      },
      {
        name: "If the wrong program opens it: fix the association",
        text: "Right-click the file, choose Open with → Choose another app, select Outlook, and tick Always use this app.",
      },
    ],
    body: (
      <>
        <h2>If you have Outlook installed</h2>
        <p>
          Double-clicking should work. When it does not, the file association has usually
          been claimed by something else — often a text editor or an unrelated app installed
          later.
        </p>
        <ol>
          <li>Right-click the <code>.msg</code> file.</li>
          <li>
            Choose <strong>Open with</strong> → <strong>Choose another app</strong>.
          </li>
          <li>
            Pick <strong>Outlook</strong>. If it is not listed, choose{" "}
            <strong>Look for another app on this PC</strong> and browse to{" "}
            <code>OUTLOOK.EXE</code> under Program Files.
          </li>
          <li>
            Tick <strong>Always use this app to open .msg files</strong>.
          </li>
        </ol>
        <p>
          On Windows 11 you can also set this under{" "}
          <strong>Settings → Apps → Default apps</strong>, then search for the{" "}
          <code>.msg</code> file type.
        </p>

        <h2>If you do not have Outlook</h2>
        <p>
          Windows itself ships no handler. The Mail app, Notepad, WordPad and Word all
          decline the format, and there is no free Microsoft download that adds support —
          Outlook is part of a paid Office or Microsoft 365 licence.
        </p>
        <p>
          The practical answer is to open it in your browser. Go to the {L("/", "viewer")},
          drag the file on, and the message renders with formatting, inline images and
          attachments. Nothing is installed and nothing is uploaded, which also means it
          works on a locked-down corporate machine where you cannot install software or run
          an installer without admin rights.
        </p>

        <h2>Why Outlook on the web does not help</h2>
        <p>
          A Microsoft 365 subscription alone is not enough:{" "}
          <strong>outlook.office.com cannot open <code>.msg</code> files</strong>. Emailing
          the file to yourself does not work either — it arrives as the same attachment the
          web client will not render. You need the desktop application specifically.
        </p>

        <h2>Opening a .msg without opening Outlook</h2>
        <p>
          Even with Outlook installed, there are reasons to avoid it: double-clicking a{" "}
          <code>.msg</code> launches the whole application, which is slow, and on a machine
          signed into someone else&apos;s mailbox you may not want to open it at all. Reading
          the file in a browser side-steps both.
        </p>

        <h2>Common Windows-specific problems</h2>
        <ul>
          <li>
            <strong>The file opens in Notepad as binary garbage.</strong> The association is
            pointing at a text editor. Fix it with the steps above — the file is fine.
          </li>
          <li>
            <strong>Windows hides the extension.</strong> Turn on{" "}
            <strong>View → Show → File name extensions</strong> in File Explorer, so you can
            see whether a file is really a <code>.msg</code>.
          </li>
          <li>
            <strong>The file came out of a ZIP and will not open.</strong> Extract it
            properly first; some programs open files &quot;inside&quot; a ZIP from a
            temporary location that gets cleaned up mid-read.
          </li>
          <li>
            <strong>Blocked file warning.</strong> Files downloaded from the internet are
            marked. Right-click → <strong>Properties</strong> → tick <strong>Unblock</strong>.
          </li>
        </ul>
        <p>
          If the file opens but looks wrong — blank body, missing images, mojibake —{" "}
          {L("/msg-file-wont-open", "the troubleshooting guide")} covers each symptom.
        </p>
      </>
    ),
  },

  gmail: {
    title: "How to open a .msg file in Gmail",
    description:
      "Gmail cannot open .msg attachments. Why not, and the two reliable ways to read one — including converting it to a format Gmail does display.",
    intro:
      "Someone forwards you a .msg attachment in Gmail, you click it, and Gmail either offers to download it or shows \"No preview available\". Gmail has no .msg support and is not going to add it. Here is what to do instead.",
    steps: [
      {
        name: "Download the attachment",
        text: "Click the download icon on the attachment in Gmail. The file goes to your Downloads folder.",
      },
      {
        name: "Open it in the viewer",
        text: "Go to the viewer on this site and drag the downloaded file on. It renders in the browser, in the same tab-switch you were already doing.",
      },
      {
        name: "Optional: convert it to .eml",
        text: "Choose Export → Save as .eml if you want a file you can forward to people whose mail clients can display it.",
      },
    ],
    body: (
      <>
        <h2>Why Gmail cannot preview .msg files</h2>
        <p>
          Gmail previews formats it understands — PDF, Office documents, images — using
          Google&apos;s own converters. <code>.msg</code> is Outlook&apos;s proprietary
          binary container, not a document format, and Google has never implemented support
          for it. You get &quot;No preview available&quot; and a download button.
        </p>
        <p>
          Uploading the file to Google Drive does not help either, for the same reason: Drive
          stores it happily but cannot render it.
        </p>

        <h2>The quickest route</h2>
        <ol>
          <li>Download the attachment from Gmail.</li>
          <li>Open the {L("/", "viewer")} in another tab.</li>
          <li>Drag the file onto it.</li>
        </ol>
        <p>
          The message opens with its formatting, inline images and attachments intact. The
          file is parsed inside the browser, so it is not uploaded to us — which is worth
          noting when the message arrived at a work address.
        </p>

        <h2>If you need it back inside Gmail</h2>
        <p>
          Gmail does display <code>.eml</code> attachments, so converting solves the problem
          properly:
        </p>
        <ol>
          <li>Open the <code>.msg</code> file in the viewer.</li>
          <li>
            Choose <strong>Export → Save as .eml</strong>.
          </li>
          <li>Attach the <code>.eml</code> to a Gmail message instead.</li>
        </ol>
        <p>
          Recipients can then open it directly. {L("/msg-to-eml", "The conversion guide")}{" "}
          covers what is preserved and what is lost.
        </p>

        <h2>Forwarding a .msg to someone else</h2>
        <p>
          If you forward the <code>.msg</code> as-is, whoever receives it hits exactly the
          same wall unless they have Outlook. Converting to <code>.eml</code> first is the
          courteous option — it opens natively for essentially everyone, including the person
          reading it on a phone.
        </p>

        <h2>What Gmail does to the file on the way</h2>
        <p>
          Worth knowing before you blame the viewer: Gmail does not modify a{" "}
          <code>.msg</code> attachment, but its interface can make it look as though
          something did.
        </p>
        <ul>
          <li>
            <strong>The preview pane cannot open it,</strong> so Gmail falls back to a generic
            file icon. That is not a sign the file is damaged — Gmail has no{" "}
            <code>.msg</code> renderer at all.
          </li>
          <li>
            <strong>Downloading several attachments at once gives you a ZIP.</strong> The{" "}
            <code>.msg</code> inside it is intact, but you have to extract it first; opening
            it from inside the archive viewer often fails.
          </li>
          <li>
            <strong>Gmail may rename it.</strong> Duplicate names gain a{" "}
            <code>(1)</code> suffix, and some subjects produce names your operating system
            then truncates. The contents are unaffected — the format is identified by its
            bytes, not its name.
          </li>
        </ul>

        <h2>Messages that arrive as an attachment inside an attachment</h2>
        <p>
          A forwarded Outlook message frequently contains other messages nested inside it.
          Gmail shows only the outer file, so a thread that was forwarded as a bundle looks
          like a single attachment.
        </p>
        <p>
          Opening it in a viewer that understands embedded messages reveals the rest. This
          matters most when the message you actually need is the innermost one — a forwarded
          approval, or the original of a complaint — which Gmail will never surface on its
          own.
        </p>

        <h2>Why the file arrived as .msg in the first place</h2>
        <p>
          Usually because the sender dragged a message out of Outlook onto their desktop, or
          used <strong>File → Save As</strong>, which produces <code>.msg</code> by default.
          Outlook&apos;s own <strong>Forward as attachment</strong> also attaches messages in
          this format. None of that is deliberate — most senders do not realise the file is
          unreadable outside Outlook.
        </p>
      </>
    ),
  },
} as const;
