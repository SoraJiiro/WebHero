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

// Un même périphérique peut apparaître en double (XInput + HID) : on n'en lit qu'un.
export function pickPad(pads) {
  const list = [...pads].filter(Boolean);
  return list.find((p) => p.mapping === "standard") ?? list[0];
}

export function getPressedPadButtons(pads) {
  const down = new Set();
  pickPad(pads)?.buttons.forEach((b, i) => b.pressed && down.add(i));
  return down;
}

// Une lane est active si tous ses boutons sont pressés, sauf si une lane plus spécifique (sur-ensemble) l'est aussi.
export function getActivePadLanes(padButtons, down) {
  const sets = padButtons.map((b) => [].concat(b));
  const on = sets.map((s) => s.length > 0 && s.every((b) => down.has(b)));
  return sets.flatMap((s, lane) =>
    on[lane] &&
    !sets.some(
      (o, m) => on[m] && o.length > s.length && s.every((b) => o.includes(b)),
    )
      ? [lane]
      : [],
  );
}

export function diffPadLanes(padButtons, down, heldLanes) {
  const active = new Set(getActivePadLanes(padButtons, down));
  const press = [...active].filter((lane) => !heldLanes.has(lane));
  const releaseLanes = [...heldLanes].filter((lane) => !active.has(lane));
  return { press, releaseLanes };
}

export const GUITAR_WINDOW = 150;

export function findGuitarGroup(notes, now, window = GUITAR_WINDOW) {
  const open = notes.filter(
    (n) =>
      !n.hitRegistered && !n.missed && now <= (n.hitUntil ?? n.hitAt + window),
  );
  let target;
  for (const n of open) {
    const d = Math.abs(now - n.hitAt);
    if (d <= window && (!target || d < Math.abs(now - target.hitAt)))
      target = n;
  }
  if (!target) return null;
  const group = open.filter((n) => Math.abs(n.hitAt - target.hitAt) < 1);
  return { notes: group, lanes: group.map((n) => n.lane), type: target.type };
}

// Une ancre plus basse est tolérée : seule la frette la plus haute doit coïncider.
export function fretsMatch(lanes, held) {
  return (
    Math.max(...held, -1) === Math.max(...lanes) &&
    lanes.every((lane) => held.includes(lane))
  );
}

export function canFretHit(type, combo) {
  return type === "tap" || (type === "hopo" && combo > 0);
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
      now > (note.hitUntil ?? note.missAt)
    )
      continue;
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
      now <= (note.hitUntil ?? note.missAt),
  );
}
