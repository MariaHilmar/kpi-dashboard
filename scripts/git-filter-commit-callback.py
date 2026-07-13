# Callback para git filter-repo — remove atribuição Cursor dos metadados de commit.
# Uso interno: scripts/sanitize-git-history.ps1

if commit.message:
    commit.message = commit.message.replace(
        b"Co-authored-by: Cursor <cursoragent@cursor.com>\n",
        b"",
    )
