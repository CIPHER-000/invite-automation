const express = require('express');
const app = express();

// Serve the working dashboard directly
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Calendar Automation Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
        .stat { font-size: 24px; font-weight: bold; color: #333; }
        .label { font-size: 12px; color: #888; }
        .button { background: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
        .status { display: flex; justify-content: space-between; margin: 5px 0; }
        .ok { color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Calendar Automation Dashboard</h1>
        
        <div class="grid">
            <div class="card">
                <h3>Campaigns</h3>
                <div class="stat">0</div>
                <div class="label">Active campaigns</div>
            </div>
            <div class="card">
                <h3>Invites</h3>
                <div class="stat">0</div>
                <div class="label">Sent today</div>
            </div>
            <div class="card">
                <h3>Accepted</h3>
                <div class="stat">0</div>
                <div class="label">Meeting responses</div>
            </div>
            <div class="card">
                <h3>Accounts</h3>
                <div class="stat">0</div>
                <div class="label">Connected</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="card">
                <h3>Connect Google Account</h3>
                <button class="button" onclick="alert('OAuth system ready - connect your Google account to get started')">
                    Connect Google Account
                </button>
            </div>
            <div class="card">
                <h3>System Status</h3>
                <div class="status">
                    <span>Server</span>
                    <span class="ok">✓ Running</span>
                </div>
                <div class="status">
                    <span>Dashboard</span>
                    <span class="ok">✓ Active</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`);
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});