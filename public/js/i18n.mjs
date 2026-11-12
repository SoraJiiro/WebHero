const STORAGE_KEY = "web-hero-language";
const dynamicValues = new WeakMap();
const originalI18nHtml = new WeakMap();
const messages = {
  fr: {
    "doc.title": "WebHero — Documentation",
    "doc.metaDescription":
      "Guide WebHero : importer une chart, jouer au clavier, à la manette ou au tactile, et régler le jeu.",
    "doc.socialDescription": "Guide de jeu et aide pour WebHero.",
    "doc.brandLabel": "WebHero, retour au jeu",
    "doc.contentsLabel": "Sommaire",
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
    "settings.autoStrum": "Auto strum",
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
    "doc.title": "WebHero — Documentation",
    "doc.metaDescription":
      "WebHero guide: import a chart, play with a keyboard, controller, or touchscreen, and adjust the game.",
    "doc.socialDescription": "WebHero gameplay guide and help.",
    "doc.brandLabel": "WebHero, back to the game",
    "doc.contentsLabel": "Contents",
    "doc.skip": "Skip to documentation",
    "doc.brandKicker": "Player guide",
    "doc.return":
      '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Back to game',
    "doc.contents": `<p class="doc-toc-title">In this guide</p>
            <a href="#prise-en-main">Getting started</a>
            <a href="#jouer">Hit a note</a>
            <a href="#commandes">Controls</a>
            <a href="#options">Game options</a>
            <a href="#resultats">Pause and results</a>
            <a href="#fonctionnement">Data and how it works</a>
            <a href="#depannage">Troubleshooting</a>`,
    "doc.article": `<header class="doc-intro">
              <p class="doc-eyebrow">PLAYER GUIDE</p>
              <h1>How to play WebHero</h1>
              <p>Import your own chart, choose your controls, and play along with the music. WebHero runs in your browser and supports keyboard, controller, and touchscreen play.</p>
              <p class="doc-quickline"><span>5 lanes</span><span>.chart and MIDI charts</span><span>Local audio</span></p>
            </header>

            <section id="prise-en-main" class="doc-section">
              <div class="doc-section-heading">
                <span class="doc-section-number">01</span>
                <h2>Getting started</h2>
              </div>
              <ol class="doc-steps">
                <li><strong>Import a song.</strong> Choose <em>Import folder</em> or the ZIP button. A folder or archive must contain a single chart in <code>.chart</code>, <code>.mid</code>, or <code>.midi</code> format. Files named <code>notes.chart</code> or <code>notes.mid</code> are detected automatically.</li>
                <li><strong>Optionally add the music.</strong> Put audio tracks in the same folder as the chart. A <code>song.ini</code> file can provide the title and artist. Audio is optional; the chart can still be played silently.</li>
                <li><strong>Choose a difficulty.</strong> The menu only lists difficulties found in the chart. If your saved difficulty is unavailable, the closest available one is selected.</li>
                <li><strong>Press Play.</strong> Importing and decoding audio can take a moment; a progress indicator appears while files are loading.</li>
              </ol>
              <aside class="doc-callout"><strong>One thing to remember</strong><span>If a ZIP contains several songs, import the ZIP for the song you want or select that song's folder directly. Do not select the parent folder of a song pack.</span></aside>
              <p>Supported audio extensions are <code>.aac</code>, <code>.flac</code>, <code>.m4a</code>, <code>.mp3</code>, <code>.ogg</code>, <code>.opus</code>, and <code>.wav</code>. Playback also depends on which formats your browser can decode.</p>
              <p>Find charts to play at <a class="doc-inline-link" href="https://enchor.us/" target="_blank" rel="noopener noreferrer">enchor.us</a>. YARG and Clone Hero song folders can be imported if they contain a supported five-lane guitar chart in <code>.chart</code>, <code>.mid</code>, or <code>.midi</code> format. Import one song folder at a time, not an entire pack.</p>
            </section>

            <section id="jouer" class="doc-section">
              <div class="doc-section-heading">
                <span class="doc-section-number">02</span>
                <h2>Hit a note</h2>
              </div>
              <p>Notes travel down five lanes. Press the control for a lane when its note reaches the hit line. For a chord, press every indicated lane at the same time. Hold the control for the full length of a sustain note.</p>
              <p>By default, the five keyboard controls are <kbd>D</kbd>, <kbd>F</kbd>, <kbd>J</kbd>, <kbd>K</kbd>, and <kbd>L</kbd>, from left to right. The colored markers below the game show which key matches each lane. You can change each key in the <em>Keyboard</em> panel.</p>
              <div class="doc-rule-list">
                <p><strong>Regular notes</strong><span>On keyboard or touchscreen, press the lane. In guitar mode, strum while holding the matching fret or frets.</span></p>
                <p><strong>HOPO</strong><span>A HOPO note can be hit by pressing its fret without strumming when the combo chain allows it.</span></p>
                <p><strong>TAP</strong><span>Hit a TAP note by pressing its fret; no strum or existing combo chain is required.</span></p>
                <p><strong>Sustain</strong><span>Keep the fret, key, or finger held until the note ends to keep earning points.</span></p>
              </div>
            </section>

            <section id="commandes" class="doc-section">
              <div class="doc-section-heading">
                <span class="doc-section-number">03</span>
                <h2>Controls</h2>
              </div>
              <div class="doc-table-wrap">
                <table>
                  <thead><tr><th>Action</th><th>Default</th><th>Notes</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Lanes</th><td><kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd></td><td>Each key can be changed in the Keyboard panel.</td></tr>
                    <tr><th scope="row">Pause</th><td><kbd>Esc</kbd> or START</td><td>A touchscreen Pause button is also available.</td></tr>
                    <tr><th scope="row">Star Power</th><td><kbd>Space</kbd></td><td>The key and controller button can be remapped.</td></tr>
                    <tr><th scope="row">Guitar strum</th><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Used in guitar mode; either direction can strum.</td></tr>
                    <tr><th scope="row">Touchscreen</th><td>Tap a note</td><td>Tap a lane at the hit line; multiple fingers can hold sustains.</td></tr>
                  </tbody>
                </table>
              </div>
              <h3>Controller</h3>
              <p>Connect a compatible controller before playing. In the <em>Controller</em> panel, click a control and press the button you want to assign; the new mapping is saved in this browser. Detected buttons and axes are shown in the panel.</p>
              <p>When a controller is connected, the game switches to guitar mode: lanes act as frets and regular notes require a strum unless <em>Auto strum</em> is enabled. Keyboard lane keys can also be used as frets.</p>
              <h3>Auto strum and fret hierarchy</h3>
              <p>The <em>Auto strum</em> option only appears when a controller is detected. When enabled, it strums notes and chords at the right time as long as the correct frets are held; you do not need to press a new fret for every note.</p>
              <p>For a chord, every lane in the chord must be held, and the highest fret must match the target. Lower frets may stay held; an incorrect higher fret or a missing chord lane prevents the hit. HOPO and TAP notes can still be hit by fretting.</p>
            </section>

            <section id="options" class="doc-section">
              <div class="doc-section-heading">
                <span class="doc-section-number">04</span>
                <h2>Game options</h2>
              </div>
              <dl class="doc-definitions">
                <div><dt>Speed</dt><dd>Adjusts song playback from 50% to 100% (75% by default).</dd></div>
                <div><dt>Hyperspeed</dt><dd>Changes note scroll speed from 0.8× to 2.5× (1.5× by default) without speeding up the music.</dd></div>
                <div><dt>Note size</dt><dd>Changes note size from 50% to 150%; it does not affect timing or the hit line.</dd></div>
                <div><dt>Practice</dt><dd>Choose a start and end section from the chart, then repeat that passage. Star Power is disabled in Practice.</dd></div>
                <div><dt>No-Fail Mode</dt><dd>Prevents the game from ending because of stage presence. The score for that run is not recorded.</dd></div>
                <div><dt>Audio delay</dt><dd>Offsets the music from −300 to +300 ms. A negative value plays it earlier; use this if the audio is late.</dd></div>
                <div><dt>Video delay</dt><dd>Offsets the notes from −300 to +300 ms. A positive value displays them earlier if the screen is delayed.</dd></div>
                <div><dt>Hit-zone preview</dt><dd>Shows the calibrated hit zone to help adjust the delays.</dd></div>
              </dl>
              <h3>Star Power</h3>
              <p>Hit every note in a star phrase to add 25% to the meter. At 50% or more, activate Star Power with its assigned key or button: the score multiplier doubles for 8 seconds. Star phrases and Star Power are disabled in Practice.</p>
              <h3>Customization</h3>
              <p>The <em>Custom</em> panel lets you choose the main color and an image for the highway background. The image is stored locally; choose <em>Remove image</em> to restore the default background.</p>
              <h3>Display and language</h3>
              <p>The <em>Fullscreen</em> button is at the top of the game page. The FR/EN toggle changes the game interface language and remembers your choice in this browser.</p>
            </section>

            <section id="resultats" class="doc-section">
              <div class="doc-section-heading">
                <span class="doc-section-number">05</span>
                <h2>Pause and results</h2>
              </div>
              <p>Pausing stops the music. Resuming syncs the music and timeline with a three-second rewind. In Practice, the pause menu also lets you restart the section; doing so resets that passage's stats.</p>
              <p>At the end of a chart, after stopping, or after a game over, the summary shows score, accuracy, duration, note count, hits and misses, average timing, and best streak. A negative timing means you hit early; a positive timing means you hit late. You can replay or return to the game screen.</p>
            </section>

            <section id="fonctionnement" class="doc-section">
              <div class="doc-section-heading">
                <span class="doc-section-number">06</span>
                <h2>Data and how it works</h2>
              </div>
              <p>Your browser reads the chart, prepares the note timeline, decodes the audio tracks, and keeps them synchronized during play. The canvas draws the highway, notes, and HUD as the game runs.</p>
              <p>Imported files stay on your device: charts and audio tracks are not uploaded to the server. WebHero stores settings, language, and the most recently imported chart locally; associated audio files are kept in the browser cache so they can be restored the next time you load the page.</p>
              <p><em>Unload chart</em> removes the current chart, its local save, and its audio cache. Clearing this site's browser data also removes saved settings and files.</p>
            </section>

            <section id="depannage" class="doc-section">
              <div class="doc-section-heading">
                <span class="doc-section-number">07</span>
                <h2>Troubleshooting</h2>
              </div>
              <div class="doc-rule-list">
                <p><strong>No difficulty appears</strong><span>Make sure a chart is loaded and contains a difficulty with a five-lane guitar track.</span></p>
                <p><strong>The folder is rejected</strong><span>Import one song folder, not the parent folder of several songs; check for a .chart, .mid, or .midi file.</span></p>
                <p><strong>There is no music</strong><span>Check that audio files are in the same folder as the chart and that your browser can decode them. Then adjust the audio delay if the sound is out of sync.</span></p>
                <p><strong>The controller is not detected</strong><span>Reconnect it, check that the browser recognizes it, then press a button to activate it.</span></p>
                            <p><strong>A guitar controller is not detected</strong><span>Some models may require a compatible USB adapter or wireless receiver to connect to the computer. Check that the operating system recognizes the guitar before launching WebHero.</span></p>
              </div>
              <p class="doc-endnote">To play, return to the game using the button at the top of this page.</p>
            </section>`,
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
    "settings.autoStrum": "Auto strum",
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
  if (element.dataset.i18nHtml) {
    if (!originalI18nHtml.has(element))
      originalI18nHtml.set(element, element.innerHTML);
    element.innerHTML =
      messages[language][element.dataset.i18nHtml] ??
      originalI18nHtml.get(element);
  } else if (element.dataset.i18n)
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
    .querySelectorAll("[data-i18n], [data-i18n-html], [data-i18n-attrs]")
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
