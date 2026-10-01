export const en = {
  meta: {
    locale: "en",
    htmlLang: "en",
    dir: "ltr",
  },
  nav: {
    viewer: "Viewer",
    guides: "Guides",
    howTo: "How to open .msg files",
    onMac: "Open .msg on a Mac",
    onPhone: "Open .msg on a phone",
    onWindows: "Open .msg in Windows",
    inGmail: "Open .msg in Gmail",
    toEml: "Convert .msg to .eml",
    wontOpen: "Why won't my .msg file open?",
    winmail: "Open a winmail.dat file",
    whatIs: "What is a .msg file?",
    noHtmlBody: "Why .msg files have no HTML",
    msgVsEml: ".msg vs .eml",
    compare: "Online .msg viewers compared",
    toPdf: "Convert .msg to PDF",
    faq: "FAQ",
    about: "About",
    contact: "Contact",
    workspace: "Workspace",
    pricing: "Pricing",
    privacy: "Privacy",
    terms: "Terms",
    openViewer: "Open viewer",
    theme: "Theme",
    language: "Language",
  },
  hero: {
    badge: "Files never leave your device",
    title: "Open .msg files without Outlook",
    subtitle:
      "Drop an Outlook .msg or .eml file and read it instantly — full formatting, inline images, attachments and headers. Everything is parsed inside your browser, so nothing is ever uploaded.",
    dropTitle: "Drop .msg files here",
    dropSubtitle: "or click to browse — .msg, .eml and winmail.dat, up to 50 files at once",
    dropActive: "Release to open",
    browse: "Choose files",
    privacyNote: "No upload. No account. Nothing you open here leaves this tab.",
    sample: "Try it with a sample message",
    sampleLoading: "Loading sample…",
  },
  trust: {
    local: {
      title: "100% local processing",
      body: "Parsing runs in JavaScript on your own machine. The viewer has no upload endpoint at all — nothing you open here is transmitted, stored or logged. Saving to a workspace is a separate, opt-in feature that requires signing in.",
    },
    fidelity: {
      title: "Faithful rendering",
      body: "HTML bodies, RTF-encapsulated bodies, inline images and non-Latin encodings all render the way Outlook shows them.",
    },
    attachments: {
      title: "Attachments included",
      body: "Preview and download every attachment individually, or grab them all as a single ZIP.",
    },
    offline: {
      title: "Works offline",
      body: "Once the page has loaded you can disconnect entirely and keep opening files.",
    },
  },
  viewer: {
    messages: "Messages",
    noSelection: "Select a message",
    noSelectionHint: "Choose a message from the list to read it here.",
    from: "From",
    to: "To",
    cc: "Cc",
    bcc: "Bcc",
    replyTo: "Reply-To",
    date: "Date",
    sent: "Sent",
    received: "Received",
    created: "Created",
    subject: "Subject",
    noSubject: "(no subject)",
    unknownSender: "Unknown sender",
    details: "Details",
    hideDetails: "Hide details",
    headers: "Internet headers",
    showHeaders: "View raw headers",
    attachments: "Attachments",
    attachment: "attachment",
    attachmentsPlural: "attachments",
    downloadAll: "Download all",
    download: "Download",
    preview: "Preview",
    open: "Open",
    openEmbedded: "Open message",
    remoteBlocked: {
      title: "Remote images blocked",
      bodyOne:
        "1 image would be loaded from an external server. Senders use these to track when you open a message.",
      bodyOther:
        "{count} images would be loaded from an external server. Senders use these to track when you open a message.",
      action: "Load images",
      loaded: "Remote images loaded",
    },
    search: "Search in message",
    searchResults: "{index} of {total}",
    noResults: "No matches",
    print: "Print / PDF",
    printAll: "Save all as PDF",
    printAllTitle: "Save every open message into one PDF, each on its own page",
    messagesNoun: "messages",
    printBlocked:
      "Your browser blocked the print window. Allow pop-ups for this site, then try again.",
    exportEml: "Save as .eml",
    exportTxt: "Save as .txt",
    exportMenu: "Export",
    removeAll: "Clear all",
    remove: "Remove",
    addMore: "Add files",
    dropMore: "Drop to add more files",
    bodySource: {
      html: "HTML body",
      rtf: "Recovered from RTF",
      text: "Plain text body",
      none: "No body",
    },
    empty: "This message has no body content.",
    importance: { high: "High importance", low: "Low importance", normal: "" },
    sortNewest: "Newest first",
    sortOldest: "Oldest first",
    sortName: "By file name",
    filterPlaceholder: "Filter messages",
    keyboard: "Keyboard shortcuts",
    shortcuts: {
      title: "Keyboard shortcuts",
      nextMessage: "Next message",
      prevMessage: "Previous message",
      search: "Search in message",
      print: "Print",
      close: "Close dialog",
      openFiles: "Open files",
    },
  },
  item: {
    when: "When",
    where: "Where",
    attendees: "Attendees",
    recurring: "Repeats",
    email: "Email",
    website: "Website",
    noAppointmentData: "This appointment has no stored start time or location.",
    sparseContact: "Only a name could be recovered from this contact. Outlook stores the rest in named properties that vary between versions.",
    kindMeeting: "Meeting",
    kindAppointment: "Appointment",
    kindContact: "Contact",
    kindTask: "Task",
    kindOther: "Outlook item",
  },
  errors: {
    unsupported:
      '"{name}" is not a readable .msg, .eml or winmail.dat file. It may be corrupted, or it may be a different format that was renamed.',
    tooLarge: '"{name}" is larger than {limit} and was skipped.',
    tooMany: "Only the first {limit} files were opened.",
    parseFailed:
      '"{name}" could not be parsed. It may use an unsupported Outlook feature.',
    encrypted:
      "This message appears to be encrypted or digitally signed (S/MIME). The encrypted payload cannot be decoded without your certificate.",
    sampleFailed:
      "The sample message could not be loaded. Check your connection and try again.",
    isCalendar:
      "\"{name}\" is a calendar file (.ics), not an Outlook message. It already opens everywhere — double-click it to add it to Calendar, Outlook or Google Calendar. Outlook for Mac exports appointments in this format rather than .msg.",
    isVcard:
      "\"{name}\" is a contact card (.vcf), not an Outlook message. Double-click it to add it to Contacts.",
    notDownloaded:
      "\"{name}\" is stored in the cloud and is not downloaded to this device yet, so it could not be read. In Finder or File Explorer, right-click it and choose \"Always keep on this device\" (OneDrive) or \"Download Now\" (iCloud), wait for it to finish, then try again.",
    staleBuild:
      "This page is running an older version of the app that is no longer available. Reload to get the current one — your files were not the problem.",
    reload: "Reload",
    report: "Report this",
    reportSubject: "MsgLens: a file would not open",
    reportIntro:
      "Something went wrong opening a file. The details below describe the failure only — no part of the message is included, and the file itself is not attached.",
    reportAsk:
      "If you can, add where the file came from (Outlook for Windows, Outlook for Mac, a web client, an archive export) and anything else you noticed:",
    dismiss: "Dismiss",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "Are my files uploaded to a server?",
        a: "Not by the viewer. The file you drop is read directly in your browser using JavaScript — there is no upload, and you can verify that by watching your browser's Network tab, or by disconnecting from the internet and opening a file anyway. There is one exception, and it only happens if you ask for it: if you sign in and choose Save to workspace, that specific file is uploaded and stored so your team can open it. Nothing is saved unless you click save.",
      },
      {
        q: "Are online .msg viewers safe to use?",
        a: "It depends on where the file goes. Some free online viewers upload your email to their server to render it; others, including this one, read it inside your browser and send nothing. For private email, use one that stays local. You can check any viewer yourself: open the browser's Network tab, open a file, and look for an upload request the size of your file. Our comparison page lists which popular viewers upload, checked in September 2026.",
      },
      {
        q: "What is a .msg file?",
        a: "A .msg file is Microsoft Outlook's proprietary format for a single item — an email, appointment, contact or task. It is a Compound File Binary (OLE2) container that stores the message properties, body, recipients and attachments as separate internal streams. Unlike .eml, it is not a standard format, which is why most non-Microsoft applications cannot open it.",
      },
      {
        q: "Can I open a .msg file without Outlook?",
        a: "Yes. This viewer reads the file's internal structure directly, so you do not need Outlook, a Microsoft 365 subscription or any installed software. It works on macOS, Windows, Linux, iOS and Android in any modern browser.",
      },
      {
        q: "Does it show attachments?",
        a: "Yes. Every attachment is extracted and can be downloaded individually or as a ZIP archive. Embedded messages — a .msg attached inside another .msg — can be opened in place without downloading them first.",
      },
      {
        q: "I received a winmail.dat file. Can this open it?",
        a: "Yes. winmail.dat appears when Outlook sent the message in Rich Text format and the receiving mail system could not unpack it — the formatted body and, more importantly, every real attachment end up inside that one file. Drop it here and the original attachments come back out, downloadable individually or as a ZIP.",
      },
      {
        q: "Why are images in the message not showing?",
        a: "Images hosted on a remote server are blocked by default because senders commonly use them as tracking pixels to detect when you open a message. Use the \"Load images\" button in the banner to fetch them. Images embedded in the file itself always display immediately.",
      },
      {
        q: "Can I convert .msg to PDF?",
        a: "Yes. Open the message and choose Print / PDF, then select \"Save as PDF\" as the destination. A print-ready copy of the message opens in a new window — allow pop-ups if nothing appears — carrying the full header block, the complete body across as many pages as it needs, and the attachment names.",
      },
      {
        q: "Is there a file size limit?",
        a: "Files up to 100 MB are supported, which comfortably covers messages with large attachments. The limit exists to protect your browser tab from running out of memory, not because of any server constraint.",
      },
      {
        q: "Does it work with encrypted or signed messages?",
        a: "Digitally signed messages are readable — the signature is shown as an attachment. Encrypted (S/MIME) messages cannot be decrypted without your private certificate, which the browser has no access to.",
      },
    ],
  },
  workspace: {
    nav: "Workspace",
    seePlans: "See plans",
    freeUsed: "{used} of {limit} free saves used",
    freeFull: "Free saves used up",
    upgrade: "Upgrade",
    planActive: "{plan} plan",
    planLifetime: "Lifetime",
    planMonthly: "Monthly",
    planYearly: "Yearly",
    renewsOn: "Renews {date}",
    endsOn: "Access until {date}",
    manageBilling: "Manage billing",
    manageBillingFailed: "Could not open billing. Email hello@msglens.app to cancel.",
    openWorkspace: "Open workspace",
    back: "Back",
    close: "Close",
    openInViewer: "Open",
    selectedCount: "{count} selected",
    clearSelection: "Clear",
    moveSelected: "Move to…",
    deleteSelected: "Delete",
    confirmDeleteMany: "Delete {count} saved messages? This cannot be undone.",
    selectAll: "Select all",
    dropToMove: "Drop to move here",
    emptyFolder: "This folder is empty. Drag messages here to file them.",
    emptySearchTitle: "Nothing matches that search",
    emptySearchBody: "Searches cover the subject, sender and file name.",
    emptyTeamTitle: "No saved messages yet",
    emptyTeamBody:
      "Open a .msg, .eml or winmail.dat file in the viewer, then choose Save to workspace. It stays available to everyone on this team.",
    emptyTeamCta: "Open the viewer",
    // English pluralises; Chinese does not, so both locales carry both forms
    // and the caller picks. Cheaper and clearer than an Intl.PluralRules here.
    teamMeta: "{members} members · {files} files",
    teamMetaOneMember: "{members} member · {files} files",
    teamMetaOneFile: "{members} members · {files} file",
    teamMetaOneBoth: "{members} member · {files} file",
    folderMeta: "{count} files",
    folderMetaOne: "{count} file",
    signIn: "Sign in with Google",
    signInShort: "Sign in",
    signOut: "Sign out",
    title: "Workspace",
    // The whole point of the two-mode split, said once, where the decision is
    // actually being made rather than buried in the privacy policy.
    uploadNotice:
      "Files you save here are uploaded to our servers so your team can open them. The viewer on the home page still parses everything in your browser and uploads nothing.",
    signInFailed: "Sign-in did not complete. Please try again.",
    signInCancelled: "Sign-in was cancelled.",
    signInNotConfigured:
      "Sign-in is not set up on this deployment yet. The viewer works as normal.",
    signedOutTitle: "Save messages and share them with your team",
    signedOutBody:
      "Sign in to keep messages in folders and let colleagues open them. The free viewer needs no account and never uploads anything — this is the other mode, and it is opt-in.",
    empty: "Nothing saved here yet.",
    emptyHint: "Open a message in the viewer and choose Save to workspace.",
    save: "Save to workspace",
    saving: "Saving…",
    saved: "Saved",
    alreadySaved: "Already in this workspace",
    newFolder: "New folder",
    folderName: "Folder name",
    rename: "Rename",
    delete: "Delete",
    allFiles: "All files",
    topLevel: "Top level",
    search: "Search saved messages",
    open: "Open",
    download: "Download",
    moveTo: "Move to",
    confirmDeleteFile: "Delete this saved message? This cannot be undone.",
    confirmDeleteFolder:
      "Delete this folder and everything inside it? This cannot be undone.",
    teams: "Teams",
    newTeam: "New team",
    teamName: "Team name",
    personal: "My files",
    members: "Members",
    invite: "Invite someone",
    inviteEmail: "Their email address",
    inviteRole: "Role",
    roleOwner: "Owner",
    roleMember: "Member",
    roleViewer: "Viewer",
    roleHint: "Viewers can read. Members can add and delete. Owners can also invite.",
    inviteCreated: "Invite link created — send it to them",
    copyLink: "Copy link",
    copied: "Copied",
    pendingInvites: "Pending invitations",
    revoke: "Revoke",
    remove: "Remove",
    leave: "Leave team",
    confirmLeave: "Leave this team? You will lose access to its files.",
    inviteTitle: "You have been invited",
    inviteAccept: "Join team",
    inviteSignIn: "Sign in to accept this invitation",
    inviteAccepted: "You have joined {team}.",
    storageUsed: "{count} files",
  },
  seo: {
    about:
      "Who builds MsgLens, why it exists, how the in-browser parsing works and how to verify it yourself, and what the tool cannot do.",
    contact:
      "How to reach MsgLens — bug reports, data deletion requests and corrections. What to include when a file will not open.",
    pricing:
      "The MsgLens viewer is free forever. Plans for the saved workspace: $5 a month, $39 a year, or $49 once for lifetime access.",
  },
  handoff: {
    title: "Open a message",
    waiting: "Waiting for the message…",
    from: "This message was handed over by",
    local: "It was read in this tab and never sent to a server — the same as any file you drop here.",
    noFile: "No message was handed over. Drop a file below to read one.",
  },
  footer: {
    tagline: "A fast, private .msg and .eml viewer that runs entirely in your browser.",
    product: "Product",
    resources: "Resources",
    legal: "Legal",
    rights: "All rights reserved.",
    madeWith: "No tracking of message contents. Ever.",
    sourceCode: "Source code on GitHub",
  },
  ads: {
    label: "Advertisement",
  },
  pricing: {
    title: "The viewer is free. Keeping things is not.",
    intro:
      "Opening a .msg, .eml or winmail.dat file costs nothing and always will. There is no account, no upload, and nothing leaves your browser — you can check that in the Network tab, or by turning your Wi-Fi off. A plan is for the other half: keeping what you open, filing it, and letting your team see it.",
    perMonth: "{price} / month",
    perMonthBilledYearly: "{price} / month, billed yearly",
    once: "once",
    billedMonthly: "Billed monthly",
    billedYearly: "{price} a year",
    payOnce: "One payment. No renewal.",
    save: "Save {percent}%",
    bestValue: "Most people pick this",
    free: {
      name: "Free",
      price: "$0",
      tagline: "The viewer, plus enough workspace to judge it.",
      cta: "Open the viewer",
    },
    monthly: { name: "Monthly", cta: "Choose monthly" },
    yearly: { name: "Yearly", cta: "Choose yearly" },
    lifetime: {
      name: "Lifetime",
      cta: "Buy lifetime",
      pitch: "Ten dollars more than a year. Then never again.",
    },
    freeFeatures: [
      "Open .msg, .eml and winmail.dat — no limit",
      "Everything parsed in your browser",
      "Attachments, headers and the real HTML body",
      "Save up to {limit} messages",
    ],
    paidFeatures: [
      "Everything in Free",
      "Unlimited saved messages",
      "Folders",
      "Shared team workspaces",
      "Invite people by email",
    ],
    notReady: "Checkout is not open yet",
    notReadyBody:
      "The plans below are final, but payments are not switched on. The free viewer and the {limit}-message workspace work today.",
    currentPlan: "Your current plan",
    faqTitle: "Before you buy",
    faq: [
      {
        q: "What happens to my files if I stop paying?",
        a: "They stay, and you keep full access to read and download every one of them. A plan buys the ability to put more in — never the ability to get back what is already there. Holding someone's own mail hostage is not a business model we are interested in.",
      },
      {
        q: "Is the free viewer going to stay free?",
        a: "Yes. It is the reason most people arrive, it runs entirely on your machine, and it costs us nothing per use. Nothing about it is behind a plan and nothing about it is planned to be.",
      },
      {
        q: "Why is lifetime barely more than a year?",
        a: "Because we would rather you decide once. A subscription you forget about is worth more to us and less to you, and we would rather not build a business on that. If you expect to still be opening .msg files in a year or so, buy lifetime.",
      },
      {
        q: "Who takes the payment?",
        a: "Paddle, as the merchant of record — they are the seller on your receipt and they handle VAT, GST and sales tax wherever you are. Card details are entered in their window and never touch this site.",
      },
      {
        q: "Can I get a refund?",
        a: "Within 30 days, for any reason, by emailing us. Say the word refund and that is the whole process.",
      },
    ],
  },

  cta: {
    updated: "Updated {date}",
    title: "Open a .msg file right now",
    body: "No sign-up, no upload, no software to install.",
    button: "Open the viewer",
  },
} as const;

/**
 * Widen the literal types produced by `as const` back to `string`.
 *
 * `as const` is kept on the English dictionary so nested arrays stay readonly
 * and structure errors surface immediately, but without widening, every
 * translated string would fail to satisfy its English literal type.
 */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends (...args: infer A) => infer R
        ? (...args: A) => R
        : T extends readonly (infer U)[]
          ? readonly Widen<U>[]
          : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof en>;
