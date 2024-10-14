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

export { getOtpFromEmail, deleteAllEmails };
