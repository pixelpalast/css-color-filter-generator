import {compute} from "./test.mjs";
import {colors} from "./tokens.huk24.mjs";
import fs from "fs";
import path from 'path';
import {fileURLToPath} from 'url';

const noFilter = 'no-filter';

function hexToFilter(hex) {
    const maxTries = 20;
    let currTry = 1

    while (currTry <= maxTries) {
        const result = compute(hex, 1)

        if (result) {
            currTry = maxTries + 1;
            if (result?.result?.filter && result.result.filter.indexOf(':') !== -1) {
                return result.result.filter.split(':')[1].trim();
            } else {
                return noFilter
            }
        } else {
            ++currTry;
        }
    }
}

function addFiltersRecursively(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            addFiltersRecursively(obj[key]);
        } else if (key === 'value' && /^#[0-9A-Fa-f]{6}$/.test(obj[key])) {
            obj.filter = hexToFilter(obj[key]);
        }
    }
}

function convertColors() {
    console.log("Converting colors...");

    addFiltersRecursively(colors);

    fs.writeFileSync(
        "data.json",
        JSON.stringify(colors, null, 2),
        (err) => {
            if (err) console.error(err);
            else console.log("Colors converted and saved successfully!");
        }
    );
}

function getFilterValue(filter) {
    if (filter !== noFilter) {
        return `filter: ${filter}`
    }
}

function buildOverview() {
    console.log("Building overview...");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const assetsDir = path.join(__dirname, 'src/assets');
    const playgroundHtmlPath = path.join(__dirname, 'overview.html');
    const dataJsonPath = path.join(__dirname, 'data.json');

    const colorsFromJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8')).color;
    const filters = Object.values(colorsFromJson.palette).flatMap(palette => Object.values(palette));

    const filterValues = filters.map(filter => filter.filter);
    const hexValues = filters.map(filter => filter.value);

    fs.readdir(assetsDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        const svgFiles = files.filter(file => path.extname(file).toLowerCase() === '.svg');
        const htmlContent = svgFiles.map(svgFile => {
            const svgFilePath = path.join(assetsDir, svgFile);
            const svgContent = fs.readFileSync(svgFilePath, 'utf8');

            const svgColumnsFilter = filterValues.map(filterValue => filterValue && `<img style="${getFilterValue(filterValue)}" src="src/assets/${svgFile}" />`);
            const svgColumnsHex = hexValues.map(hexValue => hexValue && `<div style="background-color: ${hexValue};" class="icon-wrapper--tile"></div>`);
            const svgColumnsCompare = hexValues.map((hexValue, i) => hexValue && `<div style="background-color: ${hexValue};" class="icon-wrapper--tile ${!filterValues[i] && noFilter}">${filterValues[i] && (`<img style="${getFilterValue(filterValues[i])}" src="src/assets/${svgFile}" />`)}</div>`);

            const svgRows = `
          <div class="icon-wrapper--section">
              <div class="icon-wrapper--row">
                <strong class="icon-wrapper--title">Filter:</strong> ${svgColumnsFilter.join('\n')}
              </div>
              <div class="icon-wrapper--row">
                <strong class="icon-wrapper--title">Hex:</strong> ${svgColumnsHex.join('\n')}
              </div>
              <div class="icon-wrapper--row">
                <strong class="icon-wrapper--title">Comp.:</strong> ${svgColumnsCompare.join('\n')}
              </div>
          </div>`
            return svgRows;
        }).join('\n');

        const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Playground</title>
      <link rel="stylesheet" href="overview.css" />
    </head>
    <body>
      <div id="icon-wrapper">
        ${htmlContent}
      </div>
    </body>
    </html>
  `;

        fs.writeFileSync(playgroundHtmlPath, html);
        console.log('Overview HTML file generated successfully!');
    });
}

console.log("starts");

convertColors()
buildOverview()

console.log("done.");
console.log()