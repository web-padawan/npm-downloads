#!/usr/bin/env node

const meow = require('meow');
const puppeteer = require('puppeteer');

const usage = `Usage
  $ npm-downloads <package>

  Options
    --debug  Show Puppeteer browser

  Example
    $ npm-downloads @vaadin/vaadin-core`;

const cli = meow(usage);

if (cli.input.length === 0) {
  console.log(usage);
  process.exit(1);
}

const package = cli.input[0];

const run = async () => {
  const browser = await puppeteer.launch({
    headless: !cli.flags.debug
  });

  try {
    const page = await browser.newPage();
    await page.goto(`https://www.npmjs.com/package/${package}?activeTab=versions`);

    const versions = await page.$$eval('h3 + ul', (el) => {
      const list = el[1];
      const rows = Array.from(list.children).slice(1);
      return rows
        .map((row) => {
          const version = row.querySelector('a').textContent;
          const downloads = row.querySelector('code').textContent;
          return { version, downloads };
        })
        .filter(({ version }) => !version.includes('alpha') && !version.includes('beta') && !version.includes('rc'))
        .map(({ version, downloads }) => `${version},${downloads}`);
    });

    console.log(versions.join('\n'));

    await browser.close();
  } catch (error) {
    await browser.close();
    console.error(error);
  }
};

run();
