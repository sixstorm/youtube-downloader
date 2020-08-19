# Log
$logFile = "C:\Users\sixst\OneDrive\Web\Youtube\templog.log"

# Find all files older than 1 week and delete
$files = Get-ChildItem C:\Users\sixst\OneDrive\Web\Youtube\temp | Where-Object { $_.DateCreated -gt (Get-Date).AddDays(-7) } | ForEach-Object { $_.FullName }
$files | ForEach-Object {
    Add-Content -Path $logFile -Value $_
    Remove-Item $_ -WhatIf
}

