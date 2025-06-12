#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AnnotationConfig {
    targetExtensions: string[];
    skipPatterns: string[];
    dryRun: boolean;
    createBackup: boolean;
}

const defaultConfig: AnnotationConfig = {
    targetExtensions: ['.ts', '.tsx', '.css'],
    skipPatterns: ['node_modules', '.git', 'dist', 'build'],
    dryRun: false,
    createBackup: true,
};

class FileAnnotator {
    private config: AnnotationConfig;
    private processedFiles: string[] = [];
    private skippedFiles: string[] = [];
    private errorFiles: string[] = [];

    constructor(config: Partial<AnnotationConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    async annotateDirectory(directoryPath: string): Promise<void> {
        console.log(`🚀 Starting annotation process for: ${directoryPath}`);
        console.log(`📋 Mode: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}`);

        await this.walkDirectory(directoryPath);

        this.printSummary();
    }

    private async walkDirectory(dirPath: string): Promise<void> {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                if (this.shouldSkipDirectory(entry.name)) {
                    continue;
                }
                await this.walkDirectory(fullPath);
            } else if (entry.isFile()) {
                await this.processFile(fullPath);
            }
        }
    }

    private shouldSkipDirectory(dirName: string): boolean {
        return this.config.skipPatterns.some(pattern => dirName.includes(pattern));
    }

    private async processFile(filePath: string): Promise<void> {
        const ext = path.extname(filePath);

        if (!this.config.targetExtensions.includes(ext)) {
            return;
        }

        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');

            if (this.isAlreadyAnnotated(content)) {
                this.skippedFiles.push(filePath);
                return;
            }

            const annotation = this.generateAnnotation(filePath, ext);
            const annotatedContent = this.addAnnotation(content, annotation);

            if (this.config.dryRun) {
                console.log(`📝 Would annotate: ${filePath}`);
                console.log(`   Comment: ${annotation.replace(/\n/g, '\\n')}`);
            } else {
                if (this.config.createBackup) {
                    await this.createBackup(filePath);
                }

                await fs.promises.writeFile(filePath, annotatedContent, 'utf-8');
                console.log(`✅ Annotated: ${filePath}`);
            }

            this.processedFiles.push(filePath);
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error);
            this.errorFiles.push(filePath);
        }
    }

    private isAlreadyAnnotated(content: string): boolean {
        const firstLines = content.split('\n').slice(0, 5).join('\n');
        return firstLines.includes('* Location:') || firstLines.includes('/* Location:');
    }

    private generateAnnotation(filePath: string, extension: string): string {
        const relativePath = path.relative(process.cwd(), filePath);
        const normalizedPath = relativePath.replace(/\\/g, '/');

        return `/* Location: ${normalizedPath} */\n`;
    }

    private addAnnotation(content: string, annotation: string): string {
        // Handle shebang lines
        if (content.startsWith('#!')) {
            const lines = content.split('\n');
            const shebang = lines[0];
            const restContent = lines.slice(1).join('\n');
            return `${shebang}\n${annotation}\n${restContent}`;
        }

        return `${annotation}\n${content}`;
    }

    private async createBackup(filePath: string): Promise<void> {
        const backupPath = `${filePath}.backup`;
        await fs.promises.copyFile(filePath, backupPath);
    }

    private printSummary(): void {
        console.log('\n📊 Summary:');
        console.log(`✅ Files processed: ${this.processedFiles.length}`);
        console.log(`⏭️  Files skipped (already annotated): ${this.skippedFiles.length}`);
        console.log(`❌ Files with errors: ${this.errorFiles.length}`);

        if (this.errorFiles.length > 0) {
            console.log('\n❌ Error files:');
            this.errorFiles.forEach(file => console.log(`   ${file}`));
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const targetDir = args[0] || '.';

    const options: Partial<AnnotationConfig> = {};

    if (args.includes('--dry-run')) {
        options.dryRun = true;
    }

    if (args.includes('--no-backup')) {
        options.createBackup = false;
    }

    const annotator = new FileAnnotator(options);

    try {
        await annotator.annotateDirectory(path.resolve(targetDir));
    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
📝 File Annotator

Usage: node file-annotator.ts [directory] [options]

Arguments:
  directory     Target directory to process (default: current directory)

Options:
  --dry-run     Preview changes without modifying files
  --no-backup   Skip creating backup files
  --help, -h    Show this help message

Examples:
  node file-annotator.ts                    # Annotate current directory
  node file-annotator.ts ./src              # Annotate src directory
  node file-annotator.ts --dry-run          # Preview changes
  node file-annotator.ts ./src --no-backup  # No backup files
  `);
    process.exit(0);
}

if (import.meta.url === `file://${__filename}`) {
    main();
}
