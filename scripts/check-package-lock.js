#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkPackageLockSync() {
    try {
        console.log('🔍 Checking package.json and package-lock.json sync...');

        // Check if both files exist
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageLockPath = path.join(process.cwd(), 'package-lock.json');

        if (!fs.existsSync(packageJsonPath)) {
            console.error('❌ package.json not found');
            process.exit(1);
        }

        if (!fs.existsSync(packageLockPath)) {
            console.error('❌ package-lock.json not found');
            process.exit(1);
        }

        // Try npm ci --dry-run to check sync
        execSync('npm ci --dry-run', {
            stdio: 'pipe',
            cwd: process.cwd(),
        });

        console.log('✅ package.json and package-lock.json are in sync');
        return true;
    } catch (error) {
        console.error('❌ package.json and package-lock.json are NOT in sync');
        console.error('');
        console.error('🔧 To fix this, run:');
        console.error('   npm install');
        console.error('   git add package-lock.json');
        console.error('');
        console.error('💡 This ensures CI/CD will work correctly with npm ci');

        // Show some details from the error
        if (error.stderr) {
            const errorLines = error.stderr.toString().split('\n');
            const relevantLines = errorLines
                .filter(
                    (line) =>
                        line.includes('Invalid:') ||
                        line.includes('Missing:') ||
                        line.includes('does not satisfy')
                )
                .slice(0, 5); // Show first 5 issues

            if (relevantLines.length > 0) {
                console.error('');
                console.error('📋 Some of the issues:');
                relevantLines.forEach((line) => {
                    console.error(`   ${line.trim()}`);
                });
            }
        }

        process.exit(1);
    }
}

// Run the check
checkPackageLockSync();
