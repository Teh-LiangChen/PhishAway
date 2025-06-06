# Prototype Documentation: PhishScan - A Phishing Detection Browser Extension

---

## 1. Introduction
### 1.1. Purpose
The primary purpose of this prototype is to develop a browser extension that can detect phishing links in real-time. It aims to enhance user security while browsing and prevent them from falling victim to phishing attacks, which can lead to compromised personal information.

### 1.2. Scope
This prototype provides real-time phishing link detection using an AI model trained on phishing datasets. It uses Google Gemini for page analysis and includes a visual color indicator for alerts. The extension is designed to be lightweight, ensuring minimal impact on the user's browsing experience.

### 1.3. Technologies Used
- **Google Chrome API**: To collect webpage data and extract links.
- **Google Gemini**: For real-time page analysis.
- **TensorFlow**: For machine learning model training.
- **JavaScript (ES6)**: For building the browser extension.
- **HTML/CSS**: For the user interface.
- **Google Analytics**: For tracking usage data.
- **Google Colab**: For model training using TensorFlow.

---

## 2. Problem Statement
### 2.1. Background
Phishing attacks are a growing threat, with millions of people being targeted by malicious links every year. These attacks can result in data breaches, financial losses, and identity theft. Despite the availability of antivirus software, phishing remains one of the most effective cyberattack vectors due to its human factor reliance.

### 2.2. Objectives
The objective of this prototype is to provide users with a real-time, AI-powered solution that can automatically detect phishing links as they browse, alert them visually, and protect them from potential harm.

---

## 3. Solution Overview
### 3.1. Description of the Solution
This solution provides a browser extension that scans links in real time to detect phishing attempts. It uses an AI model to analyze web pages and determine if the links are phishing attempts. The extension displays a visual indicator on the browser to alert users when a potential phishing link is detected. It also integrates Gemini to scan the page and output a security risk score.

### 3.2. Key Features
- **Real-Time Link Scanning**: Detects phishing links instantly as users browse.
- **Visual Color Indicator**: Alerts users with a red or green indicator based on the risk of the link.
- **AI Model Trained on Phishing Datasets**: Uses machine learning to classify links as phishing or safe.
- **Gemini for Page Analysis**: Enhances the detection process by analyzing the webpage content in real-time.
- **Lightweight Browser Extension**: Ensures minimal resource usage, maintaining smooth browsing experience.

### 3.3. Benefits
- **Increased Security**: Protects users from falling victim to phishing attacks.
- **Easy to Use**: A simple, lightweight browser extension that requires minimal user interaction.
- **AI-Powered**: Continuous improvement in detection accuracy via AI model training.

---

## 4. Architecture and Design
### 4.1. High-Level Architecture
The architecture includes a **browser extension** acting as the frontend, which interacts with the local **AI model** and leverages **Google Gemini** for content analysis. Google Analytics is used for tracking user behavior and extension usage.

### 4.2. System Components
- **Browser Extension (Frontend)**: Collects webpage data and links, triggers the AI model for scanning.
- **AI Model (TensorFlow)**: Analyzes links based on trained phishing datasets.
- **Google Gemini**: Analyzes page content and outputs a security risk score and potential vulnerabilities.
- **Google Analytics**: Tracks usage data for performance and improvements.

### 4.3. Flow and User Journey
1. The user installs the extension in their browser.
2. As they browse, the extension continuously scans links on the page.
3. The AI model analyzes the links and determines if they are phishing attempts.
4. A visual indicator (red/yellow/green) is displayed on the detected link.
5. If the link is red or yellow in colour, the user is alerted, and they are warned about the potential threat.

---

## 5. Technical Details
### 5.1. Code Structure
- **manifest.json**: Extension configuration file.
- **background.js**: Handles event listeners and link scanning.
- **popup.js**: Manages the UI and displays alerts.
- **model.js**: Interface for TensorFlow.js model (conversion from TensorFlow).
- **googleanalytics.js**: Integrates Google Analytics API to tracks usage data for performance and improvements.

### 5.2. Data Flow
1. **Webpage Data Collection**: The browser extension uses the Chrome API to gather data from the page.
2. **AI Model Analysis**: Data is passed to the trained TensorFlow model for phishing detection.
3. **Page Analysis (Gemini)**: Gemini API analyzes the content and provides a risk score.
4. **Display Alerts**: Based on the results, the extension updates the UI with an alert indicator.

### 5.3. External Dependencies
- **TensorFlow**: Machine learning framework for model training.
- **Google Gemini API**: For real-time page content analysis.
- **Google Analytics**: For tracking user interactions with the extension.

---

## 6. Prototype Usage
### 6.1. Installation Instructions
1. Git clone the extension.
2. Replace the GEMINI_API_KEY in background.js,MEASUREMENT_ID and API_SECRET in googleanalytic.js.
3. Navigate to chrome://extensions/, enable developer mode, and then click "Load unpacked" to select the extension's folder. 
2. Ensure the extension is enabled in your browser settings.

### 6.2. Usage Instructions
1. After installation, the extension will automatically start scanning webpages for phishing links.
2. When a potential phishing link is detected, the link will appear red.
3. Result of Gemini webpage analysis will pop up in notifications form.

---

## 7. Testing and Results
### 7.1. Testing Methodology
- **Manual Testing**: Tested with various phishing and legitimate links to ensure accuracy.

### 7.2. Results
- **Accuracy**: Achieved an accuracy of 91.79% in training dataset.
- **Performance**: The extension file size is under 10MB, ensuring fast installation and minimal resource consumption.

---

## 8. Known Issues and Limitations
- **False Positives**: The model occasionally flags legitimate links as phishing.
- **Limited Database**: The model's effectiveness depends on the data used for training, and may need further improvement with more diverse datasets.

---

## 9. Future Work
- **Phishing Database Integration**: Add a connection to a global phishing database for real-time updates.
- **Customizable Alerts**: Allow users to modify alert settings for different types of risks.
- **Detailed Detection Reports**: Generate detailed reports to explain why a link is flagged as phishing.

---

## 10. Conclusion
The phishing detection browser extension is an effective solution for preventing phishing attacks. Through the use of AI and real-time analysis with Google Gemini, the extension provides users with immediate alerts, protecting their online safety.

---

## Appendices
### A. References
- **Google Gemini**: https://cloud.google.com/gemini
- **Google Analytics**: https://analytics.google.com/
- **Chrome API reference**:https://developer.chrome.com/docs/extensions/reference/api
- **TensorFlow**: https://www.tensorflow.org/

---