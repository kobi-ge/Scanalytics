$dir = "C:\Users\menachem shoval\Desktop\Kodcode\tarining\generaly\Scanalytics\openshift"
Get-ChildItem -Path $dir -Recurse -Filter "*.yaml" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $changed = $false
    
    # Scale to 1 replica
    if ($content -match 'replicas: \d+') {
        $content = $content -replace 'replicas: \d+', 'replicas: 1'
        $changed = $true
    }
    
    # Minimize CPU requests
    if ($content -match 'cpu: (?!10m)\d+[m]?') {
        $content = $content -replace 'cpu: \d+[m]?', 'cpu: 10m'
        $changed = $true
    }

    # Minimize Memory requests
    if ($content -match 'memory: (?!128Mi)\d+[GM][iB]') {
        $content = $content -replace 'memory: \d+[GM][iB]', 'memory: 128Mi'
        $changed = $true
    }

    if ($changed) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Downscaled: $($_.Name)"
    }
}
