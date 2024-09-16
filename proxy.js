const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3009;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    console.log('Received request:', req.body); // Log the incoming request
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.1', // Ensure this is the correct model name
                prompt: req.body.prompt
                //stream: false
            }),
        });

        // Check if the response is OK
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response from Llama 3.1:', errorText);
            return res.status(response.status).json({ error: 'Error from Llama 3.1', details: errorText });
        }

        // Read the response as text
        const reader = response.body.getReader();
        let result = '';
        let done = false;

        // Read the stream
        while (!done) {
            const { done: streamDone, value } = await reader.read();
            done = streamDone;
            // Convert Uint8Array to string
            result += new TextDecoder("utf-8").decode(value);
        }

        // Split the result into individual JSON objects
        const responses = result.trim().split('\n').map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                return null; // Return null for invalid JSON
            }
        }).filter(Boolean); // Filter out null values

        console.log('Parsed responses from Llama 3.1:', responses); // Log the parsed responses
        res.json(responses); // Send the array of responses back to the client
    } catch (error) {
        console.error('Error communicating with Llama 3.1:', error); // Log any errors
        res.status(500).json({ error: 'Error communicating with Llama 3.1' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});