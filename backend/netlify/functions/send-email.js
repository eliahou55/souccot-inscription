// Aucune dépendance npm — utilise le fetch natif de Node 18

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
    }

    let formData, pdfBase64;
    try {
        ({ formData, pdfBase64 } = JSON.parse(event.body));
    } catch {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'Body invalide' }) };
    }

    if (!formData || !formData.emailContact) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'Email manquant' }) };
    }

    const RESEND_API_KEY  = process.env.RESEND_API_KEY;
    const FROM_EMAIL      = process.env.FROM_EMAIL      || 'noreply@loisirel.online';
    const ORGANIZER_EMAIL = process.env.ORGANIZER_EMAIL || 'loisirel@hotmail.fr';
    const finalTotal = (formData.remiseAmount > 0) ? formData.totalApresRemise : formData.totalEUR;
    const attachment = pdfBase64
        ? [{ filename: `Devis_Souccot_${formData.nomContact}_${formData.prenomContact}.pdf`, content: pdfBase64 }]
        : [];

    async function sendEmail(to, subject, html) {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ from: `Loisirel Souccot 2026 <${FROM_EMAIL}>`, to, subject, html, attachments: attachment })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Erreur Resend');
        }
    }

    try {
        await sendEmail(formData.emailContact, "Confirmation d'inscription - Souccot 2026", buildClientHTML(formData, finalTotal));
        await sendEmail(ORGANIZER_EMAIL, `Nouvelle inscription - ${formData.nomContact} ${formData.prenomContact} - Souccot 2026`, buildOrganizerHTML(formData, finalTotal));
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    } catch (error) {
        console.error('Erreur email:', error);
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: error.message }) };
    }
};

