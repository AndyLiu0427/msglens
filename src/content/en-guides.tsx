import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "en")}>{children}</Link>
);

/**
 * Platform- and problem-specific guides.
 *
 * Deliberately separate pages rather than sections of the main how-to: each
 * answers a distinct search intent ("on a mac", "on iphone", "won't open")
 * with its own symptoms and steps. The main how-to acts as the hub and links
 * out to these, so they deepen it rather than compete with it.
 */
export const enGuides = {
  mac: {
    title: "How to open a .msg file on a Mac",
    description:
      "macOS has no built-in handler for Outlook .msg files. Four ways to read one on a Mac, including a browser method that needs no software and no upload.",
    intro:
      "You double-click a .msg file on your Mac and get \"There is no application set to open the document\". macOS ships no handler for the format, and — unlike on Windows — installing Outlook does not reliably fix it either. Here is what actually works.",
    steps: [
      {
        name: "Open it in your browser",
        text: "Drag the .msg file onto the viewer on this site. It renders with formatting, inline images and attachments. Parsing happens locally in Safari, Chrome or Firefox, so the file never leaves your Mac.",
      },
      {
        name: "Convert it to .eml for Apple Mail",
        text: "Open the file in the viewer and choose Export → Save as .eml. Double-clicking the resulting file opens it in Apple Mail like any other message.",
      },
      {
        name: "Drag it into Outlook for Mac",
        text: "If you have Outlook for Mac, dragging the file into a mail folder often imports it even when double-clicking does nothing.",
      },
    ],
    body: (
      <>
        <h2>Why macOS cannot open .msg files</h2>
        <p>
          A <code>.msg</code> file is not a document in any format macOS knows. It is a{" "}
          <strong>Compound File Binary</strong> container holding Outlook&apos;s internal
          MAPI properties — the same OLE2 structure as a legacy <code>.doc</code>, but with
          entirely different contents. {L("/what-is-a-msg-file", "The format breakdown")}{" "}
          covers what is inside one.
        </p>
        <p>
          Because Microsoft never published it as an interchange format, Apple Mail, Mail.app
          plug-ins, Preview and Quick Look all decline it. Quick Look shows a generic file
          icon rather than a preview, which is often the first sign something is wrong.
        </p>

        <h2>Method 1 — Open it in your browser</h2>
        <p>
          This is the only method that needs nothing installed and works the same on an Intel
          Mac, an Apple Silicon Mac, and a locked-down work machine where you cannot install
          software.
        </p>
        <ol>
          <li>Open the {L("/", "viewer")}.</li>
          <li>Drag the <code>.msg</code> file onto the drop zone.</li>
          <li>
            The message opens with its original formatting, inline images, recipients and
            attachments.
          </li>
        </ol>
        <p>
          The file is parsed by JavaScript inside the page, so nothing is uploaded. You can
          confirm that in Safari&apos;s Web Inspector or Chrome&apos;s DevTools: open the
          Network tab, then open a file, and no request carries your data.
        </p>

        <h2>Method 2 — Convert to .eml and use Apple Mail</h2>
        <p>
          If you want the message to live in Apple Mail alongside everything else, convert
          it to the standard format first:
        </p>
        <ol>
          <li>Open the <code>.msg</code> file in the {L("/", "viewer")}.</li>
          <li>
            Choose <strong>Export → Save as .eml</strong>.
          </li>
          <li>
            Double-click the downloaded file. Apple Mail opens it directly, and you can then
            drag it into any mailbox to keep it.
          </li>
        </ol>
        <p>
          {L("/msg-vs-eml", "What .eml preserves and what it drops")} is worth reading if the
          message is evidence or an appointment rather than ordinary mail.
        </p>

        <h2>Method 3 — Outlook for Mac</h2>
        <p>
          Outlook for Mac has never handled <code>.msg</code> files as smoothly as the
          Windows version. Double-clicking frequently does nothing at all. What usually works
          instead is dragging the file directly into a mail folder in the Outlook window,
          which imports it as a message you can then open normally.
        </p>
        <p>
          Note that <strong>Outlook on the web cannot open .msg files at all</strong>, so a
          Microsoft 365 subscription on its own does not solve this. Emailing the file to
          yourself does not help either — it arrives as the same unreadable attachment.
        </p>

        <h2>Method 4 — Save it as a PDF for filing</h2>
        <p>
          If the goal is to archive the message or attach it to a ticket, PDF is usually the
          real destination. {L("/convert-msg-to-pdf", "The PDF guide")} covers how to get a
          clean, paginated document with the header block intact.
        </p>

        <h2>What does not work</h2>
        <ul>
          <li>
            <strong>Renaming to .txt and opening in TextEdit.</strong> You will see scattered
            readable fragments among binary noise. Attachments, formatting and any non-Latin
            characters are lost. Use it only to confirm a file is not empty.
          </li>
          <li>
            <strong>Quick Look and Preview.</strong> Neither has a handler for the format.
          </li>
          <li>
            <strong>Changing the extension to .eml.</strong> The two formats are structurally
            unrelated; renaming does not convert anything, and Apple Mail will either refuse
            the file or show gibberish.
          </li>
        </ul>

        <h2>Opening many files at once</h2>
        <p>
          Select them all and drag them in together — up to 50 at a time. They appear in a
          list you can filter, and <code>J</code> and <code>K</code> step between them. That
          is considerably faster than converting an exported archive one file at a time.
        </p>
      </>
    ),
  },

  mobile: {
    title: "How to open a .msg file on iPhone or Android",
    description:
      "Neither iOS nor Android can open Outlook .msg files natively. How to read one on a phone, save the attachments, and why the usual workarounds fail.",
    intro:
      "Someone forwards you a .msg attachment, you tap it on your phone, and nothing happens — or it downloads and then sits there refusing to open. Neither iOS nor Android ships a handler for Outlook's format, and the Outlook mobile app will not open one either.",
    steps: [
      {
        name: "Save the file to your phone",
        text: "On iPhone, tap the attachment, choose Share, then Save to Files. On Android, tap Download. The file lands in Files or your Downloads folder.",
      },
      {
        name: "Open the viewer in your mobile browser",
        text: "Go to the viewer in Safari, Chrome or your usual browser. It adapts to small screens.",
      },
      {
        name: "Pick the saved file",
        text: "Tap the drop zone, choose Browse, and select the .msg file. The message opens with formatting, images and attachments.",
      },
    ],
    body: (
      <>
        <h2>Why phones cannot open .msg files</h2>
        <p>
          <code>.msg</code> is Outlook&apos;s proprietary desktop format — a binary container
          of MAPI properties rather than a standard email file. iOS and Android both handle{" "}
          <code>.eml</code> natively but have no idea what to do with{" "}
          <code>.msg</code>. Even Microsoft&apos;s own Outlook mobile app declines it.
        </p>

        <h2>On iPhone and iPad</h2>
        <ol>
          <li>
            Tap the attachment in Mail, Messages or wherever you received it.
          </li>
          <li>
            Tap the <strong>Share</strong> icon, then <strong>Save to Files</strong>. Choose
            somewhere you will find again, such as <em>On My iPhone → Downloads</em>.
          </li>
          <li>Open the {L("/", "viewer")} in Safari.</li>
          <li>
            Tap the drop zone, choose <strong>Browse</strong>, and pick the saved file.
          </li>
        </ol>
        <p>
          The message opens in the browser. Attachments download to the Files app, where you
          can open them with whatever app normally handles that type.
        </p>

        <h2>On Android</h2>
        <ol>
          <li>Tap <strong>Download</strong> on the attachment.</li>
          <li>Open the {L("/", "viewer")} in Chrome.</li>
          <li>
            Tap the drop zone, then pick the file from <strong>Downloads</strong>.
          </li>
        </ol>
        <p>
          Some Android mail apps hand the file straight to a &quot;choose an app&quot;
          dialog with nothing suitable listed. Save it first rather than trying to open it
          from that dialog.
        </p>

        <h2>Your file stays on your phone</h2>
        <p>
          Parsing runs inside the browser tab, so the message is never uploaded. This matters
          more on mobile than on a desktop: a phone is often where you read work mail on a
          personal device, and the alternative tools all require sending the file to a server
          you know nothing about.
        </p>
        <p>
          Because there is no upload, it also works on a slow or metered connection — only
          the page itself is downloaded, once.
        </p>

        <h2>Getting the attachments</h2>
        <p>
          Every attachment inside the message can be downloaded individually, or all at once
          as a ZIP. On iPhone they land in Files; on Android in Downloads. Inline images —
          logos and signature graphics — are shown in the message body rather than listed
          separately, so the attachment list stays limited to what was really attached.
        </p>

        <h2>What does not work on a phone</h2>
        <ul>
          <li>
            <strong>The Outlook mobile app.</strong> It will not open a <code>.msg</code>{" "}
            attachment, even with a Microsoft 365 subscription.
          </li>
          <li>
            <strong>Renaming the file.</strong> Mobile file managers often hide extensions,
            and renaming would not help anyway — the formats are structurally unrelated.
          </li>
          <li>
            <strong>Most &quot;file viewer&quot; apps from the store.</strong> Those that do
            claim <code>.msg</code> support usually upload your file to their own server to
            convert it.
          </li>
        </ul>

        <h2>If you need it on a computer later</h2>
        <p>
          Open the file on your phone and use <strong>Export → Save as .eml</strong>. The
          resulting file opens natively in Apple Mail, Outlook, Thunderbird and Gmail, so you
          can forward it to yourself and have something readable at the other end. See{" "}
          {L("/msg-vs-eml", "the format comparison")} for what changes in the conversion.
        </p>
      </>
    ),
  },

  troubleshoot: {
    title: "Why won't my .msg file open?",
    description:
      "A symptom-by-symptom guide to .msg files that will not open, show a blank body, or look corrupted — and what actually fixes each one.",
    intro:
      "\"This file cannot be opened\", a blank message body, boxes where the images should be, or a wall of binary garbage. These are four different problems with four different causes, and most of them are not a damaged file.",
    body: (
      <>
        <h2>Symptom: nothing happens, or &quot;no application can open this file&quot;</h2>
        <p>
          <strong>Cause:</strong> no handler is registered for the format. This is the normal
          state on macOS, Linux, iOS and Android, and on Windows machines without Outlook
          installed.
        </p>
        <p>
          <strong>Fix:</strong> open it in the {L("/", "browser viewer")}, which needs
          nothing installed. Platform-specific steps are in the{" "}
          {L("/how-to-open-msg-files", "the platform sections of the main guide")}.
        </p>

        <h2>Symptom: it opens in Notepad or TextEdit as binary garbage</h2>
        <p>
          <strong>Cause:</strong> your system fell back to a text editor. The file is fine;
          a text editor simply cannot interpret a binary container.
        </p>
        <p>
          <strong>Fix:</strong> on Windows, right-click the file, choose{" "}
          <strong>Open with</strong>, and pick Outlook — or use the browser viewer. Do not be
          alarmed by the garbage: seeing fragments of the message text scattered through it
          actually confirms the file is intact.
        </p>

        <h2>Symptom: the message opens but the body is blank</h2>
        <p>
          This is the most common failure in other online viewers, and it is worth
          understanding because it is not your file&apos;s fault.
        </p>
        <p>
          <strong>Cause:</strong> Outlook can store the body in three different places —
          plain text, HTML, or <strong>compressed RTF with the original HTML encapsulated
          inside it</strong>. That third case is extremely common: in a sample of 20 real
          business messages, 17 stored their body only as compressed RTF. A viewer that reads
          the HTML property and gives up when it is missing shows nothing at all.
        </p>
        <p>
          <strong>Fix:</strong> use a viewer that decompresses the RTF and de-encapsulates
          the HTML from it. This site does that, so try the same file{" "}
          {L("/", "in the viewer")} before concluding it is empty.
        </p>

        <h2>Symptom: images in the message are missing or show as empty boxes</h2>
        <p>
          <strong>Cause A — remote images are blocked.</strong> Images hosted on the
          sender&apos;s server are blocked by default here, because they are routinely used
          as tracking pixels that report when you opened the message. Use{" "}
          <strong>Load images</strong> in the banner to fetch them.
        </p>
        <p>
          <strong>Cause B — unresolved inline images.</strong> Images embedded in the message
          are stored as hidden attachments and referenced as{" "}
          <code>cid:something@01D9…</code>. A viewer has to match each reference back to its
          attachment. If it does not, you get broken-image placeholders where the signature
          and logos should be.
        </p>

        <h2>Symptom: non-Latin text is mojibake</h2>
        <p>
          <strong>Cause:</strong> the HTML body is stored as raw bytes that must be decoded
          using the code page named in the message&apos;s own properties. Decoding it as
          UTF-8 by default turns Chinese, Japanese, Korean, Cyrillic and Greek messages into
          nonsense.
        </p>
        <p>
          <strong>Fix:</strong> use a viewer that reads the declared code page. If a message
          looked like garbage elsewhere, it is worth retrying here.
        </p>

        <h2>Symptom: &quot;the file is corrupted&quot; or it will not parse</h2>
        <p>Work through these in order:</p>
        <ol>
          <li>
            <strong>Check the size.</strong> A file of 0 bytes, or a few hundred, did not
            transfer completely. Ask the sender to send it again — ideally zipped, since some
            mail gateways strip or truncate <code>.msg</code> attachments.
          </li>
          <li>
            <strong>Check it is really a .msg.</strong> Every genuine one starts with the same
            eight signature bytes. This viewer detects the real format from those bytes
            rather than the extension, so a mislabelled <code>.eml</code> renamed to{" "}
            <code>.msg</code> still opens.
          </li>
          <li>
            <strong>Check whether it was edited.</strong> Opening a <code>.msg</code> in a
            text editor and saving it will destroy the binary structure irreversibly. Always
            work on a copy.
          </li>
        </ol>

        <h2>Symptom: it asks for a password, or the body is unreadable ciphertext</h2>
        <p>
          <strong>Cause:</strong> the message is encrypted with S/MIME.
        </p>
        <p>
          <strong>Fix:</strong> there is no workaround. Decryption requires the private
          certificate the message was encrypted to, which lives in the intended
          recipient&apos;s certificate store and is not available to a browser. Digitally{" "}
          <em>signed</em> messages are different — those read normally, with the signature
          shown as an attachment.
        </p>

        <h2>Symptom: the attachment list looks wrong</h2>
        <p>
          Inline images are technically attachments too — a long reply chain can carry a
          dozen signature logos. Listing them alongside the real attachments makes it hard to
          find the document you actually want, so they are shown in the body instead and kept
          out of the list. If an attachment you expected is missing entirely, check whether
          the sender&apos;s mail gateway stripped it before it reached you; the{" "}
          {L("/faq", "FAQ")} covers what the raw headers can tell you about that.
        </p>
      </>
    ),
  },
  winmail: {
    title: "How to open a winmail.dat file",
    description:
      "Open winmail.dat in your browser and get the trapped attachments back. What the file is, why you got one, and how the sender stops it recurring.",
    intro:
      "A winmail.dat is not a corrupt file and not a virus. It is what arrives when the sender's Outlook packed the message into Microsoft's TNEF format and the mail system in between could not unpack it. The formatted message and — the part that actually costs you time — every real attachment are sealed inside it.",
    steps: [
      {
        name: "Save the winmail.dat attachment",
        text: "Download it out of the message the way you would any other attachment. Do not rename it; the format is identified by its contents, not its extension.",
      },
      {
        name: "Drop it onto the viewer",
        text: "Open the viewer on this site and drag the file in. It is read inside your browser, so a message you were not meant to forward is not forwarded to a server either.",
      },
      {
        name: "Take the attachments back out",
        text: "The original files appear with their real names restored. Download them individually, or take the whole set as a ZIP.",
      },
    ],
    body: (
      <>
        <h2>Why you received one</h2>
        <p>
          Outlook can send mail in Rich Text Format, a Microsoft-only flavour that standard
          internet mail has no way to express. When it does, Outlook bundles everything that
          does not fit — the formatting, and every attachment — into a single blob called
          TNEF, short for Transport Neutral Encapsulation Format. Another Outlook on the
          receiving end unpacks it silently and you never learn it happened.
        </p>
        <p>
          Anything else — Gmail, Apple Mail, Thunderbird, a phone, a ticketing system, an
          archive — does not know how, so it hands you the raw blob under the name Outlook
          gave it: <code>winmail.dat</code>. Two things follow from that:
        </p>
        <ul>
          <li>
            <strong>It is not your fault and not the sender&apos;s fault.</strong> It is a
            setting on one message, or on one Outlook contact entry, that neither of you
            probably knows exists.
          </li>
          <li>
            <strong>Your attachments are not lost.</strong> They are inside the file. This is
            the important part, and it is the reason a winmail.dat is worth opening rather
            than replying to ask for a resend.
          </li>
        </ul>

        <h2>Open it here</h2>
        <ol>
          <li>Save the <code>winmail.dat</code> out of the message.</li>
          <li>Drop it on the {L("/", "viewer")}.</li>
          <li>
            Read the message, and download the attachments individually or as a ZIP.
          </li>
        </ol>
        <p>
          Parsing runs in your browser. Nothing is uploaded, which matters more here than
          usual: a winmail.dat almost always turns up in a thread that was never meant to
          leave the company, and the obvious alternative — a converter site that wants you to
          upload it — means posting exactly that to a server you know nothing about.
        </p>

        <h2>What comes back, and what does not</h2>
        <p>
          The subject, the sender, the date, the formatted body and every attachment are all
          stored in the file and all come back.
        </p>
        <p>
          The recipient list does not, and no tool can recover it from this file. TNEF is an
          attachment <em>inside</em> a carrying message, and To, Cc and the internet headers
          belong to that carrying message rather than to the attachment. If you need them,
          they are in the mail you received the <code>winmail.dat</code> with — open its
          headers there. A viewer that shows you a recipient list from a winmail.dat is
          guessing.
        </p>

        <h2>What is actually inside the file</h2>
        <p>
          A <code>winmail.dat</code> is not a compressed archive and not a{" "}
          <code>.msg</code>. It is a flat stream of length-prefixed attributes, defined by{" "}
          <strong>MS-OXTNEF</strong>, and it opens with a four-byte signature:{" "}
          <code>0x223E9F78</code>, little-endian. That signature is how a reader identifies
          one regardless of what the file has been renamed to — which matters, because mail
          gateways rename these constantly.
        </p>
        <p>
          After the signature the file is a sequence of records, each carrying a level byte
          saying whether it belongs to the message or to the attachment currently being
          described, an attribute id, a length, the data, and a checksum. Walking it is
          straightforward; the interesting part is what the records contain.
        </p>
        <p>
          Some hold plain values — the subject, the sent date, the sender&rsquo;s display
          name. Others hold a <strong>serialised MAPI property blob</strong>: the same
          property model a <code>.msg</code> uses, flattened into bytes. That is where the
          real content lives, and it is why a TNEF reader ends up sharing most of its logic
          with a <code>.msg</code> reader despite the two formats having no structural
          resemblance at all.
        </p>

        <h2>Why the body is usually not HTML here either</h2>
        <p>
          The body follows the same order of preference as a <code>.msg</code>:{" "}
          <code>PidTagHtml</code> if present, otherwise de-encapsulated{" "}
          <code>PidTagRtfCompressed</code>, otherwise plain text.
        </p>
        <p>
          And it is usually the RTF. That is not a coincidence — it is the whole reason the
          file exists. A <code>winmail.dat</code> is produced precisely when Outlook was
          sending in Rich Text format, so the message it carries is RTF almost by definition.
          A tool that extracts the attachments but shows you a plain-text body has skipped
          the de-encapsulation step, and you are seeing a degraded version of a message that
          is sitting right there in full. {L("/outlook-msg-no-html-body", "The same problem")}{" "}
          affects <code>.msg</code> files, where it is merely very common rather than close
          to universal.
        </p>

        <h2>Why the recipient list is genuinely gone</h2>
        <p>
          This is worth stating precisely, because tools that claim otherwise are guessing.
        </p>
        <p>
          TNEF preserves the sender. It does not preserve To, Cc or the internet headers —
          not because the format lacks a place for them, but because of where the file sits.
          A <code>winmail.dat</code> is an <em>attachment inside a carrying message</em>. The
          recipients and the delivery path belong to that carrying message, and the
          attachment never had a copy.
        </p>
        <p>
          So if you need to know who else received something, the answer is in the mail you
          received the <code>winmail.dat</code> with — open its headers there. Any viewer
          that displays a recipient list extracted from a <code>winmail.dat</code> is showing
          you something it invented.
        </p>

        <h2>Why the attachments still have their real names</h2>
        <p>
          One of the more useful details: TNEF stores an attachment&rsquo;s name twice. There
          is a legacy 8.3-style title — <code>INVOIC~1.PDF</code> — and, in the MAPI property
          blob, <code>PidTagAttachLongFilename</code> holding the real one:{" "}
          <code>Invoice 2026-03.pdf</code>.
        </p>
        <p>
          A reader that only looks at the legacy attribute gives you a folder of truncated
          uppercase names. Preferring the long name is the difference between recovering your
          documents and recovering something you then have to identify one by one. The MIME
          type is stored too, in <code>PidTagAttachMimeTag</code>, so files come back with the
          right type rather than one guessed from a mangled extension.
        </p>
        <p>
          Inline images are marked with a content id, which is what lets them appear in the
          body rather than cluttering the attachment list — the same mechanism{" "}
          <code>cid:</code> references use in ordinary HTML mail.
        </p>

        <h2>A bug worth knowing about, if you are writing a reader</h2>
        <p>
          Strings in a TNEF property blob are stored NUL-terminated. The obvious way to strip
          that padding is to trim trailing zero bytes — and it is wrong for anything Unicode.
        </p>
        <p>
          In UTF-16LE every Latin character has a <code>0x00</code> high byte. The word{" "}
          <em>Whitfield</em> ends <code>64 00</code>, and with its terminator the tail of the
          buffer reads <code>64 00 00 00</code>. Trimming byte-wise eats three zeros, leaves
          an odd number of bytes, and the final letter decodes as a replacement character.
          Every string loses its last character, quietly, in a way that reads as a rendering
          glitch rather than a decoding bug.
        </p>
        <p>
          The fix is to trim in whole code units — two bytes at a time for UTF-16. It is a
          small thing, and it is the kind of small thing that only shows up when you test
          against something other than ASCII.
        </p>

        <h2>How the sender stops it happening again</h2>
        <p>
          Worth passing on, because it fixes the problem at source rather than one message at
          a time. In Outlook on Windows:
        </p>
        <ul>
          <li>
            <strong>For one message:</strong> in the compose window, open{" "}
            <strong>Format Text</strong> and choose <strong>HTML</strong> or{" "}
            <strong>Plain Text</strong> instead of <strong>Rich Text</strong>.
          </li>
          <li>
            <strong>For everything:</strong> <strong>File → Options → Mail</strong>, and
            under &ldquo;Compose messages&rdquo; set the format to HTML.
          </li>
          <li>
            <strong>For one stubborn contact:</strong> this is the usual culprit when it
            happens to the same person every time. Open the contact, double-click the email
            address, and set &ldquo;Internet Format&rdquo; to send plain text or HTML rather
            than Outlook Rich Text. A cached autocomplete entry can hold the old setting, so
            delete the address from the To field with the X in the dropdown before retyping
            it.
          </li>
        </ul>

        <h2>Related symptoms</h2>
        <p>
          The same message may also reach you as <code>Part 1.2</code>,{" "}
          <code>ATT00001.dat</code> or a nameless attachment — all of them are the same TNEF
          blob under a name some intermediate server invented, and all of them open the same
          way. If the file you have is an Outlook message rather than a TNEF blob, the{" "}
          {L("/msg-file-wont-open", "won't-open troubleshooting guide")} covers that case,
          and {L("/what-is-a-msg-file", "what a .msg file is")} explains the format it is in.
        </p>
      </>
    ),
  },
} as const;
