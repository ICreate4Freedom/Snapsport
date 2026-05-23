// Parses memories_history.json exported from Snapchat's "My Data" page.
// Snapchat wraps media in a "Saved Media" array. Each item has a date string,
// media type, and a pre-signed AWS S3 URL that expires ~7 days after export.
//
// Actual schema observed from real export (2026):
//   "Media Type": "Image" | "Video"  (not PHOTO/VIDEO)
//   "Location": "Latitude, Longitude: 41.88, -87.62"  (string, not object)
//   "Download Link": "<url>"
//   "Media Download Url": "<url>"  (alternative URL field, same content)

export type MediaType = 'PHOTO' | 'VIDEO';

export interface MemoryItem {
  date: Date;
  rawDate: string;
  mediaType: MediaType;
  downloadLink: string;
  location?: { latitude: number; longitude: number };
}

export interface ParseResult {
  memories: MemoryItem[];
  skipped: number;
}

interface RawMemory {
  Date?: string;
  'Media Type'?: string;
  'Download Link'?: string;
  'Media Download Url'?: string;
  Location?: string;
}

export function parseMemoriesJson(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON — make sure you selected memories_history.json');
  }

  const root = parsed as Record<string, unknown>;
  const savedMedia = root['Saved Media'];

  if (!Array.isArray(savedMedia)) {
    throw new Error('Unexpected format — "Saved Media" array not found');
  }

  const memories: MemoryItem[] = [];
  let skipped = 0;

  for (const item of savedMedia as RawMemory[]) {
    // Try both URL fields — Snapchat uses either depending on export type
    const link = item['Download Link'] || item['Media Download Url'];
    const rawDate = item['Date'];
    const rawType = item['Media Type'];

    if (!link || !rawDate || !rawType) {
      skipped++;
      continue;
    }

    // Snapchat exports "Image" and "Video" (title case)
    const mediaType = rawType.toLowerCase() === 'video' ? 'VIDEO' : 'PHOTO';

    let date: Date;
    try {
      // Snapchat format: "2026-05-16 22:22:54 UTC"
      date = new Date(rawDate.replace(' UTC', 'Z').replace(' ', 'T'));
      if (isNaN(date.getTime())) throw new Error();
    } catch {
      date = new Date();
    }

    const memory: MemoryItem = { date, rawDate, mediaType, downloadLink: link };

    const loc = parseLocation(item.Location);
    if (loc) memory.location = loc;

    memories.push(memory);
  }

  // Most recent first
  memories.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { memories, skipped };
}

// Parses "Latitude, Longitude: 41.8812, -87.62373" → { latitude, longitude }
// Returns undefined for missing, malformed, or 0,0 (no-data) coordinates.
function parseLocation(raw?: string): { latitude: number; longitude: number } | undefined {
  if (!raw) return undefined;
  const match = raw.match(/Latitude,\s*Longitude:\s*([-\d.]+),\s*([-\d.]+)/i);
  if (!match) return undefined;
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return undefined;
  return { latitude: lat, longitude: lon };
}

export function generateFilename(memory: MemoryItem, index: number): string {
  const d = memory.date;
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const ext = memory.mediaType === 'VIDEO' ? 'mp4' : 'jpg';
  return `snap_${datePart}_${String(index).padStart(5, '0')}.${ext}`;
}
