const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || 'whatsapp:+919535901059';

let client;
const isRealCreds = accountSid && authToken && !accountSid.includes('YOUR_') && !authToken.includes('YOUR_');

if (isRealCreds) {
    try {
        client = twilio(accountSid, authToken);
    } catch (err) {
        console.error('Twilio initialization failed:', err.message);
    }
} else {
    console.warn('Twilio credentials missing or invalid. WhatsApp notifications will be simulated in console.');
}

const sendWhatsApp = async ({ to, body }) => {
    if (!to) {
        console.error('No recipient phone number provided for WhatsApp notification');
        return;
    }

    let formattedTo = to.toString().startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    if (!formattedTo.includes('+') && formattedTo.length === 19) { // Simple check for missing + in whatsapp:+91...
        // No easy fix here without specific logic, assuming user provides clean input or we handle in formatWhatsApp
    }

    if (!client) {
        console.log(`[SIMULATION] Sending WhatsApp to ${formattedTo}: ${body}`);
        return;
    }

    try {
        const message = await client.messages.create({
            from: fromNumber,
            to: formattedTo,
            body: body
        });
        return message;
    } catch (error) {
        console.error(`Failed to send WhatsApp to ${formattedTo}:`, error.message);
    }
};

const formatWhatsApp = (number) => {
    if (!number) return '';
    let formatted = number.toString().replace(/\s+/g, '');
    if (!formatted.startsWith('whatsapp:')) {
        if (!formatted.startsWith('+')) {
            if (formatted.length === 10) formatted = '+91' + formatted;
            else formatted = '+' + formatted;
        }
        formatted = `whatsapp:${formatted}`;
    }
    return formatted;
};

module.exports = { sendWhatsApp, adminNumber, formatWhatsApp };
