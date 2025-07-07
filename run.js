// Simple development server entry point
const { spawn } = require('child_process');

console.log('🚀 Starting Calendar Automation System...');

const server = spawn('node', ['start-dev.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || 5000 }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🛑 Server process exited with code ${code}`);
  process.exit(code);
});