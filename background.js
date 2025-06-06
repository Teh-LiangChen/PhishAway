import googleanalytic from "./googleanalytic.js";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

let ScanReport = null;

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    let currentUrl = new URL(tab.url).origin;

    let webData = await getWebData(tabId, currentUrl);
    console.log("Congrats:", webData);

    const response = JSON.parse(await callGemini(webData))[0];
    console.log("The response:", response);

    ScanReport = {
      Url: currentUrl,
      PhishingRiskScore: response['Phishing Risk Score'],
      ScoreReasons: response['Reasons for the Risk Score'],
      URLDescription: response['Description of URL'],
      ContentAnalysis: response['Content Analysis'],
      NetworkActivity: response['Network Activity'],
      SuspiciousRedirections: response['Suspicious Redirections'],
      BehavioralIndicators: response['Behavioral Indicators'],
      ActionableSecurityInsights: response['Actionable Security Insights']
    };

    // googleanalytic.recordlink(currentUrl, securityRiskScore, potentialVulnerabilities);
    console.log("Done on-time");
    showOnTimeNotification(currentUrl,response['Phishing Risk Score']);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'getStoredReport') {
    // Return the stored report
    sendResponse(ScanReport);
    return true;
  }
});

//Function to show notification from Gemini's responses
function showOnTimeNotification(url,securityRiskScore) {
  const message = `Target: ${url}\nReal-Time Analysis Done\nRisk Score: ${securityRiskScore}/100`;

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon/icon.png",
    title: "Real-Time Analysis",
    message: message,
    priority: 2
  });
}

//Function to show notification from Gemini's responses
function showNotification(url,securityRiskScore) {
  const message = `Target: ${url}\nDeep Analysis Done\nRisk Score: ${securityRiskScore}/100`;

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon/icon.png",
    title: "Deep Analysis",
    message: message,
    priority: 2
  });
}

//Function to Call Gemini API
async function callGemini(webData) {
  const GEMINI_API_KEY = 'AIzaSyCUT3q0aS8C_nXkw-cdvL_cClqvBTyP16s';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const input = structuredinput(webData);
  return fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  })
    .then(response => response.json())
    .then(data => {
      // console.log("Gemini response:", data.candidates[0].content.parts[0]);
      console.log("Gemini response:", data);
      return data.candidates[0].content.parts[0].text;
    })
    .catch((error) => {
      console.error('Error:', error);
      return { error: error.toString() };
    });
}

