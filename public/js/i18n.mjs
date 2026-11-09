const STORAGE_KEY = "web-hero-language";
const dynamicValues = new WeakMap();
const messages = {
  fr: {
    "meta.title": "WebHero — jeu de rythme gratuit",
    "meta.description":
      "Joue à WebHero, un jeu de rythme gratuit inspiré de Guitar Hero. Lance une chart, règle la difficulté et joue au clavier ou sur écran tactile.",
    "meta.socialDescription":
      "Un jeu de rythme gratuit inspiré de Guitar Hero, jouable au clavier ou sur écran tactile.",
    "meta.locale": "fr_FR",
    "nav.skip": "Passer au jeu",
    "nav.gameConfig": "Configuration de la partie",
    "nav.language": "Langue",
    "language.fr": "Français",
    "language.en": "Anglais",
    "nav.display": "Affichage",
    "nav.chart": "Chart",
    "nav.session": "Session",
    "nav.fullscreen": "Plein écran",
    "nav.fullscreenAria": "Passer en plein écran (recommandé)",
    "nav.fullscreenTitle": "Activer ou quitter le plein écran (recommandé)",
    "chart.import": "Importer un dossier",
    "chart.importAria":
      "Importer un dossier de chart avec notes, fichier INI et pistes audio",
    "chart.importTitle": "Importer le dossier d’une chart et ses pistes audio",
    "chart.importZipAria": "Importer une archive ZIP de chart",
    "chart.importZipTitle": "Importer une archive ZIP de chart",
    "chart.unload": "Décharger la chart",
    "chart.unloadAria": "Décharger la chart courante",
    "chart.unloadTitle": "Décharger la chart et supprimer sa sauvegarde locale",
    "difficulty.label": "Difficulté",
    "difficulty.aria": "Difficulté de la chart",
    "difficulty.title": "Choisir la difficulté",
    "difficulty.easy": "Facile",
    "difficulty.medium": "Moyen",
    "difficulty.hard": "Difficile",
    "difficulty.expert": "Expert",
    "difficulty.noChart": "Importe une chart",
    "game.start": "Jouer",
    "game.startAria": "Démarrer la partie",
    "game.startTitle": "Jouer la chart importée",
    "game.stop": "Arrêter",
    "game.stopAria": "Arrêter la partie",
    "game.stopTitle": "Arrêter la partie en cours",
    "status.importPrompt":
      "Importe une chart .chart/.mid, avec ses fichiers audio pour jouer en musique.",
    "status.progressLabel": "Progression du chargement",
    "arena.label": "Jeu WebHero",
    "canvas.label":
      "Piste de jeu WebHero. Utilisez les touches D, F, J, K et L selon les lanes colorées.",
    "canvas.fallback": "Votre navigateur ne prend pas en charge le canvas.",
    "idle.title": "À TOI DE JOUER",
    "idle.caption": "Importe le dossier d’une chart, puis lance la partie.",
    "instructions.controls":
      "Choisissez une chart et une difficulté, puis appuyez sur Jouer. Appuyez sur les touches D, F, J, K et L lorsque les notes atteignent la ligne de frappe, ou touchez les cibles sur la piste. Utilisez la touche Star Power lorsque la jauge atteint 50 % pour doubler le score pendant 8 s.",
    "pause.kicker": "ÉCHAP pour reprendre · START sur la manette",
    "pause.title": "PAUSE",
    "pause.resume": "Reprendre",
    "pause.resumeAria": "Reprendre la partie",
    "pause.restartSection": "Recommencer la section",
    "pause.restartSectionTitle":
      "Recommencer avec la touche ou le bouton Star Power",
    "pause.quit": "Abandonner la partie",
    "pause.quitAria": "Abandonner la partie",
    "results.kicker": "SESSION TERMINÉE",
    "results.title": "GAME OVER",
    "results.titleCompleted": "CHART TERMINÉE",
    "results.titleStopped": "PARTIE ARRÊTÉE",
    "results.score": "SCORE FINAL",
    "results.accuracy": "Précision",
    "results.duration": "Durée",
    "results.durationValue": "{seconds}s",
    "results.notes": "Notes",
    "results.hitsMisses": "Hits / Misses",
    "results.delay": "Délai moyen",
    "results.streak": "Meilleure série",
    "results.fc": "FC",
    "results.replay": "Rejouer",
    "results.replayAria": "Rejouer la chart",
    "results.replayTitle": "Recommencer cette chart",
    "results.return": "Retour à l’écran titre",
    "results.returnAria": "Retourner à l’écran titre sans rejouer",
    "results.returnTitle": "Fermer les résultats et revenir à l’écran titre",
    "settings.game": "Jeu",
    "settings.speed": "Vitesse",
    "settings.speedShort": "Vit.",
    "settings.chartSpeedAria": "Vitesse de lecture de la chart",
    "settings.chartSpeedTitle": "Régler la vitesse de lecture",
    "settings.hyperspeed": "Hyperspeed",
    "settings.hyperspeedShort": "Hyper.",
    "settings.hyperspeedAria": "Vitesse de défilement des notes",
    "settings.noteSize": "Taille des notes",
    "settings.noteSizeShort": "Notes",
    "settings.noteSizeTitle": "Régler la taille des notes",
    "settings.noFailTitle":
      "Pas de stage presence ni de game over ; score non enregistré",
    "settings.noFail": "No-Fail Mode",
    "settings.practice": "Practice",
    "settings.start": "Début",
    "settings.end": "Fin",
    "settings.chartBeginning": "Début de la chart",
    "settings.chartEnd": "Fin de la chart",
    "settings.calibration": "Calibration",
    "settings.audioDelay": "Délai audio",
    "settings.audioShort": "Aud.",
    "settings.audioDelayAria": "Délai audio en millisecondes",
    "settings.audioDelayTitle":
      "Négatif : musique plus tôt (compense un audio en retard, ex. Bluetooth)",
    "settings.videoDelay": "Délai vidéo",
    "settings.videoShort": "Vid.",
    "settings.videoDelayAria": "Délai vidéo en millisecondes",
    "settings.videoDelayTitle":
      "Positif : notes affichées plus tôt (compense un écran en retard)",
    "settings.hitZonePreview": "Aperçu hitzone calibrée",
    "controller.config": "Configuration de la manette",
    "controller.label": "Manette",
    "controller.debugTitle": "Boutons et axes détectés",
    "controller.learnTitle": "Cliquer puis appuyer sur un bouton de la manette",
    "controller.pause": "Bouton de pause",
    "controller.pauseAria": "Bouton de pause de la manette",
    "controller.strumUp": "Strum haut",
    "controller.strumDown": "Strum bas",
    "controller.strumUpAria": "Bouton de strum haut de la manette",
    "controller.strumDownAria": "Bouton de strum bas de la manette",
    "controller.starPower": "Star Power",
    "controller.starPowerAria": "Bouton Star Power de la manette",
    "keyboard.config": "Configuration des touches de jeu",
    "keyboard.label": "Clavier",
    "keyboard.laneRed": "Touche de jeu pour la lane rouge",
    "keyboard.laneOrange": "Touche de jeu pour la lane orange",
    "keyboard.laneYellow": "Touche de jeu pour la lane jaune",
    "keyboard.laneGreen": "Touche de jeu pour la lane verte",
    "keyboard.laneBlue": "Touche de jeu pour la lane bleue",
    "keyboard.learnTitle": "Cliquer puis appuyer sur une touche",
    "keyboard.pause": "Touche de pause",
    "keyboard.starPower": "Touche Star Power",
    "keyboard.strumUp": "Touche de strum haut",
    "keyboard.strumDown": "Touche de strum bas",
    "custom.panel": "Personnalisation de l’interface",
    "custom.label": "Custom",
    "custom.primaryColor": "Couleur principale",
    "custom.primaryColorAria": "Couleur principale de l’interface",
    "custom.background": "Fond du highway",
    "custom.backgroundAria": "Choisir une image de fond du highway",
    "custom.noImage": "Aucune image",
    "custom.removeImage": "Retirer l’image",
    "custom.removeConfirm": "Voulez-vous vraiment supprimer l'image de fond ?",
    "custom.removeAria": "Retirer l’image",
    "touch.group": "Touches tactiles",
    "touch.laneRed": "Jouer la lane rouge",
    "touch.laneOrange": "Jouer la lane orange",
    "touch.laneYellow": "Jouer la lane jaune",
    "touch.laneGreen": "Jouer la lane verte",
    "touch.laneBlue": "Jouer la lane bleue",
    "touch.activateLaneRed": "Activer la lane rouge",
    "touch.activateLaneOrange": "Activer la lane orange",
    "touch.activateLaneYellow": "Activer la lane jaune",
    "touch.activateLaneGreen": "Activer la lane verte",
    "touch.activateLaneBlue": "Activer la lane bleue",
    "touch.pause": "Mettre le jeu en pause",
    "touch.pauseText": "Pause",
    "touch.starPower": "Activer le Star Power",
    "file.chart":
      "Sélectionner le dossier d’une chart, avec son fichier INI et ses pistes audio",
    "file.chartTitle": "Sélectionner le dossier d’une seule chart",
    "status.settingsReadFailed": "Paramètres Web Hero locaux illisibles.",
    "status.settingsSaveFailed":
      "Impossible de sauvegarder les paramètres Web Hero localement.",
    "status.ready": "Prêt à jouer.",
    "status.importPromptShort":
      "Importez un fichier .chart ou .mid pour commencer.",
    "status.audioPrepareFailed": "Préparation audio impossible : {error}",
    "status.noAudio": " — aucune bande-son associée",
    "status.running": "En jeu — {difficulty} ({track}){warning}",
    "status.gameFinished": "{message} - {score} points",
    "status.finished": "Partie terminée",
    "status.chartFinished": "Chart terminée",
    "status.stopped": "Partie arrêtée — score non enregistré",
    "status.stageFailed": "Stage presence épuisée",
    "status.difficultyChanged": "Partie abandonnée : difficulté modifiée",
    "status.fullscreenFailed": "Plein écran indisponible : {error}",
    "status.backgroundFailed": "Image de fond impossible : {error}",
    "status.chartRestored":
      "{title} restaurée — {count} notes ({track}), {audio}.",
    "status.chartImported":
      "{title} chargé — {count} notes ({track}), {audio}{warning}.",
    "status.chartUnloaded": "Chart déchargée.",
    "status.chartUnloadFailed":
      "Chart déchargée, mais impossible de supprimer sa sauvegarde locale.",
    "status.progress": "{label} — {percent} %",
    "status.readingChart": "Lecture de la chart",
    "status.extractingArchive": "Extraction de l’archive ZIP",
    "status.audioProgress": "Audio {current}/{total}",
    "status.savingChart": "Sauvegarde locale de la chart et de l’audio…",
    "status.importFailed": "Import impossible : {error}",
    "status.imageTooLarge": "Image trop volumineuse après compression.",
    "status.finishPractice": "Terminez la partie avant d’importer.",
    "status.audioSaved": "pistes audio mémorisées",
    "status.audioNotSaved": "audio non mémorisé",
    "status.noAudioAttached": "sans bande-son associée",
    "status.audioCount": "{count} piste{plural} audio synchronisée{plural}",
    "status.audioSaveFailed": " — sauvegarde locale impossible",
    "status.audioWarning": " — audio non mémorisé",
    "status.audioUnavailable": " — audio mémorisé indisponible",
    "status.imageSaved": "Image enregistrée",
    "status.loadPercent": "{percent} %",
    "game.gameOver": "GAME OVER",
    "game.chartComplete": "CHART TERMINÉE",
    "game.stopped": "PARTIE ARRÊTÉE",
    "game.miss": "miss",
    "game.hits": "hits",
    "game.noFail": "NO-FAIL",
    "game.accuracy": "Précision {accuracy} %. {hits} hits, {misses} misses.",
    "game.starPower": "Star Power {charge} %.{active}",
    "game.starPowerActive": " Actif.",
    "game.stagePresence": "Stage presence {presence} %.",
    "game.progress": "Progression {progress} %.",
    "game.canvasLabel":
      "Web Hero. Score {score}.{practiceStatsLabel} Série {combo}. Multiplicateur x{multiplier}. {starPower} Progression {progress} %. {stagePresence}",
    "game.nextNote": "PROCHAINE NOTE",
  },
  en: {
    "meta.title": "WebHero — free rhythm game",
    "meta.description":
      "Play WebHero, a free rhythm game inspired by Guitar Hero. Load a chart, choose a difficulty, and play with a keyboard or touchscreen.",
    "meta.socialDescription":
      "A free rhythm game inspired by Guitar Hero, playable with a keyboard or touchscreen.",
    "meta.locale": "en_US",
    "nav.skip": "Skip to game",
    "nav.gameConfig": "Game settings",
    "nav.language": "Language",
    "language.fr": "French",
    "language.en": "English",
    "nav.display": "Display",
    "nav.chart": "Chart",
    "nav.session": "Session",
    "nav.fullscreen": "Fullscreen",
    "nav.fullscreenAria": "Enter fullscreen (recommended)",
    "nav.fullscreenTitle": "Enter or exit fullscreen (recommended)",
    "chart.import": "Import folder",
    "chart.importAria":
      "Import a chart folder with notes, INI file, and audio tracks",
    "chart.importTitle": "Import a chart folder and its audio tracks",
    "chart.importZipAria": "Import a chart ZIP archive",
    "chart.importZipTitle": "Import a chart ZIP archive",
    "chart.unload": "Unload chart",
    "chart.unloadAria": "Unload current chart",
    "chart.unloadTitle": "Unload the chart and remove its local save",
    "difficulty.label": "Difficulty",
    "difficulty.aria": "Chart difficulty",
    "difficulty.title": "Choose difficulty",
    "difficulty.easy": "Easy",
    "difficulty.medium": "Medium",
    "difficulty.hard": "Hard",
    "difficulty.expert": "Expert",
    "difficulty.noChart": "Load a chart",
    "game.start": "Play",
    "game.startAria": "Start game",
    "game.startTitle": "Play the imported chart",
    "game.stop": "Stop",
    "game.stopAria": "Stop game",
    "game.stopTitle": "Stop the current game",
    "status.importPrompt":
      "Import a .chart or .mid file with its audio tracks to play with music.",
    "status.progressLabel": "Loading progress",
    "arena.label": "WebHero game",
    "canvas.label":
      "WebHero game highway. Use D, F, J, K, and L for the colored lanes.",
    "canvas.fallback": "Your browser does not support canvas.",
    "idle.title": "YOUR TURN",
    "idle.caption": "Import a chart folder, then start playing.",
    "instructions.controls":
      "Choose a chart and difficulty, then press Play. Press D, F, J, K, and L when notes reach the hit line, or touch the targets on the highway. Use the Star Power key when the meter reaches 50% to double your score for 8 seconds.",
    "pause.kicker": "ESC to resume · START on controller",
    "pause.title": "PAUSED",
    "pause.resume": "Resume",
    "pause.resumeAria": "Resume game",
    "pause.restartSection": "Restart section",
    "pause.restartSectionTitle": "Restart with the Star Power key or button",
    "pause.quit": "Quit game",
    "pause.quitAria": "Quit game",
    "results.kicker": "SESSION COMPLETE",
    "results.title": "GAME OVER",
    "results.titleCompleted": "CHART COMPLETE",
    "results.titleStopped": "GAME STOPPED",
    "results.score": "FINAL SCORE",
    "results.accuracy": "Accuracy",
    "results.duration": "Duration",
    "results.durationValue": "{seconds}s",
    "results.notes": "Notes",
    "results.hitsMisses": "Hits / Misses",
    "results.delay": "Average timing",
    "results.streak": "Best streak",
    "results.fc": "FC",
    "results.replay": "Replay",
    "results.replayAria": "Replay chart",
    "results.replayTitle": "Restart this chart",
    "results.return": "Return to title screen",
    "results.returnAria": "Close results and return to the title screen",
    "results.returnTitle": "Close results and return to the title screen",
    "settings.game": "Game",
    "settings.speed": "Speed",
    "settings.speedShort": "Spd.",
    "settings.chartSpeedAria": "Chart playback speed",
    "settings.chartSpeedTitle": "Adjust playback speed",
    "settings.hyperspeed": "Hyperspeed",
    "settings.hyperspeedShort": "Hyper.",
    "settings.hyperspeedAria": "Note scroll speed",
    "settings.noteSize": "Note size",
    "settings.noteSizeShort": "Notes",
    "settings.noteSizeTitle": "Adjust note size",
    "settings.noFailTitle":
      "No stage presence or game over; score is not submitted",
    "settings.noFail": "No-Fail Mode",
    "settings.practice": "Practice",
    "settings.start": "Start",
    "settings.end": "End",
    "settings.chartBeginning": "Beginning of chart",
    "settings.chartEnd": "End of chart",
    "settings.calibration": "Calibration",
    "settings.audioDelay": "Audio delay",
    "settings.audioShort": "Aud.",
    "settings.audioDelayAria": "Audio delay in milliseconds",
    "settings.audioDelayTitle":
      "Negative: play music earlier (compensates for delayed audio, e.g. Bluetooth)",
    "settings.videoDelay": "Video delay",
    "settings.videoShort": "Vid.",
    "settings.videoDelayAria": "Video delay in milliseconds",
    "settings.videoDelayTitle":
      "Positive: display notes earlier (compensates for a delayed screen)",
    "settings.hitZonePreview": "Calibrated hit zone preview",
    "controller.config": "Controller configuration",
    "controller.label": "Controller",
    "controller.debugTitle": "Detected buttons and axes",
    "controller.learnTitle": "Click, then press a controller button",
    "controller.pause": "Pause button",
    "controller.pauseAria": "Controller pause button",
    "controller.strumUp": "Strum up",
    "controller.strumDown": "Strum down",
    "controller.strumUpAria": "Controller strum-up button",
    "controller.strumDownAria": "Controller strum-down button",
    "controller.starPower": "Star Power",
    "controller.starPowerAria": "Controller Star Power button",
    "keyboard.config": "Game key configuration",
    "keyboard.label": "Keyboard",
    "keyboard.laneRed": "Red lane key",
    "keyboard.laneOrange": "Orange lane key",
    "keyboard.laneYellow": "Yellow lane key",
    "keyboard.laneGreen": "Green lane key",
    "keyboard.laneBlue": "Blue lane key",
    "keyboard.learnTitle": "Click, then press a key",
    "keyboard.pause": "Pause key",
    "keyboard.starPower": "Star Power key",
    "keyboard.strumUp": "Strum-up key",
    "keyboard.strumDown": "Strum-down key",
    "custom.panel": "Interface customization",
    "custom.label": "Custom",
    "custom.primaryColor": "Primary color",
    "custom.primaryColorAria": "Interface primary color",
    "custom.background": "Highway background",
    "custom.backgroundAria": "Choose a highway background image",
    "custom.noImage": "No image",
    "custom.removeImage": "Remove image",
    "custom.removeConfirm":
      "Are you sure you want to remove the background image?",
    "custom.removeAria": "Remove background image",
    "touch.group": "Touch controls",
    "touch.laneRed": "Play red lane",
    "touch.laneOrange": "Play orange lane",
    "touch.laneYellow": "Play yellow lane",
    "touch.laneGreen": "Play green lane",
    "touch.laneBlue": "Play blue lane",
    "touch.activateLaneRed": "Activate red lane",
    "touch.activateLaneOrange": "Activate orange lane",
    "touch.activateLaneYellow": "Activate yellow lane",
    "touch.activateLaneGreen": "Activate green lane",
    "touch.activateLaneBlue": "Activate blue lane",
    "touch.pause": "Pause game",
    "touch.pauseText": "Pause",
    "touch.starPower": "Activate Star Power",
    "file.chart": "Select a chart folder with its INI file and audio tracks",
    "file.chartTitle": "Select one chart folder",
    "status.settingsReadFailed": "Could not read local WebHero settings.",
    "status.settingsSaveFailed": "Could not save WebHero settings locally.",
    "status.ready": "Ready to play.",
    "status.importPromptShort": "Import a .chart or .mid file to begin.",
    "status.audioPrepareFailed": "Could not prepare audio: {error}",
    "status.noAudio": " — no audio track attached",
    "status.running": "Playing — {difficulty} ({track}){warning}",
    "status.gameFinished": "{message} - {score} points",
    "status.finished": "Game finished",
    "status.chartFinished": "Chart complete",
    "status.stopped": "Game stopped — score not submitted",
    "status.stageFailed": "Stage presence depleted",
    "status.difficultyChanged": "Game abandoned: difficulty changed",
    "status.fullscreenFailed": "Fullscreen unavailable: {error}",
    "status.backgroundFailed": "Background image error: {error}",
    "status.chartRestored":
      "{title} restored — {count} notes ({track}), {audio}.",
    "status.chartImported":
      "{title} loaded — {count} notes ({track}), {audio}{warning}.",
    "status.chartUnloaded": "Chart unloaded.",
    "status.chartUnloadFailed":
      "Chart unloaded, but its local save could not be removed.",
    "status.progress": "{label} — {percent}%",
    "status.readingChart": "Reading chart",
    "status.extractingArchive": "Extracting ZIP archive",
    "status.audioProgress": "Audio {current}/{total}",
    "status.savingChart": "Saving chart and audio locally…",
    "status.importFailed": "Import failed: {error}",
    "status.imageTooLarge": "Image is too large after compression.",
    "status.finishPractice": "Finish the game before importing.",
    "status.audioSaved": "saved audio tracks",
    "status.audioNotSaved": "audio not saved",
    "status.noAudioAttached": "no audio track attached",
    "status.audioCount": "{count} synced audio track{plural}",
    "status.audioSaveFailed": " — local save failed",
    "status.audioWarning": " — audio not saved",
    "status.audioUnavailable": " — saved audio unavailable",
    "status.imageSaved": "Image saved",
    "status.loadPercent": "{percent}%",
    "game.gameOver": "GAME OVER",
    "game.chartComplete": "CHART COMPLETE",
    "game.stopped": "GAME STOPPED",
    "game.miss": "misses",
    "game.hits": "hits",
    "game.noFail": "NO-FAIL",
    "game.accuracy": "Accuracy {accuracy}%. {hits} hits, {misses} misses.",
    "game.starPower": "Star Power {charge}%.{active}",
    "game.starPowerActive": " Active.",
    "game.stagePresence": "Stage presence {presence}%.",
    "game.progress": "Progress {progress}%.",
    "game.canvasLabel":
      "Web Hero. Score {score}.{practiceStatsLabel} Streak {combo}. Multiplier x{multiplier}. {starPower} Progress {progress}%. {stagePresence}",
    "game.nextNote": "NEXT NOTE",
  },
};

