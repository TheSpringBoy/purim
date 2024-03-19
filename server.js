const { Client } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the WhatsApp client
const client = new Client();

// Object to store users and their currency
const userCurrency = {};

// Set up event listeners
client.on('qr', async (qr) => {
  try {
    // Generate QR code as data URI
    const qrDataUrl = await QRCode.toDataURL(qr, { scale: 8 });

    // Log the link to the QR code image
    console.log('QR code:', qrDataUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
});

client.on('ready', () => {
  // Handle ready event (WhatsApp client is ready)
  console.log('WhatsApp client is ready!');
});

client.on('message', async message => {
  // Check if the message is from the desired group
  if (message.from === 'K2715brAt8j7uq3It7TUK8') { 
    console.log("got message");
    const { body } = message;
    // Check if the message is in the format of adding funds
    if (body.match(/^050\d{7} \+\d+$/)) {
      const [, phoneNumber, amountToAdd] = body.match(/^(050\d{7}) \+(\d+)$/);
      if (!userCurrency[phoneNumber]) {
        userCurrency[phoneNumber] = 0;
        client.sendMessage(message.from, `User ${phoneNumber} created. Current currency is ${amountToAdd}`);
      } else {
        client.sendMessage(message.from, `User ${phoneNumber} already exists. Current currency is ${userCurrency[phoneNumber] + parseInt(amountToAdd)}`);
      }
      userCurrency[phoneNumber] += parseInt(amountToAdd);
      console.log(`Added ${amountToAdd} to ${phoneNumber}. New balance: ${userCurrency[phoneNumber]}`);
    }
    // Check if the message is in the format of subtracting funds
    else if (body.match(/^050\d{7} \-\d+$/)) {
      const [, phoneNumber, amountToSubtract] = body.match(/^(050\d{7}) \-(\d+)$/);
      if (!userCurrency[phoneNumber] || userCurrency[phoneNumber] < parseInt(amountToSubtract)) {
        console.log(`${phoneNumber} does not have sufficient balance to subtract ${amountToSubtract}`);
        return;
      }
      userCurrency[phoneNumber] -= parseInt(amountToSubtract);
      console.log(`Subtracted ${amountToSubtract} from ${phoneNumber}. New balance: ${userCurrency[phoneNumber]}`);
      // Send a reply message to the group
      client.sendMessage(message.from, `New currency for ${phoneNumber}: ${userCurrency[phoneNumber]}`);
    }
  }
});


// Set up middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to handle sending messages
app.post('/send-message', (req, res) => {
  let { phoneNumber, message } = req.body;

  // Convert phone number format from 0500000000 to 050-000-0000
  phoneNumber = phoneNumber.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');

  // Append "@c.us" at the end to form the chatId
  const chatId = phoneNumber + "@c.us";

  // Send WhatsApp message
  client.sendMessage(chatId, message)
    .then(() => {
      res.status(200).send('Message sent successfully');
    })
    .catch((error) => {
      console.error('Error sending message:', error);
      res.status(500).send('Error sending message');
    });
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize the WhatsApp client after setting up event listeners
client.initialize();

// Route handler for root URL
app.get('/', (req, res) => {
  // Redirect users to the Google Sheets URL
  res.redirect('https://docs.google.com/spreadsheets/d/1A5ECQpxs4LTjD7LwCIV2NM23iiaTn4l6QBrU5kJW76A/');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