//Function to structured input for calling gemini
function structuredinput(webData){
    const jsondata = {
        contents: [{
            parts:[{
                text: JSON.stringify(webData),
            }]
        }],
        systemInstruction: {
            parts:[{
                text:`You are an advanced AI-powered phishing detection and web security analysis engine. Your primary task is to evaluate the likelihood that a given website or URL is part of a phishing attack. You will receive website-related data in JSON format, including but not limited to URL structure, DOM content, embedded links, JavaScript behavior and sandbox execution logs.
Your analysis must:
Provide a comprehensive analysis by considering various indicators, including but not limited to URL structure, content, network behavior, and user interaction. The analysis should include the following sections:
1. Phishing Risk Score:
Assess the phishing risk based on the URL's characteristics. The risk score should be on a scale of 1 to 100, where 100 represents a high likelihood of phishing.
2. Reasons for the Risk Score:
Provide a detailed explanation of the factors that contributed to the phishing risk score. This should include unusual URL patterns, domain anomalies, and other key observations.
3. Description of URL:
Analyze the structure of the URL, including the domain, subdomain, path, and any suspicious elements that could indicate a phishing attempt. If the URL uses any URL shorteners or redirects, mention that as well.
4. Content Analysis:
Evaluate the content of the website, including the presence of any login forms, forms requesting sensitive information, suspicious JavaScript, or misleading branding that could be used for phishing.
5. Network Activity:
Inspect the network activity, such as SSL certificate validation, requests to external domains, or loading of resources that could be deemed suspicious. Mention if any resources are loaded from untrusted or unusual sources.
6. Suspicious Redirections:
Check if the URL redirects to another page or domain, and if so, assess whether the redirection chain leads to a suspicious or malicious destination.
7. Behavioral Indicators:
Identify any user behavior that may indicate phishing tactics, such as fake login forms, misleading popups, or attempts to trick users into entering sensitive information.
8. Actionable Security Insights:
Provide clear and actionable recommendations based on the analysis, such as precautions to take, actions to verify the authenticity of the site, or steps to report or block the URL.
Ensure that each section provides relevant insights based on the provided URL and clearly highlights areas of concern. The goal is to help users identify and mitigate potential phishing risks associated with the URL.`,
            }]
        },
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema:{
                type: "array",
                items: {
                    type: "object",
                    properties:{
                        'Phishing Risk Score':{
                            type: "string",
                            description: 'Risk score of the link being phishing link',
                            nullable: false,
                        },
                        'Reasons for the Risk Score':{
                            type: "string",
                            description: 'Summary of the reasons for the score',
                            nullable: false,
                        },
                        'Description of URL':{
                            type: "string",
                            description: 'Analysis of the URL',
                            nullable: false,
                        },
                        
                        'Content Analysis':{
                            type: "string",
                            description: 'Analysis of the content',
                            nullable: false,
                        },
                        'Network Activity':{
                            type: "string",
                            description: 'Analysis of the netowrk log',
                            nullable: false,
                        },
                        'Suspicious Redirections':{
                            type: "string",
                            description: 'Analysis of the netowrk log',
                            nullable: false,
                        },
                        'Behavioral Indicators':{
                            type: "string",
                            description: 'Analysis of the netowrk log',
                            nullable: false,
                        },
                        'Actionable Security Insights':{
                            type: "string",
                            description: 'Some actions can be taken',
                            nullable: false,
                        },
                    },
                    required: ['Phishing Risk Score','Reasons for the Risk Score','Description of URL','Content Analysis','Network Activity','Suspicious Redirections','Behavioral Indicators','Actionable Security Insights',],
                },
            }
        }
    }
    return jsondata;
}

//Function to combine extracted data
async function getWebData(tabId, url) {
  //Fetch website data and cookies
  let websiteData = await extractScript(tabId);
  let cookies = await getCookies(url);

  //Combine the data
  let combinedData = {
    url: url,
    websiteData: websiteData,
    cookies: cookies
  };

  console.log('Combined Data:', combinedData);
  return combinedData;
}

// Function to inject script and extract website data
function extractScript(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: extractWebsiteData
    }, (results) => {
      console.log("Extracted Data:", results[0]?.result);
      resolve(results[0]?.result || {});
    });
  });
}

// Function that runs inside the webpage to extract website data
function extractWebsiteData() {
  return {
    title: document.title,
    metaDescription: document.querySelector("meta[name='description']")?.content || "N/A",
    scripts: [...document.querySelectorAll("script")].map(s => s.src).filter(src => src)
  };
}

// Function to get cookies
function getCookies(url) {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ url: url }, (cookies) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting cookies:", chrome.runtime.lastError);
        resolve([]);
      } else {
        console.log(`Cookies for ${url}:`, cookies);
        resolve(cookies);
      }
    });
  });
}



// ──────────────────────────────────────────────────────
// HELPER FUNCTIONS (must come before the listener)
// ──────────────────────────────────────────────────────

// Remove HTML tags from snippets
const stripHtml = html => (html || '').replace(/<[^>]*>/g, '');

// Recursively find any text/html part in the payload tree
function findHtmlPart(parts = []) {
  for (const p of parts) {
    if (p.mimeType === 'text/html' && p.body?.data) {
      return p;
    }
    if (Array.isArray(p.parts)) {
      const found = findHtmlPart(p.parts);
      if (found) return found;
    }
  }
  return null;
}

// Decode Gmail’s URL-safe Base64 into UTF-8 string
function decodeBase64Url(data) {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return new TextDecoder().decode(
    Uint8Array.from(bin, c => c.charCodeAt(0))
  );
}

// Recursively collect all attachments ({filename, attachmentId, mimeType})
function findAttachments(parts = []) {
  let atts = [];
  for (const p of parts) {
    if (p.filename && p.body?.attachmentId) {
      atts.push({
        filename: p.filename,
        attachmentId: p.body.attachmentId,
        mimeType: p.mimeType
      });
    }
    if (Array.isArray(p.parts)) {
      atts = atts.concat(findAttachments(p.parts));
    }
  }
  return atts;
}

