const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const techmap = JSON.parse(fs.readFileSync("./techmap.json", "utf8"));
const repos = JSON.parse(fs.readFileSync("./repos.json", "utf8")).repos;

const CACHE_DIR = ".cache_repos";

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

function cloneRepo(url) {
  const folderName = url.split("/").pop();
  const targetDir = path.join(CACHE_DIR, folderName);

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  const cloneUrl = url.replace(
    "https://github.com/",
    `https://${process.env.GH_TOKEN}@github.com/`
  );

  console.log("Cloning", url);

  execSync(`git clone --depth=1 "${cloneUrl}" "${targetDir}"`, {
    stdio: "inherit"
  });

  return targetDir;
}

function scanRepo(dir, found = new Set()) {
  const files = fs.readdirSync(dir);

  for (let file of files) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes(".git")) scanRepo(fullPath, found);
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8").toLowerCase();

    for (let keyword in techmap) {
      if (content.includes(keyword.toLowerCase())) {
        found.add(keyword);
      }
    }
  }

  return found;
}

function generateTable(keywords) {
  const arr = Array.from(keywords);

  let html = `<table><tr>`;

  arr.forEach((k, index) => {
    const { icon, label } = techmap[k];

    html += `
<td align="center" width="120" style="padding: 14px 12px;">
  <img src="https://skillicons.dev/icons?i=${icon}" width="48" style="margin-bottom: 6px;" />
  <br>
  <span style="font-size: 14px; font-weight: 600;">${label}</span>
</td>`;

    if ((index + 1) % 6 === 0) html += `</tr><tr>`;
  });

  html += `</tr></table>`;
  return html;
}

function updateReadme(tableHtml) {
  let readme = fs.readFileSync("README.md", "utf8");

  readme = readme.replace(
    /<!-- TECH_STACK_AUTO -->([\s\S]*?)<!-- TECH_STACK_END -->/,
    `<!-- TECH_STACK_AUTO -->\n${tableHtml}\n<!-- TECH_STACK_END -->`
  );

  fs.writeFileSync("README.md", readme);
}

let foundKeywords = new Set();

repos.forEach(url => {
  const repoDir = cloneRepo(url);
  scanRepo(repoDir, foundKeywords);
});

fs.rmSync(CACHE_DIR, { recursive: true, force: true });

updateReadme(generateTable(foundKeywords));