const errorTranslations = [
  [
    "Le dossier ne contient aucun fichier .chart ou .mid.",
    "The folder contains no .chart or .mid file.",
  ],
  [
    "Choisissez le dossier d’une seule chart, pas un dossier de lots.",
    "Choose a single chart folder, not a folder containing multiple charts.",
  ],
  [
    "Plusieurs charts trouvées. Gardez un fichier notes.chart ou notes.mid dans le dossier.",
    "Multiple charts found. Keep a notes.chart or notes.mid file in the folder.",
  ],
  ["Piste audio locale introuvable.", "Local audio track not found."],
  ["Fichier .chart invalide.", "Invalid .chart file."],
  [
    "Sections Song ou SyncTrack introuvables.",
    "Song or SyncTrack sections not found.",
  ],
  ["Résolution .chart invalide.", "Invalid .chart resolution."],
  ["Tempo .chart invalide.", "Invalid .chart tempo."],
  [
    "Aucune difficulté jouable trouvée dans le fichier .chart.",
    "No playable difficulty found in the .chart file.",
  ],
  ["Fichier MIDI invalide.", "Invalid MIDI file."],
  ["En-tête MIDI invalide.", "Invalid MIDI header."],
  ["En-tête MIDI tronqué.", "Truncated MIDI header."],
  [
    "Format MIDI non pris en charge (utilisez un MIDI PPQ type 0 ou 1).",
    "Unsupported MIDI format (use a type 0 or 1 PPQ MIDI file).",
  ],
  ["Piste MIDI invalide.", "Invalid MIDI track."],
  ["Piste MIDI tronquée.", "Truncated MIDI track."],
  ["Événement MIDI tronqué.", "Truncated MIDI event."],
  ["Valeur MIDI invalide.", "Invalid MIDI value."],
  ["Événement MIDI invalide.", "Invalid MIDI event."],
  ["Méta-événement MIDI tronqué.", "Truncated MIDI meta event."],
  ["Tempo MIDI invalide.", "Invalid MIDI tempo."],
  ["Événement SysEx MIDI tronqué.", "Truncated MIDI SysEx event."],
  [
    "Événement système MIDI non pris en charge.",
    "Unsupported MIDI system event.",
  ],
  ["Événement MIDI sans statut.", "MIDI event has no status."],
  [
    "Aucune piste Guitar Hero à cinq lanes trouvée dans le MIDI.",
    "No five-lane Guitar Hero track found in the MIDI file.",
  ],
  [
    "Le MIDI ne contient aucune note jouable Guitar Hero.",
    "The MIDI contains no playable Guitar Hero notes.",
  ],
  [
    "Terminez la partie avant d’importer.",
    "Finish the current game before importing.",
  ],
  [
    "Image trop volumineuse après compression.",
    "Image is too large after compression.",
  ],
];

