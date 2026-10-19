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
  scheduleWebHeroTrack,
} from "./pde_hero_chart.mjs";
import { parseSongIni, selectChartFolderFiles } from "./chart-import.mjs";
import { createGameRenderer } from "./game-renderer.mjs";
import { decodeMidi, encodeMidi, loadKeys, selectChartTrack } from "./utils.js";

const DEFAULT_KEYS = ["d", "f", "j", "k", "l"];
const SETTINGS_KEY = "web-hero-settings";
const COLORS = ["#ff4f64", "#ffb347", "#ffe14a", "#63e6be", "#74a7ff"];
const DIFFICULTIES = {
  easy: { label: "Facile", travelTime: 3200 },
  medium: { label: "Moyen", travelTime: 2400 },
  hard: { label: "Difficile", travelTime: 1450 },
  expert: { label: "Expert", travelTime: 1100 },
};
const DIFFICULTY_ORDER = Object.keys(DIFFICULTIES);

export function initWebHero(socket = null) {
  const stage = document.getElementById("stage22");
  const canvas = document.getElementById("web-hero-canvas");
  const startButton = document.getElementById("web-hero-start");
  const stopButton = document.getElementById("web-hero-stop");
  const chartImportButton = document.getElementById("web-hero-chart-import");
  const chartFileInput = document.getElementById("web-hero-chart-file");
  const difficultySelect = document.getElementById("web-hero-difficulty");
  const chartSpeedInput = document.getElementById("web-hero-chart-speed");
  const chartSpeedValue = document.getElementById("web-hero-chart-speed-value");
  const hyperspeedInput = document.getElementById("web-hero-hyperspeed");
  const hyperspeedValue = document.getElementById("web-hero-hyperspeed-value");
  const keyInputs = [...document.querySelectorAll(".web-hero-key")];
  if (
    !stage ||
    !canvas ||
    !startButton ||
    !stopButton ||
    !chartImportButton ||
    !chartFileInput ||
    !difficultySelect ||
    !chartSpeedInput ||
    !chartSpeedValue ||
    !hyperspeedInput ||
    !hyperspeedValue ||
    keyInputs.length !== 5
  )
    return;

  const statusEl = document.getElementById("web-hero-status-text");
  const gameOverEl = document.getElementById("web-hero-game-over");
  const restartButton = document.getElementById("web-hero-restart");
  const returnButton = document.getElementById("web-hero-return");
  const finalScoreEl = document.getElementById("web-hero-final-score");
  const finalTimeEl = document.getElementById("web-hero-final-time");
  const finalAccuracyEl = document.getElementById("web-hero-final-accuracy");
  const finalNotesEl = document.getElementById("web-hero-final-notes");
  const finalHitsEl = document.getElementById("web-hero-final-hits");
  const finalStreakEl = document.getElementById("web-hero-final-streak");
  const finalDelayEl = document.getElementById("web-hero-final-delay");
  const gameOverTitleEl = document.getElementById("web-hero-result-title");
  const lyricsEl = document.getElementById("web-hero-lyrics");
  let lyricSpans = [];
  const state = {
    running: false,
    score: 0,
    combo: 0,
    multiplier: 1,
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
    chart: null,
    chartDuration: 0,
    travelTime: 0,
    animation: 0,
    lastFrame: 0,
    missFlashUntil: 0,
    viewWidth: 0,
    viewHeight: 0,
    difficulty: difficultySelect.value,
    chartDifficulty: difficultySelect.value,
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
  let importedChartSource = null;
  let audioContext = null;
  let audioBuffers = [];
  let audioSources = [];

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
    statusEl.textContent = "Paramètres Web Hero locaux illisibles.";
  }
  if (DIFFICULTIES[savedSettings.difficulty]) {
    difficultySelect.value = savedSettings.difficulty;
    state.difficulty = savedSettings.difficulty;
  }
  for (const [input, value] of [
    [chartSpeedInput, savedSettings.chartSpeed],
    [hyperspeedInput, savedSettings.hyperspeed],
  ]) {
    if (Number.isFinite(value)) {
      input.value = String(
        Math.max(Number(input.min), Math.min(Number(input.max), value)),
      );
    }
  }
  chartSpeedValue.value = `${Math.round(Number(chartSpeedInput.value) * 100)} %`;
  hyperspeedValue.value = `${Number(hyperspeedInput.value).toFixed(1)}×`;
  if (
    typeof savedSettings.importedChart?.name === "string" &&
    typeof savedSettings.importedChart?.content === "string"
  ) {
    try {
      state.chart =
        savedSettings.importedChart.format === "midi"
          ? parseWebHeroMidi(decodeMidi(savedSettings.importedChart.content))
          : parseWebHeroChart(savedSettings.importedChart.content);
      importedChartSource = savedSettings.importedChart;
      statusEl.textContent = `${importedChartSource.name} chargé depuis les paramètres locaux, sans bande-son.`;
    } catch (error) {
      console.error(
        "La dernière chart Web Hero sauvegardée est invalide.",
        error,
      );
      statusEl.textContent =
        "La dernière chart Web Hero sauvegardée est invalide.";
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          difficulty: difficultySelect.value,
          chartSpeed: Number(chartSpeedInput.value),
          hyperspeed: Number(hyperspeedInput.value),
          importedChart: importedChartSource,
        }),
      );
    } catch (error) {
      console.error(
        "Impossible de sauvegarder les paramètres Web Hero.",
        error,
      );
      if (!state.running)
        statusEl.textContent =
          "Impossible de sauvegarder les paramètres Web Hero localement.";
    }
  }

  function setChartControlsDisabled(disabled) {
    chartImportButton.disabled = disabled;
    difficultySelect.disabled = disabled;
    chartSpeedInput.disabled = disabled;
    hyperspeedInput.disabled = disabled;
  }

  keyInputs.forEach((input, index) => {
    input.value = keys[index].toUpperCase();
    input.addEventListener("change", () => {
      const value = input.value.trim().toLowerCase().slice(0, 1);
      if (!value || keys.includes(value)) {
        input.value = keys[index].toUpperCase();
        return;
      }
      keys[index] = value;
      input.value = value.toUpperCase();
      localStorage.setItem("web-hero-keys", JSON.stringify(keys));
    });
  });

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
      lyricsEl.replaceChildren();
      lyricSpans = phrase.syllables.map((syllable) => {
        if (syllable.separatorBefore)
          lyricsEl.append(document.createTextNode(syllable.separatorBefore));
        const span = document.createElement("span");
        span.textContent = syllable.text;
        lyricsEl.append(span);
        return span;
      });
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

  function frame(now) {
    if (!state.running) return;
    state.lastFrame = now;
    const travelTime = state.travelTime;
    const hitY = state.viewHeight - 48;
    const { laneWidth } = getTrackBounds();
    const noteRadius = Math.max(0, Math.min(20, laneWidth / 2 - 6));
    const distanceAfterHitZone = state.viewHeight - hitY + noteRadius;
    const timePastHitZone =
      travelTime * (distanceAfterHitZone / Math.max(1, hitY));
    while (
      state.pendingNotes.length > 0 &&
      state.pendingNotes[0].spawnAt <= now
    ) {
      const pendingNote = state.pendingNotes.shift();
      const hitAt = pendingNote.spawnAt + pendingNote.travelTime;
      state.notes.push({
        lane: pendingNote.lane,
        spawnAt: pendingNote.spawnAt,
        travelTime: pendingNote.travelTime,
        hitAt,
        missAt: hitAt + timePastHitZone,
        sustain: pendingNote.sustain,
        sustainEndAt: hitAt + pendingNote.sustain * 1000,
        holding: false,
        hitRegistered: false,
      });
    }
    for (let index = state.notes.length - 1; index >= 0; index--) {
      const note = state.notes[index];
      if (note.holding) {
        creditSustain(note, now);
        if (now >= note.sustainEndAt) endSustain(note, note.sustainEndAt);
      }
      if (!note.hitRegistered && note.missAt < now) registerMiss();
      if (!state.running) return;
      if (note.holding && now - (note.lastParticleAt || 0) >= 65) {
        note.lastParticleAt = now;
        const { center: x } = getLaneBounds(note.lane);
        const y = hitY - 8;
        state.particles.push(
          ...Array.from({ length: 3 }, () => ({
            x,
            y,
            vx: (Math.random() - 0.5) * 90,
            vy: -(18 + Math.random() * 50),
            size: 3 + Math.random() * 3,
            color: COLORS[note.lane],
            createdAt: now,
            duration: 350 + Math.random() * 250,
          })),
        );
      }
      if (
        note.hitRegistered
          ? !note.holding && now >= note.sustainEndAt
          : note.missAt < now
      )
        state.notes.splice(index, 1);
    }
    if (
      state.pendingNotes.length === 0 &&
      state.notes.length === 0 &&
      now >= state.startedAt + state.chartDuration * 1000 + timePastHitZone
    ) {
      finish("Chart terminée", { completed: true });
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
    draw(now);
    state.animation = requestAnimationFrame(frame);
  }

  function registerMiss() {
    if (!state.running) return;
    state.misses += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.combo = 0;
    state.multiplier = 1;
    state.stagePresence = adjustWebHeroStagePresence(
      state.stagePresence,
      false,
    );
    state.missFlashUntil = performance.now() + 180;
    if (state.stagePresence <= 0) {
      finish("Stage presence épuisée");
    }
  }

  function registerOverHit() {
    if (!state.running) return;
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
    message = "Partie terminee",
    { completed = false, stopped = false } = {},
  ) {
    if (!state.running) return;
    state.running = false;
    stopSong();
    stage.classList.remove("is-playing");
    cancelAnimationFrame(state.animation);
    const duration = Math.max(
      0,
      Math.floor((performance.now() - state.startedAt) / 1000),
    );
    state.longest = Math.max(state.longest, duration);
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    startButton.disabled = false;
    stopButton.hidden = true;
    statusEl.textContent = `${message} - ${state.score} points`;
    const finalDuration = Math.floor(duration);
    const accuracy =
      state.hits + state.misses
        ? Math.round((state.hits / (state.hits + state.misses)) * 100)
        : 0;
    gameOverTitleEl.textContent = completed
      ? "CHART TERMINÉE"
      : stopped
        ? "PARTIE ARRÊTÉE"
        : "GAME OVER";
    gameOverEl.classList.toggle("is-completed", completed);
    gameOverEl.classList.toggle("is-stopped", stopped);
    document.getElementById("web-hero-result-subtitle").textContent = completed
      ? "Chart terminée. Beau jeu !"
      : stopped
        ? "Session arrêtée. Ton score n’a pas été enregistré."
        : "La prochaine sera la bonne.";
    finalScoreEl.textContent = state.score.toLocaleString("fr-FR");
    finalTimeEl.textContent = `${finalDuration}s`;
    finalAccuracyEl.textContent = `${accuracy}%`;
    finalNotesEl.textContent = state.totalNotes.toLocaleString("fr-FR");
    finalHitsEl.textContent = `${state.hits} / ${state.misses}`;
    finalStreakEl.textContent = state.maxCombo.toLocaleString("fr-FR");
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
    if (completed && socket) {
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

  async function start() {
    if (state.running) return;
    if (!state.chart) {
      statusEl.textContent =
        "Importez un fichier .chart ou .mid pour commencer.";
      return;
    }
    startButton.disabled = true;
    stopButton.disabled = true;
    setChartControlsDisabled(true);
    try {
      if (audioBuffers.length) {
        audioContext ||= new AudioContext();
        await audioContext.resume();
      }
    } catch (error) {
      startButton.disabled = false;
      setChartControlsDisabled(false);
      statusEl.textContent = `Préparation audio impossible : ${error.message}`;
      console.error("Impossible de préparer la bande-son importée.", error);
      return;
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
    const audioStartAt = audioBuffers.length
      ? audioContext.currentTime + travelTime / 1000
      : null;
    const schedule = scheduleWebHeroTrack(
      chartTrack,
      startAt,
      travelTime,
      chartSpeed,
    );
    state.longPauses = scheduleWebHeroLongPauses(
      chartTrack,
      schedule.startAt,
      chartSpeed,
    );
    state.running = true;
    stage.classList.add("is-playing");
    gameOverEl.hidden = true;
    canvas.focus({ preventScroll: true });
    state.score = 0;
    state.combo = 0;
    state.multiplier = 1;
    state.maxCombo = 0;
    state.misses = 0;
    state.hits = 0;
    state.hitDelayTotal = 0;
    state.overHits = 0;
    state.sustainSeconds = 0;
    state.stagePresence = 80;
    state.totalNotes = schedule.notes.length;
    state.chartDifficulty = chartDifficulty;
    state.scoreMultiplier = getWebHeroScoreMultiplier(
      chartDifficulty,
      chartSpeed,
      hyperspeed,
    );
    state.longest = 0;
    state.notes = [];
    state.travelTime = travelTime;
    state.startedAt = schedule.startAt;
    state.pendingNotes = schedule.notes;
    state.lyrics = scheduleWebHeroLyrics(
      state.chart.lyrics || [],
      schedule.startAt,
      chartSpeed,
    );
    state.lyricPhrases = groupWebHeroLyrics(state.lyrics);
    state.lyricIndex = -1;
    state.lyricPhraseIndex = -1;
    state.lyricActiveIndex = -1;
    lyricsEl.replaceChildren();
    lyricsEl.hidden = state.lyrics.length === 0;
    state.particles = [];
    state.chartDuration = schedule.duration;
    state.lastFrame = state.startedAt;
    startButton.disabled = true;
    stopButton.hidden = false;
    stopButton.disabled = false;
    setChartControlsDisabled(true);
    statusEl.textContent = `En jeu — ${DIFFICULTIES[chartDifficulty].label} (${chartTrack.name})`;
    state.animation = requestAnimationFrame(frame);
    if (audioBuffers.length) {
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
        source.start(audioStartAt);
      }
    } else {
      statusEl.textContent += " — aucune bande-son associée";
    }
  }

  function registerHit(hitNote, lane, now) {
    const hitY = state.viewHeight - 48;
    const noteProgress = Math.min(
      1,
      (now - hitNote.spawnAt) / hitNote.travelTime,
    );
    const noteY = Math.min(hitY, noteProgress * hitY);
    state.hits += 1;
    state.hitDelayTotal += now - hitNote.hitAt;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.multiplier = getWebHeroMultiplier(state.combo);
    state.stagePresence = adjustWebHeroStagePresence(state.stagePresence, true);
    state.score += Math.round(100 * state.multiplier * state.scoreMultiplier);
    const { laneWidth, center: laneCenter } = getLaneBounds(lane);
    const fireColors = ["#fff7ae", "#ffd43b", "#ff8a24", "#ed4228"];
    state.particles.push(
      ...Array.from({ length: 22 }, (_, index) => ({
        x: laneCenter,
        y: noteY,
        vx: (Math.random() - 0.5) * laneWidth * 1.7,
        vy: -(100 + Math.random() * 150),
        size: 5 + Math.random() * 7,
        color: fireColors[index % fireColors.length],
        fire: true,
        createdAt: now,
        duration: 420 + Math.random() * 300,
      })),
    );
  }

  function creditSustain(note, at) {
    const heldSeconds = Math.min(
      note.sustain,
      Math.max(0, (at - note.sustainStartedAt) / 1000),
    );
    const scoredSeconds = note.sustainScoredSeconds || 0;
    state.score +=
      getWebHeroSustainBonus(
        heldSeconds,
        note.holdMultiplier,
        state.scoreMultiplier,
      ) -
      getWebHeroSustainBonus(
        scoredSeconds,
        note.holdMultiplier,
        state.scoreMultiplier,
      );
    note.sustainScoredSeconds = heldSeconds;
    return heldSeconds;
  }

  function endSustain(note, endedAt) {
    const heldSeconds = creditSustain(note, endedAt);
    state.sustainSeconds += heldSeconds;
    note.holding = false;
    note.releasedAt = endedAt;
  }

  function hit(key) {
    if (!state.running) return;
    const now = performance.now();
    if (
      state.longPauses.some(
        (pause) => now >= pause.startAt && now < pause.endAt,
      )
    )
      return;
    const lane = keys.indexOf(key.toLowerCase());
    if (lane < 0) {
      registerMiss();
      return;
    }
    const laneNote = state.notes.find(
      (note) => note.lane === lane && !note.hitRegistered,
    );
    if (laneNote && !laneNote.holding && now > laneNote.missAt) {
      state.notes.splice(state.notes.indexOf(laneNote), 1);
      registerMiss();
      return;
    }
    const index = state.notes.findIndex(
      (note) =>
        !note.hitRegistered &&
        note.lane === lane &&
        now >= note.hitAt - 280 &&
        now <= note.missAt,
    );
    if (index < 0) {
      registerOverHit();
      return;
    }
    const hitNote = state.notes[index];
    if (hitNote.sustain > 0) {
      hitNote.holding = true;
      hitNote.hitRegistered = true;
      hitNote.holdMultiplier = state.multiplier;
      hitNote.sustainStartedAt = now;
      hitNote.sustainScoredSeconds = 0;
      hitNote.sustainEndAt = hitNote.hitAt + hitNote.sustain * 1000;
      registerHit(hitNote, lane, now);
      return;
    }
    state.notes.splice(index, 1);
    registerHit(hitNote, lane, now);
  }

  function release(key) {
    if (!state.running) return;
    const lane = keys.indexOf(key.toLowerCase());
    const index = state.notes.findIndex(
      (note) => note.lane === lane && note.holding,
    );
    if (index < 0) return;
    const note = state.notes[index];
    endSustain(note, Math.min(performance.now(), note.sustainEndAt));
  }

  const heldTouchPointers = new Map();
  const heldTouchLanes = new Map();
  const heldCanvasPointers = new Map();
  document.querySelectorAll(".touch-lane").forEach((button, lane) => {
    const finishTouch = (event) => {
      if (heldTouchPointers.get(event.pointerId) !== lane) return;
      heldTouchPointers.delete(event.pointerId);
      const pointers = heldTouchLanes.get(lane);
      pointers.delete(event.pointerId);
      if (pointers.size === 0) {
        heldTouchLanes.delete(lane);
        button.classList.remove("is-pressed");
        release(keys[lane]);
      }
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (event.button !== 0) return;
      if (heldTouchPointers.has(event.pointerId)) return;
      const pointers = heldTouchLanes.get(lane) || new Set();
      if (pointers.size === 0) hit(keys[lane]);
      pointers.add(event.pointerId);
      heldTouchLanes.set(lane, pointers);
      heldTouchPointers.set(event.pointerId, lane);
      button.classList.add("is-pressed");
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", finishTouch);
    button.addEventListener("pointercancel", finishTouch);
    button.addEventListener("lostpointercapture", finishTouch);
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      hit(keys[lane]);
      release(keys[lane]);
    });
  });
  const finishCanvasTouch = (event) => {
    const lane = heldCanvasPointers.get(event.pointerId);
    if (lane === undefined) return;
    heldCanvasPointers.delete(event.pointerId);
    const pointers = heldTouchLanes.get(lane);
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      heldTouchLanes.delete(lane);
      release(keys[lane]);
    }
  };
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || !state.running) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * state.viewWidth) / rect.width;
    const y = ((event.clientY - rect.top) * state.viewHeight) / rect.height;
    const track = getTrackBounds();
    const lane = Math.floor((x - track.x) / track.laneWidth);
    const targetRadius = Math.min(24, track.laneWidth / 2 - 5);
    const touchRadius = Math.min(
      track.laneWidth / 2,
      Math.max(24, targetRadius + 8),
    );
    if (
      x < track.x ||
      x >= track.x + track.width ||
      lane < 0 ||
      lane >= 5 ||
      Math.abs(y - (state.viewHeight - 48)) > touchRadius
    )
      return;
    event.preventDefault();
    const pointers = heldTouchLanes.get(lane) || new Set();
    if (pointers.size === 0) hit(keys[lane]);
    pointers.add(event.pointerId);
    heldTouchLanes.set(lane, pointers);
    heldCanvasPointers.set(event.pointerId, lane);
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", finishCanvasTouch);
  canvas.addEventListener("pointercancel", finishCanvasTouch);
  canvas.addEventListener("lostpointercapture", finishCanvasTouch);

  startButton.addEventListener("click", start);
  stopButton.addEventListener("click", () =>
    finish("Partie arrêtée — score non enregistré", { stopped: true }),
  );
  restartButton.addEventListener("click", start);
  returnButton?.addEventListener("click", () => {
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
    statusEl.textContent = "Prêt à jouer.";
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
        statusEl.textContent = `Plein écran indisponible : ${error.message}`;
      }
    });
  chartSpeedInput.addEventListener("input", () => {
    chartSpeedValue.value = `${Math.round(Number(chartSpeedInput.value) * 100)} %`;
    saveSettings();
  });
  hyperspeedInput.addEventListener("input", () => {
    hyperspeedValue.value = `${Number(hyperspeedInput.value).toFixed(1)}×`;
    saveSettings();
  });
  chartFileInput.addEventListener("change", async () => {
    const files = [...chartFileInput.files];
    if (!files.length) return;
    try {
      if (state.running)
        throw new Error("Terminez la partie avant d’importer.");
      const {
        chartFile: file,
        audioFiles,
        iniFile,
        folderName,
      } = selectChartFolderFiles(files);
      const extension = file.name.split(".").pop().toLowerCase();
      let chart;
      let source;
      const songName = iniFile
        ? parseSongIni(await iniFile.text()) || folderName
        : folderName;
      if (extension === "chart") {
        const content = await file.text();
        chart = parseWebHeroChart(content);
        source = { name: songName, content, format: "chart" };
      } else {
        const content = await file.arrayBuffer();
        chart = parseWebHeroMidi(content);
        source = {
          name: songName,
          content: encodeMidi(content),
          format: "midi",
        };
      }
      const decodedAudio = [];
      if (audioFiles.length) {
        audioContext ||= new AudioContext();
        for (const audioFile of audioFiles) {
          decodedAudio.push(
            await audioContext.decodeAudioData(await audioFile.arrayBuffer()),
          );
        }
      }
      state.chart = chart;
      importedChartSource = source;
      audioBuffers = decodedAudio;
      saveSettings();
      const selectedTrack = selectChartTrack(
        state.chart,
        difficultySelect.value,
        DIFFICULTY_ORDER,
      );
      gameOverEl.hidden = true;
      const audioStatus = audioFiles.length
        ? `${audioFiles.length} piste${audioFiles.length === 1 ? "" : "s"} audio synchronisée${audioFiles.length === 1 ? "" : "s"}`
        : "sans bande-son associée";
      statusEl.textContent = `${songName} chargé — ${selectedTrack.track.notes.length} notes (${selectedTrack.track.name}), ${audioStatus}.`;
    } catch (error) {
      statusEl.textContent = `Import impossible : ${error.message}`;
    } finally {
      chartFileInput.value = "";
    }
  });
  difficultySelect.addEventListener("change", () => {
    const newDifficulty = difficultySelect.value;
    state.difficulty = newDifficulty;
    saveSettings();
    if (!state.running) return;
    finish("Partie abandonnée : difficulté modifiée", { save: false });
  });
  window.addEventListener("keydown", (event) => {
    if (event.repeat || event.target.matches("input, textarea, select")) return;
    hit(event.key);
  });
  window.addEventListener("keyup", (event) => release(event.key));
  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();
  draw(0);
  if (!state.chart)
    statusEl.textContent =
      "Importez une chart .chart/.mid, avec ses fichiers audio pour jouer en musique.";
  if (canvas) canvas.focus();
  alert(
    "Sur PC, utilisez l'option de plein écran pour une meilleure expérience.",
  );
}

initWebHero();
