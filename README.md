# Enrico Genco - Osteopathe a Bruxelles

Site web professionnel avec systeme de prise de rendez-vous en ligne connecte a Google Calendar.

## Deploiement du site

Le site est heberge sur GitHub Pages. Il est automatiquement deploye depuis la branche `main`.

URL : https://maxc55.github.io/enrico-genco-osteopathe

## Configuration du backend Google Calendar

Le systeme de reservation utilise Google Apps Script comme backend gratuit pour se connecter a Google Calendar.

### Etapes de configuration :

1. **Creer le Google Apps Script :**
   - Connectez-vous au compte Google d'Enrico (enricogenco700m@gmail.com)
   - Allez sur [script.google.com](https://script.google.com)
   - Cliquez sur "Nouveau projet"
   - Supprimez le contenu par defaut et collez le contenu du fichier `apps-script/Code.gs`

2. **Deployer l'application web :**
   - Cliquez sur "Deployer" > "Nouveau deploiement"
   - Type : "Application Web"
   - Executer en tant que : "Moi"
   - Acces : "Tout le monde"
   - Cliquez sur "Deployer"
   - **Autorisez l'acces** quand Google le demande (acces au calendrier et aux emails)
   - Copiez l'URL du deploiement

3. **Connecter le frontend :**
   - Ouvrez `js/booking.js`
   - Remplacez la valeur de `APPS_SCRIPT_URL` (ligne 3) par l'URL copiee
   - Committez et poussez le changement

4. **Tester :**
   - Allez sur le site et essayez de prendre un rendez-vous
   - Verifiez que l'evenement apparait dans Google Calendar
   - Verifiez que les emails de confirmation sont envoyes

### Fonctionnement :

- **GET** `?action=getSlots&date=YYYY-MM-DD` : Retourne les creneaux deja reserves pour une date
- **POST** `{action: 'book', ...}` : Reserve un creneau, cree l'evenement dans Google Calendar, et envoie les emails de confirmation

### Personnalisation des creneaux :

Modifiez la variable `SLOTS` dans `js/booking.js` et dans `apps-script/Code.gs` pour ajuster les horaires disponibles.

## Structure du projet

```
index.html          - Page principale
css/style.css       - Styles
js/booking.js       - Logique frontend (calendrier + reservation)
apps-script/Code.gs - Backend Google Apps Script
assets/portrait.png - Photo de profil
```
