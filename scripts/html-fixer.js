#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

// HTML5 void elements that should not be self-closed
const voidElements = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];

function fixHtml(content) {
    // Fix DOCTYPE to uppercase
    content = content.replace(/<!doctype\s+html>/i, '<!DOCTYPE html>');

    // Fix void elements - remove self-closing slashes
    voidElements.forEach(element => {
        const pattern = new RegExp(`<${element}([^>]*?)\\s*\\/>`, 'gi');
        content = content.replace(pattern, `<${element}$1>`);
    });

    // Parse and reformat HTML
    try {
        const root = parse(content, {
            lowerCaseAttributeNames: false,
            comment: true,
            blockTextElements: {
                script: true,
                style: true,
                pre: true,
            },
        });

        // Format the output
        content = root.toString();

        // Clean up extra whitespace but preserve structure
        content = content.replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n');

        // Ensure proper DOCTYPE
        if (!content.match(/^<!DOCTYPE html>/i)) {
            content = content.replace(/^<!doctype[^>]*>/i, '<!DOCTYPE html>');
        }
    } catch (error) {
        console.warn(
            'HTML parsing failed, using regex fixes only:',
            error.message
        );
    }

    return content;
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fixed = fixHtml(content);

        if (content !== fixed) {
            fs.writeFileSync(filePath, fixed);
            console.log(`✓ Fixed: ${filePath}`);
        } else {
            console.log(`✓ Already valid: ${filePath}`);
        }
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        process.exit(1);
    }
}

function findHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (
            stat.isDirectory() &&
            !item.startsWith('.') &&
            item !== 'node_modules'
        ) {
            files.push(...findHtmlFiles(fullPath));
        } else if (stat.isFile() && item.match(/\.(html?|htm)$/i)) {
            files.push(fullPath);
        }
    }

    return files;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage: node html-fixer.js <file-or-directory>');
    console.log(
        '  or: node html-fixer.js --all  (process all HTML files in current directory)'
    );
    process.exit(1);
}

if (args[0] === '--all') {
    const htmlFiles = findHtmlFiles(process.cwd());
    console.log(`Found ${htmlFiles.length} HTML files`);
    htmlFiles.forEach(processFile);
} else {
    const target = path.resolve(args[0]);

    if (fs.existsSync(target)) {
        const stat = fs.statSync(target);

        if (stat.isDirectory()) {
            const htmlFiles = findHtmlFiles(target);
            console.log(`Found ${htmlFiles.length} HTML files in ${target}`);
            htmlFiles.forEach(processFile);
        } else {
            processFile(target);
        }
    } else {
        console.error(`File or directory not found: ${target}`);
        process.exit(1);
    }
}
