import puppeteer from "puppeteer";
import {setTimeout} from "node:timers/promises";

// url will be analysis 
const url_to_analysis = process.env.URL;

if(!url_to_analysis){
  console.log(JSON.stringify({Message : "No url "}));
}

// define custom headers
const requestHeaders = {
  'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  Referer: 'https://www.google.com/',
};

(async () => {

  // store the logs in JSON format
  const logs = {
    requests_log: [],
    responses_log: [],
    consoleMessage_log: [],
    html:"",
    css:[],
    js:[]
  }

  // we will diable the default sandbox features in puppeteer since we run in a docker edi  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({ ...requestHeaders });

  // this is actually like listen any http response
  // cuz when browser it will send http request to get the resources
  // this event will be triggered everytime when it get the http responses
  // the response include url and also content  
  page.on('response', async (response) => {
    const url = response.url();

    // Identify and store CSS
    if (url.endsWith('.css')) {
      try {
        const content = await response.text();
        logs.css.push({ url, content });
      } catch (err) {
        console.warn(`Failed to fetch CSS from ${url}`);
      }
    }

    // Identify and store JS
    if (url.endsWith('.js')) {
      try {
        const content = await response.text();
        logs.js.push({url:content})
      } catch (err) {
        console.warn(`Failed to fetch JS from ${url}`);
      }
    }
  });

  // Log console messages from the page
  page.on('console', (msg) => {
    logs.consoleMessage_log.push({
      type: msg.type(),
      text: msg.text()
    });
    // console.log(`Console message: ${msg.text()}`);
  });

  // Intercept network requests and log them
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    logs.requests_log.push(
      {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        headers: request.headers()
      }
    )
    // console.log(`Request URL: ${request.url()}`);
    // console.log(`Request Type: ${request.resourceType()}`);
    request.continue();  // Continue with the request
  });

  // get responses and log it 
  page.on('response', (response) => {
    logs.responses_log.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    })
    // console.log(`Response URL: ${response.url()}`);
    // console.log(`Response Status: ${response.status()}`);
  });


  // Navigate to the target url 
  await page.goto(url_to_analysis, {
    waitUntil: 'domcontentloaded', // make sure captured all the network activities
    timeout: 20000 // wait for 30 s and if still have network activity will force to stop 
  });

  const htmlContent = await page.content();
  logs.html=htmlContent;

  // Wait for some time to capture requests, response and console messages
  // if want faster can configure the time here 
  await setTimeout(5000);

  // print the logs in JSON format 
  console.log(JSON.stringify(logs,null,2));

  await browser.close();
})();
