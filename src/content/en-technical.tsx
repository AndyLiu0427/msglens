import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "en")}>{children}</Link>
);

/**
 * First-hand technical writing.
 *
 * Everything here comes from building the parser and measuring real files —
 * the 17-of-20 figure, the `\par` trap, the stylesheet loss. None of it is
 * available elsewhere, because nobody who has not written an MS-OXRTFEX
 * de-encapsulator has reason to know it.
 *
 * That is the point. The rest of the site answers "how do I open this file",
 * which every competitor also answers. This answers "why is this file the way
 * it is", which none of them can.
 */
export const enTechnical = {
  rtfBody: {
    title: "Why most Outlook messages have no HTML body",
    description:
      "Measured against 20 real business .msg files: 17 stored their body only as compressed RTF. What that means, why Outlook does it, and where naive readers break.",
    intro:
      "If you open a .msg file expecting to find HTML in it, most of the time you will not. Outlook stores the body in up to three different places, and the one everybody looks for first is usually empty. This is the single biggest reason .msg viewers render blank pages.",
    body: (
      <>
        <h2>The measurement</h2>
        <p>
          Against a corpus of 20 real business <code>.msg</code> files — offers,
          invoices, quotations, forwarded threads, the ordinary contents of a working
          mailbox — <strong>17 of them had no HTML body at all</strong>. The formatted
          message existed only as compressed RTF.
        </p>
        <p>
          That is 85%. A viewer that reads <code>PidTagHtml</code>, finds nothing, and gives
          up will render an empty page for more than four files in five. This is not an edge
          case; it is the normal case, and it is why so many <code>.msg</code> tools look
          broken on real mail while working perfectly on a test message.
        </p>
        <p>
          The number is worth stating precisely because it is so rarely stated at all. Most
          documentation describes the three body properties as alternatives without saying
          which one you will actually encounter.
        </p>

        <h2>The three places a body can live</h2>
        <p>
          A <code>.msg</code> file is a Compound File Binary container — the same OLE2
          structure Office used for <code>.doc</code> and <code>.xls</code> — holding MAPI
          properties as separate internal streams. The body may appear in three of them:
        </p>
        <ul>
          <li>
            <strong><code>PidTagHtml</code></strong> (0x1013) — the HTML body as raw bytes.
            This is the one everybody reads. It is frequently absent.
          </li>
          <li>
            <strong><code>PidTagRtfCompressed</code></strong> (0x1009) — the body as RTF,
            compressed. Present on almost every message that has any formatting at all.
          </li>
          <li>
            <strong><code>PidTagBody</code></strong> (0x1000) — plain text. Nearly always
            present, and nearly always a poor substitute: tables collapse, emphasis
            disappears, and a quoted reply chain becomes an undifferentiated wall.
          </li>
        </ul>
        <p>
          The correct fallback order is HTML, then RTF de-encapsulated back to HTML, then
          plain text. Skipping the middle step is what costs you 85% of your fidelity.
        </p>

        <h2>What &ldquo;compressed RTF&rdquo; actually means</h2>
        <p>
          The compression is not gzip or deflate. It is a Microsoft-specific LZ77 variant
          described in <strong>MS-OXRTFCP</strong>, and its most unusual feature is that it
          starts from a preloaded dictionary — a 207-byte string of common RTF control words
          such as <code>{"\\viewkind"}</code>, <code>{"\\par"}</code> and{" "}
          <code>{"\\pard"}</code>.
        </p>
        <p>
          Because those tokens are already in the window before the first byte of your
          message is read, a short RTF document compresses far better than a general-purpose
          algorithm would manage. It also means you cannot decompress the stream with any
          standard tool: without that exact dictionary, the back-references at the start of
          the stream point at nothing.
        </p>
        <p>
          A stream can also be stored uncompressed, signalled by the magic value{" "}
          <code>MELA</code> rather than <code>LZFu</code> in its header. Readers that assume
          compression unconditionally fail on those.
        </p>

        <h2>The part that surprises people: the RTF contains HTML</h2>
        <p>
          When Outlook sends an HTML message, it does not throw the HTML away and re-author
          it as RTF. It <em>wraps</em> it. The RTF stream carries the original HTML inside
          it, marked up so that an RTF reader and an HTML reader each see what they need.
          The mechanism is <strong>MS-OXRTFEX</strong>, and it works through three devices:
        </p>
        <ul>
          <li>
            <code>{"\\fromhtml1"}</code> in the header, declaring that this RTF is
            encapsulated HTML rather than native RTF.
          </li>
          <li>
            <code>{"{\\*\\htmltag<N> ... }"}</code> destinations, each holding a fragment of
            the original HTML source verbatim. The number encodes what kind of fragment it
            is.
          </li>
          <li>
            <code>{"\\htmlrtf"}</code> / <code>{"\\htmlrtf0"}</code> toggles, which bracket
            RTF that exists only so RTF readers see something sensible. An HTML
            de-encapsulator must ignore everything between them.
          </li>
        </ul>
        <p>
          Reassembling the HTML means walking the RTF, emitting the contents of the{" "}
          <code>htmltag</code> destinations, honouring the toggles, and decoding the
          character escapes — <code>{"\\'hh"}</code> for a byte in the declared code page,{" "}
          <code>{"\\uN"}</code> for a Unicode code point followed by <code>N</code> fallback
          characters to skip. Get the skip count wrong and every non-Latin message fills with
          stray characters.
        </p>

        <h2>A trap worth knowing about</h2>
        <p>
          In HTML de-encapsulation, a bare <code>{"\\par"}</code> is RTF-side layout. The
          real paragraph structure is already in the <code>&lt;p&gt;</code> tags carried by
          the <code>htmltag</code> destinations, so emitting a line break for{" "}
          <code>{"\\par"}</code> duplicates it. The correct behaviour is to drop it.
        </p>
        <p>
          Except inside an <code>{"\\*\\htmltag"}</code> destination, where it means the
          opposite. There it encodes a newline that was present in the original HTML source —
          Outlook writes <code>{"{\\*\\htmltag4 \\par }"}</code> for one. HTML collapses that
          newline to a space. Drop it and adjacent words weld together.
        </p>
        <p>
          The symptom is unmistakable once you have seen it: a sentence reading{" "}
          <em>&ldquo;the prevailing9% GST&rdquo;</em>, where the source had a line break
          between <em>prevailing</em> and <em>9%</em>. Two rules for the same control word,
          decided by context.
        </p>

        <h2>The other half of the fidelity problem</h2>
        <p>
          Recovering the HTML is not the end of it. Outlook writes its formatting into a{" "}
          <code>&lt;style&gt;</code> block in <code>&lt;head&gt;</code>, not into inline{" "}
          <code>style</code> attributes on each element.
        </p>
        <p>
          Any viewer that sanitises the message and keeps only the <code>&lt;body&gt;</code>{" "}
          fragment — which is the default behaviour of most HTML sanitisers, including
          DOMPurify — silently discards that stylesheet. The text survives; the table borders,
          fonts, colours and spacing do not. On a real message this is the difference between
          a formatted quotation table and an unstyled list of numbers.
        </p>
        <p>
          It is a quiet failure. Nothing errors, nothing is missing from the text, and the
          result looks plausible until you compare it against Outlook side by side.
        </p>

        <h2>How to check your own files</h2>
        <p>
          A <code>.msg</code> is a compound file, so any OLE2 browser will list its streams.
          The body properties appear as <code>__substg1.0_1013</code> (HTML),{" "}
          <code>__substg1.0_1009</code> (compressed RTF) and <code>__substg1.0_1000</code>{" "}
          (plain text), with a suffix indicating the data type.
        </p>
        <p>
          If <code>1013</code> is absent and <code>1009</code> is present, you have one of the
          85%, and any tool that renders your message correctly is doing the RTF work
          described above.
        </p>

        <h2>What this means when choosing a viewer</h2>
        <p>
          Two questions separate a tool that works on real mail from one that works on test
          messages:
        </p>
        <ul>
          <li>
            <strong>Does it de-encapsulate compressed RTF?</strong> Open a message you know
            has formatting. If the body is blank or plain, it does not.
          </li>
          <li>
            <strong>Does it keep the message&rsquo;s own stylesheet?</strong> Open something
            with a table. If the borders are gone, it dropped the{" "}
            <code>&lt;head&gt;&lt;style&gt;</code>.
          </li>
        </ul>
        <p>
          Both are checkable in about thirty seconds with a file you already have. The{" "}
          {L("/", "viewer on this site")} does both, which is why it was built —{" "}
          {L("/what-is-a-msg-file", "what a .msg file is")} covers the container format in
          more detail, and {L("/msg-file-wont-open", "the troubleshooting guide")} covers the
          failures that are not about the body at all.
        </p>
      </>
    ),
  },
} as const;
