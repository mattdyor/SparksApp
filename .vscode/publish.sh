#!/bin/bash
set -e

echo "🚀 Starting publish workflow..."

# check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed."
    exit 1
fi

# check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: GitHub CLI is not authenticated. Please run 'gh auth login'."
    exit 1
fi

# Add all changes
echo "📦 Staging changes..."
git add .

# Commit changes
if ! git diff-index --quiet HEAD --; then
    echo "💾 Committing changes..."
    
    # Prompt for commit message
    echo "Please enter a brief description of your changes (press Enter for default):"
    read -r MESSAGE
    
    if [ -z "$MESSAGE" ]; then
        MESSAGE="Publishing changes"
    fi
    
    git commit -m "$MESSAGE"
else
    echo "ℹ️ No changes to commit."
    # Try to grab the last commit message for the PR title
    MESSAGE=$(git log -1 --pretty=%s)
fi

# Determine current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    echo "⚠️ Warning: You are on the $BRANCH branch."
    echo "It is highly recommended to create a feature branch before publishing."
    echo "Example: git checkout -b my-new-feature"
    # Don't exit here, as some users might have push access to main, 
    # but the instructions say they shouldn't.
fi

# Push changes
echo "⬆️ Pushing changes to remote 'origin'..."
# Ensure upstream is set so gh pr create knows where to look
if git push -u origin "$BRANCH"; then
    echo "✅ Changes pushed successfully."
else
    echo "❌ Error: Failed to push changes to origin."
    echo "Make sure you have write access to the fork."
    exit 1
fi

# Create PR
echo "🔀 Creating Pull Request..."

# Helper: parse owner/repo from a remote URL
parse_owner_repo() {
    url="$1"
    # handle formats like git@github.com:owner/repo.git or https://github.com/owner/repo.git
    echo "$url" | sed -E 's#.*[:/](.+/.+?)(\.git)?$#\1#'
}

# Get fork (origin) and upstream (parent) remotes
ORIGIN_URL=$(git remote get-url origin 2>/dev/null || true)
UPSTREAM_URL=$(git remote get-url upstream 2>/dev/null || true)

ORIGIN_REPO=$(parse_owner_repo "$ORIGIN_URL")
UPSTREAM_REPO=$(parse_owner_repo "$UPSTREAM_URL")

# If no upstream is configured, treat origin as upstream (user likely has push access)
if [ -z "$UPSTREAM_REPO" ]; then
    UPSTREAM_REPO="$ORIGIN_REPO"
fi

# Extract owner (user/org) for head ref
FORK_OWNER=$(echo "$ORIGIN_REPO" | cut -d'/' -f1)

# Build head ref as owner:branch
HEAD_REF="$FORK_OWNER:$BRANCH"

echo "📝 Creating PR from $HEAD_REF to $UPSTREAM_REPO:main"

# Attempt to create PR
# Use the custom message for title and body
if gh pr create --repo "$UPSTREAM_REPO" --base main --head "$HEAD_REF" --title "$MESSAGE" --body "Automated PR created via Sparks Publish workflow."; then
    echo "✅ Pull Request created successfully!"
else
    echo "⚠️ Failed to create PR via CLI."
    echo "This often happens if a PR already exists or if there's a permission issue."
    echo "You can try creating it manually at: https://github.com/$UPSTREAM_REPO/compare"
fi

echo "🎉 Publish complete!"
