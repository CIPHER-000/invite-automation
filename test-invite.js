import { storage } from "./server/storage.js";
import { googleCalendarService } from "./server/services/google-calendar.js";

async function sendTestInvite() {
  try {
    console.log("Starting test invite process...");
    
    // Get the first available Google account
    const accounts = await storage.getGoogleAccounts();
    if (accounts.length === 0) {
      throw new Error("No Google accounts available");
    }
    
    const account = accounts[0];
    console.log("Using account:", account.email);
    
    // Create test invite event details
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes later
    
    const eventDetails = {
      title: "Test Meeting - Shaw",
      description: "Hi Shaw,\n\nI would like to schedule a quick 30-minute meeting to discuss potential opportunities.\n\nBest regards,\nShady 5.0 Team",
      attendeeEmail: "shaw@getmemeetings.com",
      startTime,
      endTime,
      timeZone: "America/New_York"
    };
    
    console.log("Creating calendar event...");
    
    // Create the calendar event
    const eventId = await googleCalendarService.createEvent(account, eventDetails);
    
    console.log("Calendar event created successfully!");
    console.log("Event ID:", eventId);
    
    // Create an invite record in the database
    const invite = await storage.createInvite({
      campaignId: null, // No campaign for this test
      prospectEmail: "shaw@getmemeetings.com",
      prospectName: "Shaw",
      eventId,
      googleAccountId: account.id,
      status: "sent",
      sentAt: new Date(),
      mergeData: { name: "Shaw", email: "shaw@getmemeetings.com" }
    });
    
    console.log("Invite record created:", invite.id);
    
    // Log the activity
    await storage.createActivityLog({
      type: "invite_sent",
      inviteId: invite.id,
      googleAccountId: account.id,
      message: `Test invite sent to shaw@getmemeetings.com`,
      metadata: { 
        prospectEmail: "shaw@getmemeetings.com",
        eventId,
        senderEmail: account.email,
      },
    });
    
    console.log("✅ Test invite sent successfully!");
    console.log("📧 Invite sent to: shaw@getmemeetings.com");
    console.log("📅 Meeting scheduled for:", startTime.toLocaleString());
    console.log("🔗 Event ID:", eventId);
    
  } catch (error) {
    console.error("❌ Failed to send test invite:", error);
    process.exit(1);
  }
}

sendTestInvite();