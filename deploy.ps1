# Tektwig - Hostinger FTP Deployment Script
# Reads credentials from deploy_config.json and uploads files

$configFile = "deploy_config.json"
if (-not (Test-Path $configFile)) {
    Write-Error "Configuration file deploy_config.json not found! Please create it."
    exit 1
}

$config = Get-Content -Raw -Path $configFile | ConvertFrom-Json

if ($config.ftpPassword -eq "your_ftp_password_here" -or $config.ftpHost -eq "ftp.yourdomain.com") {
    Write-Warning "---------------------------------------------------------"
    Write-Warning "PLEASE UPDATE deploy_config.json WITH YOUR FTP DETAILS!"
    Write-Warning "---------------------------------------------------------"
    exit 1
}

$ftpHost = $config.ftpHost
$username = $config.ftpUsername
$password = $config.ftpPassword
$port = if ($config.ftpPort) { $config.ftpPort } else { 21 }
$remoteDir = $config.mainRemoteDir.TrimEnd('/')


# Helper: Create Remote FTP Directory
function Create-FTPDirectory {
    param (
        [string]$RemotePath
    )
    $url = "ftp://$ftpHost`:$port" + $RemotePath
    try {
        $request = [System.Net.FtpWebRequest]::Create($url)
        $request.Credentials = New-Object System.Net.NetworkCredential($username, $password)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.UsePassive = $true
        $response = $request.GetResponse()
        $response.Close()
        $response.Dispose()
        Write-Host "Created remote directory: $RemotePath" -ForegroundColor Green
    } catch {
        # Directory already exists or permission error (safe to ignore if directory is already present)
    }
}

# Helper: Upload File to FTP
function Upload-FTPFile {
    param (
        [string]$LocalFilePath,
        [string]$RemoteFilePath
    )
    if (-not (Test-Path $LocalFilePath)) {
        Write-Warning "Local file not found: $LocalFilePath. Skipping."
        return
    }

    $url = "ftp://$ftpHost`:$port" + $RemoteFilePath
    
    $maxRetries = 5
    $retryCount = 0
    $success = $false
    
    while (-not $success -and $retryCount -lt $maxRetries) {
        $retryCount++
        if ($retryCount -gt 1) {
            Write-Host "Retrying upload ($retryCount/$maxRetries) after 3s delay..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
        
        Write-Host "Uploading $LocalFilePath -> $url..." -NoNewline
        
        try {
            $request = [System.Net.FtpWebRequest]::Create($url)
            $request.Credentials = New-Object System.Net.NetworkCredential($username, $password)
            $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $request.UseBinary = $true
            $request.KeepAlive = $false
            $request.UsePassive = $true
            
            $fileBytes = [System.IO.File]::ReadAllBytes($LocalFilePath)
            $request.ContentLength = $fileBytes.Length
            
            $requestStream = $request.GetRequestStream()
            $requestStream.Write($fileBytes, 0, $fileBytes.Length)
            $requestStream.Close()
            $requestStream.Dispose()
            
            $response = $request.GetResponse()
            $response.Close()
            $response.Dispose()
            
            Write-Host " [OK]" -ForegroundColor Green
            $success = $true
        } catch {
            Write-Host " [FAILED]" -ForegroundColor Red
            Write-Warning $_.Exception.Message
        }
    }
    
    if (-not $success) {
        Write-Error "Failed to upload $LocalFilePath after $maxRetries attempts."
    }
}

Write-Host "============================================="
Write-Host " Starting Tektwig Deployment to Hostinger"
Write-Host "============================================="

# 1. Ensure remote directories exist
Write-Host "`n1. Setting up remote directories..."
Create-FTPDirectory -RemotePath "$remoteDir/assets"
Create-FTPDirectory -RemotePath "$remoteDir/admin"

# 2. Upload All Site Files
Write-Host "`n2. Uploading files to $remoteDir..."
$filesToUpload = @(
    @{ local = "index.html"; remote = "$remoteDir/index.html" },
    @{ local = "careers.html"; remote = "$remoteDir/careers.html" },
    @{ local = "privacy-policy.html"; remote = "$remoteDir/privacy-policy.html" },
    @{ local = "recruit.html"; remote = "$remoteDir/recruit.html" },
    @{ local = "admin.html"; remote = "$remoteDir/admin.html" },
    @{ local = "admin/index.html"; remote = "$remoteDir/admin/index.html" },
    @{ local = "db.js"; remote = "$remoteDir/db.js" },
    @{ local = "admin.js"; remote = "$remoteDir/admin.js" },
    @{ local = "app.js"; remote = "$remoteDir/app.js" },
    @{ local = "careers.js"; remote = "$remoteDir/careers.js" },
    @{ local = "recruit.js"; remote = "$remoteDir/recruit.js" },
    @{ local = "styles.css"; remote = "$remoteDir/styles.css" },
    @{ local = "recruit.css"; remote = "$remoteDir/recruit.css" },
    @{ local = "assets/logo.svg"; remote = "$remoteDir/assets/logo.svg" },
    @{ local = "assets/favicon.svg"; remote = "$remoteDir/assets/favicon.svg" }
)

foreach ($file in $filesToUpload) {
    Upload-FTPFile -LocalFilePath $file.local -RemoteFilePath $file.remote
    Start-Sleep -Milliseconds 500
}



Write-Host "`n============================================="
Write-Host " Deployment Complete!"
Write-Host "============================================="
