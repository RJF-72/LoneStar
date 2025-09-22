import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs'
import { ModelService } from './modelService.js'

export interface RefactoringSuggestion {
  id: string
  type: 'rename' | 'extract' | 'inline' | 'move' | 'optimize' | 'simplify' | 'document'
  title: string
  description: string
  file: string
  line: number
  column: number
  severity: 'info' | 'warning' | 'error'
  confidence: number
  changes: CodeChange[]
  rationale: string
}

export interface CodeChange {
  type: 'replace' | 'insert' | 'delete'
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  newContent: string
  oldContent: string
}

export interface RefactoringOptions {
  includeComments: boolean
  preserveFormatting: boolean
  maxSuggestions: number
  confidenceThreshold: number
  targetLanguages: string[]
}

export interface RefactoringResult {
  suggestions: RefactoringSuggestion[]
  applied: number
  skipped: number
  errors: string[]
}

export class CodeRefactoringTools extends EventEmitter {
  private static instance: CodeRefactoringTools
  private modelService: ModelService
  private options: RefactoringOptions = {
    includeComments: true,
    preserveFormatting: true,
    maxSuggestions: 50,
    confidenceThreshold: 0.7,
    targetLanguages: ['typescript', 'javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust']
  }

  private constructor() {
    super()
    this.modelService = ModelService.getInstance()
  }

  static getInstance(): CodeRefactoringTools {
    if (!CodeRefactoringTools.instance) {
      CodeRefactoringTools.instance = new CodeRefactoringTools()
    }
    return CodeRefactoringTools.instance
  }

