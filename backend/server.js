const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// ── Route santé ──────────────────────────────────────────────
app.get('/', (req, res) => res.send('Souccot 2026 - Email Service OK'));

// ── Envoi du devis par email ─────────────────────────────────
app.post('/send-email', async (req, res) => {
    const { formData, pdfBase64 } = req.body;

    if (!formData || !formData.emailContact) {
        return res.status(400).json({ success: false, error: 'Email manquant' });
    }

    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@socialword.shop';
    const ORGANIZER_EMAIL = process.env.ORGANIZER_EMAIL || 'loisirel@hotmail.fr';

    const finalTotal = (formData.remiseAmount > 0) ? formData.totalApresRemise : formData.totalEUR;
    const pdfAttachment = pdfBase64
        ? [{ filename: `Devis_Souccot_${formData.nomContact}_${formData.prenomContact}.pdf`, content: pdfBase64 }]
        : [];

    try {
        // ── Email de confirmation au client ──────────────────
        await resend.emails.send({
            from: `Loisirel Souccot 2026 <${FROM_EMAIL}>`,
            to: formData.emailContact,
            subject: "Confirmation d'inscription - Souccot 2026",
            html: buildClientEmail(formData, finalTotal),
            attachments: pdfAttachment
        });

        // ── Notification à l'organisateur ────────────────────
        await resend.emails.send({
            from: `Formulaire Souccot 2026 <${FROM_EMAIL}>`,
            to: ORGANIZER_EMAIL,
            subject: `Nouvelle inscription - ${formData.nomContact} ${formData.prenomContact} - Souccot 2026`,
            html: buildOrganizerEmail(formData, finalTotal),
            attachments: pdfAttachment
        });

        console.log(`Emails envoyés pour ${formData.nomContact} ${formData.prenomContact} (${formData.emailContact})`);
        res.json({ success: true });

    } catch (error) {
        console.error('Erreur envoi email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Templates HTML ────────────────────────────────────────────
function buildClientEmail(data, finalTotal) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
    <tr>
      <td style="background:#8c3d0c;padding:25px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">LOISIRÉL SOUCCOT 2026</h1>
        <p style="color:#ffe0c2;margin:5px 0 0;">Hôtel Millenium Charles de Gaulle</p>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <h2 style="color:#8c3d0c;margin-top:0;">Confirmation d'inscription</h2>
        <p>Bonjour <strong>${data.prenomContact} ${data.nomContact}</strong>,</p>
        <p>Nous avons bien reçu votre inscription pour le séjour de Souccot 2026. Votre devis complet est joint en pièce attachée.</p>

        <h3 style="color:#8c3d0c;border-bottom:2px solid #8c3d0c;padding-bottom:6px;">Récapitulatif</h3>
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <tr style="background:#fbf0e6;">
            <td style="border:1px solid #ddd;"><strong>Contact</strong></td>
            <td style="border:1px solid #ddd;">${data.prenomContact} ${data.nomContact} — ${data.portable || 'N/A'}</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd;"><strong>Nombre de personnes</strong></td>
            <td style="border:1px solid #ddd;">${data.nombrePersonnes}</td>
          </tr>
          ${data.remiseAppliquee === 'Oui' && data.remiseAmount > 0 ? `
          <tr>
            <td style="border:1px solid #ddd;"><strong>Total avant remise</strong></td>
            <td style="border:1px solid #ddd;">${data.totalEUR}€</td>
          </tr>` : ''}
          <tr style="background:#8c3d0c;">
            <td style="border:1px solid #8c3d0c;color:#fff;padding:10px;"><strong>TOTAL</strong></td>
            <td style="border:1px solid #8c3d0c;color:#fff;padding:10px;"><strong>${finalTotal}€</strong></td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd;">Acompte 50%</td>
            <td style="border:1px solid #ddd;">${data.acomptEUR}€</td>
          </tr>
          <tr style="background:#fbf0e6;">
            <td style="border:1px solid #ddd;">Solde</td>
            <td style="border:1px solid #ddd;">${data.soldeEUR}€</td>
          </tr>
        </table>

        <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:15px;margin-top:20px;border-radius:4px;">
          <strong>Règlement par virement :</strong><br>
          IBAN : FR76 1820 6002 1365 0425 2422 502<br>
          BIC : AGRFRPP882<br>
          Libellé : <strong>${data.nomContact} ${data.prenomContact} - Souccot 2026</strong>
        </div>

        <p style="margin-top:20px;color:#555;">Pour toute question, contactez-nous à <a href="mailto:loisirel@hotmail.fr">loisirel@hotmail.fr</a>.</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fbf0e6;padding:15px;text-align:center;font-size:12px;color:#888;">
        Millennium Hotel Paris Charles de Gaulle — 2 Allée du Verger, 95700 Roissy-en-France, France
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOrganizerEmail(data, finalTotal) {
    const membres = Array.isArray(data.familleMembers) ? data.familleMembers : [];
    const CAT_LABELS = { adulte: 'Adulte', enfant: 'Enfant', bebe: 'Bébé' };
    const membresHTML = membres.map((m, i) =>
        `<tr style="${i % 2 === 0 ? 'background:#fbf0e6;' : ''}">
            <td style="border:1px solid #ddd;padding:6px;">${m.nom} ${m.prenom}</td>
            <td style="border:1px solid #ddd;padding:6px;">${CAT_LABELS[m.categorie] || m.categorie || 'N/A'}</td>
        </tr>`
    ).join('');

    return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
    <tr>
      <td style="background:#8c3d0c;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:18px;">NOUVELLE INSCRIPTION — SOUCCOT 2026</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:25px;">
        <h2 style="color:#8c3d0c;margin-top:0;">${data.prenomContact} ${data.nomContact}</h2>
        <table width="100%" cellpadding="7" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <tr style="background:#fbf0e6;">
            <td style="border:1px solid #ddd;width:40%;"><strong>Téléphone</strong></td>
            <td style="border:1px solid #ddd;">${data.portable || 'N/A'}</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd;"><strong>Email</strong></td>
            <td style="border:1px solid #ddd;">${data.emailContact}</td>
          </tr>
          <tr style="background:#fbf0e6;">
            <td style="border:1px solid #ddd;"><strong>Personnes</strong></td>
            <td style="border:1px solid #ddd;">${data.nombrePersonnes} (${data.chambresAdultes} adultes, ${data.chambresEnfants} enfants, ${data.bebes} bébés)</td>
          </tr>
          ${data.notes ? `<tr><td style="border:1px solid #ddd;"><strong>Notes</strong></td><td style="border:1px solid #ddd;">${data.notes}</td></tr>` : ''}
          ${data.remiseAppliquee === 'Oui' ? `
          <tr style="background:#fbf0e6;">
            <td style="border:1px solid #ddd;"><strong>Total avant remise</strong></td>
            <td style="border:1px solid #ddd;">${data.totalEUR}€</td>
          </tr>` : ''}
          <tr style="background:#8c3d0c;">
            <td style="border:1px solid #8c3d0c;color:#fff;padding:10px;"><strong>TOTAL</strong></td>
            <td style="border:1px solid #8c3d0c;color:#fff;padding:10px;"><strong>${finalTotal}€</strong></td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd;">Acompte 50%</td>
            <td style="border:1px solid #ddd;">${data.acomptEUR}€</td>
          </tr>
          <tr style="background:#fbf0e6;">
            <td style="border:1px solid #ddd;">Solde</td>
            <td style="border:1px solid #ddd;">${data.soldeEUR}€</td>
          </tr>
        </table>

        ${membres.length > 0 ? `
        <h3 style="color:#8c3d0c;margin-top:20px;">Membres de la famille</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
          <tr style="background:#8c3d0c;color:#fff;">
            <th style="padding:8px;text-align:left;">Nom Prénom</th>
            <th style="padding:8px;text-align:left;">Catégorie</th>
          </tr>
          ${membresHTML}
        </table>` : ''}

        <p style="color:#888;font-size:12px;margin-top:20px;">Soumis le ${data.dateSoumission}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
