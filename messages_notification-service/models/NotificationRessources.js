// models/Notification.js
const db = require('../config/db');

class Notification {
    // Create a single notification
    static async create(expediteur, destinataire, contenu) {
        try {
            //console.log(`Creating notification: expediteur=${expediteur}, destinataire=${destinataire}, contenu=${contenu}`);
            const [result] = await db.execute(
                'INSERT INTO Notification (expediteur, destinataire, contenu) VALUES (?, ?, ?)',
                [expediteur, destinataire, contenu]
            );
            //console.log(`Notification created with ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error('Error creating notification:', error.message);
            throw error; // Re-throw the error so it can be caught by the caller
        }
    }

    // Create notifications for multiple recipients
    static async createForMultipleRecipients(expediteur, destinataires, contenu) {
        try {
            //console.log(`Creating notifications for ${destinataires.length} recipients from expediteur=${expediteur}`);
            const promises = destinataires.map(destinataire =>
                this.create(expediteur, destinataire, contenu)
            );
            await Promise.all(promises);
            //console.log('All notifications created successfully');
        } catch (error) {
            console.error('Error in createForMultipleRecipients:', error.message);
            throw error; // Re-throw the error so it can be caught by the caller
        }
    }
}

module.exports = Notification;