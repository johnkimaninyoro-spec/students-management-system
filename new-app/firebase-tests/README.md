# Isolated Firebase testing
Uses demo-mara-school-test emulator only. No live deployment, school records, passwords or Firebase account changes. Tests load actual candidate rules; identities are simulated rule contexts, NOT real Auth sign-ins. Checks admin snapshot access and rejection of teacher, guest and legacy collection requests. Run status is in GitHub Actions: Mara Firebase emulator tests. Prepared tests are not a passing result.

Do not deploy candidate rules to production: they block legacy collections even for admin. Existing broad wildcard grants override narrow restrictions. Separate staging project and reviewed permissions are needed before live account or device testing.
