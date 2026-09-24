# Run in PowerShell as Administrator to allow inbound access to the SnabOffice shop.
# Then forward router port 3000 -> this PC's LAN IP (usually 192.168.0.7).

$ErrorActionPreference = "Stop"
$port = 3000
$name = "SnabOffice Dev $port"

$existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
if ($existing) {
  Enable-NetFirewallRule -DisplayName $name
  Write-Host "Firewall rule already exists and is enabled: $name"
} else {
  New-NetFirewallRule `
    -DisplayName $name `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $port `
    -Action Allow `
    -Profile Any | Out-Null
  Write-Host "Created firewall rule: $name"
}

$lan = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -like "192.168.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress

Write-Host ""
Write-Host "1) Keep the shop running: npm run dev"
Write-Host "2) In your router, forward TCP $port to ${lan}:$port"
Write-Host "3) Open from internet: http://YOUR_PUBLIC_IP:$port"
Write-Host "   (check public IP at https://api.ipify.org )"
if ($lan) {
  Write-Host "LAN test from another device: http://${lan}:$port"
}
