const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const formatEnvText = (value) => value.replace(/\\n/g, "\n");

const verifyConnection = async () => {
  await transporter.verify();
  console.log("Mail server connected successfully");
};

const getAttachments = () => {
  if (!process.env.ATTACHMENTS) {
    return [];
  }

  return process.env.ATTACHMENTS.split(",")
    .map((filePath) => filePath.trim())
    .filter(Boolean)
    .map((filePath) => {
      const resolvedPath = path.resolve(filePath);

      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Attachment not found: ${filePath}`);
      }

      return {
        filename: path.basename(resolvedPath),
        path: resolvedPath
      };
    });
};

const sendMail = async ({ to, subject, text, html, attachments }) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    cc: process.env.EMAIL_CC,
    bcc: process.env.EMAIL_BCC,
    text,
    html,
    attachments
  });
};

const sendBulkMails = async (recipients, mailOptions = {}) => {
  const uniqueRecipients = [...new Set(recipients)]
    .map((email) => String(email).trim())
    .filter(isValidEmail);

  if (!uniqueRecipients.length) {
    throw new Error("No valid email addresses found in data.js");
  }

  const subject = mailOptions.subject || process.env.MAIL_SUBJECT || "Hello from Nodemailer";
  const text = mailOptions.text || formatEnvText(process.env.MAIL_TEXT || "This is a bulk email sent with Nodemailer.");
  const html = mailOptions.html || process.env.MAIL_HTML;
  const attachments = mailOptions.attachments || getAttachments();

  const results = [];

  for (const to of uniqueRecipients) {
    try {
      const info = await sendMail({ to, subject, text, html, attachments });
      results.push({ to, success: true, messageId: info.messageId });
      console.log(`Sent mail to ${to}`);
    } catch (error) {
      results.push({ to, success: false, error: error.message });
      console.error(`Failed to send mail to ${to}: ${error.message}`);
    }
  }

  return results;
};

module.exports = {
  sendBulkMails,
  sendMail,
  verifyConnection
};
