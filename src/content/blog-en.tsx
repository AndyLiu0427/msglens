import Link from "next/link";
import { localizedPath } from "@/lib/site";
import type { BlogPost } from "./blog";

const L = (path: string, children: React.ReactNode) => (
  <Link href={localizedPath(path, "en")}>{children}</Link>
);

export const blogEn: readonly BlogPost[] = [
  {
    slug: "before-you-upload-work-email",
    date: "2026-11-17",
    title: "Before you upload a work email to an online converter",
    description:
      "Most free .msg viewers and converters send your file to their server. What that server can see, why it matters for work email, and a two-minute test to check any tool.",
    body: (
      <>
        <p>
          You have a <code>.msg</code> file, no Outlook, and a deadline. You search for a viewer,
          click the first result, and drop the file in. It works. But for most of those sites, the
          file you just dropped is now on someone else&apos;s computer.
        </p>
        <p>
          That is often fine for a newsletter. It is a different matter for a work email. This post
          explains what an upload exposes, and how to check a tool before you trust it with a
          message.
        </p>

        <h2>What a .msg file actually contains</h2>
        <p>
          A saved email holds more than the text you see. A typical <code>.msg</code> from a
          company mailbox contains:
        </p>
        <ul>
          <li>the full body, including the quoted history of the whole thread;</li>
          <li>every attachment: contracts, invoices, spreadsheets, scans of ID cards;</li>
          <li>
            the names and addresses of everyone on the thread, often including people who are not
            visible in the body;
          </li>
          <li>
            internal routing headers: server names, internal IP addresses, and the names of your
            company&apos;s mail systems.
          </li>
        </ul>
        <p>
          The last two are easy to forget. Even a short reply can tell a stranger who works with
          whom, and how your mail system is built.
        </p>

        <h2>What happens on an upload-based site</h2>
        <p>
          When a converter works by upload, your browser sends the whole file to a server. The
          server parses it and sends back a preview, a PDF or an .eml. You cannot see what happens
          to the file after that. The site may delete it after an hour, as many promise. It may keep
          it in a log or a backup. It may be hosted in a country with different rules on data
          access.
        </p>
        <p>
          None of this means the site is malicious. It means you are relying on a promise you cannot
          check. For a work email, that promise is also not yours to accept. Your employer, and
          often your client, decides where their data may go.
        </p>

        <h2>Questions to ask before you upload</h2>
        <ol>
          <li>
            <strong>Is the email mine to share?</strong> If it came from a client or contains
            customer data, assume it is not.
          </li>
          <li>
            <strong>Does my company have a rule?</strong> Many IT policies forbid uploading company
            files to unapproved services. A quick message to IT is cheaper than an incident report.
          </li>
          <li>
            <strong>Is there an attachment I would not email to a stranger?</strong> If yes, do not
            upload the message that carries it.
          </li>
          <li>
            <strong>Does the tool say where the file goes?</strong> &quot;We delete files after one
            hour&quot; is an upload. &quot;Your file never leaves your browser&quot; is a claim you
            can test.
          </li>
        </ol>

        <h2>A two-minute test for any viewer</h2>
        <p>
          A viewer that parses the file inside your browser does not need a network connection to
          do its work. That gives you a simple test:
        </p>
        <ol>
          <li>Open the viewer page and wait for it to load fully.</li>
          <li>Turn off Wi-Fi, or unplug the network cable.</li>
          <li>Drop in a harmless .msg file, for example a newsletter.</li>
        </ol>
        <p>
          If the message still opens, the parsing happens on your computer. If you get an error or
          an endless spinner, the tool needs its server, which means your file goes there.
        </p>
        <p>
          For a closer look, open your browser&apos;s developer tools (F12), choose the Network tab,
          and drop the file in. An upload shows up as a large POST request with the size of your
          file. A local viewer shows no such request.
        </p>

        <h2>What we do</h2>
        <p>
          {L("/", "MsgLens")} is built the second way. The .msg, .eml or winmail.dat file is read
          by JavaScript in your browser, and the viewer has no upload endpoint. The{" "}
          <a href="https://github.com/AndyLiu0427/msglens" target="_blank" rel="noopener noreferrer">
            source is public
          </a>
          , so you do not have to take that on trust either. Run the offline test above on it.
        </p>
        <p>
          The same applies to its exports. {L("/convert-msg-to-pdf", "Saving as PDF")} and{" "}
          {L("/msg-to-eml", "converting to .eml")} both happen in the page, so a confidential
          message stays on the machine it is already on.
        </p>

        <h2>If you have already uploaded something</h2>
        <p>
          Do not panic, but do not ignore it. Note which site you used and when. If the email held
          customer data or anything under contract, tell your IT or security team. They would much
          rather hear it from you today than find it in a log next year.
        </p>
      </>
    ),
  },
  {
    slug: "msg-file-in-gmail",
    date: "2026-11-18",
    title: "Someone sent a .msg file to your Gmail. Here is what to do",
    description:
      "Gmail cannot show what is inside a .msg attachment. How to read it on a computer or phone without Outlook, and what to ask the sender so it does not happen again.",
    body: (
      <>
        <p>
          A colleague or client forwards you an email, and in Gmail you see an attachment called
          something like <code>RE_ Quote.msg</code>. You click it and Gmail says there is no preview.
          The content is not lost. Gmail just does not read Outlook&apos;s format.
        </p>

        <h2>Why the email arrived as a .msg</h2>
        <p>
          A <code>.msg</code> file is one Outlook email saved as a file. The sender usually did one
          of two things:
        </p>
        <ul>
          <li>saved an email to their desktop and then attached that file to a new message; or</li>
          <li>dragged an email from their inbox into a new message.</li>
        </ul>
        <p>
          Inside Outlook this is normal, because every recipient can open the attachment. Outside
          Outlook, the recipient gets a file that Gmail, Apple Mail and most phones cannot display.
        </p>

        <h2>Read it on a computer</h2>
        <ol>
          <li>In Gmail, point at the attachment and click the download arrow.</li>
          <li>Open {L("/", "the MsgLens viewer")} in another tab.</li>
          <li>Drag the downloaded .msg file onto the page.</li>
        </ol>
        <p>
          You see the message with its formatting, the sender and recipients, the date, and any
          attachments inside it. Click an attachment to save it. If the .msg holds another email,
          which happens with long forwarding chains, click it to open that one in place.
        </p>
        <p>
          The file is parsed in your browser. It is not uploaded, so this is also safe for a work
          email.
        </p>

        <h2>Read it on a phone</h2>
        <p>On an iPhone or iPad:</p>
        <ol>
          <li>In the Gmail app, tap the attachment, then the share icon, then Save to Files.</li>
          <li>Open msglens.app in Safari and tap Choose files.</li>
          <li>Pick the file from the Files app.</li>
        </ol>
        <p>
          On Android, tap the download icon on the attachment in Gmail. Then open msglens.app in
          Chrome, tap Choose files, and pick the file from Downloads.
        </p>

        <h2>Keep a copy you can open later</h2>
        <p>
          If you need the message again, convert it once instead of repeating these steps. In the
          viewer, choose Export, then Save as .eml. An .eml file is the standard email format. Apple
          Mail and Thunderbird open it directly, and most archive tools accept it. If you only need
          to read or print it, use Print / PDF instead. See {L("/msg-vs-eml", "EML vs MSG")} for
          which format suits what.
        </p>

        <h2>What to ask the sender</h2>
        <p>
          If the same person sends you .msg files often, a short, friendly note solves it. Ask them
          to use one of these instead:
        </p>
        <ul>
          <li>
            <strong>Forward the email normally.</strong> The text and attachments arrive in the body
            of the message, readable anywhere.
          </li>
          <li>
            <strong>Attach the files, not the email.</strong> If you only need the invoice or the
            contract, they can save that file from the email and attach it directly.
          </li>
          <li>
            <strong>Save it as PDF</strong> if you need a record of the whole message.
          </li>
        </ul>
        <p>
          Something like this works: &quot;Thanks! The attachment came through as an Outlook .msg,
          which my mail app cannot open. Could you forward the email itself, or send the attachment
          on its own next time?&quot;
        </p>

        <h2>A related case: winmail.dat</h2>
        <p>
          If the attachment is called <code>winmail.dat</code> instead, the cause is different. The
          sender&apos;s Outlook sent the message in Rich Text format, and the real attachments are
          packed inside that file. See {L("/open-winmail-dat", "how to open winmail.dat")}. The same
          viewer unpacks it.
        </p>
      </>
    ),
  },
  {
    slug: "check-who-really-sent-an-email",
    date: "2026-11-19",
    title: "How to check who really sent an email, from the saved file",
    description:
      "The From line is easy to fake. The headers inside a saved .msg or .eml are much harder. A practical guide to Received lines, SPF, DKIM, DMARC and Reply-To.",
    body: (
      <>
        <p>
          Someone forwards you a suspicious email as a file and asks: is this real? The name and
          address on the From line prove almost nothing, because a sender can type anything there.
          The headers tell a more honest story. Here is how to read the parts that matter.
        </p>

        <h2>Step 1: open the raw headers</h2>
        <p>
          Open the .msg or .eml in {L("/", "the viewer")} and choose View raw headers. You get the
          internet headers exactly as the mail servers wrote them. In a .msg file these are stored
          as text inside the file, so they survive even after the email was saved from Outlook.
        </p>
        <p>
          One exception: a draft, or an email saved before it was sent, has no internet headers. If
          the list is empty, the message never travelled over the internet in that form.
        </p>

        <h2>Step 2: look at Authentication-Results</h2>
        <p>
          The receiving mail server checks the sender and writes the results in a header called{" "}
          <code>Authentication-Results</code>. Look for three words:
        </p>
        <ul>
          <li>
            <strong>spf=pass</strong>: the server that sent the message is allowed to send mail for
            that domain.
          </li>
          <li>
            <strong>dkim=pass</strong>: the message carries a valid signature from the domain, and
            the signed parts were not changed on the way.
          </li>
          <li>
            <strong>dmarc=pass</strong>: the domain in the From line matches the domain that passed
            SPF or DKIM. This is the one that ties the checks to the address you see.
          </li>
        </ul>
        <p>
          A message that claims to be from your bank but shows <code>dmarc=fail</code> is a strong
          warning. All three passing is good news, but only for the domain that passed. Check that
          domain carefully: <code>paypa1-support.com</code> can pass all three checks for itself.
        </p>

        <h2>Step 3: compare From, Reply-To and Return-Path</h2>
        <p>
          Three headers name an address, and in a normal email they usually agree:
        </p>
        <ul>
          <li>
            <code>From</code> is what your mail app shows.
          </li>
          <li>
            <code>Reply-To</code> is where your answer goes when you click Reply.
          </li>
          <li>
            <code>Return-Path</code> is where bounce messages go.
          </li>
        </ul>
        <p>
          A From address at a real company with a Reply-To at a free webmail account is a classic
          sign of invoice fraud. The attacker wants your reply, not the real company&apos;s.
          Newsletters and ticket systems use a different Return-Path legitimately, so treat that
          one as a hint, not proof.
        </p>

        <h2>Step 4: read the Received lines from the bottom</h2>
        <p>
          Every server that handles a message adds a <code>Received</code> line at the top. So the
          oldest line, from the first server, is at the bottom. Read them upward and you follow the
          email&apos;s route to you.
        </p>
        <p>
          You do not need to decode every line. Look at the lowest one or two. Does the first server
          belong to the company the email claims to be from, or to a hosting provider in an
          unexpected country? A mismatch does not prove fraud, since many companies send through
          mailing services, but it is worth a question.
        </p>
        <p>
          Note that the lines below the first server you trust can be faked. A sender can add false
          Received lines before the message leaves. The lines written by your own provider are the
          reliable ones.
        </p>

        <h2>Step 5: check the links and attachments without opening them</h2>
        <p>
          In the viewer, remote images stay blocked until you load them, so a tracking pixel does
          not tell the sender that you looked. Point at a link to see where it really goes before
          you click. Treat attachments with macros, password-protected ZIP files, and HTML files as
          dangerous until someone confirms them.
        </p>

        <h2>When to stop and ask</h2>
        <p>
          Headers make a case stronger or weaker. They rarely settle it alone. If money, passwords
          or personal data are involved, contact the sender through a channel you already know,
          such as a phone number from an old invoice, not the one in the email. And if the message
          came to a work mailbox, send it to your security team. The original file, with its
          headers, is exactly what they need.
        </p>
      </>
    ),
  },
  {
    slug: "saving-an-email-as-evidence",
    date: "2026-11-20",
    title: "Saving an email as evidence: keep the original, not only a PDF",
    description:
      "A PDF shows what an email said. The original file shows where it came from. What to keep for a dispute, a complaint or an HR case, and how to prove the file was not changed.",
    body: (
      <>
        <p>
          When an email matters for a dispute, a complaint, an insurance claim or an HR case, most
          people print it to PDF. That is a good start, but it is not enough on its own. Here is why,
          and what to keep instead.
        </p>
        <p>
          This is general, practical advice, not legal advice. If a lawyer or an investigator is
          involved, ask them which format they want before you do anything else.
        </p>

        <h2>What a PDF keeps and loses</h2>
        <p>
          A PDF is a picture of the message. It shows the From, To, Date and Subject lines and the
          body, which makes it easy to read, print and attach to a report.
        </p>
        <p>
          What it loses is everything that shows the email is genuine:
        </p>
        <ul>
          <li>the internet headers: the route through mail servers, with times at each step;</li>
          <li>the Message-ID, a unique identifier the sending server created;</li>
          <li>the authentication results and the DKIM signature from the sending domain;</li>
          <li>the attachments themselves, since a printout lists their names at best.</li>
        </ul>
        <p>
          Anyone can make a convincing PDF of an email that was never sent. It is much harder to
          fake a complete original with consistent headers.
        </p>

        <h2>What to keep</h2>
        <ol>
          <li>
            <strong>The original message file.</strong> From classic Outlook for Windows, drag the
            email to a folder or use File, Save As. This gives you a .msg. From Outlook on the web or
            the new Outlook, choose Download as EML or Save as EML.
          </li>
          <li>
            <strong>A PDF for reading.</strong> Make it from the original, so the two match.
          </li>
          <li>
            <strong>The attachments as separate files</strong>, if they matter on their own.
          </li>
          <li>
            <strong>A short note</strong>: when and how you saved each file, and from which mailbox.
          </li>
        </ol>
        <p>
          Do not forward the email to yourself as a way of saving it. A forward is a new message: it
          has your headers, not the original sender&apos;s.
        </p>

        <h2>.msg or .eml for evidence?</h2>
        <p>
          Both keep the headers as text. They differ in one detail that matters for evidence:
        </p>
        <ul>
          <li>
            An <strong>.eml downloaded from the server</strong> is usually the message as it
            arrived, byte for byte. Its DKIM signature can often still be checked, which shows the
            signed parts were not changed after sending.
          </li>
          <li>
            A <strong>.msg</strong> is Outlook&apos;s own copy. It keeps the headers and some
            Outlook-only data, such as internal Exchange sender details. But Outlook rebuilds the
            body when it stores the message, so a DKIM check against it often fails even when
            nothing was tampered with.
          </li>
        </ul>
        <p>
          If you can get both, keep both. If you only have the .msg, keep it as it is. Do not
          convert it and throw the original away. See {L("/msg-vs-eml", "EML vs MSG")} for the full
          comparison.
        </p>

        <h2>Prove the file has not changed since you saved it</h2>
        <p>
          A hash is a short fingerprint of a file. If even one byte changes, the hash changes.
          Calculate it on the day you save the file and write it in your note.
        </p>
        <p>On Windows, in Command Prompt:</p>
        <pre>
          <code>certutil -hashfile &quot;Complaint.msg&quot; SHA256</code>
        </pre>
        <p>On a Mac, in Terminal:</p>
        <pre>
          <code>shasum -a 256 Complaint.msg</code>
        </pre>
        <p>
          Anyone can run the same command later and compare. If the result matches, the file is the
          one you saved.
        </p>

        <h2>Make the readable copy without changing the original</h2>
        <p>
          Open the original in {L("/", "MsgLens")} and choose Print / PDF. The PDF carries the full
          header block, the whole body and the attachment names. The viewer only reads the file. It
          does not modify it, and it does not upload it, which also matters when the email is
          confidential. Check the hash again afterwards if you want to be certain.
        </p>

        <h2>A short checklist</h2>
        <ul>
          <li>Original file saved from the mailbox, not a forward.</li>
          <li>SHA-256 hash written down with the date.</li>
          <li>PDF made from that original, for reading.</li>
          <li>Important attachments saved separately.</li>
          <li>A note on where each file came from.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "open-msg-on-chromebook",
    date: "2026-11-21",
    title: "How to open .msg files on a Chromebook",
    description:
      "ChromeOS has no Outlook desktop app, and Outlook on the web does not open .msg attachments. Three ways to read a .msg file on a Chromebook, and the one to avoid.",
    body: (
      <>
        <p>
          Chromebooks are common in schools and in companies that run on Google Workspace. Sooner or
          later someone sends a <code>.msg</code> file, and the Chromebook has nothing that can open
          it. Here is what works.
        </p>

        <h2>Why the Chromebook cannot open it</h2>
        <p>
          A .msg file is one email saved by Microsoft Outlook for Windows, in Outlook&apos;s own
          binary format. ChromeOS has no Outlook desktop app, and the Files app does not know the
          format. Outlook on the web does not help either: it can read your mailbox, but it does not
          open a .msg attachment or a .msg file from your drive.
        </p>

        <h2>Option 1: open it in the browser</h2>
        <p>This works on every Chromebook, including managed school and work devices.</p>
        <ol>
          <li>Save the .msg file to your Downloads folder or to Google Drive.</li>
          <li>Open msglens.app in Chrome.</li>
          <li>
            Drag the file from the Files app onto the page, or click to browse and pick it.
          </li>
        </ol>
        <p>
          The message opens with its formatting, inline images and attachments. Click an attachment
          to save it to Downloads. The file is read by the page itself, so nothing is uploaded,
          which matters if your school or company restricts where files may go.
        </p>
        <p>
          If the file is in Google Drive, the Files app shows your Drive in its sidebar. You can
          drag it from there directly.
        </p>

        <h2>Option 2: convert it once, then open it anywhere</h2>
        <p>
          If you keep the message, convert it so you do not need a viewer next time. In the viewer,
          choose Export:
        </p>
        <ul>
          <li>
            <strong>Save as .eml</strong> gives you a standard email file. Upload it to Google Drive
            or keep it with your other records.
          </li>
          <li>
            <strong>Print / PDF</strong>, then &quot;Save as PDF&quot;, gives you a document that
            opens in the Chromebook&apos;s own viewer and in Google Drive.
          </li>
        </ul>
        <p>
          Did someone send you a whole folder of messages? Drop up to 200 files at once, then use
          &quot;All as .eml&quot; to download them together in one ZIP file.
        </p>

        <h2>Option 3: an Android app</h2>
        <p>
          Many Chromebooks run Android apps from the Play Store, and some of those apps open .msg
          files. This can work, but check two things first. Managed devices often block the Play
          Store. And read the app&apos;s privacy details: some viewer apps send the file to a server
          to convert it.
        </p>

        <h2>What to avoid: renaming the file</h2>
        <p>
          Some advice says to rename the .msg to .txt or .eml. Renaming does not change what is
          inside. A renamed .msg opens as unreadable binary text, or not at all. The format has to be
          converted, not renamed.
        </p>

        <h2>For teachers and IT admins</h2>
        <p>
          If students or staff receive .msg files often, a browser viewer needs no install and no
          admin approval, so it works on locked-down devices. It is also worth telling regular
          senders to forward emails normally or send attachments on their own. That way the problem
          does not arrive in the first place.
        </p>
        <p>
          More help: {L("/how-to-open-msg-files", "how to open .msg files")} on other systems, and{" "}
          {L("/msg-file-wont-open", "what to do if a .msg file will not open")}.
        </p>
      </>
    ),
  },
  {
    slug: "move-msg-files-to-apple-mail-or-thunderbird",
    date: "2026-11-22",
    title: "Moving a folder of old .msg files into Apple Mail or Thunderbird",
    description:
      "Switching from Outlook on Windows and left with a folder of saved .msg emails? Convert them to .eml in one go, then import them into Apple Mail or Thunderbird.",
    body: (
      <>
        <p>
          Many people who leave Outlook for Windows have a folder of emails saved over the years:
          receipts, contracts, project threads. On a Mac or with Thunderbird, none of those{" "}
          <code>.msg</code> files open. The fix is to convert them to <code>.eml</code>, the
          standard email format, and then import them.
        </p>

        <h2>Step 1: convert the folder to .eml</h2>
        <ol>
          <li>Open msglens.app.</li>
          <li>
            Click &quot;or choose a folder&quot; and pick your folder, or drag up to 200 .msg files
            onto the page.
          </li>
          <li>Check a few messages in the list to see that they look right.</li>
          <li>
            Click &quot;All as .eml&quot;. You get one ZIP file with an .eml for every message.
          </li>
          <li>Unzip it.</li>
        </ol>
        <p>
          The conversion runs in your browser, so a folder of private email is not uploaded anywhere.
          For more than 200 files, do it in batches. Each .eml keeps the body, the sender and
          recipients, the date and the attachments. What it drops is Outlook-only data, such as
          flags and categories. See {L("/msg-to-eml", "MSG to EML")} for the details.
        </p>
        <p>
          Keep the original .msg folder too, at least until you have checked the import. It costs a
          little disk space and gives you a way back.
        </p>

        <h2>Step 2a: import into Apple Mail</h2>
        <ol>
          <li>
            In Mail, create a mailbox for the archive: Mailbox, New Mailbox, and choose On My Mac
            as the location.
          </li>
          <li>In Finder, open the unzipped folder and select all the .eml files.</li>
          <li>Drag them onto the new mailbox in Mail&apos;s sidebar.</li>
        </ol>
        <p>
          Mail copies the messages into the mailbox. They are then searchable with the rest of your
          mail. An &quot;On My Mac&quot; mailbox stays on this computer. If you want the archive on
          your other devices, create the mailbox under your iCloud or IMAP account instead.
        </p>

        <h2>Step 2b: import into Thunderbird</h2>
        <p>
          Thunderbird imports .eml files with the free ImportExportTools NG add-on:
        </p>
        <ol>
          <li>In Thunderbird, open Add-ons and Themes, search for ImportExportTools NG, and add it.</li>
          <li>Create a local folder for the archive under Local Folders.</li>
          <li>
            Right-click that folder, choose ImportExportTools NG, then Import Messages, and select
            the .eml files.
          </li>
        </ol>
        <p>
          The add-on also imports a whole directory of .eml files, which helps if you kept your old
          folder structure.
        </p>

        <h2>Step 3: check the result</h2>
        <ul>
          <li>Count the messages. The number in the mailbox should match the number of files.</li>
          <li>Open a few with attachments and check that the attachments open.</li>
          <li>Search for a word you know is in an old message.</li>
        </ul>
        <p>
          If a message looks empty in the viewer before conversion, the .msg may store its body only
          as compressed RTF. The viewer handles that case. See{" "}
          {L("/outlook-msg-no-html-body", "why some .msg files have no HTML body")} if you want to
          know why other tools show it blank.
        </p>

        <h2>On Linux, for very large folders</h2>
        <p>
          With thousands of files, a command-line tool can be faster. On Debian and Ubuntu, the{" "}
          <code>libemail-outlook-message-perl</code> package provides <code>msgconvert</code>, which
          turns .msg files into .eml files:
        </p>
        <pre>
          <code>msgconvert *.msg</code>
        </pre>
        <p>
          It writes an .eml next to each .msg. Spot-check the output in a viewer before you import
          it, as with any conversion.
        </p>

        <h2>What about a .pst file?</h2>
        <p>
          A .pst is a whole Outlook mailbox in one file, not a single message. These steps do not
          apply to it. The simplest route is to open the .pst in Outlook on a Windows computer and
          move the messages to an IMAP account that your new mail app also uses.
        </p>
      </>
    ),
  },
  {
    slug: "email-attached-inside-an-email",
    date: "2026-11-23",
    title: "An email attached inside an email: what it is and how to open it",
    description:
      "Why some forwarded emails arrive as an attached .msg or .eml file, why phones show them as unknown files, and how to open nested messages several levels deep.",
    body: (
      <>
        <p>
          You open an email and find, instead of text, an attachment that is itself an email:{" "}
          <code>Original message.eml</code> or <code>FW_ Contract.msg</code>. Sometimes that email
          contains another one. Here is where these come from and how to read them.
        </p>

        <h2>Where nested emails come from</h2>
        <p>There are three common causes:</p>
        <ul>
          <li>
            <strong>Forward as attachment.</strong> Gmail, Outlook and other mail apps can forward a
            message as an attachment instead of in the body. Investigators and IT teams prefer this,
            because the attached copy keeps the original headers.
          </li>
          <li>
            <strong>Dragging an email into a new message</strong> in Outlook. This attaches the
            email as an Outlook item.
          </li>
          <li>
            <strong>Attaching a saved file</strong>: someone saved an email to disk and attached that
            file.
          </li>
        </ul>
        <p>
          Whether you receive a .msg or an .eml depends on how the sender did it and on their mail
          system. A saved .msg file always arrives as a .msg. An attached Outlook item is often
          converted to a standard .eml on its way out of the company, but not always.
        </p>

        <h2>Why phones and webmail struggle</h2>
        <p>
          An attached .eml is a standard format, and many mail apps open it. But phones often show it
          only as a file, and some apps treat it as unknown. An attached .msg is harder: only Outlook
          reads it natively, so Gmail, Apple Mail and most phones show a file they cannot preview.
        </p>
        <p>
          Nesting makes it worse. A forward of a forward can be three or four levels deep, and each
          level needs the same treatment.
        </p>

        <h2>How to open it</h2>
        <ol>
          <li>Save the attachment to your computer or phone.</li>
          <li>Open msglens.app and drop the file in, or tap Choose files on a phone.</li>
          <li>
            The message opens. Any email attached inside it appears in the attachment list with an
            Open message button.
          </li>
          <li>Click it to open the inner email in place. Repeat for each level.</li>
        </ol>
        <p>
          You do not need to download each inner message first. The whole chain is read from the
          one file you opened, inside your browser, without an upload.
        </p>

        <h2>Why the attached copy is worth keeping</h2>
        <p>
          A normal forward copies the text into a new message, and the original headers are lost. The
          attached copy keeps them. That is why a security team asks you to forward a phishing email
          as an attachment: they need the original headers to see where it came from. For how to
          read those headers yourself, see{" "}
          {L("/blog/check-who-really-sent-an-email", "how to check who really sent an email")}.
        </p>

        <h2>Sending one yourself</h2>
        <p>
          If you forward as an attachment to someone outside Outlook, tell them in the body what the
          attachment is and that it is an email. If they only need to read it, a normal forward is
          kinder. If they need the original for an investigation, the attachment is right. Choose by
          what the recipient needs, not by habit.
        </p>
        <p>
          Related: {L("/extract-msg-attachments", "how to extract attachments from a .msg file")}{" "}
          and {L("/open-eml-file", "how to open an .eml file")}.
        </p>
      </>
    ),
  },
];
