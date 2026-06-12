import { MemoryItem } from '../core/parser';

export const MOCK_MEMORY_COUNT = 75;

export function generateMockMemories(): MemoryItem[] {
  return Array.from({ length: MOCK_MEMORY_COUNT }, (_, i) => {
    const d = new Date(Date.now() - i * 86_400_000 * 2);
    return {
      date: d,
      rawDate: d.toISOString(),
      mediaType: i % 5 === 0 ? 'VIDEO' : 'PHOTO',
      downloadLink: `https://mock.snapsport.dev/memory-${i}.${i % 5 === 0 ? 'mp4' : 'jpg'}`,
      location:
        i % 7 === 0
          ? { latitude: 40.7128 + i * 0.001, longitude: -74.006 + i * 0.001 }
          : undefined,
    };
  });
}
