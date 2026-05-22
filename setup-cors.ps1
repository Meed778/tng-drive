# Configure CORS for Firebase Storage bucket
# Run this script once after cloning the project

$BUCKET = "gen-lang-client-0550066290.firebasestorage.app"

$CORS_CONFIG = @"
[
  {
    "origin": ["https://meed778.github.io", "http://localhost:*"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "x-goog-*"],
    "maxAgeSeconds": 3600
  }
]
"@

Write-Host "Configuring CORS for bucket: $BUCKET" -ForegroundColor Cyan

# Save config to temp file
$TEMP_FILE = "$env:TEMP\cors-config.json"
$CORS_CONFIG | Out-File -FilePath $TEMP_FILE -Encoding UTF8

# Run gsutil
gsutil cors set $TEMP_FILE gs://$BUCKET

if ($LASTEXITCODE -eq 0) {
    Write-Host "CORS configured successfully!" -ForegroundColor Green
    Remove-Item $TEMP_FILE
} else {
    Write-Host "Failed to configure CORS. Make sure you're authenticated with: gcloud auth login" -ForegroundColor Red
}
