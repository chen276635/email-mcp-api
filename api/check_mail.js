const Imap = require('imap');
const { simpleParser } = require('mailparser');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.end();

  const imapConfig = {
    user: process.env.EMAIL_163,
    password: process.env.EMAIL_163_AUTH,
    host: 'imap.163.com',
    port: 993,
    tls: true
  };

  const imap = new Imap(imapConfig);

  function openInbox() {
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, (err, box) => err ? reject(err) : resolve(box));
    });
  }

  try {
    await new Promise((res, rej) => imap.once('ready', res).once('error', rej).connect());
    await openInbox();
    const results = await new Promise((resolve, reject) => {
      imap.search(['ALL', ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000)]], (err, ids) => {
        if(err) return reject(err);
        if(!ids.length) return resolve([]);
        const f = imap.fetch(ids.slice(-5), { bodies: '' });
        const list = [];
        f.on('message', msg => {
          msg.on('body', stream => {
            simpleParser(stream, (e, mail) => {
              if(!e) list.push({
                from: mail.from?.text,
                subject: mail.subject,
                text: mail.text?.slice(0,500),
                date: mail.date
              });
            });
          });
        });
        f.on('end', () => resolve(list));
      });
    });
    imap.end();
    return res.json({mails:results});
  }catch(e){
    return res.status(500).json({error:e.message});
  }
};
