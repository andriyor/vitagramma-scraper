const fs = require("fs");
const util = require('util')

const puppeteer = require('puppeteer');
const cleanDeep = require('clean-deep');
require('dotenv').config();

const {parseReference} = require('./refParser');

(async () => {
  const browser = await puppeteer.launch({headless: false, args: ['--start-maximized', '--window-size=1910,1000']});
  const page = await browser.newPage();
  await page.setViewport({width: 0, height: 0});

  // try {
  //   const data = fs.readFileSync('cookies.json', 'utf8');
  //   const cookies = JSON.parse(data);
  //   await page.setCookie(...cookies);
  //   console.log('using saved cookies');
  //   await page.goto('https://vitagramma.com/');
  // } catch (err) {
  //   if (err.code === 'ENOENT') {
  //     console.log('cookies not found!');
  //
  //     await page.goto('https://vitagramma.com/profile');
  //     const USERNAME_SELECT = 'input.text[type="text"]';
  //     const PASSWORD_SELECT = 'input.text[type="password"]';
  //     const LOGIN_BUTTON_SELECT = 'button.but-green';
  //
  //     await page.click(USERNAME_SELECT);
  //     await page.keyboard.type(process.env.LOGIN);
  //
  //     await page.click(PASSWORD_SELECT);
  //     await page.keyboard.type(process.env.PASSWORD);
  //
  //     await page.click(LOGIN_BUTTON_SELECT);
  //
  //     const cookies = await page.cookies('https://vitagramma.com');
  //     const data = JSON.stringify(cookies);
  //
  //     await fs.writeFile('cookies.json', data, 'utf8', err => {
  //       if (err) throw err;
  //       console.log('The file has been saved!');
  //     });
  //
  //     const GO_TO_RESULTS_SELECTOR = '.profile-short-list:nth-of-type(1) .but-blue';
  //     await page.click(GO_TO_RESULTS_SELECTOR);
  //
  //   } else {
  //     throw err;
  //   }
  // }
  //
  // const SHOW_MORE_SELECTOR = 'div.more-analysis span.but-light';
  // await page.$eval(SHOW_MORE_SELECTOR, (el) => el.scrollIntoView());
  // await page.click(SHOW_MORE_SELECTOR);
  //
  // await page.waitForResponse(response => response.status() === 200);
  // await page.waitForTimeout(5000);

  await page.goto('file:///home/aoriekhov/PycharmProjects/vitagramma-scraper/exportResult.html');

  await page.addScriptTag({path: './node_modules/luxon/build/global/luxon.js'});

  page.on('console', consoleObj => console.log(consoleObj.text()));

  await page.exposeFunction("parseReference", parseReference);

  const observationsReport = await page.evaluate(async () => {
    const result = [];
    const elements = document.querySelectorAll('li.code-item');
    for (const element of elements) {
      const unformattedDate = element.querySelector('p.name').innerText;
      const issued = window.luxon.DateTime.fromFormat(unformattedDate, "d MMMM yyyy", {locale: "uk"}).toFormat('yyyy-MM-dd')
      const rows = element.querySelectorAll('.table-result tbody tr');
      const itemResults = [];

      for (const row of rows) {
        if (!Boolean(row.className)) {
          if (row.querySelector("b").innerText.toLowerCase().includes('бакпосів на мікрофлору')) {
            break
          } else {
            const title = row.querySelector("b").innerText
            itemResults.push(
              {
                title,
                issued
              })
          }
        } else {
          const title = row.querySelector(".a").innerText.trim().split('\n')[0];
          const resultNode = row.querySelector(".b");
          const unitNode = row.querySelector(".d");
          const referenceNode = row.querySelector(".c");

          let result = resultNode ? resultNode.innerText : "";
          const unit = unitNode ? unitNode.innerText : "";
          let valueString = null;
          let valueQuantity = null;
          if (Number(result)) {
            valueQuantity = {
              value: Number(result),
              unit
            }
          } else {
            valueString = result
          }


          let rawReference = referenceNode ? referenceNode.innerText : "";
          let referenceRange = [];
          if (!rawReference.includes('\n')) {
            if (rawReference.includes('до')) {
              const high = Number(rawReference.split(' ')[1])
              if (high) {
                referenceRange = [
                  {
                    "low": {
                      "value": 0,
                    },
                    "high": {
                      "value": high,
                    }
                  }
                ]
              }
            } else if (rawReference.includes('-')) {
              const [low, high] = rawReference.split(' -');
              referenceRange = [
                {
                  "low": {
                    "value": Number(low),
                  },
                  "high": {
                    "value": Number(high),
                  }
                }
              ]
            }
          } else {
            referenceRange = await parseReference(rawReference);
          }

          const observation = {
            title,
            referenceRange,
            valueString,
            valueQuantity,
            issued
          }

          if (!itemResults[itemResults.length - 1]['result']) {
            itemResults[itemResults.length - 1].result = [observation]
          } else {
            itemResults[itemResults.length - 1].result.push(observation)
          }
        }
      }

      const item = {
        issued,
        itemResults
      }
      result.push(item);
    }
    return result;
  });

  const result = {
    observationsReport
  }
  const cleanResult = cleanDeep(result);

  fs.writeFileSync('result.json', JSON.stringify(cleanResult, null, 2));

})();