# ============================================================================
# DocumentDB Data Import Script
# ============================================================================
#
# PURPOSE:
# Imports all BSON collections from the local Grocy dump into the
# AWS DocumentDB cluster using mongorestore with TLS authentication.
#
# PREREQUISITES:
# 1. MongoDB Database Tools installed (mongorestore)
#    Download: https://www.mongodb.com/try/download/database-tools
#
# 2. AWS global-bundle.pem certificate at:
#    C:\Users\xraff\Certificates\global-bundle.pem
#    Download: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
#
# 3. Network access to DocumentDB:
#    - You must be connected to the VPC (e.g., via SSH tunnel, VPN, or
#      an EC2 bastion host) because DocumentDB is in private subnets.
#    - See the SSH tunnel instructions in the comments below.
#
# USAGE:
#   .\import_to_docdb.ps1 -Endpoint "<cluster-endpoint>" -Username "grocyadmin" -Password "<password>"
#
# WITH SSH TUNNEL (most common):
#   1. First, open the SSH tunnel in a separate terminal:
#      ssh -i your-key.pem -L 27017:<docdb-endpoint>:27017 ec2-user@<bastion-public-ip> -N
#
#   2. Then run this script pointing to localhost:
#      .\import_to_docdb.ps1 -Endpoint "localhost" -Username "grocyadmin" -Password "<password>"
#
# ============================================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$Endpoint,

    [Parameter(Mandatory = $true)]
    [string]$Username,

    [Parameter(Mandatory = $true)]
    [SecureString]$Password,

    [int]$Port = 27017,

    [string]$Database = "Grocy",

    [string]$CertPath = "C:\Users\xraff\Certificates\global-bundle.pem",

    [string]$DumpPath = "C:\Workspace\Production-Ready MERN on AWS\Grocy"
)

# Convert SecureString password to plain text for use in the connection URI
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
)


# ── Validate prerequisites ──────────────────────────────────────────────────

# Check that mongorestore is available
if (-not (Get-Command mongorestore -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: 'mongorestore' not found in PATH." -ForegroundColor Red
    Write-Host "Install MongoDB Database Tools from:" -ForegroundColor Yellow
    Write-Host "  https://www.mongodb.com/try/download/database-tools" -ForegroundColor Cyan
    exit 1
}

# Check that the TLS certificate exists
if (-not (Test-Path $CertPath)) {
    Write-Host "ERROR: TLS certificate not found at: $CertPath" -ForegroundColor Red
    Write-Host "Download it from:" -ForegroundColor Yellow
    Write-Host "  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" -ForegroundColor Cyan
    exit 1
}

# Check that the dump directory exists
if (-not (Test-Path $DumpPath)) {
    Write-Host "ERROR: Dump directory not found: $DumpPath" -ForegroundColor Red
    exit 1
}

# ── Build connection URI ────────────────────────────────────────────────────
# DocumentDB connection string with TLS parameters.
# retryWrites=false is REQUIRED — DocumentDB does not support retryable writes.
$connectionUri = "mongodb://${Username}:${PlainPassword}@${Endpoint}:${Port}/${Database}?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"

# ── Discover collections ────────────────────────────────────────────────────
# Find all .bson files in the dump directory
$bsonFiles = Get-ChildItem -Path $DumpPath -Filter "*.bson"

if ($bsonFiles.Count -eq 0) {
    Write-Host "ERROR: No .bson files found in $DumpPath" -ForegroundColor Red
    exit 1
}

# ── Import collections ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " DocumentDB Data Import" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Endpoint  : $Endpoint" -ForegroundColor White
Write-Host " Port      : $Port" -ForegroundColor White
Write-Host " Database  : $Database" -ForegroundColor White
Write-Host " TLS Cert  : $CertPath" -ForegroundColor White
Write-Host " Dump Path : $DumpPath" -ForegroundColor White
Write-Host " Collections: $($bsonFiles.Count)" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0
$totalSize = 0

foreach ($bsonFile in $bsonFiles) {
    $collectionName = $bsonFile.BaseName
    $fileSizeMB = [math]::Round($bsonFile.Length / 1MB, 2)
    $totalSize += $bsonFile.Length

    Write-Host "[$($successCount + $failCount + 1)/$($bsonFiles.Count)] Importing: $collectionName ($fileSizeMB MB)" -ForegroundColor Yellow

    try {
        # mongorestore command with TLS for DocumentDB
        #
        # Key flags:
        #   --uri           : Full connection string with TLS params
        #   --ssl           : Enable TLS/SSL connection
        #   --sslCAFile     : Path to the AWS global-bundle.pem certificate
        #   --db            : Target database name
        #   --collection    : Target collection name
        #   --drop          : Drop the collection first if it already exists
        #   --noIndexRestore: Skip index restoration (DocumentDB handles indexes differently)
        #                     Re-create indexes manually after import if needed
        $output = mongorestore `
            --uri="$connectionUri" `
            --ssl `
            --sslCAFile="$CertPath" `
            --db="$Database" `
            --collection="$collectionName" `
            --drop `
            --noIndexRestore `
            "$($bsonFile.FullName)" 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SUCCESS: $collectionName imported" -ForegroundColor Green
            $successCount++
        }
        else {
            Write-Host "  FAILED: $collectionName" -ForegroundColor Red
            Write-Host "  Error: $output" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "  EXCEPTION: $collectionName — $_" -ForegroundColor Red
        $failCount++
    }

    Write-Host ""
}

# ── Summary ─────────────────────────────────────────────────────────────────
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Import Complete" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Total Collections : $($bsonFiles.Count)" -ForegroundColor White
Write-Host " Successful        : $successCount" -ForegroundColor Green
Write-Host " Failed            : $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "White" })
Write-Host " Total Data        : $totalSizeMB MB" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "WARNING: Some collections failed to import. Check the errors above." -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. SSH tunnel not open (connection timeout)" -ForegroundColor Gray
    Write-Host "  2. Wrong credentials (authentication failed)" -ForegroundColor Gray
    Write-Host "  3. Certificate not found or expired" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify data: mongosh '$connectionUri' --tls --tlsCAFile '$CertPath'" -ForegroundColor Gray
Write-Host "  2. Create indexes if needed (DocumentDB index syntax may differ from MongoDB)" -ForegroundColor Gray
Write-Host "  3. Update your application's MONGO_URI to point to the DocumentDB endpoint" -ForegroundColor Gray
