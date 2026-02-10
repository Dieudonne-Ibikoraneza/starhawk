import express from 'express';
const router = express.Router();

const API_KEY = "apk.bdae00480670eca2619075475aad287b0683f9288af574b219eb3c9e203a4664";
const API_BASE_URL = "https://api-connect.eos.com/api/gdw/api";

// Create statistics task
router.post('/task', async (req, res) => {
  try {
    const response = await fetch(`${API_BASE_URL}?api_key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `API Error: ${response.statusText}`,
        details: errorText 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Satellite API Error:', error);
    res.status(500).json({ 
      error: 'Failed to create task', 
      message: error.message 
    });
  }
});

// Get task status
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await fetch(`${API_BASE_URL}/${taskId}?api_key=${API_KEY}`);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `API Error: ${response.statusText}`,
        details: errorText 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Satellite API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch task status', 
      message: error.message 
    });
  }
});

// Weather Forecast API
router.post('/weather', async (req, res) => {
  try {
    const response = await fetch(`https://api-connect.eos.com/api/forecast/weather/forecast/?api_key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `Weather API Error: ${response.statusText}`,
        details: errorText 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Weather API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather forecast', 
      message: error.message 
    });
  }
});

export default router;
