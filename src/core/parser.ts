import * as FileSystem from 'expo-file-system/legacy';

export type MediaType = 'PHOTO' | 'VIDEO';

export interface MemoryItem {
  localPath: string;
  mediaType: MediaType;
  date: Date;
}

export interface ScanResult {
  memories: MemoryItem[];
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.heic', '.png']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov']);
const MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export async function scanMediaFiles(extractedDirs: string[]): Promise<ScanResult> {
  const dated: MemoryItem[] = [];
  const undated: Omit<MemoryItem, 'date'>[] = [];

  for (const dir of extractedDirs) {
    const result = await walkDir(ensureTrailingSlash(dir));
    dated.push(...result.dated);
    undated.push(...result.undated);
  }

  dated.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Files with no recoverable date are grouped just before the earliest dated
  // memory in this import, rather than defaulting to "now" (which would push
  // them to the front of the library instead of lumping them with their batch).
  const earliest = dated.length > 0 ? dated[dated.length - 1].date : new Date();
  const undatedAnchor = new Date(earliest.getTime() - 1000);
  const undatedMemories = undated.map((m) => ({ ...m, date: undatedAnchor }));

  return { memories: [...dated, ...undatedMemories] };
}

interface WalkResult {
  dated: MemoryItem[];
  undated: Omit<MemoryItem, 'date'>[];
}

async function walkDir(dir: string): Promise<WalkResult> {
  const dated: MemoryItem[] = [];
  const undated: Omit<MemoryItem, 'date'>[] = [];

  let entries: string[];
  try {
    entries = await FileSystem.readDirectoryAsync(dir);
  } catch {
    return { dated, undated };
  }

  for (const entry of entries) {
    const path = `${dir}${entry}`;
    const ext = getExtension(entry);

    if (MEDIA_EXTENSIONS.has(ext)) {
      const mediaType: MediaType = IMAGE_EXTENSIONS.has(ext) ? 'PHOTO' : 'VIDEO';
      const date = parseDateFromFilename(entry);
      if (date) {
        dated.push({ localPath: path, mediaType, date });
      } else {
        undated.push({ localPath: path, mediaType });
      }
    } else {
      // Not a recognized media file — but it may still be a directory, including
      // one whose name contains a dot (the old "no extension" heuristic wrongly
      // treated those as files and skipped any media inside them). Check, don't guess.
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (info.isDirectory) {
          const sub = await walkDir(`${path}/`);
          dated.push(...sub.dated);
          undated.push(...sub.undated);
        }
        // Non-media file (json/html/etc.) → intentionally ignored.
      } catch {
        // Unreadable entry → ignore.
      }
    }
  }

  return { dated, undated };
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

// Handles Snapchat export filenames like "2024-01-15 12-34-56 UTC.jpg"
// and common variants like "2024-01-15_12-34-56.jpg" or "20240115_123456.jpg"
function parseDateFromFilename(filename: string): Date | null {
  // "YYYY-MM-DD HH-MM-SS" or "YYYY-MM-DD_HH-MM-SS" or "YYYY-MM-DDTHH:MM:SS"
  const full = filename.match(/(\d{4})-(\d{2})-(\d{2})[\s_T](\d{2})[-:](\d{2})[-:](\d{2})/);
  if (full) {
    const [, y, mo, d, h, mi, s] = full;
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
    if (!isNaN(date.getTime())) return date;
  }

  // "YYYYMMDD_HHMMSS"
  const compact = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (compact) {
    const [, y, mo, d, h, mi, s] = compact;
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
    if (!isNaN(date.getTime())) return date;
  }

  // Fall back to date-only "YYYY-MM-DD"
  const dateOnly = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    const [, y, mo, d] = dateOnly;
    const date = new Date(`${y}-${mo}-${d}T00:00:00Z`);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}
