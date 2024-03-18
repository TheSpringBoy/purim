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

// Initialize the WhatsApp client after setting up event listeners
client.initialize();

// Set up middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to handle sending messages
app.post('/send-message', (req, res) => {
  const { phoneNumber, message } = req.body;

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
