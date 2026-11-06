# Staging login and sync validation

Target: mara-school-test only. Branch: mara-new-app-test. No production deployment or main change.

Verified on 6 November 2026 using the actual app served locally, Firebase JavaScript SDK 10.7.1, two independent browser contexts, dedicated fictional staging administrator and the isolated staging backend.

Passed: app startup without page errors; email/password login; blank-cloud initialization; profile edit through the UI; listener delivery to second client; reload with persisted authentication and saved data; reverse-direction sync; cleanup of test marker; sign-out locks records.

Access tests passed: anonymous read denied; a separate non-admin account could neither read nor write the snapshot (403), and was deleted afterward. Admin collection listing, unrelated paths, invalid revision update and document deletion were denied. Staging rules are restricted to one dedicated test identity and one snapshot document, with server timestamp, bounded JSON payload and sequential revision checks.

Fixed an actual Firestore limitation: nested arrays inside the school snapshot cannot be stored directly. Snapshots now use a bounded JSON string, validated after parsing on read. This is a staging-only pilot format change; no production data migration was attempted.

The dedicated fictional test administrator remains in test Auth. Its password and account details are not included here, in repository files or test results. They are not user-facing login credentials. The test database contains only the blank fictional school snapshot and configuration. Temporary denial account removed.

The public preview stays disconnected. No website deployment, production rules change or real pupil data use occurred. Teacher permissions, simultaneous edit-conflict stress tests, offline recovery, local-cache confidentiality, user-device behavior and production readiness are not established by these checks. This is an admin-only staging pilot, not a production security approval.
