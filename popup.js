// DOM Elements
const btnSignIn = document.getElementById("btn-signin")
const btnSignOut = document.getElementById("btn-signout")
const statusDiv = document.getElementById("status")
const msgList = document.getElementById("message-list")
const btnGmailScanner = document.getElementById("btn-gmail-scanner")
const btnScannerReport = document.getElementById("btn-scanner-report")
const gmailScannerSection = document.getElementById("gmail-scanner")
const scannerReportSection = document.getElementById("scanner-report")
const userStatus = document.getElementById("user-status")
const emptyState = document.getElementById("empty-state")
const scanCount = document.getElementById("scan-count")
const lastScan = document.getElementById("last-scan")
const btnOnTimeScanner = document.getElementById("btn-on-time-scanner")
const btnDeepScanner = document.getElementById("btn-deep-scanner")

// Tab Navigation
function setActiveTab(activeTab) {
  // Reset all tabs
  ;[btnGmailScanner, btnScannerReport].forEach((btn) => {
    btn.classList.remove("active")
  })

  // Set active tab
  activeTab.classList.add("active")
}

btnGmailScanner.addEventListener("click", () => {
  setActiveTab(btnGmailScanner)
  gmailScannerSection.style.display = "flex"
  scannerReportSection.style.display = "none"
})

btnScannerReport.addEventListener("click", () => {
  setActiveTab(btnScannerReport)
  gmailScannerSection.style.display = "none"
  scannerReportSection.style.display = "flex"

  // Fetch and display report
  fetchScannerReport()
})

// Report Tab Navigation
function setActiveReportTab(activeTab) {
  ;[btnOnTimeScanner, btnDeepScanner].forEach((btn) => {
    btn.classList.remove("active")
  })
  activeTab.classList.add("active")
}

btnOnTimeScanner.addEventListener("click", () => {
  setActiveReportTab(btnOnTimeScanner)
  // Fetch on-time scanner report
  fetchScannerReport("ontime")
})

btnDeepScanner.addEventListener("click", () => {
  setActiveReportTab(btnDeepScanner)
  // Fetch deep scanner report
  fetchDeepReport("ontime")
})

// Sign-In Logic
btnSignIn.addEventListener("click", () => {
  showLoading("Signing in...")
  chrome.runtime.sendMessage({ message: "sign in" }, (resp) => {
    if (resp.success) {
      hideLoading("Signed in successfully")
      toggleAuthButtons(true)
      userStatus.textContent = resp.email || "Signed in"
      listEmails()
      updateScanStats(resp.scanCount, resp.lastScan)
    } else {
      hideLoading("Sign-in failed")
    }
  })
})

// Sign-Out Logic
btnSignOut.addEventListener("click", () => {
  showLoading("Signing out...")
  chrome.runtime.sendMessage({ message: "sign out" }, (resp) => {
    if (resp.success) {
      hideLoading("Signed out")
      toggleAuthButtons(false)
      userStatus.textContent = ""
      msgList.innerHTML = ""
      emptyState.style.display = "flex"
      updateScanStats(0, "Never")
    } else {
      hideLoading("Sign-out failed")
    }
  })
})

// Toggle Visibility of Sign-In / Sign-Out Buttons
function toggleAuthButtons(signedIn) {
  btnSignIn.hidden = signedIn
  btnSignOut.hidden = !signedIn
  emptyState.style.display = signedIn ? "none" : "flex"
}

// Show loading state
function showLoading(message) {
  statusDiv.innerHTML = `<div class="loading"></div> ${message}`
}

// Hide loading state
function hideLoading(message = "") {
  statusDiv.textContent = message

  // Clear status message after 3 seconds
  if (message) {
    setTimeout(() => {
      statusDiv.textContent = ""
    }, 3000)
  }
}

// Update scan statistics
function updateScanStats(count, time) {
  scanCount.textContent = `${count} messages scanned`
  lastScan.textContent = `Last scan: ${time}`
}

