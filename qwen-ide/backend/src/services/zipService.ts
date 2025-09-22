import fs from 'fs/promises'
import path from 'path'
import { createWriteStream, createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import archiver from 'archiver'
import unzipper from 'unzipper'
import { FileSystemItem } from '../types'

export interface ZipOptions {
  includeHidden?: boolean
  excludePatterns?: string[]
  compressionLevel?: number
  password?: string
}

export interface ZipEntry {
  name: string
  path: string
  size: number
  compressedSize: number
  isDirectory: boolean
  lastModified: Date
}

export class ZipService {
  private static instance: ZipService

  static getInstance(): ZipService {
    if (!ZipService.instance) {
      ZipService.instance = new ZipService()
    }
    return ZipService.instance
  }

  async createZip(sourcePath: string, outputPath: string, options: ZipOptions = {}): Promise<void> {
    const {
      includeHidden = false,
      excludePatterns = ['node_modules', '.git', 'dist', 'build', '__pycache__'],
      compressionLevel = 6
    } = options

    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath)
      const archive = archiver('zip', {
        zlib: { level: compressionLevel }
      })

      output.on('close', () => {
        console.log(`📦 Zip created: ${archive.pointer()} total bytes`)
        resolve()
      })

      archive.on('error', (err) => {
        reject(err)
      })

      archive.pipe(output)

      // Add files to archive
      this.addToArchive(archive, sourcePath, '', includeHidden, excludePatterns)
        .then(() => {
          archive.finalize()
        })
        .catch(reject)
    })
  }

  private async addToArchive(
    archive: archiver.Archiver,
    sourcePath: string,
    relativePath: string,
    includeHidden: boolean,
    excludePatterns: string[]
  ): Promise<void> {
    const stats = await fs.stat(sourcePath)

    if (stats.isDirectory()) {
      const items = await fs.readdir(sourcePath)
      
      for (const item of items) {
        // Skip hidden files/folders if not included
        if (!includeHidden && item.startsWith('.')) continue
        
        // Skip excluded patterns
        if (excludePatterns.some(pattern => item.includes(pattern))) continue

        const itemPath = path.join(sourcePath, item)
        const itemRelativePath = path.join(relativePath, item)
        
        await this.addToArchive(archive, itemPath, itemRelativePath, includeHidden, excludePatterns)
      }
    } else {
      // Add file to archive
      archive.file(sourcePath, { name: relativePath })
    }
  }

  async extractZip(zipPath: string, outputPath: string): Promise<void> {
    await fs.mkdir(outputPath, { recursive: true })
    
    return new Promise((resolve, reject) => {
      createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: outputPath }))
        .on('close', resolve)
        .on('error', reject)
    })
  }

  async listZipContents(zipPath: string): Promise<ZipEntry[]> {
    return new Promise((resolve, reject) => {
      const entries: ZipEntry[] = []
      
      createReadStream(zipPath)
        .pipe(unzipper.Parse())
        .on('entry', (entry) => {
          const { path: entryPath, size, compressedSize, type } = entry
          
          entries.push({
            name: path.basename(entryPath),
            path: entryPath,
            size: size || 0,
            compressedSize: compressedSize || 0,
            isDirectory: type === 'Directory',
            lastModified: new Date()
          })
          
          entry.autodrain()
        })
        .on('finish', () => resolve(entries))
        .on('error', reject)
    })
  }

  async createProjectArchive(projectPath: string, outputDir: string, projectName?: string): Promise<string> {
    const name = projectName || path.basename(projectPath)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const zipFileName = `${name}_${timestamp}.zip`
    const outputPath = path.join(outputDir, zipFileName)

    await this.createZip(projectPath, outputPath, {
      includeHidden: false,
      excludePatterns: ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', '.nuxt', 'coverage'],
      compressionLevel: 9
    })

    return outputPath
  }

  async createDeploymentPackage(projectPath: string, outputDir: string, buildScript?: string): Promise<string> {
    const projectName = path.basename(projectPath)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const packageName = `${projectName}_deployment_${timestamp}.zip`
    const outputPath = path.join(outputDir, packageName)

    // If build script provided, run it first
    if (buildScript) {
      console.log(`🔨 Running build script: ${buildScript}`)
      // Note: In a real implementation, you'd execute the build script here
    }

    await this.createZip(projectPath, outputPath, {
      includeHidden: false,
      excludePatterns: ['node_modules', '.git', 'src', 'test', 'tests', '__pycache__'],
      compressionLevel: 9
    })

    return outputPath
  }

  async validateZip(zipPath: string): Promise<{ valid: boolean; error?: string; entryCount: number }> {
    try {
      const entries = await this.listZipContents(zipPath)
      return {
        valid: true,
        entryCount: entries.length
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        entryCount: 0
      }
    }
  }

  async getArchiveInfo(zipPath: string): Promise<{
    name: string
    size: number
    entryCount: number
    compressionRatio: number
    created: Date
  }> {
    const stats = await fs.stat(zipPath)
    const entries = await this.listZipContents(zipPath)
    
    const totalUncompressed = entries.reduce((sum, entry) => sum + entry.size, 0)
    const compressionRatio = totalUncompressed > 0 ? (stats.size / totalUncompressed) * 100 : 0

    return {
      name: path.basename(zipPath),
      size: stats.size,
      entryCount: entries.length,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      created: stats.birthtime
    }
  }
}

export default ZipService.getInstance()