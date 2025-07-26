class HttpNotifier {
    constructor(nodeRedAdminUrl = "http://localhost:1880") {
        this.nodeRedAdminUrl = nodeRedAdminUrl;
    }

    async triggerReload() {
        const url = `${this.nodeRedAdminUrl}/flows`;
        const headers = {
            'Content-type': 'application/json',
            'Node-RED-Deployment-Type': 'reload'
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({})
            });

            if (!response.ok) {
                console.error(`[mongo-storage] Error triggering flow reload: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`[mongo-storage] Error making POST request to /flows: ${error.message}`);
        }
    }
}

module.exports = HttpNotifier;
