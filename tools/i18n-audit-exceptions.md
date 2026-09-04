# I18n Audit Exceptions

The i18n auditor is configured to fail on new visible hardcoded text and missing English keys.
The current allowlist contains historical hardcoded text that existed before the dynamic language
implementation and must be migrated module by module.

Current exception count: 1683

Justification:
- The legacy UI contains many dynamic table labels, form labels, modal texts, and notification strings.
- Removing or renaming all of them mechanically in one pass is risky because several keys are used by
  dynamic column definitions and backend-driven screens.
- The allowlist stores stable fingerprints so line changes do not hide newly introduced hardcoded text.

Required rule:
- New UI text must be added as a translation key.
- When a module is migrated, remove its entries from `tools/i18n-hardcoded-allowlist.json`.
- `npm run i18n:audit:strict` must stay at zero new findings before closing i18n-related work.

