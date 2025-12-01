const fs = require("fs");
const path = require("path");

const techmap = JSON.parse(fs.readFileSync("./techmap.json", "utf8"));

function scanRepo(dir, foundKeywords = new Set()) {
  const files = fs.readdirSync(dir);

  for (let file of files) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes(".git")) scanRepo(fullPath, foundKeywords);
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
  let html = `<table><tr>`;

  keywords.forEach(k => {
    const { icon, label } = techmap[k];
    html += `
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=${icon}" width="48" />
  <br>${label}
</td>`;
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
