const { Client } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the WhatsApp client
const client = new Client();

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

// Set up middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to handle sending messages
app.post('/send-message', (req, res) => {
  const { phoneNumber, message } = req.body;
  console.log("Num: " + phoneNumber + ", message: " + message)
  // Send WhatsApp message
  client.sendMessage(phoneNumber, message)
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
