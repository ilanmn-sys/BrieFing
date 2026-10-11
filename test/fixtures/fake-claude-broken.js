#!/usr/bin/env node
// Behaves like a Claude Code install whose company gateway is misconfigured: prints the error, asks a question, waits.
console.log('Error: gateway failed to start:\nError: failed to decrypt credentials: credential mismatch: expected bedrock credentials, got vertex');
console.log('  WARNING Your current provider is being phased out.\n  Switch to Amazon Bedrock now? [y/N]');
process.stdin.resume(); process.stdin.on('end', () => process.exit(1)); // with stdin closed this ends at once
