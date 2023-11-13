const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //1) create treansporter we here sepcify the service that we want to use like [gmail, hotmail, ....] and another things as you see
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  //2) Defiend the mail options
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: options.email,
    subject: options.subject,
    text: options.text,
    // html: options.html,
  };

  //3) we actaully send the email here
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
