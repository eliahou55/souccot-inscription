// ============================================================
// GOOGLE APPS SCRIPT - SOUCCOT 2026
// ============================================================

const SHEET_INSCRIPTIONS = "Inscriptions";

// ---- Headers (doivent correspondre exactement aux colonnes du Sheet) ----

const HEADERS_INSCRIPTIONS = [
  "ID Inscription", "Date Soumission",
  "Nom", "Prenom", "Telephone", "Email",
  "Total Membre", "Membre Famille",
  "Adultes", "Enfants", "Bébés",
  "Tarif Total Adultes", "Tarif Total Enfants", "Tarif Bébés",
  "Notes",
  "Reduction (€)",
  "Total", "Acompte", "Solde Restant",
  "Total avant remise (€)", "Réduction (%)",
  "Paiement Intégral",
  "Chambre Standard Double", "Chambre Standard Twin", "Chambre Club Double/Queen",
  "Chambre Club Twin", "Chambre Supérieure", "Suite Studio/Junior"
];

// ============================================================
// POINT D'ENTRÉE POST
// ============================================================

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (!payload.nomContact || !payload.prenomContact) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'error', message: 'Nom et prénom de contact requis' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const result = addDataToSheets(payload);

    return ContentService.createTextOutput(
      JSON.stringify(result.success
        ? { status: 'success', message: 'Inscription reçue', confirmationId: result.confirmationId }
        : { status: 'error', message: result.error }
      )
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: 'Erreur serveur: ' + error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================

function addDataToSheets(data) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const color = generateRandomColor();

    // Générer l'ID unique
    const sheet1 = getOrCreateSheet(spreadsheet, SHEET_INSCRIPTIONS, HEADERS_INSCRIPTIONS);
    const inscriptionId = 'SOUCCOT-2026-' + (sheet1.getLastRow());

    // Récupérer les membres de la famille
    let membres = [];
    try {
      membres = JSON.parse(data.familleJSON || '[]');
    } catch(e) {
      membres = [];
    }

    const membresTexte = membres.map(m =>
      m.nom + ' ' + m.prenom + (m.categorie ? ' (' + m.categorie + ')' : '')
    ).join(' | ');

    const finalTotal = (data.remiseAmount > 0) ? data.remiseAmount : data.totalEUR;
    const rooms = data.roomsOrganisateur || {};

    const rowInscription = [
      inscriptionId,
      data.dateSoumission || new Date().toLocaleDateString('fr-FR'),
      data.nomContact,
      data.prenomContact,
      data.portable || '',
      data.emailContact || '',
      membres.length,
      membresTexte,
      data.chambresAdultes || 0,
      data.chambresEnfants || 0,
      data.bebes || 0,
      data.tarifChambresAdultes || 0,
      data.tarifChambresEnfants || 0,
      data.tarifBebes || 0,
      data.notes || '',
      (data.remiseAppliquee === 'Oui' && data.remiseAmount > 0) ? (data.totalEUR - data.remiseAmount) : 0,
      finalTotal || 0,
      data.acomptEUR || 0,
      data.soldeEUR || 0,
      data.totalEUR || 0,
      data.remisePourcentage || 0,
      data.paiementIntegral ? 'Oui' : 'Non',
      rooms.stdDouble || 0,
      rooms.stdTwin || 0,
      rooms.clubDouble || 0,
      rooms.clubTwin || 0,
      rooms.superieure || 0,
      rooms.suite || 0
    ];

    sheet1.appendRow(rowInscription);
    coloriserLigne(sheet1, sheet1.getLastRow(), color);

    Logger.log('Inscription enregistrée: ' + inscriptionId + ' - ' + data.nomContact + ' ' + data.prenomContact);

    return { success: true, confirmationId: inscriptionId };

  } catch (error) {
    Logger.log('Erreur: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ============================================================
// HELPERS
// ============================================================

function getOrCreateSheet(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#8c3d0c');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function coloriserLigne(sheet, rowIndex, color) {
  const range = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn());
  range.setBackground(color);
}

function generateRandomColor() {
  const colors = [
    '#FFE6E6', '#E6F2FF', '#E6FFE6', '#FFFFE6',
    '#FFE6F2', '#E6FFFF', '#FFF0E6', '#F0E6FF',
    '#E6FFE6', '#FFE6CC', '#E6F9FF', '#F9FFE6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ============================================================
// TEST LOCAL (à lancer depuis Apps Script pour tester)
// ============================================================

function testDoPost() {
  const testData = {
    nomContact: 'Cohen',
    prenomContact: 'David',
    portable: '0612345678',
    emailContact: 'david.cohen@example.com',
    familleJSON: '[{"nom":"Cohen","prenom":"David","categorie":"adulte"},{"nom":"Cohen","prenom":"Sarah","categorie":"adulte"},{"nom":"Cohen","prenom":"Tom","categorie":"enfant"},{"nom":"Cohen","prenom":"Leia","categorie":"bebe"}]',
    chambresAdultes: 2,
    chambresEnfants: 1,
    bebes: 1,
    tarifChambresAdultes: 1040,
    tarifChambresEnfants: 400,
    tarifBebes: 150,
    notes: 'Régime casher strict',
    remiseAppliquee: 'Non',
    remiseAmount: 0,
    totalEUR: 1590,
    totalApresRemise: 1590,
    acomptEUR: 795,
    soldeEUR: 795,
    paiementIntegral: false,
    roomsOrganisateur: { stdDouble: 1, stdTwin: 0, clubDouble: 1, clubTwin: 0, superieure: 0, suite: 0 },
    dateSoumission: new Date().toLocaleDateString('fr-FR'),
    timestamp: new Date().toISOString()
  };

  const result = addDataToSheets(testData);
  Logger.log('Résultat: ' + JSON.stringify(result));
}
