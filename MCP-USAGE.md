# 🚀 Guide d'Utilisation du Serveur MCP Supabase

## ✅ État Actuel

Le serveur MCP Supabase est maintenant **entièrement fonctionnel** et configuré correctement dans Cursor.

## 🔧 Configuration

### Fichier de Configuration MCP
Le fichier `.cursor/mcp.json` est configuré pour utiliser le serveur MCP personnalisé :

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["mcp/supabase-mcp.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://eiawccnqfmvdnvjlyftx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

## 🛠️ Outils Disponibles

### 1. `list_tables`
**Description**: Liste toutes les tables de la base de données
**Paramètres**: 
- `schema` (optionnel, défaut: "public")

**Exemple d'utilisation**:
```json
{
  "name": "list_tables",
  "arguments": {"schema": "public"}
}
```

### 2. `describe_table`
**Description**: Décrit la structure d'une table spécifique
**Paramètres**:
- `table_name` (requis)
- `schema` (optionnel, défaut: "public")

**Exemple d'utilisation**:
```json
{
  "name": "describe_table",
  "arguments": {"table_name": "users"}
}
```

### 3. `check_rls_policies`
**Description**: Vérifie les politiques RLS sur une table
**Paramètres**:
- `table_name` (requis)

**Exemple d'utilisation**:
```json
{
  "name": "check_rls_policies",
  "arguments": {"table_name": "companies"}
}
```

### 4. `cleanup_database`
**Description**: Nettoie complètement la base de données (SUPPRIME TOUT)
**Paramètres**:
- `confirmation` (requis, doit être "CONFIRM")

**Exemple d'utilisation**:
```json
{
  "name": "cleanup_database",
  "arguments": {"confirmation": "CONFIRM"}
}
```

### 5. `create_clean_schema`
**Description**: Crée le nouveau schéma propre de la base de données
**Paramètres**:
- `confirmation` (requis, doit être "CONFIRM")

**Exemple d'utilisation**:
```json
{
  "name": "create_clean_schema",
  "arguments": {"confirmation": "CONFIRM"}
}
```

### 6. `activate_rls`
**Description**: Active la sécurité RLS sur toutes les tables
**Paramètres**:
- `confirmation` (requis, doit être "CONFIRM")

**Exemple d'utilisation**:
```json
{
  "name": "activate_rls",
  "arguments": {"confirmation": "CONFIRM"}
}
```

### 7. `execute_sql`
**Description**: Exécute une requête SQL sur la base de données Supabase
**Paramètres**:
- `query` (requis)
- `description` (requis)

**Note**: Cette fonction est limitée et redirige vers les outils spécialisés.

## 🔍 Tests de Fonctionnement

Tous les outils ont été testés et fonctionnent correctement :

- ✅ `list_tables` - Liste 10 tables existantes
- ✅ `describe_table` - Décrit la structure des tables
- ✅ `check_rls_policies` - Vérifie les politiques RLS
- ✅ `cleanup_database` - Nettoie la base de données
- ✅ `create_clean_schema` - Crée le schéma propre
- ✅ `activate_rls` - Vérifie l'état RLS

## 🚀 Utilisation dans Cursor

### 1. Redémarrer Cursor
Après la configuration, redémarrez Cursor pour que les changements MCP prennent effet.

### 2. Vérifier la Connexion
Le serveur MCP devrait maintenant être disponible dans Cursor avec le nom `supabase`.

### 3. Utiliser les Outils
Vous pouvez maintenant utiliser tous les outils MCP pour interagir avec votre base de données Supabase directement depuis Cursor.

## 🔧 Dépannage

### Problème : Serveur MCP non détecté
**Solution**: Vérifiez que le fichier `.cursor/mcp.json` est correctement configuré et redémarrez Cursor.

### Problème : Erreur de connexion Supabase
**Solution**: Vérifiez que les variables d'environnement dans le fichier MCP sont correctes.

### Problème : Outils non disponibles
**Solution**: Vérifiez que le serveur MCP démarre correctement en exécutant `node mcp/supabase-mcp.js`.

## 📚 Ressources

- **Fichier MCP**: `mcp/supabase-mcp.js`
- **Configuration**: `.cursor/mcp.json`
- **Script de schéma**: `scripts/create-clean-schema.sql`

## 🎯 Prochaines Étapes

1. **Utiliser le serveur MCP** dans Cursor pour gérer votre base de données
2. **Développer de nouveaux outils** si nécessaire
3. **Automatiser les tâches** de base de données via MCP

---

**🎉 Félicitations ! Votre serveur MCP Supabase est maintenant opérationnel !**
