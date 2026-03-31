# test_ai.ps1

Write-Host "[Step 1] Logging in..."
$login = Invoke-RestMethod `
  -Uri "http://localhost:5001/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"Shreerajlandge1603@gmail.com","password":"Phantom30606"}'
$token = $login.token
Write-Host "Token received: $($token.Substring(0,20))..."

# Create a dummy text file if no PDF is found, just to satisfy the form-data request
if (!(Test-Path "test.pdf")) {
    Set-Content -Path "test.pdf" -Value "This is a dummy PDF file pretending to be text."
}

Write-Host "[Step 2] Testing PDF upload..."
$headers = @{ "Authorization" = "Bearer $token" }
$multipart = [System.Net.Http.MultipartFormDataContent]::new()
$fileContent = [System.Net.Http.ByteArrayContent]::new(
  [System.IO.File]::ReadAllBytes("test.pdf")
)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/pdf")
$multipart.Add($fileContent, "pdf", "test.pdf")
$multipart.Add([System.Net.Http.StringContent]::new("Test PDF"), "title")
$client = [System.Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Add("Authorization", "Bearer $token")
$response = $client.PostAsync("http://localhost:5001/api/pdfs/upload", $multipart).Result
$result = $response.Content.ReadAsStringAsync().Result
Write-Host "Upload response: $result"

$uploadData = $result | ConvertFrom-Json
if ($uploadData.success -eq $false -or $uploadData.data -eq $null) {
    Write-Host "Upload failed, stopping."
    exit
}

$pdfId = $uploadData.data._id
Write-Host "PDF ID: $pdfId"

Write-Host "[Step 3] Testing AI summarize..."
try {
  $aiResponse = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/pdfs/$pdfId/summarize" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $token" }
  Write-Host "Summary response: $($aiResponse | ConvertTo-Json -Depth 5)"
} catch {
  Write-Host "Summary failed: $_"
}

Write-Host "[Step 4] Testing AI ask question..."
try {
  $questionResponse = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/pdfs/$pdfId/ask" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -Body '{"question":"What is this document about?"}'
  Write-Host "Question response: $($questionResponse | ConvertTo-Json -Depth 5)"
} catch {
  Write-Host "Ask failed: $_"
}
