import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { gmailAppPasswordService } from "./services/gmail-app-password";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for access code protection
app.use(session({
  secret: process.env.SESSION_SECRET || 'shady-5-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Access code protection middleware
const ACCESS_CODE = process.env.ACCESS_CODE || 'tyuiop[0';

function requireAccessCode(req: Request, res: Response, next: NextFunction) {
  // Allow access to login routes
  if (req.path === '/login' || req.path === '/logout') {
    return next();
  }

  // Allow OAuth callback routes (these need to work for authentication flow)
  if (req.path === '/api/auth/google/callback' || req.path === '/api/auth/google' || req.path === '/api/auth/outlook/callback') {
    return next();
  }

  // Allow service account setup without access code (for initial configuration)
  if (req.path === '/api/auth/google/service-account' || req.path === '/api/auth/service-account/status') {
    return next();
  }

  // Check if user has valid access code in session
  const session = req.session as any;
  if (session.accessCodeValid) {
    return next();
  }

  // For API routes, return JSON error
  if (req.path.startsWith('/api')) {
    return res.status(401).json({ error: 'Access code required' });
  }

  // For all other routes, redirect to login
  return res.redirect('/login');
}

// Login routes
app.get('/login', (req, res) => {
  const loginHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Calendar Automation - Access Required</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0; padding: 0; height: 100vh;
          display: flex; align-items: center; justify-content: center;
        }
        .container { 
          background: white; padding: 2rem; border-radius: 8px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; width: 90%;
        }
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo h1 { color: #333; margin: 0; font-size: 2rem; font-weight: 600; }
        .logo p { color: #666; margin: 0.5rem 0 0 0; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; color: #333; font-weight: 500; }
        input[type="password"] { 
          width: 100%; padding: 0.75rem; border: 2px solid #e1e5e9; 
          border-radius: 4px; font-size: 1rem; box-sizing: border-box;
        }
        input[type="password"]:focus { 
          outline: none; border-color: #667eea; 
        }
        button { 
          width: 100%; padding: 0.75rem; background: #667eea; color: white; 
          border: none; border-radius: 4px; font-size: 1rem; cursor: pointer;
          font-weight: 500;
        }
        button:hover { background: #5a6fd8; }
        .error { color: #e74c3c; margin-top: 0.5rem; font-size: 0.9rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>Calendar Automation</h1>
          <p>Secure Access Required</p>
        </div>
        <form method="POST" action="/login">
          <div class="form-group">
            <label for="accessCode">Enter Access Code:</label>
            <input type="password" id="accessCode" name="accessCode" required autofocus>
          </div>
          <button type="submit">Access Dashboard</button>
          ${req.query.error ? '<div class="error">Invalid access code</div>' : ''}
        </form>
      </div>
    </body>
    </html>
  `;
  res.send(loginHtml);
});

app.post('/login', (req, res) => {
  const { accessCode } = req.body;
  
  console.log("Login attempt with access code:", accessCode);
  console.log("Expected access code:", ACCESS_CODE);
  
  if (accessCode === ACCESS_CODE) {
    const session = req.session as any;
    session.accessCodeValid = true;
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/login');
  });
});

// Apply access code protection to all routes except login/logout
app.use(requireAccessCode);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Gmail app password service to load existing accounts
  await gmailAppPasswordService.initialize();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