// List Emails Logic
function listEmails() {
  showLoading("Loading messages...")

  // Hide persistent notification when loading new emails
  const persistentNotification = document.getElementById("persistent-notification")
  persistentNotification.style.display = "none"

  chrome.runtime.sendMessage({ message: "list" }, (resp) => {
    if (chrome.runtime.lastError) {
      hideLoading("Error: " + chrome.runtime.lastError.message)
      return
    }
    if (!resp.success) {
      hideLoading("Failed to load messages")
      return
    }

    hideLoading()
    msgList.innerHTML = "" // Clear old list

    if (resp.messages.length === 0) {
      msgList.innerHTML = `
        <div class="empty-message">
          <p>No messages found</p>
        </div>
      `
      return
    }

    resp.messages.forEach((m) => {
      const li = document.createElement("li")
      li.className = "message-item fade-in"

      // Message header with sender and date
      const header = document.createElement("div")
      header.className = "message-header"

      const from = document.createElement("div")
      from.className = "message-from"
      from.textContent = m.from

      const date = document.createElement("div")
      date.className = "message-date"
      date.textContent = m.date

      header.appendChild(from)
      header.appendChild(date)
      li.appendChild(header)

      // Message snippet
      const snippet = document.createElement("div")
      snippet.className = "message-snippet"
      snippet.textContent = m.snippet
      li.appendChild(snippet)

      // Links
      if (m.links && m.links.length) {
        const linksContainer = document.createElement("div")
        linksContainer.className = "message-links"

        const linksTitle = document.createElement("div")
        linksTitle.className = "message-section-title"
        linksTitle.textContent = "Links:"
        linksContainer.appendChild(linksTitle)

        m.links.forEach((url) => {
          const a = document.createElement("a")
          a.href = url
          a.textContent = url
          a.className = "link-item"
          a.target = "_blank"
          linksContainer.appendChild(a)
        })

        li.appendChild(linksContainer)
      }

      // Attachments
      if (m.attachments && m.attachments.length) {
        const attachmentsContainer = document.createElement("div")
        attachmentsContainer.className = "message-attachments"

        const attachmentsTitle = document.createElement("div")
        attachmentsTitle.className = "message-section-title"
        attachmentsTitle.textContent = "Attachments:"
        attachmentsContainer.appendChild(attachmentsTitle)

        m.attachments.forEach((att) => {
          const btn = document.createElement("button")
          btn.className = "attachment-btn"

          // Add file icon
          const icon = document.createElement("span")
          icon.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          `

          const fileName = document.createElement("span")
          fileName.textContent = att.filename

          btn.appendChild(icon)
          btn.appendChild(fileName)

          btn.addEventListener("click", () => {
            showLoading(`Getting ${att.filename}...`)
            chrome.runtime.sendMessage(
              {
                message: "getAttachment",
                payload: {
                  messageId: m.id,
                  attachmentId: att.attachmentId,
                  filename: att.filename,
                },
              },
              (resp2) => {
                if (!resp2.success) {
                  hideLoading(`Failed to scan ${att.filename}`)
                  return
                }

                hideLoading(`Scanning ${att.filename}...`)
                scanAttachment(resp2.filename, resp2.data)
              },
            )
          })

          attachmentsContainer.appendChild(btn)
        })

        li.appendChild(attachmentsContainer)
      }

      msgList.appendChild(li)
    })
  })
}

// Fetch Scanner Report
function fetchScannerReport(type = "ontime") {
  showLoading("Loading report...")

  chrome.runtime.sendMessage(
    {
      message: "getStoredReport",
      reportType: type,
    },
    (response) => {
      hideLoading()

      if (chrome.runtime.lastError) {
        console.error("Error fetching report:", chrome.runtime.lastError.message)
        return
      }

      if (!response || !response.Url) {
        const reportDiv = document.getElementById("scan-report-details")
        reportDiv.innerHTML = `
        <div class="report-empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <p>No scan reports available yet</p>
        </div>
      `
        return
      }

      const {
        Url,
        PhishingRiskScore,
        ScoreReasons,
        URLDescription,
        ContentAnalysis,
        NetworkActivity,
        SuspiciousRedirections,
        BehavioralIndicators,
        ActionableSecurityInsights,
      } = response

      // Determine risk level class
      let riskClass = "risk-low"
      if (PhishingRiskScore > 70) {
        riskClass = "risk-high"
      } else if (PhishingRiskScore > 30) {
        riskClass = "risk-medium"
      }

      const reportDiv = document.getElementById("scan-report-details")
      reportDiv.innerHTML = `
      <div class="report-card fade-in">
        <h3>Website Security Report</h3>
        <p><strong>URL:</strong> <a href="${Url}" target="_blank" class="link-item">${Url}</a></p>
        <p>
          <strong>Phishing Risk Score:</strong> 
          <span class="risk-score ${riskClass}">${PhishingRiskScore}%</span>
        </p>

        <h4>Score Reasons</h4>
        <p>${ScoreReasons}</p>

        <h4>URL Description</h4>
        <p>${URLDescription}</p>
      </div>

      <div class="report-card fade-in">
        <h4>Content Analysis</h4>
        <p>${ContentAnalysis}</p>

        <h4>Network Activity</h4>
        <p>${NetworkActivity}</p>

        <h4>Suspicious Redirections</h4>
        <p>${SuspiciousRedirections}</p>
      </div>

      <div class="report-card fade-in">
        <h4>Behavioral Indicators</h4>
        <p>${BehavioralIndicators}</p>

        <h4>Actionable Security Insights</h4>
        <p>${ActionableSecurityInsights}</p>
      </div>
    `
    },
  )
}

// Fetch Deep Report
function fetchDeepReport(type = "ontime") {
  showLoading("Loading report...")

  chrome.runtime.sendMessage(
    {
      message: "getDeepReport",
      reportType: type,
    },
    (response) => {
      hideLoading()

      if (chrome.runtime.lastError) {
        console.error("Error fetching report:", chrome.runtime.lastError.message)
        return
      }

      if (!response || !response.Url) {
        const reportDiv = document.getElementById("scan-report-details")
        reportDiv.innerHTML = `
        <div class="report-empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <p>No scan reports available yet</p>
        </div>
      `
        return
      }

      const {
        Url,
        PhishingRiskScore,
        ScoreReasons,
        URLDescription,
        ContentAnalysis,
        NetworkActivity,
        SuspiciousRedirections,
        BehavioralIndicators,
        ActionableSecurityInsights,
      } = response

      // Determine risk level class
      let riskClass = "risk-low"
      if (PhishingRiskScore > 70) {
        riskClass = "risk-high"
      } else if (PhishingRiskScore > 30) {
        riskClass = "risk-medium"
      }

      const reportDiv = document.getElementById("scan-report-details")
      reportDiv.innerHTML = `
      <div class="report-card fade-in">
        <h3>Website Security Report</h3>
        <p><strong>URL:</strong> <a href="${Url}" target="_blank" class="link-item">${Url}</a></p>
        <p>
          <strong>Phishing Risk Score:</strong> 
          <span class="risk-score ${riskClass}">${PhishingRiskScore}%</span>
        </p>

        <h4>Score Reasons</h4>
        <p>${ScoreReasons}</p>

        <h4>URL Description</h4>
        <p>${URLDescription}</p>
      </div>

      <div class="report-card fade-in">
        <h4>Content Analysis</h4>
        <p>${ContentAnalysis}</p>

        <h4>Network Activity</h4>
        <p>${NetworkActivity}</p>

        <h4>Suspicious Redirections</h4>
        <p>${SuspiciousRedirections}</p>
      </div>

      <div class="report-card fade-in">
        <h4>Behavioral Indicators</h4>
        <p>${BehavioralIndicators}</p>

        <h4>Actionable Security Insights</h4>
        <p>${ActionableSecurityInsights}</p>
      </div>
    `
    },
  )
}

// Simulate a scanner (example only)
function scanAttachment(filename, data) {
  // Clear any existing notification when starting a new scan
  showLoading(`Scanning ${filename}...`)

  // Hide the persistent notification area while scanning
  const persistentNotification = document.getElementById("persistent-notification")
  persistentNotification.style.display = "none"

  chrome.runtime.sendMessage(
    {
      message: "scanAttachment",
      payload: { filename, data },
    },
    (resp) => {
      hideLoading()

      if (!resp.success) {
        // Show error in persistent notification
        showPersistentNotification(`Scan error: ${resp.error}`, "danger")
        return
      }

      // Create a persistent notification for scan results
      const isMalicious = resp.malicious
      const message = isMalicious ? `${filename} is MALICIOUS!` : `${filename} appears clean.`
      const type = isMalicious ? "danger" : "success"

      showPersistentNotification(message, type)

      // Update scan stats
      updateScanStats(Number.parseInt(scanCount.textContent) + 1, new Date().toLocaleString())
    },
  )
}

// Function to show persistent notification
function showPersistentNotification(message, type) {
  const persistentNotification = document.getElementById("persistent-notification")
  persistentNotification.className = `persistent-notification alert-${type}`

  // Add appropriate icon based on type
  const iconSvg =
    type === "danger"
      ? `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`
      : `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`

  // Add a close button to the notification
  const closeButton = `<button class="close-notification" aria-label="Close notification">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>`

  persistentNotification.innerHTML = iconSvg + message + closeButton
  persistentNotification.style.display = "flex"

  // Add event listener to close button
  const closeBtn = persistentNotification.querySelector(".close-notification")
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      persistentNotification.style.display = "none"
    })
  }
}

// Initialize the extension
function initialize() {
  // Hide persistent notification on startup
  const persistentNotification = document.getElementById("persistent-notification")
  persistentNotification.style.display = "none"

  // Check if user is already signed in
  try {
    chrome.runtime.sendMessage({ message: "checkAuthStatus" }, (resp) => {
      if (resp && resp.signedIn) {
        toggleAuthButtons(true)
        userStatus.textContent = resp.email || "Signed in"
        listEmails()
        updateScanStats(resp.scanCount || 0, resp.lastScan || "Today")
      } else {
        toggleAuthButtons(false)
        emptyState.style.display = "flex"
      }
    })
  } catch (error) {
    console.error("Chrome runtime error:", error)
    // Handle the error appropriately, e.g., display a message to the user.
    userStatus.textContent = "Error: Unable to communicate with background script."
  }
}

// Run initialization when popup opens
document.addEventListener("DOMContentLoaded", initialize)
