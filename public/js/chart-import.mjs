const chartExtensions = new Set(["chart", "mid", "midi"]);
const audioExtensions = new Set([
  "aac",
  "flac",
  "m4a",
  "mp3",
  "ogg",
  "opus",
  "wav",
]);

function extension(name) {
  return name.split(".").pop().toLowerCase();
}

function relativePath(file) {
  return file.webkitRelativePath || file.name;
}

function directory(path) {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index);
}

export function selectChartFolderFiles(files) {
  const chartFiles = files.filter((file) => chartExtensions.has(extension(file.name)));
  const namedCharts = chartFiles.filter((file) =>
    /^notes\.(chart|mid|midi)$/i.test(file.name)
  );
  const candidates = namedCharts.length ? namedCharts : chartFiles;
  if (!candidates.length)
    throw new Error("Le dossier ne contient aucun fichier .chart ou .mid.");

  const chartDirectories = new Set(candidates.map((file) => directory(relativePath(file))));
  if (chartDirectories.size !== 1)
    throw new Error("Choisissez le dossier d’une seule chart, pas un dossier de lots.");
  if (candidates.length > 1 && !namedCharts.length)
    throw new Error("Plusieurs charts trouvées. Gardez un fichier notes.chart ou notes.mid dans le dossier.");

  const chartFile = candidates.find((file) => extension(file.name) === "chart") ||
    candidates.find((file) => extension(file.name) === "mid") ||
    candidates[0];
  const chartDirectory = directory(relativePath(chartFile));
  const siblings = files.filter((file) =>
    directory(relativePath(file)) === chartDirectory
  );
  const iniFile = siblings.find((file) => file.name.toLowerCase() === "song.ini") ||
    siblings.find((file) => extension(file.name) === "ini") ||
    null;

  return {
    chartFile,
    audioFiles: siblings.filter((file) => audioExtensions.has(extension(file.name))),
    iniFile,
    folderName: chartDirectory.split("/").filter(Boolean).at(-1) || chartFile.name,
  };
}

export function parseSongIni(content) {
  let section = "";
  let name = "";
  let artist = "";
  for (const line of content.split(/\r?\n/)) {
    const heading = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (heading) {
      section = heading[1].trim().toLowerCase();
      continue;
    }
    if (section !== "song") continue;
    const property = line.match(/^\s*(name|artist)\s*=\s*(.*?)\s*$/i);
    if (!property) continue;
    if (property[1].toLowerCase() === "name") name = property[2];
    if (property[1].toLowerCase() === "artist") artist = property[2];
  }
  return [name, artist].filter(Boolean).join(" — ");
}
