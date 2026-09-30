import Link from "next/link";
import { localizedPath } from "@/lib/site";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "en")}>{children}</Link>
);

/**
 * Names other tools, so every claim here is one that was checked, dated and can
 * be re-checked by the reader. What was not tested says so.
 */
export const enCompare = {
  title: "Free .msg viewers compared: which upload your email?",
  description:
    "Four free .msg viewers checked on 30 September 2026: which send your email to a server, their size limits and formats, and how to check any viewer yourself.",
  intro:
    "Short answer: two of the four upload the file to their own server before showing it; two read it inside your browser and send nothing. If the email is confidential, use one of the two that stay local, or check for yourself in under a minute.",
  body: (
    <>
      <h2>The comparison</h2>
      <p>
        Checked on <strong>30 September 2026</strong> by reading each site&apos;s own page and
        upload code. No file was uploaded to any service to produce this table.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Where your file goes</th>
              <th>Size limit</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MsgLens (this site)</td>
              <td>Stays in your browser</td>
              <td>100 MB</td>
              <td>.msg, .eml and winmail.dat; attachments; PDF and .eml export. Open source (MIT).</td>
            </tr>
            <tr>
              <td>msg-viewer.pages.dev</td>
              <td>Stays in your browser; its code contains no upload call</td>
              <td>Not stated</td>
              <td>.msg; its code includes attachment handling. Open source.</td>
            </tr>
            <tr>
              <td>Encryptomatic Viewer</td>
              <td>Uploaded to its server (form upload)</td>
              <td>75 MB</td>
              <td>.msg, .eml and winmail.dat; attachments.</td>
            </tr>
            <tr>
              <td>CoolUtils MSG to PDF</td>
              <td>Uploaded to its server; it says uploads are deleted within 24 hours</td>
              <td>50 MB</td>
              <td>A converter rather than a viewer: outputs PDF, DOC, HTML, JPG or TXT.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Both local tools load a third-party script: msg-viewer.pages.dev loads Google
        Analytics, and this site loads Google AdSense. Neither sends the file. Whether the
        other tools render messages whose body is stored only as compressed RTF was{" "}
        <strong>not tested</strong>; that would have meant uploading a message to them.
      </p>

      <h2>Why it matters for email in particular</h2>
      <p>
        A saved .msg is rarely a newsletter. It is a forwarded offer letter, a contract
        thread, a complaint with the customer&apos;s details in the signature. Uploading it
        to read it hands a complete copy, headers and attachments included, to a server you
        know nothing about. A deletion promise may well be kept, but it is a promise; a
        viewer that never sends the file does not need one.
      </p>

      <h2>How to check any viewer yourself</h2>
      <ol>
        <li>
          Open the viewer, then open your browser&apos;s developer tools (F12, or
          Cmd+Option+I on a Mac) and choose the <strong>Network</strong> tab.
        </li>
        <li>Open a .msg file in the viewer.</li>
        <li>
          Look for a request the size of your file, usually a <code>POST</code>. If there is
          one, the file was uploaded. If the only requests are small ones for scripts or
          ads, it was read locally.
        </li>
        <li>
          Stronger test: load the viewer, disconnect from the network, then open a file. A
          local viewer still works; an uploading one cannot.
        </li>
      </ol>

      <h2>When uploading is fine</h2>
      <p>
        For a message you would happily post publicly, any of these tools will do, and a
        converter such as CoolUtils offers output formats a viewer does not. The choice only
        matters when the content is private, which for saved email is most of the time.
      </p>

      <h2>Related</h2>
      <ul>
        <li>{L("/how-to-open-msg-files", "How to open a .msg file without Outlook")}</li>
        <li>{L("/outlook-msg-no-html-body", "Why most Outlook messages have no HTML body")}</li>
        <li>{L("/about", "How MsgLens reads files in the browser, and how to verify it")}</li>
      </ul>
    </>
  ),
};
