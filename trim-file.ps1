$trimmedPath = "D:\Data\working\practice\blog-frontend\blog-fe\src\components\PostModal.tsx.trimmed"
$originalPath = "D:\Data\working\practice\blog-frontend\blog-fe\src\components\PostModal.tsx"

# Copy trimmed to original
Copy-Item -Path $trimmedPath -Destination $originalPath -Force

# Verify
$lines = @(Get-Content $originalPath)
Write-Host "File trimmed. New line count: $($lines.Count)"
Write-Host "Last 5 lines:"
$lines[-5..-1] | ForEach-Object { Write-Host $_ }
