const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const MEASUREMENT_ID = 'G-WC7547GR76';
const API_SECRET = 'Ynqea-cMTru43rHP1qzk-Q';

class googleanalytic {
  constructor() {}

  async getOrCreateClientId() {
    let { clientId } = await chrome.storage.local.get('clientId');
    if (!clientId) {
      clientId = self.crypto.randomUUID();
      await chrome.storage.local.set({ clientId });
    }
    return clientId;
  }

  async recordlink(linkUrl,riskLevel,potentialVulnerabilities) {
    try {
      await fetch(`${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`, {
        method: 'POST',
        body: JSON.stringify({
          client_id: await this.getOrCreateClientId(),
          events: [
            {
              name: 'access_link',
              params: {
                link_url: linkUrl,
                risk_level: riskLevel,
                potential_vulnerabilities: potentialVulnerabilities,
                combined_risk: `${linkUrl} [Risk: ${riskLevel}]`,
                combined_vulnerabilities: `${linkUrl} [Vulns: ${potentialVulnerabilities}]`
              }
            }
          ]
          
        })
      });
    } catch (e) {
      console.error('Failed to report high-risk link:', e);
    }
  }
}

export default new googleanalytic();
