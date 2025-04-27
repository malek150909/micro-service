const nodemailer = require("nodemailer")
require("dotenv").config()

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Vérifier la connexion au serveur SMTP
const verifyConnection = async () => {
  try {
    await transporter.verify()
    console.log("Connexion SMTP établie avec succès")
    return true
  } catch (error) {
    console.error("Erreur de connexion SMTP:", error)
    return false
  }
}

// Envoyer un email
const sendEmail = async (options) => {
  try {
    const { to, subject, text, html, attachments } = options

    const mailOptions = {
      from: `"Plateform Universitaire" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email envoyé:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error)
    return { success: false, error: error.message }
  }
}

module.exports = {
  verifyConnection,
  sendEmail,
}
