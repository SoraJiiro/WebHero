export const LAST_CHART_KEY = "web-hero-last-chart-v1";
const AUDIO_CACHE_PREFIX = "web-hero-audio-v1-";

function audioUrl(id, index, origin) {
  return `${origin}/__webhero-audio__/${encodeURIComponent(id)}/${index}`;
}

function readRecord(storage) {
  try {
    const record = JSON.parse(storage.getItem(LAST_CHART_KEY));
    return record?.version === 1 && record.chart && record.audioFiles
      ? record
      : null;
  } catch {
    return null;
  }
}

async function deleteCache(cacheStorage, name) {
  if (!name || !cacheStorage?.delete) return;
  try {
    await cacheStorage.delete(name);
  } catch {}
}

async function pruneAudioCaches(cacheStorage, keepName) {
  if (!cacheStorage?.keys) return;
  try {
    const names = await cacheStorage.keys();
    await Promise.all(
      names
        .filter(
          (name) => name.startsWith(AUDIO_CACHE_PREFIX) && name !== keepName,
        )
        .map((name) => cacheStorage.delete(name)),
    );
  } catch {}
}

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

export async function saveLastChart(
  storage,
  { chart, title, chartName, audioFiles = [] },
  {
    cacheStorage = globalThis.caches,
    origin = globalThis.location?.origin,
    id = createId(),
  } = {},
) {
  const cacheName = `${AUDIO_CACHE_PREFIX}${id}`;
  const audioMetadata = audioFiles.map(({ name, type }, index) => ({
    name,
    type,
    index,
  }));
  let savedCacheName = null;
  let audioSaved = audioFiles.length === 0;

  if (audioFiles.length && cacheStorage?.open && origin) {
    try {
      const cache = await cacheStorage.open(cacheName);
      for (const [index, file] of audioFiles.entries()) {
        await cache.put(
          audioUrl(id, index, origin),
          new Response(file, {
            headers: {
              "content-type": file.type || "application/octet-stream",
            },
          }),
        );
      }
      savedCacheName = cacheName;
      audioSaved = true;
    } catch {
      await deleteCache(cacheStorage, cacheName);
    }
  }

  const record = {
    version: 1,
    id,
    title,
    chartName,
    chart,
    audioFiles: audioMetadata,
    audioCacheName: savedCacheName,
    lastPlayedAt: null,
  };

  try {
    storage.setItem(LAST_CHART_KEY, JSON.stringify(record));
  } catch (error) {
    await deleteCache(cacheStorage, savedCacheName);
    throw error;
  }

  await pruneAudioCaches(cacheStorage, savedCacheName);
  return { record, audioSaved };
}

export async function restoreLastChart(
  storage,
  {
    cacheStorage = globalThis.caches,
    audioContext,
    origin = globalThis.location?.origin,
  } = {},
) {
  const record = readRecord(storage);
  if (!record) return null;

  let audioBuffers = [];
  let audioRestored = record.audioFiles.length === 0;
  if (
    record.audioFiles.length &&
    record.audioCacheName &&
    cacheStorage?.open &&
    origin &&
    audioContext
  ) {
    try {
      const cache = await cacheStorage.open(record.audioCacheName);
      for (const { index } of record.audioFiles) {
        const response = await cache.match(audioUrl(record.id, index, origin));
        if (!response) throw new Error("Piste audio locale introuvable.");
        audioBuffers.push(
          await audioContext.decodeAudioData(await response.arrayBuffer()),
        );
      }
      audioRestored = true;
    } catch {
      audioBuffers = [];
    }
  }

  return { record, audioBuffers, audioRestored };
}

export async function removeLastChart(
  storage,
  { cacheStorage = globalThis.caches } = {},
) {
  const record = readRecord(storage);
  try {
    storage.removeItem(LAST_CHART_KEY);
  } catch {
    return false;
  }
  await deleteCache(cacheStorage, record?.audioCacheName);
  return true;
}

export function markLastChartPlayed(storage, id, playedAt = Date.now()) {
  const record = readRecord(storage);
  if (!record || record.id !== id) return false;
  try {
    storage.setItem(
      LAST_CHART_KEY,
      JSON.stringify({ ...record, lastPlayedAt: playedAt }),
    );
    return true;
  } catch {
    return false;
  }
}
