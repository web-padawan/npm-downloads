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
  const FILE_NAME = `${package.replace('@vaadin/', '')}.json`;

  const res = await fetch(`https://api.npmjs.org/versions/${package.replace('/', '%2f')}/last-week`);
  const data = await res.json();

  const today = new Date();
  const date =
    ('0' + today.getDate()).slice(-2) + '/' + ('0' + (today.getMonth() + 1)).slice(-2) + '/' + today.getFullYear();

  const saved = await readFile(path.join(__dirname, 'docs', FILE_NAME));
  const savedData = JSON.parse(saved);

  if (!savedData.downloads) {
    savedData.downloads = [];
  }

  const { downloads } = data;

  const item = { date };

  const keys = Object.keys(downloads);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // ignore dev versions and pre-releases
    if (['dev', 'alpha', 'beta', 'rc'].some((s) => key.includes(s))) {
      continue;
    }
    item[key] = downloads[key];

    // set 0 for previously not existing versions
    for (let j = 0; j < savedData.downloads.length; j++) {
      if (savedData.downloads[j][key] === undefined) {
        savedData.downloads[j][key] = 0;
      }
    }
  }

  savedData.downloads.push(item);

  // sort the array so recent versions come first
  savedData.downloads = savedData.downloads.map((item) => {
    const result = { date: item.date };
    const keys = Object.keys(item)
      .filter((key) => key !== 'date')
      .sort((v1, v2) => {
        const sv1 = semverRegex().exec(v1)[0] || v1;
        const sv2 = semverRegex().exec(v2)[0] || v2;

        return semver.rcompare(sv1, sv2);
      });

    for (let i = 0; i < keys.length; i++) {
      result[keys[i]] = item[keys[i]];
    }

    return result;
  });

  const updatedJson = JSON.stringify(savedData, null, 2);
  await writeFile(path.join(__dirname, 'docs', FILE_NAME), updatedJson);
}

main();
