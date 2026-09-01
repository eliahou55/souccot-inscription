# Bulletin d'Inscription Souccot 2026 - Guide d'Installation

## 📋 Vue d'ensemble

Ce projet est un bulletin d'inscription en ligne pour le séjour de Souccot 2026 (du vendredi 25 septembre (au soir) au lundi 28 septembre 2026 (11h00)) à l'Hôtel Millenium Charles de Gaulle. Les inscriptions sont automatiquement sauvegardées dans un Google Sheet.

**Caractéristiques:**
- ✅ Formulaire responsive et professionnel
- ✅ Calcul automatique du total et acompte
- ✅ Validation côté client et serveur
- ✅ Synchronisation directe avec Google Sheets
- ✅ Pas de frais d'hébergement (GitHub Pages / Netlify gratuit)

---

## 🚀 Installation Étape par Étape

### **ÉTAPE 1: Préparer Google Sheets**

1. Allez sur [Google Sheets](https://sheets.google.com)
2. Créez un nouveau Google Sheet (donner-lui un nom, ex: "Inscriptions Souccot 2026")
3. Vous pouvez laisser la première feuille vide - le script créera automatiquement les headers
4. ⚠️ Ce Google Sheet doit être **différent** de celui utilisé pour Pessah - chaque événement a son propre Sheet et son propre déploiement Apps Script

**Structure attendue - colonnes créées automatiquement:**
- ID Inscription, Date Soumission, Nom, Prenom, Telephone, Email
- Total Membre, Membre Famille, Adultes, Enfants, Bébés
- Tarif Total Adultes, Tarif Total Enfants, Tarif Bébés, Notes
- Réduction (€), Total, Acompte, Solde Restant, Total avant remise (€), Réduction (%), Paiement Intégral

---

### **ÉTAPE 2: Configurer Google Apps Script**

1. **Ouvrir Google Apps Script:**
   - Depuis votre Google Sheet: `Outils` → `Éditeur de script`
   - Ou allez directement à [script.google.com](https://script.google.com)

2. **Créer un nouveau projet:**
   - Cliquer sur "Nouveau projet"
   - Donner un nom au projet (ex: "Pessah Inscription API")

3. **Copier le code du backend:**
   - Supprimer le code par défaut dans `Code.gs`
   - Copier-coller tout le contenu du fichier `script.gs` fourni (version Souccot 2026)
   - Sauvegarder: `Ctrl+S` (ou `Cmd+S` sur Mac)

4. **Lier le Google Sheet au Script:**
   - Dans le script, il faut d'abord exécuter le script une fois pour qu'il soit lié
   - Cliquer sur le nom du projet en haut: `Éditeur de script non associé`
   - Sélectionner le Google Sheet créé à l'étape 1

5. **Déployer comme application Web:**
   - Cliquer sur `Déployer` → `Nouveau déploiement`
   - Choisir le type: `Application web`
   - Remplir:
     - **Exécuter en tant que:** Votre compte (xxx@gmail.com)
     - **Qui a accès:** Tout le monde
   - Cliquer sur `Déployer`

6. **Autoriser les permissions:**
   - Une fenêtre pop-up demandera la permission
   - Cliquer sur votre compte Gmail
   - Cliquer sur "Autoriser"
   - Copier l'URL de déploiement (elle ressemble à: `https://script.google.com/macros/d/1-xxxxxxxxxxx/usercopy`)

⚠️ **Important:** Cette URL est essentielle - gardez-la précieusement !

---

### **ÉTAPE 3: Configurer le formulaire**

1. **Ouvrir le fichier `form.js`**

2. **Remplacer l'URL Google Apps Script (et celle du service email si utilisé):**
   ```javascript
   const CONFIG = {
       GOOGLE_APPS_SCRIPT_URL: 'YOUR_SOUCCOT_GOOGLE_APPS_SCRIPT_URL',
       EMAIL_SERVICE_URL: 'YOUR_SOUCCOT_EMAIL_SERVICE_URL',
   };
   ```

   Remplacer par l'URL de déploiement copiée à l'étape 2.6 (et par l'URL de votre backend `/backend` si vous déployez l'envoi d'email):
   ```javascript
   const CONFIG = {
       GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/d/VOTRE_ID_SCRIPT/usercopy',
       EMAIL_SERVICE_URL: 'https://votre-backend.onrender.com',
   };
   ```

3. **Sauvegarder le fichier**

---

### **ÉTAPE 4: Tester localement**

1. **Ouvrir le formulaire:**
   - Double-cliquer sur `index.html` depuis l'explorateur de fichiers
   - Ou ouvrir avec votre navigateur préféré

2. **Test complet:**
   - Remplir le formulaire avec des données de test
   - Vérifier que les calculs du total sont corrects
   - Cliquer sur "Soumettre l'Inscription"
   - Un message vert devrait apparaître: "✅ Inscription envoyée avec succès!"

3. **Vérifier dans Google Sheets:**
   - Aller sur votre Google Sheet "Inscriptions Souccot 2026"
   - Les données de test doivent apparaître dans une nouvelle ligne
   - Les headers doivent avoir été créés automatiquement

---

### **ÉTAPE 5: Déployer sur Netlify (Gratuit)**

#### Option A: Via l'interface Netlify (le plus simple)

1. **Préparer vos fichiers:**
   - Vous devez avoir dans le même dossier:
     - `index.html`
     - `styles.css`
     - `form.js`
     - (optionnel: `README.md`)

2. **Créer un compte Netlify (ou utiliser un site Netlify dédié à Souccot, distinct de celui de Pessah):**
   - Aller sur [netlify.com](https://netlify.com)
   - Cliquer sur "Sign up"
   - S'enregistrer avec un compte GitHub (recommandé) ou email

3. **Déployer via Netlify Drop:**
   - Dans Netlify, aller à: "Sites" → "Add new site"
   - Choisir "Deploy manually"
   - Glisser-déposer le dossier contenant vos fichiers
   - Netlify va automatiquement générer une URL

#### Option B: Via GitHub + Netlify (plus robuste)

1. **Créer un repo GitHub:**
   - Allez sur [github.com](https://github.com)
   - Cliquer sur "New repository"
   - Donner un nom au repo (ex: `souccot-inscription`)
   - Sélectionner "Public"
   - Cliquer "Create repository"

2. **Uploader vos fichiers:**
   - Cliquer "uploading an existing file"
   - Ajouter: `index.html`, `styles.css`, `form.js`, `README.md`
   - Cliquer "Commit changes"

3. **Connecter Netlify:**
   - Dans Netlify: "Add new site" → "Import an existing project"
   - Connecter votre compte GitHub
   - Sélectionner le repo `souccot-inscription`
   - Laisser les paramètres par défaut
   - Cliquer "Deploy"
   - Attendez quelques secondes...
   - Votre site est en ligne ! 🎉

L'URL ressemblera à: `https://votre-site.netlify.app`

---

### **ÉTAPE 6: Optimisation et Configuration Finale**

#### Ajouter le nom de domaine (optionnel)

1. Dans Netlify: Site settings → Domain management
2. Vous pouvez ajouter un domaine personnalisé si vous en avez un

#### Créer un événement Google Sheet pour notifications (optionnel)

1. Dans votre Google Sheet: `Outils` → `Éditeur de script`
2. Ajouter une fonction pour envoyer des emails:
   ```javascript
   function sendNotificationEmail(email, senderName) {
       MailApp.sendEmail(
           email,
           '✅ Inscription Souccot reçue',
           `Bonjour ${senderName}, votre inscription a été bien reçue.`
       );
   }
   ```

---

## 🧪 Tests Complets

### Checklist avant mise en production:

- [ ] Formulaire s'affiche correctement
- [ ] Tous les champs sont fonctionnels
- [ ] Calcul du total fonctionne en temps réel
- [ ] Acompte = 50% du total
- [ ] Bouton "Soumettre" envoie bien les données
- [ ] Message de succès apparaît
- [ ] Les données s'ajoutent au Google Sheet
- [ ] Les données sont correctement formatées dans le Sheet
- [ ] Le formulaire fonctionne sur mobile
- [ ] Le formulaire fonctionne sur tous les navigateurs

---

## 📱 Utilisation en Production

### URL finale:
Partagez cette URL avec vos participants:
```
https://votre-site.netlify.app
```

### Suivi des inscriptions:
1. Ouvrir votre Google Sheet
2. Voir toutes les inscriptions en temps réel
3. Télécharger/exporter les données quand besoin

---

## 🔧 Dépannage

### ❌ Le formulaire ne soumet pas les données

**Problème:** Le message d'erreur apparaît

**Solutions:**
1. Vérifier que l'URL Google Apps Script est correct dans `form.js`
2. Vérifier que le Google Apps Script est bien déployé
3. Ouvrir la console du navigateur (F12) pour voir les erreurs
4. Vérifier que le Google Sheet existe

### ❌ Les données n'apparaissent pas dans Google Sheets

**Solutions:**
1. Vérifier que le Google Apps Script a les bonnes permissions
2. Vérifier le nom de la feuille (doit être "Inscriptions")
3. Ouvrir le script Google Apps Script et regénérer un nouveau déploiement

### ❌ Le formulaire ne s'affiche pas correctement sur mobile

**Solutions:**
1. Rafraîchir la page (Ctrl+F5)
2. Vérifier les paramètres de zoom du navigateur (100%)
3. Tester avec un autre navigateur

### ❌ Google Apps Script retourne une erreur de CORS

**Solution:** Ce n'est pas un problème - Google Apps Script accepte les requêtes cross-origin par défaut. Si ça bloque, ajouter au script:

```javascript
function doOptions(e) {
    return HtmlService.createHtmlOutput()
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
```

---

## 📞 Support

Si vous avez besoin d'aide:
1. Vérifier que tous les fichiers sont au bon endroit
2. Vérifier les erreurs dans la console du navigateur (F12)
3. Vérifier les logs dans Google Apps Script (Exécutions → Logs)

---

## 👤 Infos Hôtel

```
Millennium Hotel Paris Charles de Gaulle
2 Allée du Verger
95700 Roissy-en-France, France

Séjour: du vendredi 25 septembre (au soir) au lundi 28 septembre 2026 (11h00)

Titulaire du compte: TOVEL
IBAN: FR76 1820 6002 1365 0425 2422 502
Code AGRFRPP882

Contact: Téléphone/WhatsApp 06 12 20 28 61 - loisirel@hotmail.fr
Code espace organisateur (sélection de chambres): 2861
```

---

## 📝 Notes Importantes

- ✅ Les acomptes sont automatiquement calculés à 50% du total
- ✅ Le solde est calculé automatiquement (Total - Acompte)
- ✅ Les données sont sauvegardées en temps réel
- ✅ Tous les champs marqués avec * sont obligatoires
- ✅ Les champs optionnels peuvent être laissés vides
- ✅ Le formulaire valide les données avant d'envoyer
- ✅ Les tarifs sont en euros (€)

---

**Bonne chance avec vos inscriptions Souccot 2026! 🎉**
