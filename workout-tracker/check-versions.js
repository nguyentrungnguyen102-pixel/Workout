const EXPECTED = {
  'expo': '54.',
  'react': '19.',
  'react-native': '0.81.',
  'babel-preset-expo': '54.',
  'react-native-reanimated': '4.',
  'react-native-safe-area-context': '5.',
};

let ok = true;
for (const [pkg, prefix] of Object.entries(EXPECTED)) {
  try {
    const v = require(`./node_modules/${pkg}/package.json`).version;
    const pass = v.startsWith(prefix);
    console.log(`${pass ? '✓' : '✗'} ${pkg}: ${v} (expected ${prefix}x)`);
    if (!pass) ok = false;
  } catch {
    console.log(`✗ ${pkg}: NOT INSTALLED`);
    ok = false;
  }
}

if (!ok) {
  console.error('\nVersion sai hoac thieu package! Chay lai: npm ci');
  process.exit(1);
}
console.log('\nAll versions correct! Starting app...\n');
