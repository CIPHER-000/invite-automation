import { gmailAppPasswordService } from './server/services/gmail-app-password.js';

async function sendDirectInvite() {
  try {
    console.log('Testing direct calendar invite...');
    
    // Test if dhairyashil@getmemeetings.com account exists
    const account = gmailAppPasswordService.getAccount('dhairyashil@getmemeetings.com');
    if (!account) {
      console.log('Account dhairyashil@getmemeetings.com not found in Gmail service');
      console.log('Available accounts:', gmailAppPasswordService.getAllAccounts().map(a => a.email));
      return;
    }

    const eventDetails = {
      title: 'Hi from Dhairya',
      description: 'Quick test invitation',
      attendeeEmail: 'shaw@openfortune.com',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // +30 minutes
      timeZone: 'UTC'
    };

    console.log('Sending invite with details:', eventDetails);
    
    const eventId = await gmailAppPasswordService.createCalendarEvent(account, eventDetails);
    console.log('✓ Calendar invite sent successfully!');
    console.log(`Event ID: ${eventId}`);
    console.log(`From: ${account.email}`);
    console.log(`To: ${eventDetails.attendeeEmail}`);
    console.log(`Subject: ${eventDetails.title}`);
    
  } catch (error) {
    console.error('✗ Failed to send invite:', error.message);
  }
}

sendDirectInvite();