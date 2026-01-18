# Comprehensive test for save-generated-flashcards endpoint

$baseUrl = "http://localhost:3000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test 1: Happy Path - Save multiple flashcards" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$longText = "Machine learning (ML) is a subset of artificial intelligence (AI) that focuses on algorithms and statistical models that computer systems use to perform specific tasks without using explicit instructions, relying instead on patterns and inference instead. It has become one of the most important technologies of the 21st century, powering everything from recommendation systems on streaming platforms to autonomous vehicles and medical diagnosis tools. The field encompasses various types of learning algorithms, including supervised learning where models learn from labeled training data, unsupervised learning where patterns are discovered in unlabeled data, and reinforcement learning where agents learn through trial and error by interacting with their environment. Deep learning, a subset of machine learning inspired by the structure and function of the brain neural networks, has revolutionized many fields by enabling computers to process vast amounts of data and make complex decisions. Convolutional neural networks excel at image recognition tasks, while recurrent neural networks are particularly effective for processing sequential data like natural language. The success of machine learning applications depends heavily on the quality and quantity of training data, as well as the choice of appropriate algorithms and computational resources."

$generateBody = @{ source_text = $longText } | ConvertTo-Json

try {
  $genResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/flashcards/generate-flashcards-proposals" `
    -ContentType "application/json" `
    -Body $generateBody -ErrorAction Stop

  Write-Host "Generation successful (ID: $($genResponse.generation_id))" -ForegroundColor Green

  # Test: Save multiple flashcards with both ai_generated and ai_edited
  $savePayload = @{
    generation_id = $genResponse.generation_id
    flashcards = @(
      @{
        front = "What is Machine Learning?"
        back = "ML is a subset of AI that uses algorithms and statistical models"
        source = "ai_edited"
      },
      @{
        front = "Sample question 2"
        back = "Sample answer 2"
        source = "ai_generated"
      }
    )
  }

  $saveBody = $savePayload | ConvertTo-Json -Depth 4

  $saveResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/flashcards/save-generated-flashcards" `
    -ContentType "application/json" `
    -Body $saveBody -ErrorAction Stop

  Write-Host "Save successful - saved $($saveResponse.flashcards.Count) flashcards" -ForegroundColor Green
  Write-Host "  - Flashcard 1: source=$($saveResponse.flashcards[0].source)" -ForegroundColor Gray
  Write-Host "  - Flashcard 2: source=$($saveResponse.flashcards[1].source)" -ForegroundColor Gray

} catch {
  Write-Host "Test 1 failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) {
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
  }
  exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test 2: Invalid Generation ID" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$invalidPayload = @{
  generation_id = "00000000-0000-0000-0000-000000000000"
  flashcards = @(
    @{
      front = "Test"
      back = "Test"
      source = "ai_generated"
    }
  )
} | ConvertTo-Json -Depth 4

try {
  $invalidResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/flashcards/save-generated-flashcards" `
    -ContentType "application/json" `
    -Body $invalidPayload -ErrorAction Stop
  
  Write-Host "Test 2 failed: Should have returned 404 error" -ForegroundColor Red
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 404) {
    Write-Host "Correctly rejected invalid generation_id with 404" -ForegroundColor Green
  } else {
    Write-Host "Test 2 failed: Expected 404, got $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    exit 1
  }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All tests passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
