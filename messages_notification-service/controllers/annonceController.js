const db = require("../config/db");

exports.getAllAnnonces = async (req, res) => {
    const sql = "SELECT * FROM Annonce";
    try {
        const [results] = await db.query(sql);

        const annoncesWithFullUrl = results.map((annonce) => {
            if (!annonce.image_url) return { ...annonce, image_url: "" };

            // Si l’annonce est liée à un événement (port 8084, ajusté selon ton commentaire)
            if (annonce.event_id) {
                return {
                    ...annonce,
                    image_url: annonce.image_url.startsWith("http")
                        ? annonce.image_url
                        : `http://localhost:8084${annonce.image_url}`,
                };
            }

            // Sinon, l’image vient du service Annonce (port 8082)
            return {
                ...annonce,
                image_url: annonce.image_url.startsWith("http")
                    ? annonce.image_url
                    : `http://localhost:8082${annonce.image_url}`,
            };
        });

        console.log("Annonces renvoyées :", annoncesWithFullUrl);
        res.json(annoncesWithFullUrl);
    } catch (err) {
        console.error("Erreur lors de la récupération des annonces :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.createAnnonce = async (req, res) => {
    const { title, content, admin_id, image_url } = req.body;
    const uploadedImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const finalImageUrl = uploadedImageUrl || image_url || "";

    const sql = "INSERT INTO Annonce (title, content, image_url, admin_id) VALUES (?, ?, ?, ?)";
    const values = [title, content, finalImageUrl, admin_id || 0];

    try {
        const [result] = await db.query(sql, values);
        res.status(201).json({ message: "Annonce créée avec succès", id: result.insertId });
    } catch (err) {
        console.error("Erreur lors de la création de l'annonce :", err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

exports.updateAnnonce = async (req, res) => {
    const { id } = req.params;
    const { title, content, image_url, admin_id } = req.body;

    const sql = "UPDATE Annonce SET title = ?, content = ?, image_url = ?, admin_id = ? WHERE id = ?";
    try {
        const [result] = await db.query(sql, [title, content, image_url, admin_id || 0, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Annonce non trouvée" });
        }
        res.json({ message: "Annonce mise à jour avec succès" });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de l'annonce :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.deleteAnnonce = async (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM Annonce WHERE id = ?";
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Annonce non trouvée" });
        }
        res.json({ message: "Annonce supprimée avec succès" });
    } catch (err) {
        console.error("Erreur lors de la suppression de l'annonce :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};