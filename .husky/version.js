const fs = require('fs');

// Add the version from the root package.json to the dist package.json
const packageJsonRoot = JSON.parse(fs.readFileSync('package.json'));

// Update root package-lock.json with version
const packageJsonLockRoot = JSON.parse(fs.readFileSync('package-lock.json'));
packageJsonLockRoot.version = packageJsonRoot.version;
packageJsonLockRoot.packages[''].version = packageJsonRoot.version;
fs.writeFileSync('package-lock.json', JSON.stringify(packageJsonLockRoot, null, 4));
