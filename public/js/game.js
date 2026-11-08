import {
  adjustWebHeroStagePresence,
  getWebHeroMultiplier,
  getWebHeroScoreMultiplier,
  getWebHeroSustainBonus,
  groupWebHeroLyrics,
  parseWebHeroChart,
  parseWebHeroMidi,
  scheduleWebHeroLongPauses,
  scheduleWebHeroLyrics,
  scheduleWebHeroBeats,
  scheduleWebHeroTrack,
} from "./web_hero_chart.mjs";
import { parseSongIni, selectChartFolderFiles } from "./chart-import.mjs";
import {
  markLastChartPlayed,
  removeLastChart,
  restoreLastChart,
  saveLastChart,
} from "./chart-storage.mjs";
import {
  createGameRenderer,
  HIT_ZONE_OFFSET,
  HIT_ZONE_HEIGHT_RATIO,
  NOTE_MAX_RADIUS,
  TARGET_MAX_RADIUS,
} from "./game-renderer.mjs";
import {
  canFretHit,
  diffPadLanes,
  findAutoHitNote,
  findGuitarGroup,
  findHitNote,
  fretsMatch,
  getFullComboStatus,
  getHoldTapLanes,
  getPressedPadButtons,
  pickPad,
  GUITAR_WINDOW,
  loadKeys,
  selectChartTrack,
} from "./utils.js";
import {
  formatNumber,
  initI18n,
  setI18nText,
  t,
  translateError,
} from "./i18n.mjs";

const DEFAULT_KEYS = ["d", "f", "j", "k", "l"];
const LANE_RANKS = [0, 1, 2, 3, 4];
const SETTINGS_KEY = "web-hero-settings";
const HIGHWAY_BACKGROUND_KEY = "web-hero-highway-background";
const REWIND_MS = 3000;
const END_SILENCE_MS = 2200;
const END_FADE_MS = 900;
const COLORS = ["#ff4f64", "#ffb347", "#ffe14a", "#63e6be", "#74a7ff"];
const DIFFICULTIES = {
  easy: { label: "Facile", travelTime: 3200 },
  medium: { label: "Moyen", travelTime: 2400 },
  hard: { label: "Difficile", travelTime: 1450 },
  expert: { label: "Expert", travelTime: 1100 },
};
const DIFFICULTY_ORDER = Object.keys(DIFFICULTIES);

