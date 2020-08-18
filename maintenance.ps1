# Creds
$creds = Get-Credential

# Find all files older than 1 week
$musicFiles = Get-ChildItem C:\Users\sixst\OneDrive\Web\Youtube\music | Select-Object -First 2 | foreach { $_.FullName }
$videoFiles = Get-ChildItem C:\Users\sixst\OneDrive\Web\Youtube\videos
$destPathMP3 = "\\192.168.50.4\Youtube\MP3"
$destPathMP4 = "\\192.168.50.4\Youtube\MP4"

# Create new PSDrive
New-PSDrive -Name MP3 -PSProvider FileSystem -Root "\\192.168.50.4\Youtube\MP3" -Credential $creds

foreach ($file in $musicFiles) {
    Write-Host $file -ForegroundColor Green -BackgroundColor Black
    Move-Item $file -Destination MP3:\
}

Remove-PSDrive MP3

# 