const axios = require('axios');

async function test() {
    const baseUrl = (process.env.BACKEND_URL || 'http://localhost:5000') + '/api/upcoming-events';

    try {
        // 1. Get initial events
        console.log("Fetching events...");
        let res = await axios.get(baseUrl);
        console.log("Initial events:", res.data);

        // 2. Add event
        console.log("Adding event...");
        const newEvent = { text: "Test Event", date: "2023-12-01T10:00" };
        res = await axios.post(baseUrl, newEvent);
        console.log("Add response:", res.data);
        const addedId = res.data.event.id;

        // 3. Get events again
        console.log("Fetching events after add...");
        res = await axios.get(baseUrl);
        console.log("Events after add:", res.data);

        // 4. Delete event
        console.log(`Deleting event ${addedId}...`);
        res = await axios.delete(`${baseUrl}/${addedId}`);
        console.log("Delete response:", res.data);

        // 5. Get events final
        console.log("Fetching events after delete...");
        res = await axios.get(baseUrl);
        console.log("Events after delete:", res.data);

    } catch (e) {
        console.error("Test failed:", e.message);
        if (e.response) console.error("Response data:", e.response.data);
    }
}

test();
