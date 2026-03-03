# MongoDB Atlas Import Script
# This script imports all collections from the local dump to MongoDB Atlas

$uri = "mongodb+srv://grocy-db:bQCumMMXDEdOaRXC@cluster0.pzq6kly.mongodb.net/Grocy"
$dumpPath = "C:\Users\xraff\dump\Grocy"

# Array of collections to import
$collections = @(
    "Al-Fatah",
    "Jalal+Sons",
    "Metro",
    "Product+Matches",
    "Product+Recommendations",
    "Rahim+Store",
    "Raja+Sahib"
)

Write-Host "Starting MongoDB Atlas import process..." -ForegroundColor Green
Write-Host "Target Database: Grocy" -ForegroundColor Cyan
Write-Host "Total Collections: $($collections.Count)" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($collection in $collections) {
    $bsonFile = Join-Path $dumpPath "$collection.bson"
    
    Write-Host "Importing collection: $collection" -ForegroundColor Yellow
    Write-Host "File: $bsonFile" -ForegroundColor Gray
    
    try {
        $output = mongorestore --uri="$uri" --collection="$collection" "$bsonFile" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully imported $collection" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "Failed to import $collection" -ForegroundColor Red
            Write-Host "Error: $output" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "Error importing $collection : $_" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Import Summary:" -ForegroundColor Green
Write-Host "Total Collections: $($collections.Count)" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
