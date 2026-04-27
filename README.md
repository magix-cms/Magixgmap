# MagixGmap

[![Release](https://img.shields.io/github/release/magix-cms/magixgmap.svg)](https://github.com/magix-cms/magixgmap/releases/latest)
[![License](https://img.shields.io/github/license/magix-cms/magixgmap.svg)](LICENSE)
[![PHP Version](https://img.shields.io/badge/php-%3E%3D%208.2-blue.svg)](https://php.net/)
[![Magix CMS](https://img.shields.io/badge/Magix%20CMS-4.x-success.svg)](https://www.magix-cms.com/)

**MagixGmap** est un plugin professionnel de gestion de cartographie (Store Locator) conçu spécifiquement pour **Magix CMS 4**. Il permet de gérer des points d'intérêt, des calculs d'itinéraires et une intégration avancée de l'API Google Maps (V3) avec support des nouveaux *Advanced Markers*.

## 🚀 Installation

1. Téléchargez et décompressez l'archive du plugin.
2. Placez le dossier `MagixGmap` dans le répertoire `plugins/` de votre installation.
3. Connectez-vous à l'administration de votre site.
4. Rendez-vous dans **Extensions** > **Gestionnaire**.
5. Cliquez sur le bouton d'installation automatique pour **MagixGmap**.

## 🌐 URL & Routage

Le plugin génère automatiquement une page publique accessible via une structure d'URL multilingue :
* **Format :** `/{lang}/magixmap/`
* *Exemple :* `https://votre-site.com/fr/magixmap/`

## 🔑 Configuration & API

Pour fonctionner, le plugin nécessite une configuration valide dans l'onglet "Configuration Globale".

* **Api Key :** Indispensable pour charger les services Google. [Obtenir une clé API](https://docs.cloud.google.com/docs/authentication/api-keys?hl=fr)
* **MapsID :** Requis pour l'utilisation des marqueurs avancés et de la personnalisation graphique. [Gérer vos Map IDs](https://developers.google.com/maps/documentation/javascript/map-ids/get-map-id?hl=fr)

## ✨ Fonctionnalités

* **Advanced Markers (API V3) :** Utilisation des nouveaux marqueurs HTML/SVG natifs pour une performance accrue.
* **Itinéraires Dynamiques :** Calcul d'itinéraires intégré via la nouvelle *Routes API* (2026).
* **Store Locator :** Liste interactive des adresses avec filtrage et centrage automatique.
* **SEO & Meta :** Gestion complète du contenu de la page, des titres SEO et des méta-descriptions par langue.
* **Geocoding :** Détection automatique des coordonnées (Latitude/Longitude) lors de la saisie d'adresses en administration via `GoogleMapDetect`.
* **Deep Linking Mobile :** Bouton natif pour ouvrir les itinéraires directement dans Apple Maps (iOS) ou Google Maps (Android).

## 📄 Licence

Ce projet est sous licence **GPLv3**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

Copyright (C) 2008 - 2026 Gerits Aurelien (Magix CMS)

Ce programme est un logiciel libre ; vous pouvez le redistribuer et/ou le modifier selon les termes de la Licence Publique Générale GNU telle que publiée par la Free Software Foundation ; soit la version 3 de la Licence, ou (à votre discrétion) toute version ultérieure.