  /**
   * Analyze code and generate refactoring suggestions
   */
  async analyzeCode(filePath: string, content?: string): Promise<RefactoringSuggestion[]> {
    try {
      console.log(`🔍 Analyzing code for refactoring: ${filePath}`)

      const code = content || fs.readFileSync(filePath, 'utf8')
      const language = this.detectLanguage(filePath)
      const lines = code.split('\n')

      const suggestions: RefactoringSuggestion[] = []

      // Run various analysis passes
      const passes = [
        this.analyzeNaming.bind(this),
        this.analyzeComplexity.bind(this),
        this.analyzeDuplication.bind(this),
        this.analyzeStructure.bind(this),
        this.analyzePerformance.bind(this),
        this.analyzeDocumentation.bind(this)
      ]

      for (const pass of passes) {
        try {
          const passSuggestions = await pass(lines, language, filePath)
          suggestions.push(...passSuggestions)
        } catch (error) {
          console.warn(`Analysis pass failed: ${error}`)
        }
      }

      // Filter and sort suggestions
      const filtered = suggestions
        .filter(s => s.confidence >= this.options.confidenceThreshold)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.options.maxSuggestions)

      console.log(`✅ Generated ${filtered.length} refactoring suggestions`)
      this.emit('analysis:complete', { file: filePath, suggestions: filtered })

      return filtered

    } catch (error) {
      console.error('❌ Failed to analyze code:', error)
      throw error
    }
  }

  /**
   * Apply a refactoring suggestion
   */
  async applyRefactoring(filePath: string, suggestion: RefactoringSuggestion): Promise<void> {
    try {
      console.log(`🔧 Applying refactoring: ${suggestion.title}`)

      let content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n')

      // Apply changes in reverse order to maintain line numbers
      const sortedChanges = suggestion.changes.sort((a, b) => b.startLine - a.startLine)

      for (const change of sortedChanges) {
        content = this.applyCodeChange(content, change)
      }

      fs.writeFileSync(filePath, content)

      console.log(`✅ Refactoring applied: ${suggestion.title}`)
      this.emit('refactoring:applied', { file: filePath, suggestion })

    } catch (error) {
      console.error('❌ Failed to apply refactoring:', error)
      throw error
    }
  }

  /**
   * Batch apply multiple refactoring suggestions
   */
  async applyRefactorings(filePath: string, suggestions: RefactoringSuggestion[]): Promise<RefactoringResult> {
    const result: RefactoringResult = {
      suggestions: [],
      applied: 0,
      skipped: 0,
      errors: []
    }

    for (const suggestion of suggestions) {
      try {
        await this.applyRefactoring(filePath, suggestion)
        result.applied++
        result.suggestions.push(suggestion)
      } catch (error) {
        result.skipped++
        result.errors.push(`Failed to apply ${suggestion.title}: ${error}`)
      }
    }

    console.log(`📊 Refactoring batch complete: ${result.applied} applied, ${result.skipped} skipped`)
    this.emit('refactorings:batch-complete', result)

    return result
  }

  /**
   * Generate AI-powered refactoring suggestions
   */
  async generateAISuggestions(filePath: string, content?: string): Promise<RefactoringSuggestion[]> {
    try {
      const code = content || fs.readFileSync(filePath, 'utf8')
      const language = this.detectLanguage(filePath)

      const prompt = `Analyze the following ${language} code and suggest specific refactoring improvements.
Focus on:
1. Code readability and maintainability
2. Performance optimizations
3. Best practices and patterns
4. Potential bugs or issues
5. Documentation improvements

Code:
${code}

Provide suggestions in this format:
- Type: [rename|extract|inline|move|optimize|simplify|document]
- Title: Brief description
- Description: Detailed explanation
- Location: Line number if applicable
- Confidence: 0.0-1.0
- Changes: Specific code changes needed

Suggestions:`

      const response = await this.modelService.generateResponse(prompt, {
        maxTokens: 1000,
        temperature: 0.3
      })

      // Parse AI response into structured suggestions
      return this.parseAISuggestions(response, filePath)

    } catch (error) {
      console.warn('AI suggestion generation failed:', error)
      return []
    }
  }

  /**
   * Analyze naming conventions and suggest improvements
   */
  private async analyzeNaming(lines: string[], language: string, filePath: string): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = []

    // Common naming patterns to check
    const patterns = {
      typescript: [
        /\b(let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, // Variable declarations
        /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g,   // Function declarations
        /\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g,      // Class declarations
      ],
      javascript: [
        /\b(let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g,
        /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g,
      ],
      python: [
        /\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
        /\bclass\s+([A-Z][a-zA-Z0-9_]*)\b/g,
      ]
    }

    const langPatterns = patterns[language as keyof typeof patterns] || []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      for (const pattern of langPatterns) {
        let match
        while ((match = pattern.exec(line)) !== null) {
          const name = match[2] || match[1]
          const issues = this.analyzeName(name, language)

          if (issues.length > 0) {
            suggestions.push({
              id: `naming-${i}-${pattern.lastIndex}`,
              type: 'rename',
              title: `Improve naming: ${name}`,
              description: `Naming issues: ${issues.join(', ')}`,
              file: filePath,
              line: i + 1,
              column: match.index,
              severity: 'warning',
              confidence: 0.8,
              changes: [],
              rationale: 'Good naming improves code readability and maintainability'
            })
          }
        }
      }
    }

    return suggestions
  }

  /**
   * Analyze code complexity and suggest simplifications
   */
  private async analyzeComplexity(lines: string[], language: string, filePath: string): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for long lines
      if (line.length > 120) {
        suggestions.push({
          id: `complexity-long-line-${i}`,
          type: 'simplify',
          title: 'Break long line into multiple lines',
          description: `Line ${i + 1} is ${line.length} characters long (recommended: ≤120)`,
          file: filePath,
          line: i + 1,
          column: 0,
          severity: 'info',
          confidence: 0.9,
          changes: [],
          rationale: 'Long lines reduce readability and are harder to review'
        })
      }

      // Check for complex expressions
      const complexityScore = this.calculateComplexity(line)
      if (complexityScore > 10) {
        suggestions.push({
          id: `complexity-expression-${i}`,
          type: 'extract',
          title: 'Extract complex expression into variable',
          description: `Complex expression with score ${complexityScore} should be extracted`,
          file: filePath,
          line: i + 1,
          column: 0,
          severity: 'warning',
          confidence: 0.7,
          changes: [],
          rationale: 'Complex expressions are harder to understand and debug'
        })
      }
    }

    return suggestions
  }

  /**
   * Analyze code duplication
   */
  private async analyzeDuplication(lines: string[], language: string, filePath: string): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = []
    const codeBlocks: Map<string, number[]> = new Map()

    // Extract code blocks (functions, classes, etc.)
    let currentBlock = ''
    let blockStart = 0
    let braceCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (language === 'typescript' || language === 'javascript') {
        braceCount += (line.match(/\{/g) || []).length
        braceCount -= (line.match(/\}/g) || []).length

        if (braceCount === 1 && currentBlock === '') {
          // Start of a block
          currentBlock = line
          blockStart = i
        } else if (braceCount === 0 && currentBlock !== '') {
          // End of a block
          currentBlock += '\n' + line
          const blockKey = this.normalizeCode(currentBlock)

          if (!codeBlocks.has(blockKey)) {
            codeBlocks.set(blockKey, [])
          }
          codeBlocks.get(blockKey)!.push(blockStart)

          currentBlock = ''
        } else if (currentBlock !== '') {
          currentBlock += '\n' + line
        }
      }
    }

    // Find duplicated blocks
    for (const [block, locations] of codeBlocks) {
      if (locations.length > 1 && block.length > 50) { // Significant duplication
        suggestions.push({
          id: `duplication-${locations[0]}`,
          type: 'extract',
          title: 'Extract duplicated code into function',
          description: `Code block duplicated ${locations.length} times`,
          file: filePath,
          line: locations[0] + 1,
          column: 0,
          severity: 'warning',
          confidence: 0.8,
          changes: [],
          rationale: 'Code duplication increases maintenance burden and bug risk'
        })
      }
    }

    return suggestions
  }

  /**
   * Analyze code structure and organization
   */
  private async analyzeStructure(lines: string[], language: string, filePath: string): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = []

    // Check for missing imports/exports
    const hasImports = lines.some(line => line.includes('import') || line.includes('require'))
    const hasExports = lines.some(line => line.includes('export'))

    if (!hasImports && lines.length > 20) {
      suggestions.push({
        id: 'structure-missing-imports',
        type: 'document',
        title: 'Add proper imports',
        description: 'File appears to be missing import statements',
        file: filePath,
        line: 1,
        column: 0,
        severity: 'warning',
        confidence: 0.6,
        changes: [],
        rationale: 'Proper imports ensure dependencies are correctly managed'
      })
    }

    // Check for large files
    if (lines.length > 500) {
      suggestions.push({
        id: 'structure-large-file',
        type: 'move',
        title: 'Consider splitting large file',
        description: `File has ${lines.length} lines (recommended: ≤500)`,
        file: filePath,
        line: 1,
        column: 0,
        severity: 'info',
        confidence: 0.7,
        changes: [],
        rationale: 'Large files are harder to navigate and maintain'
      })
    }

    return suggestions
  }

  /**
   * Analyze performance issues
   */
  private async analyzePerformance(lines: string[], language: string, filePath: string): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for inefficient patterns
      if (language === 'typescript' || language === 'javascript') {
        // Inefficient array operations
        if (line.includes('.forEach') && line.includes('.push')) {
          suggestions.push({
            id: `performance-foreach-push-${i}`,
            type: 'optimize',
            title: 'Use map instead of forEach with push',
            description: 'forEach with push can be replaced with map for better performance',
            file: filePath,
            line: i + 1,
            column: 0,
            severity: 'info',
            confidence: 0.8,
            changes: [],
            rationale: 'map is more efficient and expressive than forEach with push'
          })
        }

        // Inefficient string concatenation
        if (line.includes('+') && line.includes('"') && lines[i + 1] && lines[i + 1].includes('+')) {
          suggestions.push({
            id: `performance-string-concat-${i}`,
            type: 'optimize',
            title: 'Use template literals instead of string concatenation',
            description: 'Multiple string concatenations should use template literals',
            file: filePath,
            line: i + 1,
            column: 0,
            severity: 'info',
            confidence: 0.9,
            changes: [],
            rationale: 'Template literals are more efficient and readable'
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Analyze documentation
   */
  private async analyzeDocumentation(lines: string[], language: string, filePath: string): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = []

    // Check for undocumented functions
    let inFunction = false
    let functionStart = 0
    let hasDocumentation = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (language === 'typescript' || language === 'javascript') {
        if (line.startsWith('function') || line.includes('=>') || line.match(/\bfunction\b/)) {
          if (inFunction) {
            // Previous function ended without documentation
            if (!hasDocumentation && (i - functionStart) > 5) {
              suggestions.push({
                id: `documentation-function-${functionStart}`,
                type: 'document',
                title: 'Add JSDoc documentation',
                description: `Function at line ${functionStart + 1} lacks documentation`,
                file: filePath,
                line: functionStart + 1,
                column: 0,
                severity: 'info',
                confidence: 0.7,
                changes: [],
                rationale: 'Documentation improves code maintainability and API usability'
              })
            }
          }

          inFunction = true
          functionStart = i
          hasDocumentation = false
        }

        // Check for JSDoc comments
        if (line.startsWith('/**') || (line.startsWith('/*') && lines[i + 1] && lines[i + 1].includes('* @'))) {
          hasDocumentation = true
        }
      }
    }

    return suggestions
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    switch (ext) {
      case '.ts': return 'typescript'
      case '.js': return 'javascript'
      case '.py': return 'python'
      case '.java': return 'java'
      case '.cpp':
      case '.cc':
      case '.cxx': return 'cpp'
      case '.c': return 'c'
      case '.go': return 'go'
      case '.rs': return 'rust'
      default: return 'unknown'
    }
  }

  private analyzeName(name: string, language: string): string[] {
    const issues: string[] = []

    // Check length
    if (name.length < 2) {
      issues.push('too short')
    } else if (name.length > 30) {
      issues.push('too long')
    }

    // Check for common naming issues
    if (name.includes('_') && language !== 'python') {
      issues.push('uses underscores in non-Python code')
    }

    if (/[A-Z]{2,}/.test(name) && !name.match(/^[A-Z]/)) {
      issues.push('contains consecutive uppercase letters')
    }

    // Language-specific checks
    if (language === 'typescript' || language === 'javascript') {
      if (!/^[a-zA-Z_$]/.test(name)) {
        issues.push('starts with invalid character')
      }
    }

    return issues
  }

  private calculateComplexity(line: string): number {
    let score = 0

    // Count operators
    score += (line.match(/[\+\-\*\/%=<>!&\|\^\?]/g) || []).length

    // Count function calls
    score += (line.match(/\w+\s*\(/g) || []).length

    // Count array/object access
    score += (line.match(/[\[\]\.]/g) || []).length

    // Count ternary operators
    score += (line.match(/\?/g) || []).length

    return score
  }

  private normalizeCode(code: string): string {
    return code
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\/\/.*$/gm, '') // Remove comments
      .trim()
  }

  private applyCodeChange(content: string, change: CodeChange): string {
    const lines = content.split('\n')

    if (change.type === 'replace') {
      // Replace specific range
      const startLine = change.startLine - 1
      const endLine = change.endLine - 1

      if (startLine === endLine) {
        // Single line replacement
        const line = lines[startLine]
        const before = line.substring(0, change.startColumn)
        const after = line.substring(change.endColumn)
        lines[startLine] = before + change.newContent + after
      } else {
        // Multi-line replacement
        const before = lines[startLine].substring(0, change.startColumn)
        const after = lines[endLine].substring(change.endColumn)
        lines.splice(startLine, endLine - startLine + 1, before + change.newContent + after)
      }
    } else if (change.type === 'insert') {
      // Insert at position
      const line = lines[change.startLine - 1]
      const before = line.substring(0, change.startColumn)
      const after = line.substring(change.startColumn)
      lines[change.startLine - 1] = before + change.newContent + after
    } else if (change.type === 'delete') {
      // Delete range
      const startLine = change.startLine - 1
      const endLine = change.endLine - 1

      if (startLine === endLine) {
        const line = lines[startLine]
        const before = line.substring(0, change.startColumn)
        const after = line.substring(change.endColumn)
        lines[startLine] = before + after
      } else {
        const before = lines[startLine].substring(0, change.startColumn)
        const after = lines[endLine].substring(change.endColumn)
        lines.splice(startLine, endLine - startLine + 1, before + after)
      }
    }

    return lines.join('\n')
  }

  private parseAISuggestions(aiResponse: string, filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = []
    const lines = aiResponse.split('\n')

    let currentSuggestion: Partial<RefactoringSuggestion> | null = null

    for (const line of lines) {
      if (line.startsWith('- Type:')) {
        if (currentSuggestion) {
          suggestions.push(currentSuggestion as RefactoringSuggestion)
        }
        currentSuggestion = {
          id: `ai-${Date.now()}-${Math.random()}`,
          file: filePath,
          line: 1,
          column: 0,
          severity: 'info',
          confidence: 0.8,
          changes: [],
          rationale: ''
        }
      }

      if (currentSuggestion) {
        if (line.includes('Type:')) {
          const type = line.split(':')[1]?.trim()
          if (type && ['rename', 'extract', 'inline', 'move', 'optimize', 'simplify', 'document'].includes(type)) {
            currentSuggestion.type = type as any
          }
        } else if (line.includes('Title:')) {
          currentSuggestion.title = line.split(':')[1]?.trim() || 'AI Suggestion'
        } else if (line.includes('Description:')) {
          currentSuggestion.description = line.split(':')[1]?.trim() || ''
        } else if (line.includes('Confidence:')) {
          const conf = parseFloat(line.split(':')[1]?.trim() || '0.8')
          currentSuggestion.confidence = Math.max(0, Math.min(1, conf))
        }
      }
    }

    if (currentSuggestion) {
      suggestions.push(currentSuggestion as RefactoringSuggestion)
    }

    return suggestions
  }

  /**
   * Update refactoring options
   */
  updateOptions(options: Partial<RefactoringOptions>): void {
    this.options = { ...this.options, ...options }
    this.emit('options:updated', this.options)
  }

  /**
   * Get current options
   */
  getOptions(): RefactoringOptions {
    return { ...this.options }
  }
}

export default CodeRefactoringTools