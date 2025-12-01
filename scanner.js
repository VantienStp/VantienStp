const fs = require("fs");
const path = require("path");

const techmap = JSON.parse(fs.readFileSync("./techmap.json", "utf8"));

function scanRepo(dir, foundKeywords = new Set()) {
  const files = fs.readdirSync(dir);

  for (let file of files) {
    const fullPath = path.join(dir, file);

    // ignore git folder + workflow folder
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes(".git") && !fullPath.includes(".github")) {
        scanRepo(fullPath, foundKeywords);
      }
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");

    for (let keyword in techmap) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.add(keyword);
      }
    }
  }

  return foundKeywords;
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

    // tự xuống dòng mỗi 6 icon
    if ((index + 1) % 6 === 0) {
      html += `</tr><tr>`;
    }
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

const keywords = scanRepo(".");
const table = generateTable(keywords);

updateReadme(table);
