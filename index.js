const fs = require("fs");
const util = require('util')

const puppeteer = require('puppeteer');
const cleanDeep = require('clean-deep');
require('dotenv').config();

(async () => {
  const browser = await puppeteer.launch({headless: false, args: ['--start-maximized', '--window-size=1910,1000']});
  const page = await browser.newPage();
  await page.setViewport({width: 0, height: 0});

  try {
    const data = fs.readFileSync('cookies.json', 'utf8');
    const cookies = JSON.parse(data);
    await page.setCookie(...cookies);
    console.log('using saved cookies');
    await page.goto('https://vitagramma.com/');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('cookies not found!');

      await page.goto('https://vitagramma.com/profile');
      const USERNAME_SELECT = 'input.text[type="text"]';
      const PASSWORD_SELECT = 'input.text[type="password"]';
      const LOGIN_BUTTON_SELECT = 'button.but-green';

      await page.click(USERNAME_SELECT);
      await page.keyboard.type(process.env.LOGIN);

      await page.click(PASSWORD_SELECT);
      await page.keyboard.type(process.env.PASSWORD);

      await page.click(LOGIN_BUTTON_SELECT);

      const cookies = await page.cookies('https://vitagramma.com');
      const data = JSON.stringify(cookies);

      await fs.writeFile('cookies.json', data, 'utf8', err => {
        if (err) throw err;
        console.log('The file has been saved!');
      });

      const GO_TO_RESULTS_SELECTOR = '.profile-short-list:nth-of-type(1) .but-blue';
      await page.click(GO_TO_RESULTS_SELECTOR);

    } else {
      throw err;
    }
  }

  const SHOW_MORE_SELECTOR = 'div.more-analysis span.but-light';
  await page.$eval(SHOW_MORE_SELECTOR, (el) => el.scrollIntoView());
  await page.click(SHOW_MORE_SELECTOR);

  await page.waitForResponse(response => response.status() === 200);
  await page.waitForTimeout(5000);

  // await page.goto('file:///home/aoriekhov/Downloads/%D0%90%D0%BD%D0%B4%D1%80%D1%96%D0%B9%20%D0%9E%D1%80%D0%B5%D1%85%D0%BE%D0%B2-%20Vitagramma%20(12_5_2020%207_41_26%20PM).html');

  const result = await page.evaluate(() => {
    const result = [];
    const elements = document.querySelectorAll('li.code-item');
    for (const element of elements) {
      const data = element.querySelector('p.name').innerText;
      const rows = element.querySelectorAll('.table-result tbody tr');
      const itemResults = [];

      for (const row of rows) {
        if (!Boolean(row.className)) {
          if (row.querySelector("b").innerText.toLowerCase().includes('бакпосів на мікрофлору')) {
            break
          } else {
            const title = row.querySelector("b").innerText
            itemResults.push({title})
          }
        } else {
          const title = row.querySelector(".a").innerText.trim().split('\n')[0];
          const resultNode = row.querySelector(".b");
          const unitNode = row.querySelector(".d");
          const referenceNode = row.querySelector(".c");

          let result = resultNode ? resultNode.innerText : "";
          let valueString = null;
          let valueQuantity = null;
          if (Number(result)) {
            valueQuantity = {
              value: Number(result)
            }
          } else {
            valueString = result
          }

          const unit = unitNode ? unitNode.innerText : "";
          let reference = referenceNode ? referenceNode.innerText : "";
          if (reference.includes('до') && !reference.includes('\n')) {
            const high = Number(reference.split(' ')[1])
            if (high) {
              reference = [
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
          }

          const observation = {
            title,
            unit,
            reference,
            valueString,
            valueQuantity
          }

          if (!itemResults[itemResults.length - 1]['result']) {
            itemResults[itemResults.length - 1].result = [observation]
          } else {
            itemResults[itemResults.length - 1].result.push(observation)
          }
        }
      }

      const item = {
        data,
        itemResults
      }
      result.push(item);
    }
    return result;
  });
  const cleanResult = cleanDeep(result);
  console.log(util.inspect(cleanResult, false, null, true))
  fs.writeFileSync('result.json', JSON.stringify(cleanResult, null, 2));

})();