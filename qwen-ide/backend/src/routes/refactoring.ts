import { Router } from 'express'
import CodeRefactoringTools from '../services/codeRefactoring.js'
import path from 'path'
import fs from 'fs'

const router = Router()
const refactoringTools = CodeRefactoringTools.getInstance()

// Analyze code for refactoring suggestions
router.post('/analyze', async (req, res) => {
  try {
    const { filePath, content } = req.body

    if (!filePath && !content) {
      return res.status(400).json({
        success: false,
        error: 'Either filePath or content is required'
      })
    }

    const absolutePath = filePath ? path.resolve(filePath) : undefined

    console.log(`🔍 Analyzing code for refactoring: ${absolutePath || 'provided content'}`)

    const suggestions = await refactoringTools.analyzeCode(absolutePath || '', content)

    res.json({
      success: true,
      suggestions: suggestions.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        description: s.description,
        file: s.file,
        line: s.line,
        column: s.column,
        severity: s.severity,
        confidence: s.confidence,
        rationale: s.rationale
      }))
    })

  } catch (error) {
    console.error('❌ Code analysis failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze code',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Generate AI-powered refactoring suggestions
router.post('/ai-suggestions', async (req, res) => {
  try {
    const { filePath, content } = req.body

    if (!filePath && !content) {
      return res.status(400).json({
        success: false,
        error: 'Either filePath or content is required'
      })
    }

    const absolutePath = filePath ? path.resolve(filePath) : undefined

    console.log(`🤖 Generating AI refactoring suggestions: ${absolutePath || 'provided content'}`)

    const suggestions = await refactoringTools.generateAISuggestions(absolutePath || '', content)

    res.json({
      success: true,
      suggestions: suggestions.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        description: s.description,
        file: s.file,
        line: s.line,
        column: s.column,
        severity: s.severity,
        confidence: s.confidence,
        rationale: s.rationale
      }))
    })

  } catch (error) {
    console.error('❌ AI suggestion generation failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Apply a refactoring suggestion
router.post('/apply', async (req, res) => {
  try {
    const { filePath, suggestion } = req.body

    if (!filePath || !suggestion) {
      return res.status(400).json({
        success: false,
        error: 'filePath and suggestion are required'
      })
    }

    const absolutePath = path.resolve(filePath)

    console.log(`🔧 Applying refactoring: ${suggestion.title}`)

    await refactoringTools.applyRefactoring(absolutePath, suggestion)

    res.json({
      success: true,
      message: `Refactoring applied: ${suggestion.title}`
    })

  } catch (error) {
    console.error('❌ Refactoring application failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to apply refactoring',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Batch apply multiple refactoring suggestions
router.post('/apply-batch', async (req, res) => {
  try {
    const { filePath, suggestions } = req.body

    if (!filePath || !Array.isArray(suggestions)) {
      return res.status(400).json({
        success: false,
        error: 'filePath and suggestions array are required'
      })
    }

    const absolutePath = path.resolve(filePath)

    console.log(`📊 Applying ${suggestions.length} refactoring suggestions`)

    const result = await refactoringTools.applyRefactorings(absolutePath, suggestions)

    res.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('❌ Batch refactoring failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to apply batch refactoring',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get refactoring options
router.get('/options', (req, res) => {
  try {
    const options = refactoringTools.getOptions()

    res.json({
      success: true,
      options
    })

  } catch (error) {
    console.error('❌ Failed to get refactoring options:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve refactoring options'
    })
  }
})

// Update refactoring options
router.post('/options', (req, res) => {
  try {
    const options = req.body

    refactoringTools.updateOptions(options)

    res.json({
      success: true,
      message: 'Refactoring options updated successfully'
    })

  } catch (error) {
    console.error('❌ Failed to update refactoring options:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update refactoring options',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get supported languages
router.get('/languages', (req, res) => {
  try {
    const languages = refactoringTools.getOptions().targetLanguages

    res.json({
      success: true,
      languages
    })

  } catch (error) {
    console.error('❌ Failed to get supported languages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve supported languages'
    })
  }
})

// Analyze file from workspace
router.post('/analyze-file', async (req, res) => {
  try {
    const { relativePath } = req.body

    if (!relativePath) {
      return res.status(400).json({
        success: false,
        error: 'relativePath is required'
      })
    }

    const workspacePath = process.cwd()
    const absolutePath = path.resolve(workspacePath, relativePath)

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    console.log(`🔍 Analyzing workspace file: ${relativePath}`)

    const suggestions = await refactoringTools.analyzeCode(absolutePath)

    res.json({
      success: true,
      file: relativePath,
      suggestions: suggestions.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        description: s.description,
        line: s.line,
        column: s.column,
        severity: s.severity,
        confidence: s.confidence,
        rationale: s.rationale
      }))
    })

  } catch (error) {
    console.error('❌ File analysis failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze file',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Quick refactor - apply common fixes automatically
router.post('/quick-refactor', async (req, res) => {
  try {
    const { filePath, autoApply = false } = req.body

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'filePath is required'
      })
    }

    const absolutePath = path.resolve(filePath)

    console.log(`⚡ Quick refactoring: ${absolutePath}`)

    // Analyze code
    const suggestions = await refactoringTools.analyzeCode(absolutePath)

    // Filter to high-confidence, safe suggestions
    const safeSuggestions = suggestions.filter(s =>
      s.confidence >= 0.9 &&
      ['simplify', 'optimize', 'document'].includes(s.type) &&
      s.severity !== 'error'
    )

    let applied = 0
    if (autoApply && safeSuggestions.length > 0) {
      const result = await refactoringTools.applyRefactorings(absolutePath, safeSuggestions)
      applied = result.applied
    }

    res.json({
      success: true,
      suggestions: safeSuggestions.length,
      applied: autoApply ? applied : 0,
      safeSuggestions: safeSuggestions.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        description: s.description,
        confidence: s.confidence
      }))
    })

  } catch (error) {
    console.error('❌ Quick refactor failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to perform quick refactor',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router