export function initWebHero(socket = null) {
  initI18n();
  const stage = document.getElementById("jeu");
  const canvas = document.getElementById("web-hero-canvas");
  const startButton = document.getElementById("web-hero-start");
  const stopButton = document.getElementById("web-hero-stop");
  const chartImportButton = document.getElementById("web-hero-chart-import");
  const chartUnloadButton = document.getElementById("web-hero-chart-unload");
  const chartFileInput = document.getElementById("web-hero-chart-file");
  const difficultySelect = document.getElementById("web-hero-difficulty");
  const chartSpeedInput = document.getElementById("web-hero-chart-speed");
  const chartSpeedValue = document.getElementById("web-hero-chart-speed-value");
  const hyperspeedInput = document.getElementById("web-hero-hyperspeed");
  const hyperspeedValue = document.getElementById("web-hero-hyperspeed-value");
  const audioDelayInput = document.getElementById("web-hero-audio-delay");
  const audioDelayValue = document.getElementById("web-hero-audio-delay-value");
  const videoDelayInput = document.getElementById("web-hero-video-delay");
  const videoDelayValue = document.getElementById("web-hero-video-delay-value");
  const practiceInput = document.getElementById("web-hero-practice");
  const practiceStartSectionSelect = document.getElementById(
    "web-hero-practice-start-section",
  );
  const practiceEndSectionSelect = document.getElementById(
    "web-hero-practice-end-section",
  );
  const hitZonePreviewInput = document.getElementById(
    "web-hero-hit-zone-preview",
  );
  const primaryColorInput = document.getElementById("web-hero-primary-color");
  const highwayBackgroundInput = document.getElementById(
    "web-hero-highway-background",
  );
  const backgroundNameOutput = document.getElementById(
    "web-hero-background-name",
  );
  const backgroundClearButton = document.getElementById(
    "web-hero-background-clear",
  );
  const keyInputs = [...document.querySelectorAll(".web-hero-key")];
  if (
    !stage ||
    !canvas ||
    !startButton ||
    !stopButton ||
    !chartImportButton ||
    !chartUnloadButton ||
    !chartFileInput ||
    !difficultySelect ||
    !chartSpeedInput ||
    !chartSpeedValue ||
    !hyperspeedInput ||
    !hyperspeedValue ||
    !practiceStartSectionSelect ||
    !practiceEndSectionSelect ||
    !primaryColorInput ||
    !highwayBackgroundInput ||
    !backgroundNameOutput ||
    !backgroundClearButton ||
    keyInputs.length !== 5
  )
    return;

  const statusEl = document.getElementById("web-hero-status-text");
  const setStatus = (key, values = {}) => setI18nText(statusEl, key, values);
  const touchPauseButton = document.getElementById("web-hero-touch-pause");
  const touchStarPowerButton = document.getElementById(
    "web-hero-touch-starpower",
  );
  const importProgress = document.getElementById("web-hero-import-progress");
  const gameOverEl = document.getElementById("web-hero-game-over");
  const restartButton = document.getElementById("web-hero-restart");
  const returnButton = document.getElementById("web-hero-return");
  const finalScoreEl = document.getElementById("web-hero-final-score");
  const finalFcEl = document.getElementById("web-hero-final-fc");
  const finalTimeEl = document.getElementById("web-hero-final-time");
  const finalAccuracyEl = document.getElementById("web-hero-final-accuracy");
  const finalNotesEl = document.getElementById("web-hero-final-notes");
  const finalHitsEl = document.getElementById("web-hero-final-hits");
  const finalStreakEl = document.getElementById("web-hero-final-streak");
  const finalDelayEl = document.getElementById("web-hero-final-delay");
  const gameOverTitleEl = document.getElementById("web-hero-result-title");
  const gameOverSongEl = document.getElementById("web-hero-result-song");
  const lyricsEl = document.getElementById("web-hero-lyrics");
  const pauseEl = document.getElementById("web-hero-pause");
  const resumeButton = document.getElementById("web-hero-resume");
  const practiceRestartButton = document.getElementById(
    "web-hero-practice-restart",
  );
  const quitButton = document.getElementById("web-hero-quit");
  const noFailInput = document.getElementById("web-hero-nofail");
  document.addEventListener("webhero:languagechange", () =>
    draw(performance.now()),
  );
  let lyricSpans = [];
  const state = {
    running: false,
    paused: false,
    ending: false,
    endingAt: 0,
    fadeAlpha: 0,
    pausedAt: 0,
    noFail: false,
    chartSpeed: 1,
    audioDelay: 0,
    videoDelay: 0,
    hitZonePreview: false,
    score: 0,
    combo: 0,
    fullComboBroken: false,
    multiplier: 1,
    starPowerCharge: 0,
    starPowerActivatedAt: 0,
    starPowerActiveUntil: 0,
    starPowerPhrases: [],
    maxCombo: 0,
    misses: 0,
    hits: 0,
    hitDelayTotal: 0,
    overHits: 0,
    sustainSeconds: 0,
    longest: 0,
    stagePresence: 80,
    totalNotes: 0,
    startedAt: 0,
    notes: [],
    pendingNotes: [],
    longPauses: [],
    lyrics: [],
    lyricPhrases: [],
    lyricIndex: -1,
    lyricPhraseIndex: -1,
    lyricActiveIndex: -1,
    particles: [],
    fireAt: [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity],
    beats: [],
    chart: null,
    chartTitle: "",
    primaryColor: "#ffd400",
    highwayBackground: "",
    chartDuration: 0,
    practiceRange: null,
    practiceTrack: null,
    travelTime: 0,
    animation: 0,
    lastFrame: 0,
    missFlashUntil: 0,
    heldLanes: [],
    lastHitAt: 0,
    lastFretAt: 0,
    heldSig: "",
    viewWidth: 0,
    viewHeight: 0,
    difficulty: difficultySelect.value || "medium",
    chartDifficulty: difficultySelect.value || "medium",
    scoreMultiplier: 1,
  };

  let keys = loadKeys(localStorage, "web-hero-keys", DEFAULT_KEYS);
  const { draw, getLaneBounds, getTrackBounds, resize } = createGameRenderer({
    canvas,
    state,
    keys,
    colors: COLORS,
  });
  let savedSettings = {};
  let audioContext = null;
  let audioBuffers = [];
  let audioSources = [];
  let savedChartRecord = null;
  let lastChartId = null;
  let storageWarning = "";

  try {
    const parsedSettings = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || "{}",
    );
    if (
      parsedSettings &&
      typeof parsedSettings === "object" &&
      !Array.isArray(parsedSettings)
    )
      savedSettings = parsedSettings;
  } catch (error) {
    console.error("Impossible de lire les paramètres Web Hero.", error);
    setStatus("status.settingsReadFailed");
  }
  if (DIFFICULTIES[savedSettings.difficulty]) {
    difficultySelect.value = savedSettings.difficulty;
    state.difficulty = savedSettings.difficulty;
  }
  state.primaryColor = /^#[\da-f]{6}$/i.test(savedSettings.primaryColor || "")
    ? savedSettings.primaryColor
    : "#ffd400";
  primaryColorInput.value = state.primaryColor;
  document.documentElement.style.setProperty("--accent", state.primaryColor);
  try {
    state.highwayBackground =
      localStorage.getItem(HIGHWAY_BACKGROUND_KEY) || "";
  } catch (error) {
    console.error("Impossible de lire l’image de fond Web Hero.", error);
  }
  backgroundNameOutput.value = state.highwayBackground
    ? "Image enregistrée"
    : "Aucune image";
  backgroundClearButton.disabled = !state.highwayBackground;
  for (const [input, value] of [
    [chartSpeedInput, savedSettings.chartSpeed],
    [hyperspeedInput, savedSettings.hyperspeed],
    [audioDelayInput, savedSettings.audioDelay],
    [videoDelayInput, savedSettings.videoDelay],
  ]) {
    if (Number.isFinite(value)) {
      input.value = String(
        Math.max(Number(input.min), Math.min(Number(input.max), value)),
      );
    }
  }
  chartSpeedValue.value = `${Math.round(Number(chartSpeedInput.value) * 100)} %`;
  hyperspeedValue.value = `${Number(hyperspeedInput.value).toFixed(1)}×`;
  audioDelayValue.value = `${audioDelayInput.value} ms`;
  videoDelayValue.value = `${videoDelayInput.value} ms`;
  state.audioDelay = Number(audioDelayInput.value);
  state.videoDelay = Number(videoDelayInput.value);
  state.travelTime =
    DIFFICULTIES[state.difficulty].travelTime / Number(hyperspeedInput.value);
  noFailInput.checked = savedSettings.noFail === true;
  practiceInput.checked = savedSettings.practiceMode === true;
  hitZonePreviewInput.checked = savedSettings.hitZonePreview === true;
  state.hitZonePreview = hitZonePreviewInput.checked;

  function saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          difficulty: state.difficulty,
          chartSpeed: Number(chartSpeedInput.value),
          hyperspeed: Number(hyperspeedInput.value),
          audioDelay: Number(audioDelayInput.value),
          videoDelay: Number(videoDelayInput.value),
          noFail: noFailInput.checked,
          practiceMode: practiceInput.checked,
          hitZonePreview: hitZonePreviewInput.checked,
          primaryColor: state.primaryColor,
        }),
      );
    } catch (error) {
      console.error(
        "Impossible de sauvegarder les paramètres Web Hero.",
        error,
      );
      if (!state.running) setStatus("status.settingsSaveFailed");
    }
  }

  function setChartControlsDisabled(disabled) {
    chartImportButton.disabled = disabled;
    difficultySelect.disabled = disabled || !state.chart;
    chartUnloadButton.disabled = disabled || !state.chart;
    chartSpeedInput.disabled = disabled;
    hyperspeedInput.disabled = disabled;
    audioDelayInput.disabled = disabled;
    videoDelayInput.disabled = disabled;
    noFailInput.disabled = disabled;
    practiceInput.disabled = disabled;
    practiceStartSectionSelect.disabled = disabled || !practiceInput.checked;
    practiceEndSectionSelect.disabled = disabled || !practiceInput.checked;
    hitZonePreviewInput.disabled = disabled;
  }

  let keyLearn = -1;
  let guitarMode = false;
  let pauseKey = localStorage.getItem("web-hero-pause-key") || "Escape";
  let pauseKeyLearn = false;
  let starPowerKey = localStorage.getItem("web-hero-star-power-key") || "Space";
  let starPowerKeyLearn = false;
  const keyLabel = (code) =>
    ({ ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" })[code] ??
    code.replace(/^(Key|Digit)/, "");
  const pauseKeyEl = document.getElementById("web-hero-pause-key");
  const showPauseKey = () => (pauseKeyEl.textContent = keyLabel(pauseKey));
  showPauseKey();
  pauseKeyEl.addEventListener("click", () => {
    pauseKeyLearn = true;
    pauseKeyEl.textContent = "…";
  });
  const starPowerKeyEl = document.getElementById("web-hero-star-power-key");
  const showStarPowerKey = () =>
    (starPowerKeyEl.textContent = keyLabel(starPowerKey));
  showStarPowerKey();
  starPowerKeyEl.addEventListener("click", () => {
    starPowerKeyLearn = true;
    starPowerKeyEl.textContent = "…";
  });
  let strumKeys = JSON.parse(
    localStorage.getItem("web-hero-strum-keys") || '["ArrowUp","ArrowDown"]',
  );
  let strumKeyLearn = -1;
  const strumKeyEls = [...document.querySelectorAll(".web-hero-strum-key")];
  const showStrumKey = (i) =>
    (strumKeyEls[i].textContent = keyLabel(strumKeys[i]));
  strumKeyEls.forEach((el, i) => {
    showStrumKey(i);
    el.addEventListener("click", () => {
      if (strumKeyLearn >= 0) showStrumKey(strumKeyLearn);
      strumKeyLearn = i;
      el.textContent = "…";
    });
  });
  const showKey = (i) => (keyInputs[i].textContent = keys[i].toUpperCase());
  keyInputs.forEach((el, lane) => {
    showKey(lane);
    el.addEventListener("click", () => {
      if (keyLearn >= 0) showKey(keyLearn);
      keyLearn = lane;
      el.textContent = "…";
    });
  });
  // Retourne true si l'événement a servi à assigner (ou annuler) une touche.
  function learnKey(event) {
    if (starPowerKeyLearn) {
      event.preventDefault();
      if (
        event.code !== pauseKey &&
        !strumKeys.includes(event.code) &&
        !keys.includes(event.key.toLowerCase()) &&
        !["Shift", "Control", "Alt", "Meta"].includes(event.key)
      ) {
        starPowerKey = event.code;
        localStorage.setItem("web-hero-star-power-key", starPowerKey);
      }
      starPowerKeyLearn = false;
      showStarPowerKey();
      return true;
    }
    if (pauseKeyLearn) {
      event.preventDefault();
      if (event.code !== starPowerKey) {
        pauseKey = event.code;
        localStorage.setItem("web-hero-pause-key", pauseKey);
      }
      pauseKeyLearn = false;
      showPauseKey();
      return true;
    }
    if (strumKeyLearn >= 0) {
      event.preventDefault();
      const i = strumKeyLearn;
      if (event.code !== starPowerKey) {
        strumKeys[i] = event.code;
        localStorage.setItem("web-hero-strum-keys", JSON.stringify(strumKeys));
      }
      strumKeyLearn = -1;
      showStrumKey(i);
      return true;
    }
    if (keyLearn < 0) return false;
    event.preventDefault();
    const lane = keyLearn;
    const value = event.key.toLowerCase();
    if (event.key === "Escape" || event.key.length !== 1) {
      if (
        event.key !== "Shift" &&
        event.key !== "Control" &&
        event.key !== "Alt"
      ) {
        keyLearn = -1;
        showKey(lane);
      }
      return true;
    }
    if (!keys.includes(value) && event.code !== starPowerKey) {
      keys[lane] = value;
      localStorage.setItem("web-hero-keys", JSON.stringify(keys));
    }
    keyLearn = -1;
    showKey(lane);
    return true;
  }

  function updateLyrics() {
    const lyric = state.lyrics[state.lyricIndex];
    if (!lyric) return;
    const phraseIndex = state.lyricPhrases.findIndex(
      (phrase) =>
        state.lyricIndex >= phrase.startIndex &&
        state.lyricIndex < phrase.endIndex,
    );
    if (phraseIndex !== state.lyricPhraseIndex) {
      const phrase = state.lyricPhrases[phraseIndex];
      lyricSpans = formatLyricPhrase(phrase.syllables);
      lyricsEl.replaceChildren(...lyricSpans);
      state.lyricPhraseIndex = phraseIndex;
      state.lyricActiveIndex = -1;
    }
    const activeIndex =
      state.lyricIndex - state.lyricPhrases[phraseIndex].startIndex;
    if (activeIndex !== state.lyricActiveIndex) {
      lyricSpans.forEach((span, index) =>
        span.classList.toggle("is-active", index <= activeIndex),
      );
      state.lyricActiveIndex = activeIndex;
    }
  }

  function formatLyricPhrase(syllables) {
    const spans = syllables.map(() => document.createElement("span"));
    let prefix = "\uE000";
    while (syllables.some((syllable) => syllable.text.includes(prefix)))
      prefix += "\uE000";
    const marker = new RegExp(`${prefix}(\\d+)\uE001`, "g");
    const template = document.createElement("template");
    template.innerHTML = syllables
      .map(
        (syllable, index) =>
          `${prefix}${index}\uE001${syllable.separatorBefore}${syllable.text}`,
      )
      .join("");
    const allowed = new Set([
      "B",
      "STRONG",
      "I",
      "EM",
      "U",
      "S",
      "DEL",
      "SUB",
      "SUP",
      "BR",
    ]);
    const blocked = new Set([
      "SCRIPT",
      "STYLE",
      "TEMPLATE",
      "IFRAME",
      "OBJECT",
      "SVG",
      "MATH",
    ]);
    let currentIndex = -1;

    function append(node, tags) {
      if (currentIndex < 0 || currentIndex >= spans.length) return;
      let target = spans[currentIndex];
      for (const tag of tags) {
        const element = document.createElement(tag);
        target.append(element);
        target = element;
      }
      target.append(node);
    }

    function visit(node, tags = []) {
      if (node.nodeType === Node.TEXT_NODE) {
        let lastIndex = 0;
        marker.lastIndex = 0;
        for (const match of node.data.matchAll(marker)) {
          if (match.index > lastIndex)
            append(
              document.createTextNode(node.data.slice(lastIndex, match.index)),
              tags,
            );
          currentIndex = Number(match[1]);
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < node.data.length)
          append(document.createTextNode(node.data.slice(lastIndex)), tags);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE || blocked.has(node.tagName))
        return;
      if (node.tagName === "BR") {
        append(document.createElement("br"), tags);
        return;
      }
      const childTags = allowed.has(node.tagName)
        ? [...tags, node.localName]
        : tags;
      node.childNodes.forEach((child) => visit(child, childTags));
    }

    template.content.childNodes.forEach((node) => visit(node));
    return spans;
  }

  function frame(now) {
    if (!state.running) return;
    state.lastFrame = now;
    if (state.ending) {
      state.fadeAlpha = Math.max(
        0,
        Math.min(1, (now - state.endingAt - END_SILENCE_MS) / END_FADE_MS),
      );
      draw(now + state.videoDelay);
      if (state.fadeAlpha === 1) {
        finish("status.chartFinished", { completed: true });
        return;
      }
      state.animation = requestAnimationFrame(frame);
      return;
    }
    if (guitarMode) {
      // Toute variation de frettes (appui ou relâchement : pull-off) compte comme un tap.
      const sig = getHeldLanes().join();
      if (sig !== state.heldSig) {
        state.heldSig = sig;
        state.lastFretAt = now;
      }
      tryFretHit(now);
    }
    const travelTime = state.travelTime;
    const hitY = state.viewHeight - HIT_ZONE_OFFSET;
    const topY = Math.max(0, state.viewHeight * 0.05);
    const hitZoneHalfHeight =
      ((state.viewHeight - topY) * HIT_ZONE_HEIGHT_RATIO) / 2;
    const timePastHitZone =
      travelTime * (hitZoneHalfHeight / Math.max(1, hitY));
    while (
      state.pendingNotes.length > 0 &&
      state.pendingNotes[0].spawnAt <= now
    ) {
      const pendingNote = state.pendingNotes.shift();
      const hitAt = pendingNote.spawnAt + pendingNote.travelTime;
      const calibrationOffset = state.hitZonePreview
        ? state.audioDelay
        : -state.videoDelay;
      const hitUntil = hitAt + calibrationOffset + timePastHitZone;
      state.notes.push({
        lane: pendingNote.lane,
        spawnAt: pendingNote.spawnAt,
        travelTime: pendingNote.travelTime,
        starPowerPhrase: pendingNote.starPowerPhrase,
        starPowerPhraseEndAt: pendingNote.starPowerPhraseEndAt,
        hitAt,
        hitUntil,
        missAt: Math.max(hitUntil + 50, hitAt + GUITAR_WINDOW + 50),
        sustain: pendingNote.sustain,
        type: pendingNote.type,
        missed: false,
        sustainEndAt: hitAt + pendingNote.sustain * 1000,
        holding: false,
        hitRegistered: false,
      });
    }
    for (let index = state.notes.length - 1; index >= 0; index--) {
      const note = state.notes[index];
      if (!note.hitRegistered && autoHitLanes.has(note.lane)) {
        const hitIndex = findAutoHitNote(state.notes, note.lane, now);
        if (hitIndex === index) {
          if (note.sustain > 0) {
            note.holding = true;
            note.hitRegistered = true;
            note.holdMultiplier = state.multiplier;
            note.sustainStartedAt = note.hitAt;
            note.sustainScoredSeconds = 0;
            note.sustainEndAt = note.hitAt + note.sustain * 1000;
            registerHit(note, note.lane, note.hitAt);
          } else {
            state.notes.splice(index, 1);
            registerHit(note, note.lane, note.hitAt);
            continue;
          }
        }
      }
      if (note.holding) {
        creditSustain(note, now);
        if (now >= note.sustainEndAt) endSustain(note, note.sustainEndAt);
      }
      if (!note.hitRegistered && !note.missed) {
        const lateAt = guitarMode
          ? Math.min(note.hitAt + GUITAR_WINDOW, note.hitUntil)
          : note.hitUntil;
        if (lateAt < now) {
          // Un accord raté ne compte qu'un seul miss.
          const mates = guitarMode
            ? state.notes.filter(
                (n) =>
                  !n.hitRegistered &&
                  !n.missed &&
                  Math.abs(n.hitAt - note.hitAt) < 1,
              )
            : [note];
          mates.forEach((n) => (n.missed = true));
          registerMiss();
        }
      }
      if (!state.running) return;
      if (
        note.hitRegistered
          ? !note.holding && now >= note.sustainEndAt
          : note.missAt < now
      )
        state.notes.splice(index, 1);
    }
    settleStarPowerPhrases(now);
    if (
      state.pendingNotes.length === 0 &&
      state.notes.length === 0 &&
      now >= state.startedAt + state.chartDuration * 1000 + timePastHitZone
    ) {
      if (state.practiceRange) {
        repeatPractice(now);
        draw(now + state.videoDelay);
        state.animation = requestAnimationFrame(frame);
        return;
      }
      state.ending = true;
      state.endingAt = now;
      state.fadeAlpha = 0;
      stopSong();
      lyricsEl.hidden = true;
      state.animation = requestAnimationFrame(frame);
      return;
    }
    const liveElapsed = Math.max(0, (now - state.startedAt) / 1000);
    state.longest = Math.max(state.longest, liveElapsed);
    while (
      state.lyricIndex + 1 < state.lyrics.length &&
      state.lyrics[state.lyricIndex + 1].at <= now
    ) {
      state.lyricIndex += 1;
    }
    updateLyrics();
    state.heldLanes = getHeldLanes();
    draw(now + state.videoDelay);
    state.animation = requestAnimationFrame(frame);
  }

  function registerMiss() {
    if (!state.running) return;
    state.fullComboBroken = true;
    state.misses += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.combo = 0;
    state.multiplier = 1;
    state.missFlashUntil = performance.now() + 180;
    if (state.noFail) return;
    state.stagePresence = adjustWebHeroStagePresence(
      state.stagePresence,
      false,
    );
    if (state.stagePresence <= 0) {
      finish("status.stageFailed");
    }
  }

  function registerOverHit() {
    if (!state.running) return;
    state.fullComboBroken = true;
    if (guitarMode && !state.noFail) {
      state.stagePresence = adjustWebHeroStagePresence(
        state.stagePresence,
        false,
      );
      if (state.stagePresence <= 0) {
        registerMiss();
        return;
      }
    }
    state.overHits += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.combo = 0;
    state.multiplier = 1;
    state.missFlashUntil = performance.now() + 180;
  }

  function stopSong() {
    for (const source of audioSources) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    audioSources = [];
  }

  function finish(
    messageKey = "status.finished",
    { completed = false, stopped = false } = {},
  ) {
    if (!state.running) return;
    const endedAt =
      state.endingAt || (state.paused ? state.pausedAt : performance.now());
    state.paused = false;
    state.ending = false;
    pauseEl.hidden = true;
    state.running = false;
    stopSong();
    stage.classList.remove("is-playing");
    cancelAnimationFrame(state.animation);
    const duration = Math.max(
      0,
      Math.floor((endedAt - state.startedAt) / 1000),
    );
    state.longest = Math.max(state.longest, duration);
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    startButton.disabled = false;
    stopButton.hidden = true;
    setStatus("status.gameFinished", {
      message: () => t(messageKey),
      score: formatNumber(state.score),
    });
    const finalDuration = Math.floor(duration);
    const accuracy =
      state.hits + state.misses
        ? Math.round((state.hits / (state.hits + state.misses)) * 100)
        : 0;
    setI18nText(
      gameOverTitleEl,
      completed
        ? "game.chartComplete"
        : stopped
          ? "game.stopped"
          : "game.gameOver",
    );
    gameOverSongEl.textContent = state.chartTitle;
    gameOverEl.classList.toggle("is-completed", completed);
    gameOverEl.classList.toggle("is-stopped", stopped);
    finalScoreEl.textContent = formatNumber(state.score);
    finalFcEl.hidden = !completed || getFullComboStatus(state) !== "complete";
    setI18nText(finalTimeEl, "results.durationValue", {
      seconds: finalDuration,
    });
    finalAccuracyEl.textContent = `${accuracy}%`;
    finalNotesEl.textContent = formatNumber(state.totalNotes);
    finalHitsEl.textContent = `${state.hits} / ${state.misses}`;
    finalStreakEl.textContent = formatNumber(state.maxCombo);
    const averageHitDelay = state.hits
      ? Math.round(state.hitDelayTotal / state.hits)
      : null;
    finalDelayEl.textContent =
      averageHitDelay === null
        ? "—"
        : `${averageHitDelay > 0 ? "+" : ""}${averageHitDelay} ms`;
    gameOverEl.hidden = false;
    restartButton.focus();
    setChartControlsDisabled(false);
    if (completed && socket && !state.noFail) {
      socket.emit("webhero:final", {
        score: state.score,
        duration,
        difficulty: state.chartDifficulty,
        chartSpeed: Number(chartSpeedInput.value),
        hyperspeed: Number(hyperspeedInput.value),
        totalNotes: state.totalNotes,
        hits: state.hits,
        misses: state.misses,
        sustainSeconds: state.sustainSeconds,
        completed,
      });
    }
    lyricsEl.hidden = true;
  }

  function shiftTimes(delta) {
    const shift = (o, ...ks) =>
      ks.forEach((k) => typeof o[k] === "number" && (o[k] += delta));
    state.notes.forEach((n) =>
      shift(
        n,
        "spawnAt",
        "hitAt",
        "missAt",
        "sustainEndAt",
        "sustainStartedAt",
        "releasedAt",
        "lastParticleAt",
        "starPowerPhraseEndAt",
      ),
    );
    state.pendingNotes.forEach((n) =>
      shift(n, "spawnAt", "starPowerPhraseEndAt"),
    );
    state.starPowerPhrases.forEach((phrase) => shift(phrase, "endAt"));
    state.lyrics.forEach((l) => shift(l, "at"));
    state.lyricPhrases.forEach((p) =>
      p.syllables.forEach((s) => shift(s, "at")),
    );
    state.longPauses.forEach((p) => shift(p, "startAt", "endAt", "nextNoteAt"));
    state.particles.forEach((p) => shift(p, "createdAt"));
    state.fireAt = state.fireAt.map((t) => t + delta);
    state.beats.forEach((b) => shift(b, "hitAt"));
    shift(
      state,
      "startedAt",
      "missFlashUntil",
      "lastHitAt",
      "lastFretAt",
      "lastFrame",
      "starPowerActivatedAt",
      "starPowerActiveUntil",
    );
  }

  function pause() {
    if (!state.running || state.paused || state.ending) return;
    state.paused = true;
    state.pausedAt = performance.now();
    cancelAnimationFrame(state.animation);
    for (const note of state.notes) {
      if (note.holding) endSustain(note, state.pausedAt);
    }
    stopSong();
    practiceRestartButton.hidden = !state.practiceRange;
    pauseEl.hidden = false;
    resumeButton.focus();
  }

  // Recule la chart et la musique de ms ; les notes déjà jouées ne reviennent pas.
  function rewindChart(ms) {
    const upcoming = state.notes.filter((n) => !n.hitRegistered && !n.missed);
    state.notes = state.notes.filter((n) => n.hitRegistered || n.missed);
    state.pendingNotes.unshift(
      ...upcoming.map(
        ({
          lane,
          spawnAt,
          travelTime,
          sustain,
          type,
          starPowerPhrase,
          starPowerPhraseEndAt,
        }) => ({
          lane,
          spawnAt,
          travelTime,
          sustain,
          type,
          starPowerPhrase,
          starPowerPhraseEndAt,
        }),
      ),
    );
    state.pendingNotes.forEach((n) => (n.spawnAt += ms));
    state.lyrics.forEach((l) => (l.at += ms));
    state.lyricPhrases.forEach((p) => p.syllables.forEach((s) => (s.at += ms)));
    state.longPauses.forEach((p) => {
      p.startAt += ms;
      p.endAt += ms;
      p.nextNoteAt += ms;
    });
    state.startedAt += ms;
    state.beats.forEach((b) => (b.hitAt += ms));
  }

  function getPracticeSegment(track) {
    const sections = state.chart.sections || [];
    const startIndex = Number(practiceStartSectionSelect.value);
    const endIndex = Number(practiceEndSectionSelect.value);
    const hasStart = Number.isInteger(startIndex) && startIndex >= 0;
    const start = hasStart ? sections[startIndex]?.time : 0;
    const segmentStart = Math.min(
      track.duration,
      Math.max(0, Number.isFinite(start) ? start : 0),
    );
    const hasEnd = Number.isInteger(endIndex) && endIndex >= startIndex;
    const endStart = hasEnd ? sections[endIndex]?.time : undefined;
    const nextSection = hasEnd
      ? sections.slice(endIndex + 1).find((section) => section.time > endStart)
      : null;
    const end = hasEnd ? (nextSection?.time ?? track.duration) : track.duration;
    const segmentEnd = Math.max(segmentStart, Math.min(track.duration, end));
    if (segmentEnd <= segmentStart) {
      return {
        start: 0,
        end: track.duration,
        track,
      };
    }
    return {
      start: segmentStart,
      end: segmentEnd,
      track: {
        ...track,
        notes: track.notes
          .filter((note) => note.time >= segmentStart && note.time < segmentEnd)
          .map((note) => ({
            ...note,
            time: note.time - segmentStart,
            sustain: Math.min(note.sustain, segmentEnd - note.time),
            starPowerPhraseEnd:
              note.starPowerPhraseEnd === undefined
                ? undefined
                : Math.min(note.starPowerPhraseEnd, segmentEnd) - segmentStart,
          })),
        duration: segmentEnd - segmentStart,
      },
    };
  }

  function scheduleTimeline(track, startAt) {
    const schedule = scheduleWebHeroTrack(
      track,
      startAt,
      state.travelTime,
      state.chartSpeed,
    );
    state.longPauses = scheduleWebHeroLongPauses(
      track,
      schedule.startAt,
      state.chartSpeed,
    );
    state.notes = [];
    state.pendingNotes = state.practiceRange
      ? schedule.notes.map((note) => ({
          ...note,
          starPowerPhrase: undefined,
          starPowerPhraseEndAt: undefined,
        }))
      : schedule.notes;
    state.lyrics = scheduleWebHeroLyrics(
      (state.chart.lyrics || [])
        .filter(
          (lyric) =>
            !state.practiceRange ||
            (lyric.time >= state.practiceRange.start &&
              lyric.time < state.practiceRange.end),
        )
        .map((lyric) => ({
          ...lyric,
          time: lyric.time - (state.practiceRange?.start || 0),
        })),
      schedule.startAt,
      state.chartSpeed,
    );
    state.lyricPhrases = groupWebHeroLyrics(state.lyrics);
    state.lyricIndex = -1;
    state.lyricPhraseIndex = -1;
    state.lyricActiveIndex = -1;
    lyricsEl.replaceChildren();
    lyricsEl.hidden = state.lyrics.length === 0;
    state.beats = scheduleWebHeroBeats(
      (state.chart.beats || [])
        .filter(
          (beat) =>
            !state.practiceRange ||
            (beat.time >= state.practiceRange.start &&
              beat.time < state.practiceRange.end),
        )
        .map((beat) => ({
          ...beat,
          time: beat.time - (state.practiceRange?.start || 0),
        })),
      schedule.startAt,
      state.chartSpeed,
    );
    state.chartDuration = schedule.duration;
    state.starPowerPhrases = state.practiceRange
      ? []
      : schedule.starPowerPhrases;
    state.startedAt = schedule.startAt;
    return schedule;
  }

  function repeatPractice(now) {
    stopSong();
    state.score = 0;
    state.combo = 0;
    state.fullComboBroken = false;
    state.multiplier = 1;
    state.starPowerCharge = 0;
    state.starPowerActivatedAt = 0;
    state.starPowerActiveUntil = 0;
    state.maxCombo = 0;
    state.hits = 0;
    state.misses = 0;
    state.hitDelayTotal = 0;
    state.overHits = 0;
    state.sustainSeconds = 0;
    state.longest = 0;
    state.stagePresence = 80;
    state.missFlashUntil = 0;
    state.fireAt = state.fireAt.map(() => -Infinity);
    state.particles = [];
    const schedule = scheduleTimeline(
      state.practiceTrack,
      now + state.travelTime,
    );
    if (audioBuffers.length) {
      playAudio(
        state.chartSpeed,
        audioContext.currentTime +
          Math.max(0, state.travelTime + state.audioDelay) / 1000,
        state.practiceRange.start,
        state.practiceRange.end - state.practiceRange.start,
      );
    }
    state.lastFrame = schedule.startAt;
  }

  function restartPractice() {
    if (!state.running || !state.practiceRange || state.ending) return;
    cancelAnimationFrame(state.animation);
    clearHeldKeys();
    state.paused = false;
    pauseEl.hidden = true;
    const now = performance.now();
    repeatPractice(now);
    canvas.focus({ preventScroll: true });
    draw(now + state.videoDelay);
    state.animation = requestAnimationFrame(frame);
  }

  function starPowerOrRestart() {
    if (state.practiceRange && state.running) restartPractice();
    else activateStarPower();
  }

  function resume() {
    if (!state.running || !state.paused) return;
    const now = performance.now();
    shiftTimes(now - state.pausedAt);
    rewindChart(REWIND_MS);
    state.lyricIndex = state.lyrics.findLastIndex((l) => l.at <= now);
    state.lyricPhraseIndex = -1;
    state.lyricActiveIndex = -1;
    if (audioBuffers.length) {
      const songPos =
        ((now - state.startedAt - state.audioDelay) / 1000) * state.chartSpeed;
      playAudio(
        state.chartSpeed,
        audioContext.currentTime + Math.max(0, -songPos) / state.chartSpeed,
        (state.practiceRange?.start || 0) + Math.max(0, songPos),
        state.practiceRange
          ? Math.max(
              0,
              state.practiceRange.end -
                state.practiceRange.start -
                Math.max(0, songPos),
            )
          : undefined,
      );
    }
    state.paused = false;
    pauseEl.hidden = true;
    canvas.focus({ preventScroll: true });
    state.animation = requestAnimationFrame(frame);
  }

  function startPressed() {
    if (state.ending) return;
    if (state.running) return state.paused ? resume() : pause();
    if (!startButton.disabled) start();
  }

  async function start() {
    if (state.running) return;
    if (!state.chart) {
      setStatus("status.importPromptShort");
      return;
    }
    startButton.disabled = true;
    stopButton.disabled = true;
    setChartControlsDisabled(true);
    try {
      if (audioBuffers.length || savedChartRecord?.audioFiles.length) {
        audioContext ||= new AudioContext();
        await audioContext.resume();
      }
    } catch (error) {
      startButton.disabled = false;
      setChartControlsDisabled(false);
      setStatus("status.audioPrepareFailed", {
        error: () => translateError(error),
      });
      console.error("Impossible de préparer la bande-son importée.", error);
      return;
    }
    if (savedChartRecord?.audioFiles.length && !audioBuffers.length) {
      try {
        const restored = await restoreLastChart(localStorage, { audioContext });
        if (
          restored?.record.id === savedChartRecord.id &&
          restored.audioRestored
        )
          audioBuffers = restored.audioBuffers;
        else storageWarning = "status.audioUnavailable";
      } catch {
        storageWarning = "status.audioUnavailable";
      }
    }
    state.difficulty = difficultySelect.value;
    const { difficulty: chartDifficulty, track: chartTrack } = selectChartTrack(
      state.chart,
      state.difficulty,
      DIFFICULTY_ORDER,
    );
    const chartSpeed = Number(chartSpeedInput.value);
    const hyperspeed = Number(hyperspeedInput.value);
    const travelTime = DIFFICULTIES[state.difficulty].travelTime / hyperspeed;
    const startAt = performance.now() + travelTime;
    const audioDelay = Number(audioDelayInput.value);
    state.travelTime = travelTime;
    state.chartSpeed = chartSpeed;
    state.audioDelay = audioDelay;
    state.videoDelay = Number(videoDelayInput.value);
    state.practiceRange = practiceInput.checked
      ? getPracticeSegment(chartTrack)
      : null;
    state.practiceTrack = state.practiceRange?.track || chartTrack;
    if (touchStarPowerButton) {
      const actionKey = state.practiceRange
        ? "pause.restartSection"
        : "touch.starPower";
      touchStarPowerButton.dataset.i18nAttrs = `aria-label:${actionKey};title:${actionKey}`;
      touchStarPowerButton.setAttribute("aria-label", t(actionKey));
      touchStarPowerButton.title = t(actionKey);
      const icon = touchStarPowerButton.querySelector("i");
      icon?.classList.toggle("fa-star", !state.practiceRange);
      icon?.classList.toggle("fa-rotate-left", !!state.practiceRange);
    }
    const audioStartAt = audioBuffers.length
      ? audioContext.currentTime + Math.max(0, travelTime + audioDelay) / 1000
      : null;
    const schedule = scheduleTimeline(state.practiceTrack, startAt);
    state.running = true;
    if (lastChartId) markLastChartPlayed(localStorage, lastChartId);
    stage.classList.add("is-playing");
    gameOverEl.hidden = true;
    canvas.focus({ preventScroll: true });
    state.score = 0;
    state.combo = 0;
    state.multiplier = 1;
    state.starPowerCharge = 0;
    state.starPowerActivatedAt = 0;
    state.starPowerActiveUntil = 0;
    state.maxCombo = 0;
    state.misses = 0;
    state.hits = 0;
    state.hitDelayTotal = 0;
    state.overHits = 0;
    state.sustainSeconds = 0;
    state.stagePresence = 80;
    state.noFail = noFailInput.checked;
    state.paused = false;
    state.ending = false;
    state.endingAt = 0;
    state.fadeAlpha = 0;
    state.totalNotes = schedule.notes.length;
    state.chartDifficulty = chartDifficulty;
    state.scoreMultiplier = getWebHeroScoreMultiplier(
      chartDifficulty,
      chartSpeed,
      hyperspeed,
    );
    state.longest = 0;
    state.particles = [];
    state.lastFrame = state.startedAt;
    startButton.disabled = true;
    stopButton.hidden = false;
    stopButton.disabled = false;
    setChartControlsDisabled(true);
    setStatus("status.running", {
      difficulty: () => t(`difficulty.${chartDifficulty}`),
      track: chartTrack.name,
      warning: () =>
        `${storageWarning ? t(storageWarning) : ""}${audioBuffers.length ? "" : t("status.noAudio")}`,
    });
    state.animation = requestAnimationFrame(frame);
    if (audioBuffers.length) {
      playAudio(
        chartSpeed,
        audioStartAt,
        state.practiceRange?.start || 0,
        state.practiceRange
          ? state.practiceRange.end - state.practiceRange.start
          : undefined,
      );
    }
  }

  // offset en secondes de buffer ; startAt en temps AudioContext.
  function playAudio(chartSpeed, startAt, offset, duration) {
    for (const buffer of audioBuffers) {
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      source.playbackRate.value = chartSpeed;
      gain.gain.value = 1 / audioBuffers.length;
      source.connect(gain);
      gain.connect(audioContext.destination);
      source.onended = () => {
        source.disconnect();
        audioSources = audioSources.filter((active) => active !== source);
      };
      audioSources.push(source);
      if (duration === undefined) source.start(startAt, offset);
      else source.start(startAt, offset, duration);
    }
  }

  function registerHit(hitNote, lane, now) {
    state.fireAt[lane] = now;
    state.hits += 1;
    state.hitDelayTotal += now - hitNote.hitAt;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.multiplier = getWebHeroMultiplier(state.combo);
    state.stagePresence = adjustWebHeroStagePresence(state.stagePresence, true);
    state.score += Math.round(
      100 * state.multiplier * state.scoreMultiplier * getStarPowerFactor(now),
    );
    const phrase = state.starPowerPhrases.find(
      (item) => item.id === hitNote.starPowerPhrase,
    );
    if (phrase) phrase.hits = (phrase.hits || 0) + 1;
  }

  function getStarPowerFactor(now) {
    return !state.practiceRange && state.starPowerActiveUntil > now ? 2 : 1;
  }

  function settleStarPowerPhrases(now) {
    for (const phrase of state.starPowerPhrases) {
      if (phrase.settled || now < phrase.endAt + 300) continue;
      phrase.settled = true;
      if (phrase.hits === phrase.noteCount)
        state.starPowerCharge = Math.min(100, state.starPowerCharge + 25);
    }
  }

  function activateStarPower() {
    const now = performance.now();
    if (
      !state.running ||
      state.paused ||
      state.ending ||
      state.starPowerCharge < 50 ||
      state.starPowerActiveUntil > now
    )
      return;
    state.starPowerCharge -= 50;
    state.starPowerActivatedAt = now;
    state.starPowerActiveUntil = now + 8000;
  }

  function creditSustain(note, at) {
    const heldSeconds = Math.min(
      note.sustain,
      Math.max(0, (at - note.sustainStartedAt) / 1000),
    );
    const scoredSeconds = note.sustainScoredSeconds || 0;
    const scoreSustain = (seconds) =>
      getWebHeroSustainBonus(
        seconds,
        note.holdMultiplier,
        state.scoreMultiplier,
      );
    state.score += scoreSustain(heldSeconds) - scoreSustain(scoredSeconds);
    const segmentStart = note.sustainStartedAt + scoredSeconds * 1000;
    const segmentEnd = note.sustainStartedAt + heldSeconds * 1000;
    const poweredSeconds =
      Math.max(
        0,
        Math.min(segmentEnd, state.starPowerActiveUntil) -
          Math.max(segmentStart, state.starPowerActivatedAt),
      ) / 1000;
    const scoredPoweredSeconds = note.sustainPoweredSeconds || 0;
    state.score +=
      scoreSustain(poweredSeconds) - scoreSustain(scoredPoweredSeconds);
    note.sustainScoredSeconds = heldSeconds;
    note.sustainPoweredSeconds = poweredSeconds;
    return heldSeconds;
  }

  function endSustain(note, endedAt) {
    const heldSeconds = creditSustain(note, endedAt);
    state.sustainSeconds += heldSeconds;
    note.holding = false;
    note.releasedAt = endedAt;
  }

  function hit(lane) {
    if (!state.running || state.paused || state.ending) return;
    const now = performance.now();
    if (
      state.longPauses.some(
        (pause) => now >= pause.startAt && now < pause.endAt,
      )
    )
      return;
    if (lane < 0) {
      registerMiss();
      return;
    }
    const index = findHitNote(state.notes, [lane], now);
    if (index < 0) {
      const expiredIndex = state.notes.findIndex(
        (note) =>
          note.lane === lane && !note.hitRegistered && now > note.missAt,
      );
      if (expiredIndex >= 0) {
        state.notes.splice(expiredIndex, 1);
        registerMiss();
        return;
      }
      // Pas de pénalité si on rejoue une lane en sustain ou qu'une autre frette est tenue (tap).
      if (
        state.notes.some((n) => n.lane === lane && n.holding) ||
        getHeldLanes().some((l) => l !== lane)
      )
        return;
      registerOverHit();
      return;
    }
    consume(index, now, registerLaneHit);
  }

  function consume(index, now, register) {
    const hitNote = state.notes[index];
    if (hitNote.sustain > 0) {
      hitNote.holding = true;
      hitNote.hitRegistered = true;
      hitNote.holdMultiplier = state.multiplier;
      hitNote.sustainStartedAt = now;
      hitNote.sustainScoredSeconds = 0;
      hitNote.sustainEndAt = hitNote.hitAt + hitNote.sustain * 1000;
      register(hitNote, hitNote.lane, now);
      return;
    }
    state.notes.splice(index, 1);
    register(hitNote, hitNote.lane, now);
  }

  function hitGuitarGroup(group, now) {
    for (const note of group.notes) {
      consume(state.notes.indexOf(note), now, registerHit);
    }
    state.lastHitAt = now;
  }

  function strum() {
    if (!state.running || state.paused || state.ending) return;
    const now = performance.now();
    if (state.longPauses.some((p) => now >= p.startAt && now < p.endAt)) return;
    const group = findGuitarGroup(state.notes, now);
    if (group && fretsMatch(group.lanes, getHeldLanes()))
      hitGuitarGroup(group, now);
    else registerOverHit();
  }

  // HOPO (chaîne en cours) et TAP : validés par une frette pressée, sans strum.
  function tryFretHit(now) {
    if (
      !state.running ||
      state.paused ||
      state.ending ||
      state.lastFretAt <= state.lastHitAt
    )
      return;
    const group = findGuitarGroup(state.notes, now);
    if (
      group &&
      canFretHit(group.type, state.combo) &&
      fretsMatch(group.lanes, getHeldLanes())
    )
      hitGuitarGroup(group, now);
  }

  function fretDown() {
    state.lastFretAt = performance.now();
    // La frette est ajoutée aux touches tenues après pressLane.
    queueMicrotask(() => tryFretHit(performance.now()));
  }

  function registerLaneHit(note, lane, now) {
    registerHit(note, lane, now);
    for (const heldLane of getHoldTapLanes(
      lane,
      getHeldLanes(),
      LANE_RANKS,
    ).slice(1)) {
      autoHitLanes.add(heldLane);
    }
  }

  function release(key) {
    if (!state.running) return;
    const lane = keys.indexOf(key.toLowerCase());
    const index = state.notes.findIndex(
      (note) => note.lane === lane && note.holding,
    );
    if (index < 0) return;
    const note = state.notes[index];
    endSustain(
      note,
      Math.min(
        state.paused ? state.pausedAt : performance.now(),
        note.sustainEndAt,
      ),
    );
  }

  const heldKeyboardLanes = new Map();
  const heldTouchPointers = new Map();
  const heldTouchLanes = new Map();
  const autoHitLanes = new Set();
  function getHeldLanes() {
    return [...heldKeyboardLanes.values(), ...heldTouchLanes.keys()];
  }
  function pressLane(lane) {
    if (guitarMode) fretDown();
    else hit(lane);
  }
  function clearHeldKeys() {
    for (const lane of new Set([
      ...heldKeyboardLanes.values(),
      ...heldTouchLanes.keys(),
    ]))
      release(keys[lane]);
    heldKeyboardLanes.clear();
    heldTouchPointers.clear();
    heldTouchLanes.clear();
    for (const lane of autoHitLanes) {
      if (!getHeldLanes().includes(lane)) autoHitLanes.delete(lane);
    }
  }

  function setTouchPointerLane(pointerId, lane) {
    if (!heldTouchPointers.has(pointerId)) return;
    const previousLane = heldTouchPointers.get(pointerId);
    if (previousLane === lane) return;
    if (previousLane !== null) {
      const pointers = heldTouchLanes.get(previousLane);
      pointers.delete(pointerId);
      if (pointers.size === 0) {
        heldTouchLanes.delete(previousLane);
        release(keys[previousLane]);
        if (!getHeldLanes().includes(previousLane))
          autoHitLanes.delete(previousLane);
      }
    }
    heldTouchPointers.set(pointerId, lane);
    if (lane === null) return;
    const pointers = heldTouchLanes.get(lane) || new Set();
    if (pointers.size === 0) hit(lane);
    pointers.add(pointerId);
    heldTouchLanes.set(lane, pointers);
  }

  function finishTouchPointer(pointerId) {
    if (!heldTouchPointers.has(pointerId)) return;
    setTouchPointerLane(pointerId, null);
    heldTouchPointers.delete(pointerId);
  }
  function getCanvasTouchLane(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((event.clientX - rect.left) * state.viewWidth) / rect.width;
    const y = ((event.clientY - rect.top) * state.viewHeight) / rect.height;
    const track = getTrackBounds();
    const lane = Math.floor((x - track.x) / track.laneWidth);
    const targetRadius = Math.min(TARGET_MAX_RADIUS, track.laneWidth / 2 - 5);
    const touchRadius = Math.min(
      track.laneWidth / 2,
      Math.max(24, targetRadius + 8),
    );
    return x >= track.x &&
      x < track.x + track.width &&
      lane >= 0 &&
      lane < keys.length &&
      Math.abs(y - (state.viewHeight - HIT_ZONE_OFFSET)) <= touchRadius
      ? lane
      : null;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || !state.running) return;
    const lane = getCanvasTouchLane(event);
    if (lane === null || heldTouchPointers.has(event.pointerId)) return;
    event.preventDefault();
    heldTouchPointers.set(event.pointerId, null);
    setTouchPointerLane(event.pointerId, lane);
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!heldTouchPointers.has(event.pointerId)) return;
    event.preventDefault();
    setTouchPointerLane(event.pointerId, getCanvasTouchLane(event));
  });
  canvas.addEventListener("pointerup", (event) =>
    finishTouchPointer(event.pointerId),
  );
  canvas.addEventListener("pointercancel", (event) =>
    finishTouchPointer(event.pointerId),
  );
  canvas.addEventListener("lostpointercapture", (event) =>
    finishTouchPointer(event.pointerId),
  );

  startButton.addEventListener("click", start);
  touchPauseButton?.addEventListener("click", startPressed);
  touchStarPowerButton?.addEventListener("click", starPowerOrRestart);
  chartUnloadButton.addEventListener("click", unloadCurrentChart);
  stopButton.addEventListener("click", () =>
    finish("status.stopped", { stopped: true }),
  );
  restartButton.addEventListener("click", start);
  resumeButton.addEventListener("click", resume);
  practiceRestartButton.addEventListener("click", restartPractice);
  quitButton.addEventListener("click", () =>
    finish("status.stopped", { stopped: true }),
  );
  noFailInput.addEventListener("change", saveSettings);
  returnButton?.addEventListener("click", () => {
    state.ending = false;
    state.endingAt = 0;
    state.fadeAlpha = 0;
    state.notes = [];
    state.pendingNotes = [];
    state.particles = [];
    state.lyrics = [];
    state.lyricPhrases = [];
    state.lyricIndex = -1;
    state.lyricPhraseIndex = -1;
    state.lyricActiveIndex = -1;
    lyricsEl.replaceChildren();
    lyricsEl.hidden = true;
    gameOverEl.hidden = true;
    stage.classList.remove("is-playing");
    draw(performance.now());
    setStatus("status.ready");
    startButton.focus({ preventScroll: true });
  });
  chartImportButton.addEventListener("click", () => chartFileInput.click());
  document
    .getElementById("fullscreen-button")
    ?.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await stage.requestFullscreen();
        }
      } catch (error) {
        setStatus("status.fullscreenFailed", {
          error: () => translateError(error),
        });
      }
    });
  chartSpeedInput.addEventListener("input", () => {
    chartSpeedValue.value = `${Math.round(Number(chartSpeedInput.value) * 100)} %`;
    saveSettings();
  });
  hyperspeedInput.addEventListener("input", () => {
    hyperspeedValue.value = `${Number(hyperspeedInput.value).toFixed(1)}×`;
    if (!state.running)
      state.travelTime =
        DIFFICULTIES[difficultySelect.value].travelTime /
        Number(hyperspeedInput.value);
    saveSettings();
    draw(performance.now());
  });
  for (const [input, output, property] of [
    [audioDelayInput, audioDelayValue, "audioDelay"],
    [videoDelayInput, videoDelayValue, "videoDelay"],
  ]) {
    input.addEventListener("input", () => {
      output.value = `${input.value} ms`;
      state[property] = Number(input.value);
      saveSettings();
      draw(performance.now());
    });
  }
  practiceInput.addEventListener("change", () => {
    practiceStartSectionSelect.disabled =
      !practiceInput.checked || state.running;
    practiceEndSectionSelect.disabled = !practiceInput.checked || state.running;
    saveSettings();
  });
  function localizedOption(key, value) {
    const option = new Option(t(key), value);
    option.dataset.i18n = key;
    return option;
  }

  function updatePracticeEndSections() {
    const sections = state.chart?.sections || [];
    const startIndex = Number(practiceStartSectionSelect.value);
    const previousEnd = practiceEndSectionSelect.value;
    const options = [localizedOption("settings.chartEnd", "-1")];
    sections.forEach((section, index) => {
      if (startIndex < 0 || index >= startIndex)
        options.push(new Option(section.name, String(index)));
    });
    practiceEndSectionSelect.replaceChildren(...options);
    practiceEndSectionSelect.value = options.some(
      (option) => option.value === previousEnd,
    )
      ? previousEnd
      : "-1";
  }
  practiceStartSectionSelect.addEventListener("change", () => {
    updatePracticeEndSections();
    saveSettings();
  });
  practiceEndSectionSelect.addEventListener("change", saveSettings);
  hitZonePreviewInput.addEventListener("change", () => {
    state.hitZonePreview = hitZonePreviewInput.checked;
    saveSettings();
    draw(performance.now());
  });
  primaryColorInput.addEventListener("input", () => {
    state.primaryColor = primaryColorInput.value;
    document.documentElement.style.setProperty("--accent", state.primaryColor);
    saveSettings();
    draw(performance.now());
  });
  highwayBackgroundInput.addEventListener("change", async () => {
    const file = highwayBackgroundInput.files?.[0];
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / bitmap.width, 900 / bitmap.height);
      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = Math.max(1, Math.round(bitmap.width * scale));
      imageCanvas.height = Math.max(1, Math.round(bitmap.height * scale));
      imageCanvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, imageCanvas.width, imageCanvas.height);
      bitmap.close();
      const image = imageCanvas.toDataURL("image/webp", 0.78);
      if (image.length > 2_000_000) throw new Error(t("status.imageTooLarge"));
      localStorage.setItem(HIGHWAY_BACKGROUND_KEY, image);
      state.highwayBackground = image;
      backgroundNameOutput.value = file.name;
      backgroundClearButton.disabled = false;
      draw(performance.now());
    } catch (error) {
      setStatus("status.backgroundFailed", {
        error: () => translateError(error),
      });
    } finally {
      highwayBackgroundInput.value = "";
    }
  });
  backgroundClearButton.addEventListener("click", () => {
    const confirmClear = confirm(t("custom.removeConfirm"));
    if (!confirmClear) return;
    localStorage.removeItem(HIGHWAY_BACKGROUND_KEY);
    state.highwayBackground = "";
    backgroundNameOutput.value = t("custom.noImage");
    backgroundClearButton.disabled = true;
    draw(performance.now());
  });
  function configureLoadedChart(chart) {
    const availableDifficulties = DIFFICULTY_ORDER.filter(
      (difficulty) => chart.tracks[difficulty],
    );
    const preferredDifficulty = DIFFICULTIES[difficultySelect.value]
      ? difficultySelect.value
      : state.difficulty;
    const selectedDifficulty = availableDifficulties.includes(
      preferredDifficulty,
    )
      ? preferredDifficulty
      : selectChartTrack(chart, preferredDifficulty, DIFFICULTY_ORDER)
          .difficulty;
    difficultySelect.replaceChildren(
      ...availableDifficulties.map((difficulty) =>
        localizedOption(`difficulty.${difficulty}`, difficulty),
      ),
    );
    difficultySelect.value = selectedDifficulty;
    state.difficulty = selectedDifficulty;
    state.travelTime =
      DIFFICULTIES[selectedDifficulty].travelTime /
      Number(hyperspeedInput.value);
    practiceStartSectionSelect.replaceChildren(
      localizedOption("settings.chartBeginning", "-1"),
      ...(chart.sections || []).map(
        (section, index) => new Option(section.name, String(index)),
      ),
    );
    practiceStartSectionSelect.value = "-1";
    updatePracticeEndSections();
    practiceStartSectionSelect.disabled = !practiceInput.checked;
    practiceEndSectionSelect.disabled = !practiceInput.checked;
  }

  async function unloadCurrentChart() {
    if (!state.chart || state.running) return;
    chartUnloadButton.disabled = true;
    stopSong();
    audioBuffers = [];
    state.chart = null;
    state.chartTitle = "";
    state.practiceTrack = null;
    state.practiceRange = null;
    state.notes = [];
    state.pendingNotes = [];
    state.longPauses = [];
    state.beats = [];
    state.lyrics = [];
    state.lyricPhrases = [];
    state.lyricIndex = -1;
    state.lyricPhraseIndex = -1;
    state.lyricActiveIndex = -1;
    state.starPowerPhrases = [];
    state.starPowerCharge = 0;
    state.particles = [];
    state.fireAt = state.fireAt.map(() => -Infinity);
    state.totalNotes = 0;
    state.score = 0;
    state.combo = 0;
    state.multiplier = 1;
    state.maxCombo = 0;
    savedChartRecord = null;
    lastChartId = null;
    storageWarning = "";
    lyricsEl.replaceChildren();
    lyricsEl.hidden = true;
    gameOverEl.hidden = true;
    pauseEl.hidden = true;
    importProgress.hidden = true;
    stage.classList.remove("is-playing");
    difficultySelect.replaceChildren(localizedOption("difficulty.noChart", ""));
    difficultySelect.value = "";
    practiceStartSectionSelect.replaceChildren(
      localizedOption("settings.chartBeginning", "-1"),
    );
    practiceEndSectionSelect.replaceChildren(
      localizedOption("settings.chartEnd", "-1"),
    );
    practiceStartSectionSelect.disabled = true;
    practiceEndSectionSelect.disabled = true;
    setChartControlsDisabled(false);
    startButton.disabled = true;
    stopButton.hidden = true;
    const removed = await removeLastChart(localStorage);
    setStatus(removed ? "status.chartUnloaded" : "status.chartUnloadFailed");
    draw(performance.now());
    chartImportButton.focus({ preventScroll: true });
  }

  async function restorePreviousChart() {
    chartImportButton.disabled = true;
    startButton.disabled = true;
    try {
      const restored = await restoreLastChart(localStorage);
      if (!restored) return;
      savedChartRecord = restored.record;
      lastChartId = restored.record.id;
      state.chart = restored.record.chart;
      state.chartTitle = restored.record.title;
      configureLoadedChart(state.chart);
      const selectedTrack = selectChartTrack(
        state.chart,
        difficultySelect.value,
        DIFFICULTY_ORDER,
      );
      const audioStatusKey = restored.record.audioFiles.length
        ? restored.record.audioCacheName
          ? "status.audioSaved"
          : "status.audioNotSaved"
        : "status.noAudioAttached";
      setStatus("status.chartRestored", {
        title: state.chartTitle,
        count: selectedTrack.track.notes.length,
        track: selectedTrack.track.name,
        audio: () => t(audioStatusKey),
      });
    } catch (error) {
      console.error("Impossible de restaurer la dernière chart.", error);
    } finally {
      chartImportButton.disabled = false;
      startButton.disabled = !state.chart;
      difficultySelect.disabled = !state.chart;
      chartUnloadButton.disabled = !state.chart;
    }
  }

  chartFileInput.addEventListener("change", async () => {
    const files = [...chartFileInput.files];
    if (!files.length) return;
    try {
      if (state.running) throw new Error(t("status.finishPractice"));
      setChartControlsDisabled(true);
      startButton.disabled = true;
      const {
        chartFile: file,
        audioFiles,
        iniFile,
        folderName,
      } = selectChartFolderFiles(files);
      const totalSteps = 1 + audioFiles.length;
      let doneSteps = 0;
      const progress = (labelKey, values = {}) => {
        importProgress.hidden = false;
        importProgress.value = doneSteps / totalSteps;
        setStatus("status.progress", {
          label: () => t(labelKey, values),
          percent: Math.round((doneSteps / totalSteps) * 100),
        });
      };
      progress("status.readingChart");
      await new Promise((resolve) => setTimeout(resolve));
      const extension = file.name.split(".").pop().toLowerCase();
      let chart;
      const songName = iniFile
        ? parseSongIni(await iniFile.text()) || folderName
        : folderName;
      if (extension === "chart") {
        chart = parseWebHeroChart(await file.text());
      } else {
        chart = parseWebHeroMidi(await file.arrayBuffer());
      }
      doneSteps++;
      const decodedAudio = [];
      if (audioFiles.length) {
        audioContext ||= new AudioContext();
        for (const [index, audioFile] of audioFiles.entries()) {
          progress("status.audioProgress", {
            current: index + 1,
            total: audioFiles.length,
          });
          decodedAudio.push(
            await audioContext.decodeAudioData(await audioFile.arrayBuffer()),
          );
          doneSteps++;
        }
      }
      importProgress.value = 1;
      stopSong();
      state.chart = chart;
      state.chartTitle = songName;
      audioBuffers = decodedAudio;
      savedChartRecord = null;
      lastChartId = null;
      storageWarning = "";
      configureLoadedChart(chart);
      setStatus("status.savingChart");
      try {
        const saved = await saveLastChart(localStorage, {
          chart,
          title: songName,
          chartName: file.name,
          audioFiles,
        });
        savedChartRecord = saved.record;
        lastChartId = saved.record.id;
        storageWarning =
          saved.record.audioFiles.length && !saved.audioSaved
            ? "status.audioWarning"
            : "";
      } catch (error) {
        storageWarning = "status.audioSaveFailed";
        console.error("Impossible de sauvegarder la chart importée.", error);
      }
      const selectedTrack = selectChartTrack(
        state.chart,
        difficultySelect.value,
        DIFFICULTY_ORDER,
      );
      gameOverEl.hidden = true;
      setStatus("status.chartImported", {
        title: songName,
        count: selectedTrack.track.notes.length,
        track: selectedTrack.track.name,
        audio: () =>
          audioFiles.length
            ? t("status.audioCount", {
                count: audioFiles.length,
                plural: audioFiles.length === 1 ? "" : "s",
              })
            : t("status.noAudioAttached"),
        warning: () => (storageWarning ? t(storageWarning) : ""),
      });
    } catch (error) {
      setStatus("status.importFailed", { error: () => translateError(error) });
    } finally {
      chartFileInput.value = "";
      importProgress.hidden = true;
      if (!state.running) {
        setChartControlsDisabled(false);
        startButton.disabled = !state.chart;
      }
    }
  });
  difficultySelect.addEventListener("change", () => {
    const newDifficulty = difficultySelect.value;
    state.difficulty = newDifficulty;
    if (!state.running)
      state.travelTime =
        DIFFICULTIES[newDifficulty].travelTime / Number(hyperspeedInput.value);
    saveSettings();
    if (!state.running) return;
    finish("status.difficultyChanged", { save: false });
  });
  window.addEventListener("keydown", (event) => {
    if (learnKey(event)) return;
    if (event.code === pauseKey && state.running) {
      event.preventDefault();
      if (!event.repeat) state.paused ? resume() : pause();
      return;
    }
    if (event.repeat || event.target.matches("input, textarea, select")) return;
    if (event.code === starPowerKey) {
      event.preventDefault();
      starPowerOrRestart();
      return;
    }
    if (guitarMode && strumKeys.includes(event.code)) {
      event.preventDefault();
      strum();
      return;
    }
    const lane = keys.indexOf(event.key.toLowerCase());
    if (lane < 0 || event.ctrlKey || event.altKey || event.metaKey) return;
    pressLane(lane);
    heldKeyboardLanes.set(event.code, lane);
  });
  window.addEventListener("keyup", (event) => {
    const lane = heldKeyboardLanes.get(event.code);
    if (lane === undefined) {
      release(event.key);
      return;
    }
    heldKeyboardLanes.delete(event.code);
    release(keys[lane]);
    if (!getHeldLanes().includes(lane)) autoHitLanes.delete(lane);
  });
  // Une lane = ensemble de boutons (certaines guitares en envoient plusieurs par frette).
  const padButtons = JSON.parse(
    localStorage.getItem("web-hero-pad") || "[1,4,3,0,2]",
  ).map((b) => [].concat(b));
  // Ensembles 5 = pause (Start), 6 et 7 = strum haut/bas (croix directionnelle).
  [[9], [12], [13]].forEach((defaults, i) => (padButtons[5 + i] ??= defaults));
  padButtons[8] ??= [8];
  const padEls = [...document.querySelectorAll(".web-hero-pad")];
  let padLearn = -1;
  const padDebugEl = document.getElementById("web-hero-pad-debug");
  const padSeen = new Set();
  const padLabel = (i) => padButtons[i].map((b) => `B${b}`).join("+");
  padEls.forEach((el, lane) => {
    el.textContent = padLabel(lane);
    el.addEventListener("click", () => {
      padLearn = lane;
      padSeen.clear();
      el.textContent = "…";
    });
  });
  const padWasDown = new Set();
  function pollPads() {
    const pads = navigator.getGamepads?.() ?? [];
    guitarMode = pads.some(Boolean);
    const down = getPressedPadButtons(pads);
    const axes = (pickPad(pads)?.axes ?? []).flatMap((v, i) =>
      Math.abs(v) > 0.5 ? [`A${i}`] : [],
    );
    padDebugEl.title = pads
      .filter(Boolean)
      .map((p) => `${p.id} [${p.mapping}]`)
      .join(" | ");
    padDebugEl.textContent = [...[...down].map((b) => `B${b}`), ...axes].join(
      " ",
    );
    if (padLearn >= 0) {
      down.forEach((b) => padSeen.add(b));
      if (down.size === 0 && padSeen.size > 0) {
        padButtons[padLearn] = [...padSeen].sort((a, b) => a - b);
        padSeen.clear();
        localStorage.setItem("web-hero-pad", JSON.stringify(padButtons));
        padEls[padLearn].textContent = padLabel(padLearn);
        padLearn = -1;
      }
    } else {
      const held = new Set(
        [...heldKeyboardLanes]
          .filter(([id]) => id.startsWith("pad"))
          .map(([, l]) => l),
      );
      const { press, releaseLanes } = diffPadLanes(
        padButtons.slice(0, 5),
        down,
        held,
      );
      for (const lane of press) {
        pressLane(lane);
        heldKeyboardLanes.set(`pad${lane}`, lane);
      }
      for (const lane of releaseLanes) {
        heldKeyboardLanes.delete(`pad${lane}`);
        release(keys[lane]);
        if (!getHeldLanes().includes(lane)) autoHitLanes.delete(lane);
      }
    }
    // Strum = croix directionnelle haut/bas (guitares XInput)
    const isOn = (set, i) =>
      padButtons[i].length > 0 && padButtons[i].every((b) => set.has(b));
    if (padLearn < 0 && isOn(down, 5) && !isOn(padWasDown, 5)) startPressed();
    if (padLearn < 0 && isOn(down, 8) && !isOn(padWasDown, 8))
      starPowerOrRestart();
    if (guitarMode && padLearn < 0) {
      for (const i of [6, 7])
        if (isOn(down, i) && !isOn(padWasDown, i)) strum();
    }
    if (!state.running) {
      const held = getHeldLanes();
      if (held.join() !== state.heldLanes.join()) {
        state.heldLanes = held;
        draw(performance.now());
      }
    }
    padWasDown.clear();
    down.forEach((b) => padWasDown.add(b));
    requestAnimationFrame(pollPads);
  }
  requestAnimationFrame(pollPads);
  window.addEventListener("blur", clearHeldKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearHeldKeys();
      pause();
    }
  });
  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();
  draw(0);
  setStatus("status.importPrompt");
  void restorePreviousChart();
  if (canvas) canvas.focus();
  /*alert(
    "Sur PC, utilisez l'option de plein écran pour une meilleure expérience.",
  );*/
}

initWebHero();
