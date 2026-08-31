// Configuration
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwGP2mPfs7V8ZdPcpfLgo0F1TLg3SF2qUhRWeRa7A3jyCnpceVOPT6RTeXoZwSsBeQC/exec',
    EMAIL_SERVICE_URL: 'https://souccot.netlify.app/.netlify/functions',
};

// Tarifs
const PRICES = {
    adulte: 520,
    enfant: 400,
    bebe: 150
};

// État du formulaire
let familyMemberCount = 4;
let lastSubmittedData = null;
let lastAutoNom = '';

// Initialisations
document.addEventListener('DOMContentLoaded', function() {
    initializeFamily();
    initializeRemise();
    initializeEventListeners();
    calculateTotal();
});

// ===== SECTION FAMILLE =====
function initializeFamily() {
    const tableBody = document.getElementById('familyTableBody');
    tableBody.innerHTML = '';

    for (let i = 0; i < 4; i++) {
        addFamilyRow(false);
    }
}

function addFamilyRow(shouldCalculate = true) {
    const tableBody = document.getElementById('familyTableBody');
    const rowIndex = familyMemberCount++;

    const radioName = `memberType_${rowIndex}`;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="family-nom" placeholder="Nom"></td>
        <td><input type="text" class="family-prenom" placeholder="Prénom"></td>
        <td class="date-cell">
            <div class="member-type-selector">
                <label class="type-radio-label"><input type="radio" class="member-type-radio" name="${radioName}" value="adulte"> Adulte</label>
                <label class="type-radio-label"><input type="radio" class="member-type-radio" name="${radioName}" value="enfant"> Enfant</label>
                <label class="type-radio-label"><input type="radio" class="member-type-radio" name="${radioName}" value="bebe"> Bébé</label>
            </div>
        </td>
        <td><span class="family-tarif-display">-</span></td>
        <td>
            <button type="button" class="btn-delete-row" onclick="deleteFamilyRow(this)">Supprimer</button>
        </td>
    `;

    tableBody.appendChild(row);

    const contactNom = document.getElementById('nomContact').value.trim();
    if (contactNom) {
        row.querySelector('.family-nom').value = contactNom;
        lastAutoNom = contactNom;
    }

    const tarifDisplay = row.querySelector('.family-tarif-display');
    const TYPE_PRICES = { adulte: PRICES.adulte, enfant: PRICES.enfant, bebe: PRICES.bebe };

    function updateDisplay() {
        const typeSelected = row.querySelector('.member-type-radio:checked');
        if (typeSelected) {
            tarifDisplay.textContent = TYPE_PRICES[typeSelected.value] + '€';
        } else {
            tarifDisplay.textContent = '-';
        }
        calculateTotal();
    }

    // Permettre de décocher un radio en cliquant dessus à nouveau
    row.querySelectorAll('.member-type-radio').forEach(radio => {
        radio.addEventListener('click', function() {
            if (this.dataset.wasChecked === 'true') {
                this.checked = false;
                this.dataset.wasChecked = 'false';
            } else {
                row.querySelectorAll('.member-type-radio').forEach(r => r.dataset.wasChecked = 'false');
                this.dataset.wasChecked = 'true';
            }
            updateDisplay();
        });
    });

    if (shouldCalculate) {
        calculateTotal();
    }
}

function deleteFamilyRow(btn) {
    const row = btn.closest('tr');
    row.remove();
    calculateTotal();
}

document.addEventListener('click', function(e) {
    if (e.target.id === 'addMemberBtn') {
        e.preventDefault();
        addFamilyRow(true);
    }
});

// ===== REMISE =====
function initializeRemise() {
    const remiseCheck = document.getElementById('remiseCheck');
    const remiseAmount = document.getElementById('remiseAmount');
    const remiseOptions = document.getElementById('remiseOptions');

    remiseCheck.addEventListener('change', function() {
        if (this.checked) {
            remiseOptions.style.display = 'block';
            remiseAmount.disabled = false;
            remiseAmount.value = '';
        } else {
            remiseOptions.style.display = 'none';
            remiseAmount.disabled = true;
            remiseAmount.value = '';
        }
        calculateTotal();
    });

    remiseAmount.addEventListener('change', calculateTotal);
    remiseAmount.addEventListener('input', calculateTotal);

    document.getElementById('paiementIntegral').addEventListener('change', calculateTotal);
}

// ===== HELPERS COMPTAGE FAMILLE =====
function getFamilyCounts() {
    let adulte = 0, enfant = 0, bebe = 0;
    document.querySelectorAll('#familyTableBody tr').forEach(row => {
        const typeSelected = row.querySelector('.member-type-radio:checked');
        if (typeSelected) {
            if (typeSelected.value === 'bebe') bebe++;
            else if (typeSelected.value === 'enfant') enfant++;
            else adulte++;
        }
    });
    return { adulte, enfant, bebe, total: adulte + enfant + bebe };
}

// ===== CALCULS =====
function calculateTotal() {
    let tarifAdulte = 0, tarifEnfant = 0, tarifBebe = 0;
    let countAdulte = 0, countEnfant = 0, countBebe = 0;

    document.querySelectorAll('#familyTableBody tr').forEach(row => {
        const typeSelected = row.querySelector('.member-type-radio:checked');
        if (typeSelected) {
            if (typeSelected.value === 'bebe') { tarifBebe += PRICES.bebe; countBebe++; }
            else if (typeSelected.value === 'enfant') { tarifEnfant += PRICES.enfant; countEnfant++; }
            else { tarifAdulte += PRICES.adulte; countAdulte++; }
        }
    });

    const total = tarifAdulte + tarifEnfant + tarifBebe;

    // Calculer la remise
    let remiseAmount = 0;
    let remisePercentage = 0;
    if (document.getElementById('remiseCheck').checked) {
        remiseAmount = parseInt(document.getElementById('remiseAmount').value) || 0;
        if (remiseAmount > 0 && total > 0) {
            remisePercentage = Math.round(((total - remiseAmount) / total) * 100);
        }
    }

    const finalTotal = remiseAmount > 0 ? remiseAmount : total;
    const acompte = Math.round(finalTotal * 0.5);
    const solde = finalTotal - acompte;

    // Mettre à jour le récapitulatif
    document.getElementById('recapAdulteLabel').textContent =
        countAdulte > 0 ? `Adultes : ${countAdulte} × ${PRICES.adulte}€` : 'Adultes :';
    document.getElementById('recapAdulte').textContent = formatPrice(tarifAdulte);

    document.getElementById('recapEnfantLabel').textContent =
        countEnfant > 0 ? `Enfants : ${countEnfant} × ${PRICES.enfant}€` : 'Enfants :';
    document.getElementById('recapEnfant').textContent = formatPrice(tarifEnfant);

    document.getElementById('recapBebeLabel').textContent =
        countBebe > 0 ? `Bébés : ${countBebe} × ${PRICES.bebe}€` : 'Bébés :';
    document.getElementById('recapBebe').textContent = formatPrice(tarifBebe);

    // Afficher le total correct (avec ou sans remise)
    if (remiseAmount > 0 && remisePercentage > 0) {
        document.getElementById('recapTotal').textContent = formatPrice(remiseAmount);

        const recapRemise = document.getElementById('recapRemise');
        recapRemise.style.display = 'block';
        recapRemise.innerHTML = `<span style="color: #27ae60; font-weight: 600;">Réduction appliquée: ${formatPrice(total - remiseAmount)} (-${remisePercentage}%)</span>`;
    } else {
        document.getElementById('recapTotal').textContent = formatPrice(total);

        const recapRemise = document.getElementById('recapRemise');
        recapRemise.style.display = 'none';
    }

    const paiementIntegral = document.getElementById('paiementIntegral').checked;
    if (paiementIntegral) {
        document.getElementById('recapAcompteRow').style.display = 'none';
        document.getElementById('recapSoldeRow').style.display = 'none';
        document.getElementById('recapRegleRow').style.display = '';
        document.getElementById('recapRegle').textContent = formatPrice(finalTotal);
    } else {
        document.getElementById('recapAcompteRow').style.display = '';
        document.getElementById('recapSoldeRow').style.display = '';
        document.getElementById('recapRegleRow').style.display = 'none';
        document.getElementById('recapAcompte').textContent = formatPrice(acompte);
        document.getElementById('recapSolde').textContent = formatPrice(solde);
    }
}

function formatPrice(price) {
    return price.toLocaleString('fr-FR') + '€';
}

// ===== ÉVÉNEMENTS FORMULAIRE =====
function initializeEventListeners() {
    const form = document.getElementById('inscriptionForm');
    form.addEventListener('submit', handleFormSubmit);

    document.getElementById('nomContact').addEventListener('input', function() {
        const newNom = this.value.trim();
        // Ne recopie que sur les lignes pas encore touchées à la main (vides ou encore
        // égales au dernier nom auto-rempli), pour ne jamais écraser un nom de famille
        // saisi manuellement (ex: membre avec un nom différent du contact).
        document.querySelectorAll('#familyTableBody .family-nom').forEach(input => {
            if (input.value.trim() === '' || input.value === lastAutoNom) {
                input.value = newNom;
            }
        });
        lastAutoNom = newNom;
    });
}

function showStatus(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;

    if (type === 'success') {
        setTimeout(() => {
            statusMessage.className = 'status-message';
        }, 5000);
    }
}

function validateForm() {
    const nomContact = document.getElementById('nomContact').value.trim();
    const prenomContact = document.getElementById('prenomContact').value.trim();

    if (!nomContact) {
        showStatus('⚠️ Veuillez saisir votre nom', 'error');
        return false;
    }

    if (!prenomContact) {
        showStatus('⚠️ Veuillez saisir votre prénom', 'error');
        return false;
    }

    return true;
}

function getFamilyMembers() {
    const members = [];
    document.querySelectorAll('#familyTableBody tr').forEach(row => {
        const nom = row.querySelector('.family-nom').value.trim();
        const prenom = row.querySelector('.family-prenom').value.trim();
        const typeSelected = row.querySelector('.member-type-radio:checked');
        const categorie = typeSelected ? typeSelected.value : '';

        if (prenom || categorie) {
            members.push({
                nom: nom || '',
                prenom: prenom || '',
                categorie: categorie
            });
        }
    });

    return members;
}

function getFormData() {
    let tarifAdulte = 0, tarifEnfant = 0, tarifBebe = 0;
    let countAdulte = 0, countEnfant = 0, countBebe = 0;

    document.querySelectorAll('#familyTableBody tr').forEach(row => {
        const typeSelected = row.querySelector('.member-type-radio:checked');
        if (typeSelected) {
            if (typeSelected.value === 'bebe') { tarifBebe += PRICES.bebe; countBebe++; }
            else if (typeSelected.value === 'enfant') { tarifEnfant += PRICES.enfant; countEnfant++; }
            else { tarifAdulte += PRICES.adulte; countAdulte++; }
        }
    });

    const total = tarifAdulte + tarifEnfant + tarifBebe;

    // Calculer la remise
    let remiseAmount = 0;
    if (document.getElementById('remiseCheck').checked) {
        remiseAmount = parseInt(document.getElementById('remiseAmount').value) || 0;
    }

    const finalTotal = remiseAmount > 0 ? remiseAmount : total;
    const acompte = Math.round(finalTotal * 0.5);
    const solde = finalTotal - acompte;
    const remiseDifference = remiseAmount > 0 ? (total - remiseAmount) : 0;
    const remisePourcentage = (remiseAmount > 0 && total > 0) ? Math.round((remiseDifference / total) * 100) : 0;

    return {
        nomContact: document.getElementById('nomContact').value.trim(),
        prenomContact: document.getElementById('prenomContact').value.trim(),
        portable: document.getElementById('portable').value.trim() || '',
        emailContact: document.getElementById('emailContact').value.trim() || '',
        familleMembers: getFamilyMembers(),
        familleJSON: JSON.stringify(getFamilyMembers()),
        nombrePersonnes: getFamilyMembers().length,
        chambresAdultes: countAdulte,
        chambresEnfants: countEnfant,
        bebes: countBebe,
        tarifChambresAdultes: tarifAdulte,
        tarifChambresEnfants: tarifEnfant,
        tarifBebes: tarifBebe,
        notes: document.getElementById('notes').value.trim() || '',
        paiementIntegral: document.getElementById('paiementIntegral').checked,
        remiseAppliquee: remiseAmount > 0 ? 'Oui' : 'Non',
        remiseAmount: remiseAmount,
        remiseDifference: remiseDifference,
        remisePourcentage: remisePourcentage,
        totalEUR: total,
        totalApresRemise: finalTotal,
        acomptEUR: acompte,
        soldeEUR: solde,
        dateSoumission: new Date().toLocaleDateString('fr-FR'),
        timestamp: new Date().toISOString()
    };
}

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    showStatus('⏳ Envoi de votre inscription...', 'loading');

    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        const formData = getFormData();
        lastSubmittedData = formData;

        // 1. Envoyer à Google Apps Script (sheets uniquement — inchangé)
        await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        // 2. Générer le PDF et envoyer au backend pour l'email
        const pdfBase64 = generateDevisPDF(formData, false);
        if (CONFIG.EMAIL_SERVICE_URL && CONFIG.EMAIL_SERVICE_URL !== 'YOUR_SOUCCOT_EMAIL_SERVICE_URL') {
            fetch(CONFIG.EMAIL_SERVICE_URL + '/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData, pdfBase64 })
            }).catch(err => console.warn('Email non envoyé:', err));
        }

        const statusMessage = document.getElementById('statusMessage');
        statusMessage.innerHTML = `
            ✅ Inscription envoyée avec succès ! Un email de confirmation va vous être envoyé.
            <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                <button type="button" id="downloadPdfBtn" class="btn-download-pdf">📄 Télécharger mon devis</button>
                <button type="button" id="newInscriptionBtn" class="btn-reset" style="margin:0;">🆕 Nouvelle inscription</button>
            </div>
            <p style="margin:8px 0 0;font-size:0.88em;opacity:0.85;">Vous pouvez corriger le formulaire et le re-soumettre si nécessaire.</p>
        `;
        statusMessage.className = 'status-message success';
        submitBtn.disabled = false;

        document.getElementById('downloadPdfBtn').onclick = () => generateDevisPDF(formData, true);
        document.getElementById('newInscriptionBtn').onclick = () => {
            document.getElementById('inscriptionForm').reset();
            initializeFamily();
            calculateTotal();
            statusMessage.className = 'status-message';
            statusMessage.innerHTML = '';
        };

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        showStatus('❌ Une erreur s\'est produite lors de l\'envoi. Veuillez réessayer ou contacter l\'administrateur.', 'error');
        submitBtn.disabled = false;
    }
}

// ===== PDF GENERATION =====
function generateDevisPDF(formData, download = true) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const primaryColor   = [140, 61, 12];
    const secondaryColor = [194, 65, 12];
    const greenColor     = [39, 174, 96];

    let y = 10;

    function checkBreak(needed) {
        if (y + (needed || 10) > 278) { doc.addPage(); y = 12; }
    }

    function sectionHead(title) {
        checkBreak(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.text(title, 10, y);
        y += 7;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8.5);
    }

    // ── HEADER ──────────────────────────────────────────────
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("CONFIRMATION D'INSCRIPTION", 105, 10, { align: 'center' });
    doc.setFontSize(11);
    doc.text('LOISIREL SOUCCOT 2026 - HÔTEL MILLENIUM CDG', 105, 18, { align: 'center' });
    y = 29;

    // ── INFORMATIONS DE CONTACT ──────────────────────────────
    sectionHead('INFORMATIONS DE CONTACT');
    doc.setFontSize(9);
    doc.text('Nom : ' + formData.nomContact + '     Prénom : ' + formData.prenomContact + '     Tél : ' + (formData.portable || 'N/A'), 10, y);
    y += 5;
    doc.text('Email : ' + (formData.emailContact || 'N/A'), 10, y);
    y += 8;

    // ── MEMBRES DE LA FAMILLE ────────────────────────────────
    sectionHead('MEMBRES DE LA FAMILLE');
    doc.setFontSize(8.5);
    if (formData.familleMembers && formData.familleMembers.length > 0) {
        const CAT_LABELS = { adulte: 'Adulte', enfant: 'Enfant', bebe: 'Bébé' };
        formData.familleMembers.forEach((m, i) => {
            checkBreak(5);
            const info = m.categorie ? ' (' + (CAT_LABELS[m.categorie] || m.categorie) + ')' : '';
            doc.text((i + 1) + '. ' + m.nom + ' ' + m.prenom + info, 10, y);
            y += 5;
        });
    }
    y += 4;

    // ── TARIF PAR PERSONNE ───────────────────────────────────
    sectionHead('TARIF PAR PERSONNE (SÉJOUR 3 JOURS)');
    doc.setFontSize(8.5);
    if ((formData.chambresAdultes || 0) > 0) {
        doc.text('Adultes : ' + formData.chambresAdultes + ' x 520€ = ' + formData.tarifChambresAdultes + '€', 10, y); y += 5;
    }
    if ((formData.chambresEnfants || 0) > 0) {
        doc.text('Enfants : ' + formData.chambresEnfants + ' x 400€ = ' + formData.tarifChambresEnfants + '€', 10, y); y += 5;
    }
    if ((formData.bebes || 0) > 0) {
        doc.text('Bébés : ' + formData.bebes + ' x 150€ = ' + formData.tarifBebes + '€', 10, y); y += 5;
    }
    y += 4;

    // ── NOTES ────────────────────────────────────────────────
    if (formData.notes) {
        sectionHead('NOTES');
        doc.setFontSize(8.5);
        const noteLines = doc.splitTextToSize(formData.notes, 190);
        doc.text(noteLines, 10, y);
        y += noteLines.length * 5 + 4;
    }

    // ── RÉSUMÉ FINANCIER ─────────────────────────────────────
    checkBreak(40);
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.8);
    doc.line(10, y, 200, y);
    y += 5;

    sectionHead('RÉSUMÉ FINANCIER');
    doc.setFontSize(9);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);

    // Total avant remise (uniquement si remise appliquée)
    const hasRemise = formData.remiseAppliquee === 'Oui' && (formData.remiseAmount || 0) > 0;
    if (hasRemise) {
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text('Total avant remise :', 10, y);
        doc.text(formData.totalEUR + '€', 180, y, { align: 'right' });
        y += 6;
    }

    // Bannière TOTAL
    const finalTotal = hasRemise ? formData.totalApresRemise : formData.totalEUR;
    doc.setFillColor(...secondaryColor);
    doc.rect(10, y - 2, 190, 7, 'F');
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(hasRemise ? 'TOTAL APRES REMISE :' : 'TOTAL :', 10, y + 2);
    doc.text(finalTotal + '€', 180, y + 2, { align: 'right' });
    y += 10;

    // Remise en vert à gauche (uniquement si remise appliquée)
    if (hasRemise && formData.totalEUR > 0) {
        const pct = Math.round(((formData.totalEUR - formData.remiseAmount) / formData.totalEUR) * 100);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...greenColor);
        doc.setFontSize(11);
        doc.text('REDUCTION : -' + pct + '%', 10, y);
        y += 7;
    }

    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    if (formData.paiementIntegral) {
        doc.setTextColor(...greenColor);
        doc.setFontSize(10);
        doc.text('TOTAL RÉGLÉ EN INTÉGRALITÉ', 10, y);
        doc.text(finalTotal + '€', 180, y, { align: 'right' });
        y += 8;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(9);
    } else {
        doc.text('Acompte 50% :', 10, y);
        doc.text(formData.acomptEUR + '€', 180, y, { align: 'right' });
        y += 5;
        doc.text('Solde :', 10, y);
        doc.text(formData.soldeEUR + '€', 180, y, { align: 'right' });
        y += 8;
    }

    // ── RÈGLEMENT ────────────────────────────────────────────
    sectionHead('REGLEMENT');
    doc.setFontSize(8.5);
    doc.text('IBAN : FR76 1820 6002 1365 0425 2422 502   |   BIC : AGRFRPP882', 10, y); y += 5;
    doc.text('Libelle du virement : Nom Prenom - Souccot 2026', 10, y); y += 7;

    // ── CONDITIONS GÉNÉRALES ─────────────────────────────────
    sectionHead('CONDITIONS GENERALES');
    doc.setFontSize(8);
    const conds = [
        'Annulation : Plus de 30 jours avant le depart - votre acompte sera retenu.',
        '15 jours avant le depart : 50% de la somme sera retenu.',
        "Tout voyage interrompu ou abrege du fait du participant pour quelque cause que ce soit, ne donnera lieu a aucun remboursement."
    ];
    conds.forEach(c => {
        const lines = doc.splitTextToSize('- ' + c, 186);
        checkBreak(lines.length * 3.8 + 1);
        doc.text(lines, 10, y);
        y += lines.length * 3.8 + 0.5;
    });

    // ── FOOTER — fixé au bas de la page ──────────────────────
    y = Math.max(y + 4, 270);
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(10, 276, 200, 276);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Millennium Hotel Paris Charles de Gaulle - 2 Allée du Verger, 95700 Roissy-en-France   |   Date : ' + formData.dateSoumission, 105, 281, { align: 'center' });

    // ── SAVE / RETURN ─────────────────────────────────────────
    const filename = 'Devis_Souccot_' + formData.nomContact + '_' + formData.prenomContact + '_' + new Date().getTime() + '.pdf';
    if (download) {
        doc.save(filename);
    }
    // Toujours retourner le base64 pour l'envoi email
    return doc.output('datauristring').split(',')[1];
}
