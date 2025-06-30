import nodemailer from 'nodemailer';

async function sendTestInvite() {
  try {
    // Create transporter with Gmail app password for dhairyashil@getmemeetings.com
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dhairyashil@getmemeetings.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password-here'
      }
    });

    // Create simple calendar event
    const eventId = `test-${Date.now()}`;
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes later

    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Invite//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${eventId}@getmemeetings.com
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:Hi from Dhairya
DESCRIPTION:Test calendar invitation
ORGANIZER:mailto:dhairyashil@getmemeetings.com
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:shaw@openfortune.com
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

    const mailOptions = {
      from: 'dhairyashil@getmemeetings.com',
      to: 'shaw@openfortune.com',
      subject: 'Hi from Dhairya',
      text: 'Please find the calendar invitation attached.',
      html: '<p>Hi Shaw,</p><p>Please find the calendar invitation attached.</p><p>Best regards,<br>Dhairya</p>',
      attachments: [
        {
          filename: 'invite.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log('✓ Test invite sent successfully from dhairyashil@getmemeetings.com to shaw@openfortune.com');
    console.log(`Subject: Hi from Dhairya`);
    console.log(`Event time: ${startTime.toLocaleString()}`);
    
  } catch (error) {
    console.error('✗ Failed to send test invite:', error.message);
  }
}

sendTestInvite();