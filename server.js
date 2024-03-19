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
  console.log("message id: " + message.from);
  if (message.from === '120363263293911851@g.us') {
    console.log("got message");
    const { body } = message;

    // Check if the message contains only a phone number
    const phoneNumberRegex = /^05\d{8}$/;
    if (phoneNumberRegex.test(body)) {
      const phoneNumber = body.match(phoneNumberRegex)[0];
      const last4digits = phoneNumber.slice(-4);
      if (userCurrency[phoneNumber]) {
        await message.reply(`למספר שנגמר ב-${last4digits} יש ${userCurrency[phoneNumber]} מזוזים.`, undefined, { quotedMessageId: message.id._serialized });
      } else {
        await message.reply(`למספר שנגמר ב-${last4digits} אין מזוזים בכלל.`, undefined, { quotedMessageId: message.id._serialized });
      }
      return;
    }

    // Check if the message is in the format of adding funds
    if (body.match(/^05\d{8} \+\d+$/)) {
      const [, phoneNumber, amountToAdd] = body.match(/^(05\d{8}) \+(\d+)$/);
      if (!userCurrency[phoneNumber]) {
        userCurrency[phoneNumber] = parseInt(amountToAdd); // Here you initialize the userCurrency with the amountToAdd
        message.reply(`למספר שנגמר ב-${phoneNumber.slice(-4)} יש כרגע ${userCurrency[phoneNumber]} מזוזים.`, undefined, { quotedMessageId: message.id._serialized });
        // Other code...
      } else {
        userCurrency[phoneNumber] += parseInt(amountToAdd); // Here you add the amountToAdd to the existing userCurrency[phoneNumber]
        message.reply(`למספר שנגמר ב-${phoneNumber.slice(-4)} הוספו ${amountToAdd} מזוזים. היתרה הנוכחית: ${userCurrency[phoneNumber]} מזוזים.`, undefined, { quotedMessageId: message.id._serialized });
        // Other code...
      }
      console.log(`Added ${amountToAdd} to ${phoneNumber}. New balance: ${userCurrency[phoneNumber]}`);
    }

    // Check if the message is in the format of subtracting funds
    else if (body.match(/^05\d{8} \-\d+$/)) {
      const [, phoneNumber, amountToSubtract] = body.match(/^(05\d{8}) \-(\d+)$/);
      if (!userCurrency[phoneNumber] || userCurrency[phoneNumber] < parseInt(amountToSubtract)) {
        await message.reply(`למספר שנגמר ב-${phoneNumber.slice(-4)} אין מספיק מזוזים בשביל פעולה זו. כרגע יש לו ${userCurrency[phoneNumber]} מזוזים.`, undefined, { quotedMessageId: message.id._serialized });
        return;
      }
      userCurrency[phoneNumber] -= parseInt(amountToSubtract);
      await message.reply(`מספר ${phoneNumber.slice(-4)}: הוסרו ${amountToSubtract} מזוזים. היתרה הנוכחית: ${userCurrency[phoneNumber]} מזוזים.`, undefined, { quotedMessageId: message.id._serialized });
      await client.sendMessage(phoneNumber + '@c.us', `היתרה הנוכחית שלך היא ${userCurrency[phoneNumber]} מזוזים, מספר נגמר ב-${phoneNumber.slice(-4)}.`);
      console.log(`Subtracted ${amountToSubtract} from ${phoneNumber}. New balance: ${userCurrency[phoneNumber]}`);
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
