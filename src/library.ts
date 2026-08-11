export const LIBRARY_STORAGE_KEY = "lorefy.native.library.v1";

export function toggleLibraryEntry(entries: string[], workId: string) {
  const current = Array.from(new Set(entries.map(String)));
  return current.includes(workId)
    ? current.filter((entry) => entry !== workId)
    : [...current, workId];
}
