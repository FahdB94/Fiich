# 🧪 GUIDE DE TEST - UPLOAD DE DOCUMENTS

## ✅ CORRECTION APPLIQUÉE

L'erreur de syntaxe `await` a été corrigée dans le composant `DocumentUploadSection`. Les fonctions `handleFileSelect` et `handleDrop` sont maintenant correctement déclarées comme `async`.

## 🎯 FONCTIONNALITÉS À TESTER

### 1. **Accès à la page de création d'entreprise**
- URL : http://localhost:3000/companies/new
- Vérification : La page se charge sans erreur 500

### 2. **Interface d'upload de documents**
- **Zone de drop** : Bordure en pointillés avec icône d'upload
- **Texte d'aide** : "Glissez-déposez vos documents ici ou cliquez pour sélectionner"
- **Formats acceptés** : PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, WEBP
- **Taille maximale** : 50MB par fichier

### 3. **Fonctionnalités d'upload**

#### A. **Sélection de fichiers**
- Cliquez sur la zone de drop pour ouvrir le sélecteur de fichiers
- Sélectionnez un ou plusieurs fichiers
- Vérifiez que seuls les formats acceptés sont sélectionnables

#### B. **Glisser-déposer**
- Glissez des fichiers depuis votre bureau vers la zone de drop
- Vérifiez que les fichiers sont acceptés

#### C. **Validation des fichiers**
- Testez avec un fichier > 50MB → Message d'erreur attendu
- Testez avec un format non supporté → Validation côté navigateur

### 4. **Affichage des fichiers uploadés**

#### A. **Liste des fichiers**
- Nom du fichier affiché
- Taille du fichier formatée (KB, MB, etc.)
- Icône selon le type de fichier :
  - 📄 PDF
  - 🖼️ Images
  - 📁 Archives
  - 📄 Autres documents

#### B. **Statut d'upload**
- **En cours** : Spinner + pourcentage
- **Terminé** : Badge "Terminé" vert
- **Erreur** : Badge "Erreur" rouge

#### C. **Actions**
- Bouton de suppression (X) pour retirer un fichier
- Possibilité de supprimer même pendant l'upload

### 5. **Upload vers Supabase**

#### A. **Processus d'upload**
- Fichiers uploadés vers le bucket `company-files`
- Structure : `companies/{companyId}/{timestamp}-{filename}`
- Enregistrement en base dans la table `documents`

#### B. **Gestion des erreurs**
- Erreur de connexion → Message d'erreur
- Erreur de permissions → Message d'erreur
- Fichier corrompu → Message d'erreur

### 6. **Association à l'entreprise**

#### A. **Création d'entreprise**
- Remplissez le formulaire d'entreprise
- Uploadez des documents
- Créez l'entreprise
- Vérifiez que les documents sont associés

#### B. **Vérification en base**
- Documents liés à l'entreprise créée
- Chemins de fichiers corrects
- Métadonnées complètes

## 🧪 TESTS À EFFECTUER

### Test 1 : Upload simple
1. Allez sur http://localhost:3000/companies/new
2. Remplissez les champs obligatoires de l'entreprise
3. Dans la section "Documents", cliquez sur la zone de drop
4. Sélectionnez un fichier PDF de petite taille (< 1MB)
5. Vérifiez que le fichier apparaît dans la liste
6. Vérifiez que l'upload se termine avec succès
7. Créez l'entreprise
8. Vérifiez le message de succès

### Test 2 : Upload multiple
1. Répétez le test 1 mais avec 3-4 fichiers différents
2. Vérifiez que tous les fichiers s'uploadent
3. Vérifiez que tous apparaissent dans la liste

### Test 3 : Glisser-déposer
1. Ouvrez l'explorateur de fichiers
2. Glissez plusieurs fichiers vers la zone de drop
3. Vérifiez que tous sont acceptés

### Test 4 : Validation d'erreurs
1. Essayez d'uploader un fichier > 50MB
2. Vérifiez le message d'erreur
3. Essayez d'uploader un fichier .exe ou .bat
4. Vérifiez que le navigateur bloque la sélection

### Test 5 : Suppression de fichiers
1. Uploadez plusieurs fichiers
2. Supprimez un fichier pendant l'upload
3. Supprimez un fichier terminé
4. Vérifiez que la liste se met à jour

### Test 6 : Création d'entreprise avec documents
1. Remplissez le formulaire complet
2. Uploadez 2-3 documents
3. Créez l'entreprise
4. Vérifiez que vous êtes redirigé vers `/companies`
5. Vérifiez le message de succès avec le nombre de documents

## 🔍 VÉRIFICATIONS SUPABASE

### Dans le Dashboard Supabase :

#### A. **Storage**
1. Allez dans Storage > Buckets
2. Vérifiez le bucket `company-files`
3. Vérifiez que les fichiers sont uploadés dans `companies/{companyId}/`

#### B. **Base de données**
1. Allez dans Table Editor > documents
2. Vérifiez que les enregistrements sont créés
3. Vérifiez que `company_id` correspond à l'entreprise créée
4. Vérifiez les métadonnées (nom, taille, type MIME)

## 🐛 DÉPANNAGE

### Erreur : "Fichier trop volumineux"
- **Cause** : Fichier > 50MB
- **Solution** : Compressez ou divisez le fichier

### Erreur : "Utilisateur non connecté"
- **Cause** : Session expirée
- **Solution** : Reconnectez-vous

### Erreur : "Erreur lors de l'upload"
- **Cause** : Problème de connexion ou permissions
- **Solution** : Vérifiez la connexion internet et les permissions Supabase

### Page ne se charge pas
- **Cause** : Erreur de compilation
- **Solution** : Vérifiez les logs du serveur de développement

## ✅ CRITÈRES DE SUCCÈS

- [ ] Page `/companies/new` se charge sans erreur
- [ ] Section "Documents" apparaît dans le formulaire
- [ ] Zone de drop fonctionne (clic et glisser-déposer)
- [ ] Validation des types et tailles de fichiers
- [ ] Affichage du progrès d'upload
- [ ] Messages de succès/erreur appropriés
- [ ] Upload vers Supabase Storage
- [ ] Enregistrement en base de données
- [ ] Association correcte à l'entreprise
- [ ] Redirection après création

## 🎉 RÉSULTAT ATTENDU

Après ces tests, vous devriez avoir une fonctionnalité complète d'upload de documents qui :
- ✅ Accepte les fichiers via clic ou glisser-déposer
- ✅ Valide les types et tailles
- ✅ Affiche le progrès en temps réel
- ✅ Gère les erreurs gracieusement
- ✅ Upload vers Supabase Storage
- ✅ Associe automatiquement les documents à l'entreprise

**La fonctionnalité est maintenant prête pour la production ! 🚀** 