export function translateError(error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const pair = errorTranslations.find(([french, english]) =>
    language === "fr" ? english === message : french === message,
  );
  return pair ? pair[language === "fr" ? 0 : 1] : message;
}

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (Object.hasOwn(messages, stored)) return stored;
  } catch {}
  if (typeof document === "undefined") return "fr";
  return globalThis.navigator?.language?.toLowerCase().startsWith("fr")
    ? "fr"
    : "en";
}

let language = readStoredLanguage();

function saveLanguage() {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {}
}

export function getLanguage() {
  return language;
}

export function formatNumber(value) {
  return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(
    value,
  );
}

export function t(key, values = {}) {
  const template = messages[language][key] ?? messages.fr[key] ?? key;
  return template.replace(/\{([\w]+)\}/g, (_, name) => {
    const value = values[name];
    return typeof value === "function" ? value() : (value ?? "");
  });
}

function translateElement(element) {
  const values = dynamicValues.get(element) || {};
  if (element.dataset.i18n)
    element.textContent = t(element.dataset.i18n, values);
  for (const item of (element.dataset.i18nAttrs || "").split(";")) {
    if (!item) continue;
    const [attribute, key] = item.split(":");
    if (attribute && key) element.setAttribute(attribute, t(key));
  }
}

export function setI18nText(element, key, values = {}) {
  dynamicValues.set(element, values);
  element.dataset.i18n = key;
  translateElement(element);
}

export function applyI18n(root = document) {
  document.documentElement.lang = language;
  root
    .querySelectorAll("[data-i18n], [data-i18n-attrs]")
    .forEach(translateElement);
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.language === language),
    );
  });
}

export function setLanguage(nextLanguage) {
  if (!(nextLanguage in messages)) return;
  language = nextLanguage;
  saveLanguage();
  applyI18n();
  document.dispatchEvent(new Event("webhero:languagechange"));
}

export function initI18n() {
  saveLanguage();
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () =>
      setLanguage(button.dataset.language),
    );
  });
  applyI18n();
}
