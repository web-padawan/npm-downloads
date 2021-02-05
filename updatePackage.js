#!/usr/bin/env node
const fs = require('fs');
const util = require('util');
const path = require('path');
const fetch = require('node-fetch');
const semver = require('semver');
const semverRegex = require('semver-regex');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const package = process.argv[2] || process.exit(1);

async function main() {
  const res = await fetch(`https://api.npmjs.org/versions/@vaadin%2f${package}/last-week`);
  const data = await res.json();

  const today = new Date();
  const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

  const saved = await readFile(path.join(__dirname, 'docs', `${package}.json`));
  const savedData = JSON.parse(saved);

  if (!savedData.downloads) {
    savedData.downloads = [];
  }

  const { downloads } = data;

  const item = { date };

  const keys = Object.keys(downloads).sort((v1, v2) => {
    const sv1 = semverRegex().exec(v1)[0] || v1;
    const sv2 = semverRegex().exec(v2)[0] || v2;

    return semver.rcompare(sv1, sv2);
  });

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // ignore old pre-releases
    if (key.indexOf('pre') !== -1) {
      continue;
    }
    item[key] = downloads[key];
  }

  savedData.downloads.push(item);

  const updatedJson = JSON.stringify(savedData, null, 2);
  await writeFile(path.join(__dirname, 'docs', `${package}.json`), updatedJson);
}

main();
