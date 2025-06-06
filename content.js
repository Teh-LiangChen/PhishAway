const GMAIL_LINK_SELECTOR = 'div[role="main"] .ii.gt a[href]';
const WEBPAGE_LINK_SELECTOR='a';
const WHATSAPP_LINK_SELECTOR='a[href]';
const RISK_THRESHOLDS = { high: 0.9, medium: 0.7 };
const RISK_STYLES = {
    'low': {
      color: '#34a853', // Google green
      backgroundColor: 'rgba(52, 168, 83, 0.08)',
      borderColor: 'rgba(52, 168, 83, 0.3)',
      icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
      text: 'Low risk - This link appears safe'
    },
    'medium': {
      color: '#fbbc05', // Google yellow
      backgroundColor: 'rgba(251, 188, 5, 0.08)',
      borderColor: 'rgba(251, 188, 5, 0.3)',
      icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M6.6 21H17.4C18.8359 21 19.5544 21 20.0927 20.6955C20.5704 20.4272 20.9443 20.0021 21.1553 19.4658C21.3929 18.8575 21.2552 18.1349 20.9797 16.6898L15.7797 4.43015C15.4835 2.88865 15.3354 2.1179 14.9389 1.65218C14.5903 1.24158 14.1128 0.964435 13.5867 0.868501C12.9863 0.76 12.2943 0.976685 10.9103 1.41005L4.01015 3.86995C2.6993 4.28345 2.04387 4.4902 1.65463 4.91225C1.31012 5.28254 1.09337 5.76265 1.04576 6.27532C0.992209 6.8676 1.3111 7.50152 1.94888 8.76935L4.44888 13.7693C4.79478 14.4651 4.96773 14.813 5.2389 15.0716C5.48133 15.2991 5.77734 15.4568 6.10256 15.5281C6.47066 15.6083 6.87458 15.5306 7.68242 15.375L8.67258 15.1755C9.02849 15.0922 9.20644 15.0505 9.37357 14.9773C9.52089 14.9126 9.65823 14.8249 9.78038 14.7178C9.91881 14.5982 10.0324 14.4491 10.2597 14.1508L11 13.2M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
      text: 'Medium risk - Exercise caution with this link'
    },
    'high': {
      color: '#ea4335', // Google red
      backgroundColor: 'rgba(234, 67, 53, 0.08)',
      borderColor: 'rgba(234, 67, 53, 0.3)',
      icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
      text: 'High risk - This link may be dangerous'
    }
  };

let model = null; // Will hold the loaded model
let observer = null; // Will hold the MutationObserver

initializeLinkAnalysis();

/**
 * Analyzes a single link element, predicts risk, and applies styling.
 * @param {HTMLAnchorElement} linkElement - The link element to process.
 * @param {tf.LayersModel} modelInstance - The loaded TensorFlow model.
 * @param {string} riskLevel - Risk level: 'low', 'medium', or 'high'
 */
function processLink(linkElement, modelInstance) {
    if (!linkElement || !modelInstance) {
        console.warn("processLink called with invalid element or model");
        return;
    }

    const classAttr = linkElement.getAttribute("class") || "";

    const excludedClasses = [
      "gb_X","gb_B gb_Za gb_0","gb_B","gb_B gb_Za","nPDzT T3FoJb","FgNLaf","ngTNl ggLgoc","fl","LLNLxf"
    ];

    // Skip unnecessary or already analyzed links
    if (excludedClasses.includes(classAttr) || classAttr.includes("row no-wrap row-with-padding") || linkElement.dataset.riskAnalyzed === "true") {
      return;
    }
    const url = linkElement.href || linkElement.getAttribute('href');
    console.log(`Processing link: ${url}`);

    try {
        const features = extractUrlFeatures(url); 
        const predictionTensor = modelInstance.predict(features);
        const prediction = predictionTensor.dataSync(); 
        tf.dispose([predictionTensor, features]);

        let riskLevel = 'low'; 
        if (prediction[0] > RISK_THRESHOLDS.high) riskLevel = 'high';
        else if (prediction[0] > RISK_THRESHOLDS.medium) riskLevel = 'medium';

        applyRiskStyling(linkElement, riskLevel);
        linkElement.dataset.riskAnalyzed = "true"; // Mark as done

        console.log(`Link classified as ${riskLevel}: ${url}`);

    } catch (error) {
        console.error(`Error processing URL: ${url}`, error);
    }
}

