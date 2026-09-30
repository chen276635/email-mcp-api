const nodemailer = require('nodemailer');

module.exports = async (req, res) =>{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { subject, content, sender, senderName } = req.body || req.query;

  if (!subject || !content) {
    return res.status(400).json({ error: '缺少 subject 或 content 参数' });
  }

  const displayName = sender || senderName || 'AI Companion';

  const transporter = nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_163,
      pass: process.env.EMAIL_163_AUTH
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"${displayName}" <${process.env.EMAIL_163}>`,
      to: process.env.TO_EMAIL || process.env.EMAIL_163,
      subject: subject,
      text: content
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
