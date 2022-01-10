const dotEnv = require('dotenv');
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlTotext = require('html-to-text');

dotEnv.config({ path: '../config.env' });

// new Email(user, url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Nariman Naghavi <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // SEND_GRID
      return nodemailer.createTransport({
        service: '',
        auth: {
          user: '',
          pass: '',
        },
      });
    }

    return nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '276d3b45151920',
        pass: 'ba75ab112ff22c',
      },
    });
  }

  // SEND ACTUAL EMAIL
  async send(template, subject) {
    // 1- Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2- Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlTotext.fromString(html),
    };

    // 3- Create and send email

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the natours family.');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token valid for 5 minutes.'
    );
  }
};