function applyRiskStyling(linkElement, riskLevel) {
    // Default to low if invalid risk level
    if (!RISK_STYLES[riskLevel]) {
      riskLevel = 'low';
    }
  
    const styleInfo = RISK_STYLES[riskLevel];
    
    // Set tooltip
    linkElement.title = styleInfo.text;
    
    // Remove any existing risk indicators
    const existingIndicator = linkElement.querySelector('.risk-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Create risk indicator container
    const indicator = document.createElement('span');
    indicator.className = `risk-indicator risk-${riskLevel}`;
    indicator.innerHTML = styleInfo.icon;
    indicator.title = styleInfo.text;
    
    // Apply styles to the indicator
    Object.assign(indicator.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '4px',
      padding: '2px',
      borderRadius: '50%',
      backgroundColor: styleInfo.backgroundColor,
      border: `1px solid ${styleInfo.borderColor}`,
      color: styleInfo.color,
      verticalAlign: 'middle',
      lineHeight: 1,
      position: 'relative',
      top: '-1px'
    });
    
    // Apply styles to the link based on risk level
    if (riskLevel === 'high') {
      // For high risk, we modify the link itself
      linkElement.style.color = styleInfo.color;
      linkElement.style.textDecoration = 'underline';
      
      // Create a subtle background highlight for high-risk links
      linkElement.style.backgroundColor = styleInfo.backgroundColor;
      linkElement.style.borderRadius = '2px';
      linkElement.style.padding = '0 2px';
      
      // Add a small border-bottom for additional emphasis
      linkElement.style.borderBottom = `1px solid ${styleInfo.borderColor}`;
    }
    
    // Add the indicator after the link text
    linkElement.appendChild(indicator);

    
    // Add hover effect with CSS
    const styleId = 'risk-indicator-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .risk-indicator {
          transition: transform 0.2s ease;
        }
        .risk-indicator:hover {
          transform: scale(1.2);
        }
        a:hover .risk-indicator {
          opacity: 1;
        }
        
        /* Tooltip styles */
        .risk-indicator::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          padding: 5px 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          pointer-events: none;
          z-index: 10000;
        }
        
        .risk-indicator:hover::after {
          opacity: 1;
          visibility: visible;
        }
      `;
      document.head.appendChild(style);
    }
  }

/**
 * Scans the document (or specific parts) for links and applies risk analysis.
 * @param {tf.LayersModel} modelInstance - The loaded TensorFlow model.
 */
function scanAndApplyRiskAnalysis(modelInstance) {
  if (!modelInstance) {
      console.warn("Model not available, skipping link scan.");
      return;
  }
  
  //Scanning for links with selector;
  const links = document.querySelectorAll(`${WEBPAGE_LINK_SELECTOR}, ${GMAIL_LINK_SELECTOR},${WHATSAPP_LINK_SELECTOR}`); 
  links.forEach(link => processLink(link, modelInstance));
}



/**
 * Retry scanning multiple times after DOM changes to ensure Gmail has fully rendered.
 */
function retryScanAfterDomChange(modelInstance) {
  const maxAttempts = 1;
  let attempt = 0;

  const retryInterval = setInterval(() => {
      console.log(`Rescan attempt #${attempt + 1}`);

      scanAndApplyRiskAnalysis(modelInstance);

      attempt++;
      if (attempt >= maxAttempts) {
          clearInterval(retryInterval);
      }
  }, 300); // 1 second between attempts
}


/**
 * Handles DOM mutations to trigger rescans.
 * @param {MutationRecord[]} mutations - An array of mutation records.
 */
function handleMutations(mutations) {
    let firstScan = false;

    for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            firstScan = true;
            break;
        }
    }

    if (firstScan && model) {
        console.log("DOM changed, starting retry scan...");
        retryScanAfterDomChange(model);
    }
}

/**
* Initializes the link analysis process.
*/
async function initializeLinkAnalysis() {
  console.log("Initializing Link Analysis Script..."); // Initial log

  model = await tf.loadLayersModel(chrome.runtime.getURL('model/model.json'));

  if (model) {
      scanAndApplyRiskAnalysis(model);

      observer = new MutationObserver(handleMutations);
      observer.observe(document.body, {
          childList: true, 
          subtree: true    
      });
      console.log("MutationObserver set up.");
  } else {
      console.error("Initialization failed: Model could not be loaded.");
  }
}



