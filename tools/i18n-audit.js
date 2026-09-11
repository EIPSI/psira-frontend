#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'src');
const translationsDir = path.join(srcRoot, 'translations');
const allowlistPath = path.join(root, 'tools', 'i18n-hardcoded-allowlist.json');

const visibleAttributePattern =
  /\b(?:placeholder|title|alt|aria-label|nzTitle|nzPlaceHolder|nzOkText|nzCancelText|nzNotFoundContent)\s*=\s*"([^"{|][^"]*[A-Za-zÁÉÍÓÚáéíóúÑñ][^"]*)"/g;
const htmlTextPattern = />\s*([^<>{|]*[A-Za-zÁÉÍÓÚáéíóúÑñ][^<>{|]*)\s*</g;
const tsTextPattern =
  /(?:message|notification|modal|create|success|error|warning|info|confirm|title|content|nzTitle|nzOkText|nzCancelText|label|placeholder)\s*[:=]\s*['"`]([^'"`]*[A-Za-zÁÉÍÓÚáéíóúÑñ][^'"`]*)['"`]/g;
const translationUsePattern = /(?:'|")([A-Za-z0-9_.-]+)(?:'|")\s*\|\s*translate|\btranslate(?:Service)?\.(?:instant|get)\(\s*(?:'|")([A-Za-z0-9_.-]+)(?:'|")/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function loadTranslation(file) {
  const source = fs.readFileSync(file, 'utf8').replace(/export\s+default/, 'module.exports =');
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(source, sandbox, { filename: file });
  return sandbox.module.exports;
}

function flatten(obj, prefix = '', out = {}) {
  Object.keys(obj || {}).forEach((key) => {
    const value = obj[key];
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, next, out);
    } else {
      out[next] = value == null ? '' : String(value);
    }
  });
  return out;
}

function unflatten(flat) {
  return Object.keys(flat).reduce((acc, key) => {
    const parts = key.split('.');
    let target = acc;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        target[part] = flat[key];
      } else {
        target[part] = target[part] || {};
        target = target[part];
      }
    });
    return acc;
  }, {});
}

function relative(file) {
  return path.relative(root, file);
}

function collectTranslations() {
  const languages = {};
  for (const file of fs.readdirSync(translationsDir)) {
    if (!/^[a-z]{2}\.ts$/.test(file)) continue;
    const code = file.replace(/\.ts$/, '');
    languages[code] = flatten(loadTranslation(path.join(translationsDir, file)));
  }
  return languages;
}

function collectHardcodedStrings() {
  const files = walk(path.join(srcRoot, 'app')).filter((file) => /\.(html|ts)$/.test(file) && !/\.spec\.ts$/.test(file));
  const findings = [];
  files.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    const patterns = file.endsWith('.html')
      ? [
          ['html-text', htmlTextPattern],
          ['html-attribute', visibleAttributePattern],
        ]
      : [['ts-text', tsTextPattern]];
    patterns.forEach(([kind, pattern]) => {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(source))) {
        const value = String(match[1] || '').trim();
        if (!value || value.length < 2) continue;
        if (isTranslationKeyLike(value)) continue;
        if (/^https?:\/\//.test(value)) continue;
        if (/^[A-Z0-9_ .-]+$/.test(value) && value.length <= 3) continue;
        const line = source.slice(0, match.index).split(/\r?\n/).length;
        findings.push({ file: relative(file), line, kind, text: value.replace(/\s+/g, ' ') });
      }
    });
  });
  return findings;
}

function isTranslationKeyLike(value) {
  return /^[a-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/.test(value);
}

function loadAllowlist() {
  if (!fs.existsSync(allowlistPath)) return [];
  return JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
}

function findingId(finding) {
  return `${finding.file}:${finding.line}:${finding.kind}:${finding.text}`;
}

function findingFingerprint(finding) {
  return `${finding.file}:${finding.kind}:${finding.text}`;
}

function collectUsedKeys() {
  const files = walk(path.join(srcRoot, 'app')).filter((file) => /\.(html|ts)$/.test(file));
  const used = new Set();
  files.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    translationUsePattern.lastIndex = 0;
    let match;
    while ((match = translationUsePattern.exec(source))) {
      used.add(match[1] || match[2]);
    }
  });
  return used;
}

function writeSeed(languages, output) {
  const english = languages.en || {};
  const keys = Object.keys(english).sort().map((key) => ({
    key,
    namespace: key.split('.')[0],
    defaultText: english[key],
  }));
  const values = Object.keys(languages).sort().reduce((acc, code) => {
    acc[code] = unflatten(languages[code]);
    return acc;
  }, {});
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const seed = { keys, values };
  if (output.endsWith('.ts')) {
    fs.writeFileSync(
      output,
      `import { DefaultTranslationSeed } from './default-translations';\n\nexport const defaultTranslationSeed = ${JSON.stringify(seed, null, 2)} as DefaultTranslationSeed;\n`,
    );
    return;
  }
  fs.writeFileSync(output, JSON.stringify(seed, null, 2) + '\n');
}

const languages = collectTranslations();
const enKeys = new Set(Object.keys(languages.en || {}));
const usedKeys = collectUsedKeys();
const missingFromEnglish = [...usedKeys].filter((key) => !enKeys.has(key)).sort();
const unusedEnglish = [...enKeys].filter((key) => !usedKeys.has(key)).sort();
const incomplete = Object.keys(languages).sort().map((code) => ({
  code,
  keys: Object.keys(languages[code]).length,
  missingAgainstEnglish: [...enKeys].filter((key) => !languages[code].hasOwnProperty(key)).length,
}));
const allowlist = loadAllowlist();
const allowed = new Set(allowlist.flatMap((item) => [item.id, item.fingerprint].filter(Boolean)));
const hardcoded = collectHardcodedStrings().filter(
  (finding) => !allowed.has(findingId(finding)) && !allowed.has(findingFingerprint(finding))
);

const report = {
  generatedAt: new Date().toISOString(),
  hardcodedCount: hardcoded.length,
  hardcoded,
  allowedHardcodedCount: allowlist.length,
  missingFromEnglish,
  unusedEnglish,
  languages: incomplete,
};

if (process.argv.includes('--write-seed')) {
  const outputIndex = process.argv.indexOf('--write-seed') + 1;
  const output = process.argv[outputIndex]
    ? path.resolve(process.cwd(), process.argv[outputIndex])
    : path.resolve(root, '../psira-backend/src/modules/language/seed/default-translation-seed.ts');
  writeSeed(languages, output);
  console.log(`Wrote i18n seed to ${output}`);
} else if (process.argv.includes('--fail-on-hardcoded')) {
  if (hardcoded.length || missingFromEnglish.length) {
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(report, null, 2));
} else if (process.argv.includes('--fail-on-obsolete')) {
  if (unusedEnglish.length) {
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(report, null, 2));
} else if (process.argv.includes('--write-report')) {
  const outputIndex = process.argv.indexOf('--write-report') + 1;
  const output = process.argv[outputIndex]
    ? path.resolve(process.cwd(), process.argv[outputIndex])
    : path.resolve(root, 'tools', 'i18n-audit-report.json');
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`Wrote i18n audit report to ${output}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}
