const deleteAllEmails = async () => {
  try {
    // Deleting all emails
    const deleteAllResponse = await fetch(
      'http://localhost:8025/api/v1/messages',
      {
        method: 'DELETE',
      }
    );

    // Check if the deletion was successful
    if (deleteAllResponse.ok) {
      console.log('All emails deleted successfully.');
    } else {
      console.error(`Failed to delete emails: ${deleteAllResponse.statusText}`);
    }
  } catch (error) {
    console.error('Error occurred while deleting emails:', error);
  }
};
const getOtpFromEmail = async () => {
  try {
    const response = await fetch('http://localhost:8025/api/v2/messages');

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const messages = data.items;

    if (messages.length === 0) {
      console.log('No emails found.');
      return null;
    }

    const latestEmail = messages[0];

    const emailBody = latestEmail.Content.Body;
    return emailBody;
  } catch (error) {
    console.error('Error fetching emails from MailHog:', error);
    return null;
  }
};

interface EmailMessage {
  Content: {
    Body: string;
  };
}

interface MailHogResponse {
  items: EmailMessage[];
}

const getLinkFromEmail = async (): Promise<string> => {
  try {
    const response = await fetch('http://localhost:8025/api/v2/messages');

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const messages = data.items;

    if (messages.length === 0) {
      console.log('No emails found.');
      throw new Error('No emails found');
    }

    const latestEmail = messages[0];

    // Email body might be encoded as Quoted-Printable, so we need to decode it
    let emailBody = latestEmail.Content.Body;

    // Decode Quoted-Printable encoding
    emailBody = emailBody.replace(/=\r?\n/g, ''); // Remove soft line breaks
    emailBody = emailBody.replace(/=3D/g, '='); // Replace encoded equals sign

    // Now extract the verification link
    const verificationLinkMatch = emailBody.match(
      /http:\/\/localhost:8000\/auth\/email-verification-check\?[^"]+/
    );

    if (!verificationLinkMatch) {
      console.log('Verification link not found.');
      throw new Error('Verification link not found');
    }

    const verificationLink = verificationLinkMatch[0];
    return verificationLink;
  } catch (error) {
    console.error('Error fetching emails from MailHog:', error);
    throw new Error('Error fetching emails from MailHog');
  }
};

export { getOtpFromEmail, deleteAllEmails, getLinkFromEmail };
