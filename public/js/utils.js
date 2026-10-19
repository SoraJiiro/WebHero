export function encodeMidi(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function decodeMidi(base64) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer;
}

export function loadKeys(storage, settingKey, defaults) {
  try {
    const saved = JSON.parse(storage.getItem(settingKey));
    if (
      Array.isArray(saved) &&
      saved.length === defaults.length &&
      new Set(saved).size === defaults.length &&
      saved.every((key) => typeof key === "string" && key.length === 1)
    ) {
      return saved;
    }
  } catch {}
  return defaults.slice();
}

export function selectChartTrack(chart, difficulty, difficultyOrder) {
  const wanted = difficultyOrder.indexOf(difficulty);
  const [trackDifficulty, track] = Object.entries(chart.tracks).sort(
    ([a], [b]) =>
      Math.abs(difficultyOrder.indexOf(a) - wanted) -
      Math.abs(difficultyOrder.indexOf(b) - wanted),
  )[0];
  return { difficulty: trackDifficulty, track };
}
