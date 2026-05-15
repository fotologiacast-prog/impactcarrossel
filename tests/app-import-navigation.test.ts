import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const processProjectFileBody = source.match(/const processProjectFile = useCallback\(\(file: File\) => \{([\s\S]*?)\n  \}, \[/)?.[1] || '';

assert.match(processProjectFileBody, /setCarousel\(result\.data\)/);
assert.match(processProjectFileBody, /setStudioMode\('advanced'\)/);
assert.match(processProjectFileBody, /setActiveTab\('IMAGE'\)/);
assert.match(processProjectFileBody, /setHasEnteredGuidedFlow\(true\)/);
assert.match(processProjectFileBody, /setError\(null\)/);

console.log('app-import-navigation.test.ts passed');
