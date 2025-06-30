// Send invite using platform's Gmail service if dhairyashil account exists
import nodemailer from 'nodemailer';

async function sendInviteFromDhairya() {
  console.log('Attempting to send invite from dhairyashil@getmemeetings.com to shaw@openfortune.com...');
  
  // Try different possible app password configurations
  const possiblePasswords = [
    process.env.DHAIRYA_GMAIL_APP_PASSWORD,
    process.env.GMAIL_APP_PASSWORD,
    process.env.DHAIRYASHIL_GMAIL_APP_PASSWORD
  ].filter(Boolean);

  for (const password of possiblePasswords) {
    try {
      console.log(`Testing with app password configuration...`);
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'dhairyashil@getmemeetings.com',
          pass: password
        }
      });

      // Test connection
      await transporter.verify();
      console.log('✓ SMTP connection verified for dhairyashil@getmemeetings.com');

      // Create calendar event
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes later

      const formatICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GetMeMeetings//NONSGML Calendar//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:dhairya-invite-${Date.now()}@getmemeetings.com
DTSTART:${formatICSDate(startTime)}
DTEND:${formatICSDate(endTime)}
SUMMARY:Hi from Dhairya
DESCRIPTION:Meeting invitation from Dhairya
ORGANIZER:mailto:dhairyashil@getmemeetings.com
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:shaw@openfortune.com
STATUS:CONFIRMED
TRANSP:OPAQUE
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

      const mailOptions = {
        from: 'dhairyashil@getmemeetings.com',
        to: 'shaw@openfortune.com',
        subject: 'Hi from Dhairya',
        text: 'Hi Shaw,\n\nMeeting invitation from Dhairya.\n\nBest regards,\nDhairya',
        html: '<p>Hi Shaw,</p><p>Meeting invitation from Dhairya.</p><p>Best regards,<br>Dhairya</p>',
        attachments: [
          {
            filename: 'meeting.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }
        ]
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✓ Email sent successfully from dhairyashil@getmemeetings.com!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`To: shaw@openfortune.com`);
      console.log(`Subject: Hi from Dhairya`);
      console.log(`Meeting time: ${startTime.toLocaleString()}`);
      return true;
      
    } catch (error) {
      console.log(`Failed with this configuration: ${error.message}`);
      continue;
    }
  }
  
  console.log('✗ Unable to send from dhairyashil@getmemeetings.com - app password not configured');
  return false;
}

sendInviteFromDhairya();