// Fallback URL regex if you need it
const urlRegex = /https?:\/\/[^\s"']+/g;


// ──────────────────────────────────────────────────────
// MESSAGE LISTENER
// ──────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      const { message, payload } = request;

      // 1) Get OAuth token
      const token = await new Promise((res, rej) => {
        chrome.identity.getAuthToken({ interactive: message === 'sign in' }, t => {
          if (chrome.runtime.lastError) return rej(chrome.runtime.lastError);
          if (!t) return rej(new Error('No token'));
          res(t);
        });
      });

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      };

      // ─── SIGN IN ──────────────────────────────────────
      if (message === 'sign in') {
        return sendResponse({ success: true });
      }

      // ─── SIGN OUT ─────────────────────────────────────
      if (message === 'sign out') {
        chrome.identity.removeCachedAuthToken({ token });
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
        return sendResponse({ success: true });
      }

      // ─── LIST MESSAGES ────────────────────────────────
      if (message === 'list') {
        // 1. Fetch up to 10 message IDs
        const { messages: ids = [] } = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
          { headers }
        ).then(r => r.json());

        // 2. Fetch each full message
        const raws = await Promise.all(
          ids.map(({ id }) =>
            fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`,
              { headers }
            ).then(r => r.json())
          )
        );

        // 3. Build result objects
        const results = raws
          .sort((a, b) => +b.internalDate - +a.internalDate)
          .map(m => {
            // a) Sender
            const hdrs = Array.isArray(m.payload?.headers)
              ? m.payload.headers
              : [];
            const fromEntry = hdrs.find(h => h.name === 'From');
            const from = fromEntry?.value || 'Unknown sender';

            // b) Snippet
            const snippet = stripHtml(m.snippet);

            // c) Full HTML body
            const htmlPart = findHtmlPart(m.payload?.parts);
            const html = htmlPart
              ? decodeBase64Url(htmlPart.body.data)
              : '';

            // d) Attachments
            const attachments = findAttachments(m.payload?.parts);

            // e) (Optional) simple links from snippet
            const links = snippet.match(urlRegex) || [];

            return {
              id: m.id,                                // <— use m.id here
              date: new Date(+m.internalDate).toLocaleString(),
              from,
              snippet,
              html,
              links,
              attachments
            };
          });
        console.log('DEBUG: attachments for each message', results.map(r => r.attachments));
        sendResponse({ success: true, messages: results });
      }

      // ─── DOWNLOAD ATTACHMENT ─────────────────────────
      if (message === 'getAttachment') {
        const { messageId, attachmentId, filename } = payload;
        const { data: b64 } = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
          { headers }
        ).then(r => r.json());

        const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
        const arr = Uint8Array.from(bin, c => c.charCodeAt(0));

        return sendResponse({ success: true, filename, data: arr });
      }

      // ─── VIRUSTOTAL SCAN ─────────────────────────────
      if (message === 'scanAttachment') {
        // 1) Pull filename & raw data out of the payload
        const { filename, data } = payload;

        // 2) Rebuild a Uint8Array from whatever arrived
        let bytes = data;
        if (bytes instanceof ArrayBuffer) {
          bytes = new Uint8Array(bytes);
        } else if (!ArrayBuffer.isView(bytes)) {
          bytes = new Uint8Array(Object.values(bytes));
        }

        (async () => {
          try {
            // 3) Compute SHA-256 hash
            const hash = await computeSHA256(bytes);
            console.log('Computed hash:', hash);

            // 4) Try lookup via your proxy
            const proxy = 'https://phishing-domain.titustanyf.workers.dev';
            const hashRes = await fetch(`${proxy}/files/${hash}`);
          
 
            let isMalicious;
            if (hashRes.ok ) {
              console.log(hashRes);
              const body=hashRes.url;
              console.log(body);
              const cnst=await fetch(body);
              const{data}=await cnst.json();
              const count = data?.attributes?.last_analysis_stats?.malicious ?? 0;
              console.log("count" +count);
      
              isMalicious = count > 0;
            } else {
              // 5) Upload if no existing report
              const form = new FormData();
              form.append('file', new Blob([bytes]), filename);

              const uploadRes = await fetch(`${proxy}/upload`, { method: 'POST', body: form });

              // 1) Clone for logging
              const clone = uploadRes.clone();
              console.log('Upload status:', uploadRes.status, uploadRes.statusText);
              console.log('Upload body:', await clone.text());

              // 2) Parse JSON from the original
              if (!uploadRes.ok) {
                const errJson = await uploadRes.json();          // safe now
                throw new Error(`Upload failed (${uploadRes.status}): ${JSON.stringify(errJson)}`);
              }
              const uploadJson = await uploadRes.json();         // first successful parse

              const analysisId = uploadJson.data.id;

              // 6) Poll until complete
              let status, resultJson;
              do {
                await new Promise(r => setTimeout(r, 5000));
                const pollRes = await fetch(`${proxy}/analyses/${encodeURIComponent(analysisId)}`);
                if (!pollRes.ok) throw new Error(`Analysis poll failed: ${pollRes.status}`);
                const resultJson = await pollRes.json();
                status = resultJson.data.attributes.status;
              } while (status !== 'completed');

              const malCount = resultJson.data.attributes.stats.malicious;
              isMalicious = malCount > 0;
            }

            // 7) Send back verdict
            sendResponse({ success: true, malicious: isMalicious });
          } catch (err) {
            console.error('VirusTotal scan error:', err);
            sendResponse({ success: false, error: err.message });
          }
        })();

        // Keep channel open for async response
        return true;
      }

      // ─── UNKNOWN COMMAND ─────────────────────────────
      sendResponse({ success: false, error: 'Unknown command' });
    }
    catch (err) {
      console.error('Background error:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  // Keep channel open for the async sendResponse
  return true;
});


// ──────────────────────────────────────────────────────
// VIRUSTOTAL HELPERS
// ──────────────────────────────────────────────────────


// Compute SHA-256 hash of a Uint8Array
async function computeSHA256(bytes) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}


// add a new option for deep analysis
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "Custom_Option",
        title: "Deep Analysis",
        contexts: ["all"]
    });
});

let DeepReport = null;

// post the url to the server 
async function post_server (url) {
    try{
        //http://localhost:3000/run-sandbox
        //http://34.173.130.118:3000/run-sandbox
        const res  = await fetch('http://localhost:3000/run-sandbox',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ urlToAnalyze: url }),
            });
        
        const data = await res.json();
        console.log(data);
        const response = JSON.parse(await callGemini(data.data))[0];
        console.log("The response:", response);

        DeepReport = {
          Url: url,
          PhishingRiskScore: response['Phishing Risk Score'],
          ScoreReasons: response['Reasons for the Risk Score'],
          URLDescription: response['Description of URL'],
          ContentAnalysis: response['Content Analysis'],
          NetworkActivity: response['Network Activity'],
          SuspiciousRedirections: response['Suspicious Redirections'],
          BehavioralIndicators: response['Behavioral Indicators'],
          ActionableSecurityInsights: response['Actionable Security Insights']
        };

        console.log("Deep analysis done");
        showNotification(url,response['Phishing Risk Score']);
    }catch(err){
        console.log(err);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'getDeepReport') {
    // Return the stored report
    sendResponse(DeepReport);
    return true;
  }
});


// get url that a user click and make a post to our server 
chrome.contextMenus.onClicked.addListener((info, tab) => {
    let urlToAnalyze;
    if (info.menuItemId === "Custom_Option") {
        if (info.linkUrl) {
            urlToAnalyze = info.linkUrl;
            console.log(`Analyzing link: ${urlToAnalyze}`);
        } else if (info.selectionText) {
            urlToAnalyze = info.selectionText;
            console.log(`Analyzing selected text: ${urlToAnalyze}`);
        } else if (info.srcUrl) {
            urlToAnalyze = info.srcUrl;
            console.log(`Analyzing image source: ${urlToAnalyze}`);
        } else if (tab.url) {
            urlToAnalyze = tab.url;
            console.log(`Analyzing page URL: ${urlToAnalyze}`);
        }
    }

    if (urlToAnalyze) {
        // send to the express server
        post_server(urlToAnalyze);
    }
});
  