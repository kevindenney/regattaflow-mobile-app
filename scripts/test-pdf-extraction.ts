/**
 * Test PDF Extraction Service
 * Run with: npx tsx scripts/test-pdf-extraction.ts
 */

import { PDFExtractionService } from '../src/services/PDFExtractionService';

async function testPDFExtraction() {
  console.log('🔍 Testing PDF Extraction Service\n');

  // Test 1: Validate PDF detection
  console.log('Test 1: PDF Validation');
  const testPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  try {
    const isValid = await PDFExtractionService.isValidPDF(testPdfUrl);
    console.log(`✅ PDF validation: ${isValid ? 'VALID' : 'INVALID'}\n`);
  } catch (error: any) {
    console.log(`❌ PDF validation failed: ${error.message}\n`);
  }

  // Test 2: Extract text from sample PDF
  console.log('Test 2: Text Extraction');
  try {
    const result = await PDFExtractionService.extractText(testPdfUrl, {
      onProgress: (progress, currentPage, totalPages) => {
        console.log(`📄 Progress: ${Math.round(progress)}% (Page ${currentPage}/${totalPages})`);
      },
      maxPages: 10,
    });

    if (result.success && result.text) {
      console.log(`✅ Extraction successful!`);
      console.log(`   Pages extracted: ${result.pages}`);
      console.log(`   Text length: ${result.text.length} characters`);
      console.log(`   Preview: ${result.text.substring(0, 200)}...\n`);
    } else {
      console.log(`❌ Extraction failed: ${result.error}\n`);
    }
  } catch (error: any) {
    console.log(`❌ Extraction error: ${error.message}\n`);
  }

  // Test 3: Get PDF metadata
  console.log('Test 3: PDF Metadata');
  try {
    const metadata = await PDFExtractionService.getMetadata(testPdfUrl);
    console.log(`✅ Metadata retrieved:`);
    console.log(`   Pages: ${metadata.pages || 'N/A'}`);
    console.log(`   Title: ${metadata.title || 'N/A'}`);
    console.log(`   Author: ${metadata.author || 'N/A'}`);
  } catch (error: any) {
    console.log(`❌ Metadata retrieval failed: ${error.message}`);
  }

  console.log('\n✨ Tests complete!');
}

// Run tests
testPDFExtraction().catch(console.error);
