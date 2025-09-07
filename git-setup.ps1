# Git setup script to create master branch and push changes

Write-Host "Checking current git status..."
git status

Write-Host "`nChecking current branches..."
git branch -a

Write-Host "`nAdding all changes to staging..."
git add .

Write-Host "`nCommitting changes..."
git commit -m "enhanced endpoints using nextjs"

Write-Host "`nCreating master branch..."
git checkout -b master

Write-Host "`nPushing master branch to origin..."
git push -u origin master

Write-Host "`nOperation completed successfully!"
