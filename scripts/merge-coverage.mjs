import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('Merging coverage reports...');

const coverageDir = 'coverage';
const unitDir = join(coverageDir, 'unit');
const integrationDir = join(coverageDir, 'integration');

// Check if coverage directories exist
if (!existsSync(unitDir) || !existsSync(integrationDir)) {
    console.error('❌ Coverage directories not found. Run tests with coverage first.');
    process.exit(1);
}

try {
    // Read individual lcov files
    const unitLcovPath = join(unitDir, 'lcov.info');
    const integrationLcovPath = join(integrationDir, 'lcov.info');

    let mergedContent = '';

    if (existsSync(unitLcovPath)) {
        mergedContent += readFileSync(unitLcovPath, 'utf8');
        console.log('✓ Unit test coverage found');
    }

    if (existsSync(integrationLcovPath)) {
        if (mergedContent.length > 0) {
            mergedContent += '\n';
        }
        mergedContent += readFileSync(integrationLcovPath, 'utf8');
        console.log('✓ Integration test coverage found');
    }

    // Write merged lcov file
    const mergedLcovPath = join(coverageDir, 'lcov.info');
    writeFileSync(mergedLcovPath, mergedContent);
    console.log('✓ Created merged lcov.info');

    // Create HTML report directory
    const reportDir = join(coverageDir, 'lcov-report');
    if (!existsSync(reportDir)) {
        mkdirSync(reportDir, { recursive: true });
    }

    console.log('✓ Coverage reports merged successfully');
    console.log(`📊 Merged LCOV: ${mergedLcovPath}`);
    console.log(`📊 Unit report: ${join(unitDir, 'lcov-report', 'index.html')}`);
    console.log(`📊 Integration report: ${join(integrationDir, 'lcov-report', 'index.html')}`);

} catch (error) {
    console.error('❌ Error merging coverage:', error.message);
    console.error(error.stack);
    process.exit(1);
}
