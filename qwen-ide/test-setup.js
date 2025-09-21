// Test setup script to verify the application works

console.log('🧪 Testing LoneStar IDE Setup...')

// Check if required dependencies are installed
try {
  const fs = require('fs')
  
  // Check package.json files exist
  const mainPackage = require('./package.json')
  const frontendPackage = require('./frontend/package.json')
  const backendPackage = require('./backend/package.json')
  
  console.log('✅ Package files found')
  console.log(`   Main: ${mainPackage.name} v${mainPackage.version}`)
  console.log(`   Frontend: ${frontendPackage.name} v${frontendPackage.version}`)
  console.log(`   Backend: ${backendPackage.name} v${backendPackage.version}`)
  
  // Check key files exist
  const keyFiles = [
    'backend/src/index.ts',
    'backend/src/routes/chat.ts',
    'backend/src/routes/file.ts',
    'backend/src/services/modelService.ts',
    'frontend/src/App.tsx',
    'frontend/src/components/Chat/ChatPanel.tsx',
    'frontend/src/components/Terminal/TerminalPanel.tsx'
  ]
  
  let allFilesExist = true
  keyFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file} - MISSING`)
      allFilesExist = false
    }
  })
  
  if (allFilesExist) {
    console.log('\n🎉 All key files are present!')
    console.log('\nNext steps:')
    console.log('1. Install dependencies: npm run install:all')
    console.log('2. Download Qwen model to /models/ directory')
    console.log('3. Set QWEN_MODEL_PATH in backend/.env')
    console.log('4. Start development server: npm run dev')
  } else {
    console.log('\n❌ Some files are missing. Please check the setup.')
  }
  
} catch (error) {
  console.error('❌ Error during setup check:', error.message)
}