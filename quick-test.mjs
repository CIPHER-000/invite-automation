import nodemailer from 'nodemailer';

async function quickTestInvite() {
  console.log('Sending test invite from dhairyashil@getmemeetings.com to shaw@openfortune.com...');
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'shaw@getmemeetings.com',
        pass: process.env.GMAIL_APP_PASSWORD // Will use the existing environment variable
      }
    });

    // Test the connection first
    await transporter.verify();
    console.log('✓ SMTP connection verified');

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
UID:dhairya-test-${Date.now()}@shaw.getmemeetings.com
DTSTART:${formatICSDate(startTime)}
DTEND:${formatICSDate(endTime)}
SUMMARY:Hi from Dhairya
DESCRIPTION:Quick test meeting invitation
ORGANIZER:mailto:shaw@getmemeetings.com
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:shaw@openfortune.com
STATUS:CONFIRMED
TRANSP:OPAQUE
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    const mailOptions = {
      from: 'shaw@getmemeetings.com',
      to: 'shaw@openfortune.com',
      subject: 'Hi from Dhairya',
      text: 'Hi Shaw,\n\nQuick test meeting invitation.\n\nBest,\nDhairya',
      html: '<p>Hi Shaw,</p><p>Quick test meeting invitation.</p><p>Best,<br>Dhairya</p>',
      attachments: [
        {
          filename: 'meeting.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✓ Email sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`From: dhairyashil@getmemeetings.com`);
    console.log(`To: shaw@openfortune.com`);
    console.log(`Subject: Hi from Dhairya`);
    console.log(`Meeting time: ${startTime.toLocaleString()}`);
    
  } catch (error) {
    console.error('✗ Failed to send test invite:', error.message);
    if (error.message.includes('Username and Password not accepted')) {
      console.log('Note: Need to set GMAIL_APP_PASSWORD environment variable for dhairyashil@getmemeetings.com');
    }
  }
}

quickTestInvite();