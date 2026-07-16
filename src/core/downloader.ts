import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import { MemoryItem } from './parser';
import { ExportDestination } from '../store/useStore';

export type DownloadStatus = 'pending' | 'saving' | 'saved' | 'failed';

export interface DownloadJob {
  memory: MemoryItem;
  index: number;
  status: DownloadStatus;
  error?: string;
}

export interface DownloadProgress {
  total: number;
  saved: number;
  failed: number;
  active: number;
}

type ProgressCallback = (progress: DownloadProgress, job: DownloadJob) => void;

const CONCURRENCY = 5;
const ALBUM_NAME = 'SnapsPort';

type Asset = Awaited<ReturnType<typeof MediaLibrary.createAssetAsync>>;
type Album = NonNullable<Awaited<ReturnType<typeof MediaLibrary.getAlbumAsync>>>;

// Resolves the destination album exactly once. `seededAssetId` is the id of the
// asset used to create the album (createAlbumAsync adds it implicitly) so the
// caller can avoid adding it a second time; it's null when the album already existed.
type AlbumResolver = (seedAsset: Asset) => Promise<{ album: Album; seededAssetId: string | null }>;

// Single-flight album resolution. With CONCURRENCY workers, a naive
// getAlbumAsync-then-createAlbumAsync check-then-act races: all workers see no
// album and each creates one, producing duplicate "SnapsPort" albums with assets
// split across them. Sharing one promise guarantees a single createAlbumAsync.
function makeAlbumResolver(): AlbumResolver {
  let pending: Promise<{ album: Album; seededAssetId: string | null }> | null = null;
  return (seedAsset) => {
    if (!pending) {
      pending = (async () => {
        const existing = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        if (existing) return { album: existing, seededAssetId: null };
        const created = await MediaLibrary.createAlbumAsync(ALBUM_NAME, seedAsset, false);
        return { album: created, seededAssetId: seedAsset.id };
      })().catch((err) => {
        // Let a later worker retry album creation instead of poisoning the run.
        pending = null;
        throw err;
      });
    }
    return pending;
  };
}

async function saveToLibrary(
  localPath: string,
  destination: ExportDestination,
  resolveAlbum: AlbumResolver
): Promise<void> {
  const asset = await MediaLibrary.createAssetAsync(localPath);
  if (destination !== 'album') return;

  try {
    const { album, seededAssetId } = await resolveAlbum(asset);
    // Skip the asset that createAlbumAsync already added, or it'd be duplicated.
    if (asset.id !== seededAssetId) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }
  } catch {
    // Asset is still in Camera Roll even if the album step fails.
  }
}

export async function runDownloadQueue(
  jobs: DownloadJob[],
  destination: ExportDestination,
  onProgress: ProgressCallback,
  signal: { cancelled: boolean },
  cleanupPaths?: string[]
): Promise<DownloadProgress> {
  const progress: DownloadProgress = {
    total: jobs.length,
    saved: 0,
    failed: 0,
    active: 0,
  };

  let cursor = 0;
  const resolveAlbum = makeAlbumResolver();

  async function worker() {
    while (cursor < jobs.length) {
      if (signal.cancelled) break;

      const job = jobs[cursor++];
      if (!job) break;

      job.status = 'saving';
      progress.active++;
      onProgress({ ...progress }, { ...job });

      try {
        await saveToLibrary(job.memory.localPath, destination, resolveAlbum);
        job.status = 'saved';
        progress.saved++;
      } catch (err) {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : 'Unknown error';
        progress.failed++;
      } finally {
        progress.active--;
        onProgress({ ...progress }, { ...job });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  if (cleanupPaths?.length) {
    await Promise.all(
      cleanupPaths.map((p) => FileSystem.deleteAsync(p, { idempotent: true }))
    );
  }

  return progress;
}
