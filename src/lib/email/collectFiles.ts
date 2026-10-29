/**
 * Files from a drop, including the contents of any dropped folder.
 *
 * `dataTransfer.files` lists a dropped folder as one zero-byte entry and
 * nothing inside it. The entry API is the only way in, and it must be read
 * during the drop event: the items are gone once the handler returns. So the
 * entries are taken synchronously and walked afterwards.
 *
 * Inside folders only mail files are kept, since a folder of saved mail often
 * holds other things too. A file dropped on its own is passed through, so an
 * unsupported one still gets its "cannot open this" message.
 */

const MAIL = /\.(msg|eml|dat)$/i;

export function collectFiles(dt: DataTransfer): Promise<File[]> {
  const entries = Array.from(dt.items ?? [])
    .filter((item) => item.kind === "file")
    .map((item) => item.webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => Boolean(entry));

  if (!entries.some((entry) => entry.isDirectory)) return Promise.resolve(Array.from(dt.files));

  return Promise.all(entries.map((entry) => walk(entry, entry.isDirectory))).then((lists) =>
    lists.flat(),
  );
}

/** Keep only mail files from a folder, everything from a direct drop. */
export function mailFilesOnly(files: FileList | File[]): File[] {
  return Array.from(files).filter((file) => MAIL.test(file.name));
}

async function walk(entry: FileSystemEntry, inFolder: boolean): Promise<File[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject),
    );
    return !inFolder || MAIL.test(file.name) ? [file] : [];
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const children: FileSystemEntry[] = [];
  // readEntries returns a batch at a time (100 in Chrome); empty means done.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    if (batch.length === 0) break;
    children.push(...batch);
  }
  const lists = await Promise.all(children.map((child) => walk(child, true)));
  return lists.flat();
}