function extractUrlFeatures(url) {
    const features = {};

    // General URL features
    features["qty_dot_url"] = (url.match(/\./g) || []).length;
    features["qty_hyphen_url"] = (url.match(/-/g) || []).length;
    features["qty_underline_url"] = (url.match(/_/g) || []).length;
    features["qty_slash_url"] = (url.match(/\//g) || []).length;
    features["qty_questionmark_url"] = (url.match(/\?/g) || []).length;
    features["qty_equal_url"] = (url.match(/=/g) || []).length;
    features["qty_at_url"] = (url.match(/@/g) || []).length;
    features["qty_and_url"] = (url.match(/&/g) || []).length;
    features["qty_exclamation_url"] = (url.match(/!/g) || []).length;
    features["qty_space_url"] = (url.match(/ /g) || []).length;
    features["qty_tilde_url"] = (url.match(/~/g) || []).length;
    features["qty_comma_url"] = (url.match(/,/g) || []).length;
    features["qty_plus_url"] = (url.match(/\+/g) || []).length;
    features["qty_asterisk_url"] = (url.match(/\*/g) || []).length;
    features["qty_hashtag_url"] = (url.match(/#/g) || []).length;
    features["qty_dollar_url"] = (url.match(/\$/g) || []).length;
    features["qty_percent_url"] = (url.match(/%/g) || []).length;
    features["qty_tld_url"] = url.split('.').pop().length;
    features["length_url"] = url.length;

    // Parse domain from URL
    let parsedUrl = new URL(url);
    let domain = parsedUrl.hostname;

    // Domain-related features
    features["qty_dot_domain"] = (domain.match(/\./g) || []).length;
    features["qty_hyphen_domain"] = (domain.match(/-/g) || []).length;
    features["qty_underline_domain"] = (domain.match(/_/g) || []).length;
    features["qty_slash_domain"] = (domain.match(/\//g) || []).length;
    features["qty_questionmark_domain"] = (domain.match(/\?/g) || []).length;
    features["qty_equal_domain"] = (domain.match(/=/g) || []).length;
    features["qty_at_domain"] = (domain.match(/@/g) || []).length;
    features["qty_and_domain"] = (domain.match(/&/g) || []).length;
    features["qty_exclamation_domain"] = (domain.match(/!/g) || []).length;
    features["qty_space_domain"] = (domain.match(/ /g) || []).length;
    features["qty_tilde_domain"] = (domain.match(/~/g) || []).length;
    features["qty_comma_domain"] = (domain.match(/,/g) || []).length;
    features["qty_plus_domain"] = (domain.match(/\+/g) || []).length;
    features["qty_asterisk_domain"] = (domain.match(/\*/g) || []).length;
    features["qty_hashtag_domain"] = (domain.match(/#/g) || []).length;
    features["qty_dollar_domain"] = (domain.match(/\$/g) || []).length;
    features["qty_percent_domain"] = (domain.match(/%/g) || []).length;
    features["qty_vowels_domain"] = domain.split('').filter(c => 'aeiou'.includes(c)).length;
    features["domain_length"] = domain.length;

    features["server_client_domain"] = (domain.includes("server") || domain.includes("client")) ? 1 : 0;

    // Path-related features
    let directory = parsedUrl.pathname;
    features["qty_dot_directory"] = (directory.match(/\./g) || []).length;
    features["qty_hyphen_directory"] = (directory.match(/-/g) || []).length;
    features["qty_underline_directory"] = (directory.match(/_/g) || []).length;
    features["qty_slash_directory"] = (directory.match(/\//g) || []).length;
    features["qty_questionmark_directory"] = (directory.match(/\?/g) || []).length;
    features["qty_equal_directory"] = (directory.match(/=/g) || []).length;
    features["qty_at_directory"] = (directory.match(/@/g) || []).length;
    features["qty_and_directory"] = (directory.match(/&/g) || []).length;
    features["qty_exclamation_directory"] = (directory.match(/!/g) || []).length;
    features["qty_space_directory"] = (directory.match(/ /g) || []).length;
    features["qty_tilde_directory"] = (directory.match(/~/g) || []).length;
    features["qty_comma_directory"] = (directory.match(/,/g) || []).length;
    features["qty_plus_directory"] = (directory.match(/\+/g) || []).length;
    features["qty_asterisk_directory"] = (directory.match(/\*/g) || []).length;
    features["qty_hashtag_directory"] = (directory.match(/#/g) || []).length;
    features["qty_dollar_directory"] = (directory.match(/\$/g) || []).length;
    features["qty_percent_directory"] = (directory.match(/%/g) || []).length;
    features["directory_length"] = directory.length;

    // File-related features
    let filePart = parsedUrl.pathname.split("/").pop();
    features["qty_dot_file"] = (filePart.match(/\./g) || []).length;
    features["qty_hyphen_file"] = (filePart.match(/-/g) || []).length;
    features["qty_underline_file"] = (filePart.match(/_/g) || []).length;
    features["qty_slash_file"] = (filePart.match(/\//g) || []).length;
    features["qty_questionmark_file"] = (filePart.match(/\?/g) || []).length;
    features["qty_equal_file"] = (filePart.match(/=/g) || []).length;
    features["qty_at_file"] = (filePart.match(/@/g) || []).length;
    features["qty_and_file"] = (filePart.match(/&/g) || []).length;
    features["qty_exclamation_file"] = (filePart.match(/!/g) || []).length;
    features["qty_space_file"] = (filePart.match(/ /g) || []).length;
    features["qty_tilde_file"] = (filePart.match(/~/g) || []).length;
    features["qty_comma_file"] = (filePart.match(/,/g) || []).length;
    features["qty_plus_file"] = (filePart.match(/\+/g) || []).length;
    features["qty_asterisk_file"] = (filePart.match(/\*/g) || []).length;
    features["qty_hashtag_file"] = (filePart.match(/#/g) || []).length;
    features["qty_dollar_file"] = (filePart.match(/\$/g) || []).length;
    features["qty_percent_file"] = (filePart.match(/%/g) || []).length;
    features["file_length"] = filePart.length;

    // Query-related features
    let params = parsedUrl.search;
    features["qty_dot_params"] = (params.match(/\./g) || []).length;
    features["qty_hyphen_params"] = (params.match(/-/g) || []).length;
    features["qty_underline_params"] = (params.match(/_/g) || []).length;
    features["qty_slash_params"] = (params.match(/\//g) || []).length;
    features["qty_questionmark_params"] = (params.match(/\?/g) || []).length;
    features["qty_equal_params"] = (params.match(/=/g) || []).length;
    features["qty_at_params"] = (params.match(/@/g) || []).length;
    features["qty_and_params"] = (params.match(/&/g) || []).length;
    features["qty_exclamation_params"] = (params.match(/!/g) || []).length;
    features["qty_space_params"] = (params.match(/ /g) || []).length;
    features["qty_tilde_params"] = (params.match(/~/g) || []).length;
    features["qty_comma_params"] = (params.match(/,/g) || []).length;
    features["qty_plus_params"] = (params.match(/\+/g) || []).length;
    features["qty_asterisk_params"] = (params.match(/\*/g) || []).length;
    features["qty_hashtag_params"] = (params.match(/#/g) || []).length;
    features["qty_dollar_params"] = (params.match(/\$/g) || []).length;
    features["qty_percent_params"] = (params.match(/%/g) || []).length;
    features["params_length"] = params.length;

    const tlds = ["com", "net", "org", "edu", "gov", "io", "co", "tv"];
    features["tld_present_params"] = tlds.some(tld => params.includes(tld)) ? 1 : 0;
    features["qty_params"] = params ? params.split("&").length : 0;
    features["email_in_url"] = url.includes('@') ? 1 : 0;
    let shortenedDomains = ["bit.ly", "goo.gl", "t.co", "tinyurl.com"];
    features["url_shortened"] = shortenedDomains.some(domain => url.includes(domain)) ? 1 : 0;

    return tf.tensor(Object.values(features)).reshape([1, Object.keys(features).length]);
}

// shortened url extraction 
async function getExpandedUrl(shortUrl) {
    try {
      // Send a HEAD request to the shortened URL
      const response = await fetch(shortUrl, {
        method: 'HEAD', // Use HEAD method to only retrieve headers
        redirect: 'follow', // Follow any redirects
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://www.google.com/',
          }
      });
  
      // The final URL after following redirects
      return response.url;
    } catch (error) {
      console.error("Error fetching URL:", error);
      return null;
    }
  }