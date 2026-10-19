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

export function getHoldTapLanes(targetLane, heldLanes, laneRanks) {
  return [
    targetLane,
    ...heldLanes.filter(
      (heldLane) => laneRanks[targetLane] > laneRanks[heldLane],
    ),
  ];
}

export function findHitNote(notes, lanes, now, earlyWindow = 280) {
  let bestIndex = -1;
  let bestDistance = Infinity;
  let bestLanePriority = Infinity;
  for (let index = 0; index < notes.length; index++) {
    const note = notes[index];
    const lanePriority = lanes.indexOf(note.lane);
    if (
      note.hitRegistered ||
      lanePriority < 0 ||
      now < note.hitAt - earlyWindow ||
      now > note.missAt
    ) continue;
    const distance = Math.abs(now - note.hitAt);
    if (
      distance < bestDistance ||
      (distance === bestDistance && lanePriority < bestLanePriority)
    ) {
      bestIndex = index;
      bestDistance = distance;
      bestLanePriority = lanePriority;
    }
  }
  return bestIndex;
}

export function findAutoHitNote(notes, lane, now) {
  return notes.findIndex(
    (note) =>
      note.lane === lane &&
      !note.hitRegistered &&
      now >= note.hitAt &&
      now <= note.missAt,
  );
}