function buildClientHTML(data, finalTotal) {
    const remiseLine = (data.remiseAppliquee === 'Oui' && data.remiseAmount > 0)
        ? `<tr><td style="border:1px solid #ddd;"><strong>Total avant remise</strong></td><td style="border:1px solid #ddd;">${data.totalEUR}€</td></tr>` : '';
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
  <tr><td style="background:#8c3d0c;padding:25px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">LOISIREL SOUCCOT 2026</h1>
    <p style="color:#ffe0c2;margin:5px 0 0;">Hotel Millenium Charles de Gaulle</p>
  </td></tr>
  <tr><td style="padding:30px;">
    <h2 style="color:#8c3d0c;margin-top:0;">Confirmation d'inscription</h2>
    <p>Bonjour <strong>${data.prenomContact} ${data.nomContact}</strong>,</p>
    <p>Nous avons bien recu votre inscription pour le sejour de Souccot 2026. Votre devis complet est joint en piece attachee.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      <tr style="background:#fbf0e6;"><td style="border:1px solid #ddd;"><strong>Contact</strong></td><td style="border:1px solid #ddd;">${data.prenomContact} ${data.nomContact} — ${data.portable || 'N/A'}</td></tr>
      <tr><td style="border:1px solid #ddd;"><strong>Personnes</strong></td><td style="border:1px solid #ddd;">${data.nombrePersonnes}</td></tr>
      ${remiseLine}
      <tr style="background:#8c3d0c;"><td style="border:1px solid #8c3d0c;color:#fff;padding:10px;"><strong>TOTAL</strong></td><td style="border:1px solid #8c3d0c;color:#fff;padding:10px;"><strong>${finalTotal}€</strong></td></tr>
      <tr><td style="border:1px solid #ddd;">Acompte 50%</td><td style="border:1px solid #ddd;">${data.acomptEUR}€</td></tr>
      <tr style="background:#fbf0e6;"><td style="border:1px solid #ddd;">Solde</td><td style="border:1px solid #ddd;">${data.soldeEUR}€</td></tr>
    </table>
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:15px;margin-top:20px;border-radius:4px;">
      <strong>Reglement par virement :</strong><br>
      <strong style="color:#8c3d0c;">Titulaire du compte : TOVEL</strong><br>
      IBAN : FR76 1820 6002 1365 0425 2422 502<br>BIC : AGRFRPP882<br>
      Libelle : <strong>${data.nomContact} ${data.prenomContact} - Souccot 2026</strong>
    </div>
    <p style="margin-top:20px;color:#555;">Pour toute question : téléphone / WhatsApp au <strong>06 12 20 28 61</strong> ou email <a href="mailto:loisirel@hotmail.fr">loisirel@hotmail.fr</a></p>
  </td></tr>
  <tr><td style="background:#fbf0e6;padding:15px;text-align:center;font-size:12px;color:#888;">
    Millennium Hotel Paris Charles de Gaulle — 2 Allee du Verger, 95700 Roissy-en-France
  </td></tr>
</table></body></html>`;
}

function buildOrganizerHTML(data, finalTotal) {
    const membres = Array.isArray(data.familleMembers) ? data.familleMembers : [];
    const CAT_LABELS = { adulte: 'Adulte', enfant: 'Enfant', bebe: 'Bébé' };
    const membresRows = membres.map((m, i) =>
        `<tr style="${i % 2 === 0 ? 'background:#fbf0e6;' : ''}"><td style="border:1px solid #ddd;padding:6px;">${m.nom} ${m.prenom}</td><td style="border:1px solid #ddd;padding:6px;">${CAT_LABELS[m.categorie] || m.categorie || 'N/A'}</td></tr>`
    ).join('');
    const remiseLine = (data.remiseAppliquee === 'Oui' && data.remiseAmount > 0)
        ? `<tr style="background:#fbf0e6;"><td style="border:1px solid #ddd;"><strong>Total avant remise</strong></td><td style="border:1px solid #ddd;">${data.totalEUR}€</td></tr>` : '';
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
  <tr><td style="background:#8c3d0c;padding:20px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:18px;">NOUVELLE INSCRIPTION — SOUCCOT 2026</h1>
  </td></tr>
  <tr><td style="padding:25px;">
    <h2 style="color:#8c3d0c;margin-top:0;">${data.prenomContact} ${data.nomContact}</h2>
    <table width="100%" cellpadding="7" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      <tr style="background:#fbf0e6;"><td style="border:1px solid #ddd;width:40%;"><strong>Telephone</strong></td><td style="border:1px solid #ddd;">${data.portable || 'N/A'}</td></tr>
      <tr><td style="border:1px solid #ddd;"><strong>Email</strong></td><td style="border:1px solid #ddd;">${data.emailContact}</td></tr>
      <tr style="background:#fbf0e6;"><td style="border:1px solid #ddd;"><strong>Personnes</strong></td><td style="border:1px solid #ddd;">${data.nombrePersonnes} (${data.chambresAdultes} adultes, ${data.chambresEnfants} enfants, ${data.bebes} bebes)</td></tr>
      ${data.notes ? `<tr><td style="border:1px solid #ddd;"><strong>Notes</strong></td><td style="border:1px solid #ddd;">${data.notes}</td></tr>` : ''}
      ${remiseLine}
      <tr style="background:#8c3d0c;"><td style="border:1px solid #8c3d0c;color:#fff;padding:10px;"><strong>TOTAL</strong></td><td style="border:1px solid #8c3d0c;color:#fff;padding:10px;"><strong>${finalTotal}€</strong></td></tr>
      <tr><td style="border:1px solid #ddd;">Acompte 50%</td><td style="border:1px solid #ddd;">${data.acomptEUR}€</td></tr>
      <tr style="background:#fbf0e6;"><td style="border:1px solid #ddd;">Solde</td><td style="border:1px solid #ddd;">${data.soldeEUR}€</td></tr>
    </table>
    ${membres.length > 0 ? `<h3 style="color:#8c3d0c;margin-top:20px;">Membres de la famille</h3>
    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
      <tr style="background:#8c3d0c;color:#fff;"><th style="padding:8px;text-align:left;">Nom Prenom</th><th style="padding:8px;text-align:left;">Categorie</th></tr>
      ${membresRows}
    </table>` : ''}
    <p style="color:#888;font-size:12px;margin-top:20px;">Soumis le ${data.dateSoumission}</p>
  </td></tr>
</table></body></html>`;
}
