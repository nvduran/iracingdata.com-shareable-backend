const fetch = require("node-fetch");

async function fetchMemberCareerStats() {
        const minNumber = 100000;
        const maxNumber = 650000;
        const endpoint = "http://localhost:3100/api/member-career-stats/career/";

        try {
                const randomNumber = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
                const response = await fetch(endpoint + randomNumber.toString());

                if (response.status === 202) {
                        const message = await response.json();
                        console.log(message);
                } else {
                        const data = await response.json();

                        console.log(`Data fetched for random number: ${randomNumber}`);
                        console.log(data.display_name);
                        console.log(data.cust_id);
                }

                // Repeat the fetch process
                setTimeout(fetchMemberCareerStats, 1000);
        } catch (error) {
                console.error("An error occurred while fetching data:", error);
        }
}

// Start fetching data
fetchMemberCareerStats();
