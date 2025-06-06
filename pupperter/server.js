import express from "express";
import {exec} from 'child_process';

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// POST endpoint to trigger the Docker container with the URL
app.post('/run-sandbox', (req, res) => {
  const { urlToAnalyze } = req.body;

  const client_ip = req.ip;
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Source ip : ${client_ip} Post url : ${urlToAnalyze}`);

  if (!urlToAnalyze) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Run the Docker container, passing the URL as an environment variable
  exec(`docker run -e URL="${urlToAnalyze}" --rm puppeteer-container `, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: 'Error executing Docker container' });
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }

    
    // Send back the output from the Docker container
    const parsedOutput = JSON.parse(stdout);
    res.status(200).json({ message: 'Docker run successfully', data: parsedOutput });
  });
}
);


// Start the Express server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});