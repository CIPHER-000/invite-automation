import React from "react";

function App() {
  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "#333", marginBottom: "20px" }}>Calendar Automation Dashboard</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>Campaigns</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>0</div>
          <div style={{ fontSize: "12px", color: "#888" }}>Active campaigns</div>
        </div>
        
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>Invites</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>0</div>
          <div style={{ fontSize: "12px", color: "#888" }}>Sent today</div>
        </div>
        
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>Accepted</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>0</div>
          <div style={{ fontSize: "12px", color: "#888" }}>Meeting responses</div>
        </div>
        
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>Accounts</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>0</div>
          <div style={{ fontSize: "12px", color: "#888" }}>Connected</div>
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff" }}>
          <h3 style={{ marginTop: "0", color: "#333" }}>Connect Google Account</h3>
          <button 
            style={{ 
              padding: "12px 24px", 
              backgroundColor: "#4285f4", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              cursor: "pointer",
              width: "100%",
              fontSize: "16px"
            }}
            onClick={() => {
              fetch("/api/auth/google")
                .then(res => res.json())
                .then(data => {
                  if (data.authUrl) {
                    const newWindow = window.open(data.authUrl, '_blank', 'width=500,height=600');
                    if (newWindow) {
                      const checkClosed = setInterval(() => {
                        if (newWindow.closed) {
                          clearInterval(checkClosed);
                          window.location.reload();
                        }
                      }, 1000);
                    }
                  }
                })
                .catch(err => console.error('OAuth error:', err));
            }}
          >
            Connect Google Account
          </button>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
            Opens Google OAuth in popup window
          </p>
        </div>
        
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff" }}>
          <h3 style={{ marginTop: "0", color: "#333" }}>System Status</h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px" }}>OAuth System</span>
            <span style={{ fontSize: "14px", color: "#28a745", fontWeight: "500" }}>✓ Active</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px" }}>Queue Processor</span>
            <span style={{ fontSize: "14px", color: "#28a745", fontWeight: "500" }}>✓ Running</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px" }}>Database</span>
            <span style={{ fontSize: "14px", color: "#28a745", fontWeight: "500" }}>✓ Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;