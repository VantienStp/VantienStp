const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const techmap = JSON.parse(fs.readFileSync("./techmap.json", "utf8"));
const repos = JSON.parse(fs.readFileSync("./repos.json", "utf8")).repos;

const CACHE_DIR = ".cache_repos";

// tạo folder cache
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

function cloneRepo(url) {
  const folderName = url.split("/").pop();
  const targetDir = path.join(CACHE_DIR, folderName);

  if (fs.existsSync(targetDir)) {
    execSync(`rm -rf ${targetDir}`);
  }

  console.log("Cloning", url);
  execSync(`git clone --depth=1 ${url} ${targetDir}`);
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

    const content = fs.readFileSync(fullPath, "utf8");

    for (let keyword in techmap) {
      if (content.toLowerCase().includes(keyword)) {
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
<td align="center" width="120" style="padding: 12px 10px;">
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

// xóa cache sau khi scan
execSync(`rm -rf ${CACHE_DIR}`);

updateReadme(generateTable(foundKeywords));
