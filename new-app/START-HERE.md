# Mara NEW Firebase admin-pilot candidate

This folder is an **isolated deployment candidate** for the new Mara prototype. It does not publish anything, modify the old GitHub site, modify the source prototype, or deploy Firestore rules.

## What it is

- A standalone copy of the Mara app UI and features from the prototype, with local browser saving and portable JSON/CSV features retained.
- Starts with **no learner, guardian, teacher, house, fee, term, payment, or admission sample records**.
- Retains non-personal configuration defaults (grades, draft subjects, grading bands, timetable templates, Senior combination catalogue).
- Adds Firebase email/password **admin sign-in** and a guarded Firestore whole-school snapshot at exactly:
  `newAppSnapshots/wholeSchool`
- Firebase public web config was read from the old public site and is included only as client configuration. It is not a secret.

## Critical pilot boundary

This is one whole-school snapshot for the configured admin UID only:

`8oI8nKYo43ftqUkk0FJ4SdvIa3l1`

**Teacher logins are not implemented. Assigned-class permissions are not implemented.** The Teachers screen remains an administrative records feature only; it does not grant a teacher access to anything.

## Safe setup (do not publish from this folder automatically)

1. In Firebase Authentication, ensure the configured administrator can sign in using Email/Password.
2. `firestore.rules.candidate` is a **standalone transitional ruleset**, not a merge fragment. Firestore allows are ORed: any existing broad authenticated wildcard (for example `match /{document=**} { allow read, write: if request.auth != null; }`) overrides a restrictive `newAppSnapshots` block. Before any deploy, remove broad legacy allows and complete a project-wide rules review. This candidate explicitly denies all non-admin/legacy documents while the pilot ruleset is active.
3. Serve/test this folder locally or deploy it only as a new, separate Hosting target/site after review. No deploy command is included or run.
4. Sign in with the configured admin account.
5. The new cloud remains empty until the admin explicitly chooses **Initialize blank cloud**. That initializes configuration-only blank data; it does not upload browser data or fictional sample people.

## Sync behaviour and safety

- Before cloud writes, the app validates the model snapshot and enforces a **700 KB UTF-8 maximum**.
- The app uses a Firestore transaction and integer revision field. A stale writer is rejected rather than overwriting newer cloud data.
- Remote changes only render when there are no pending local edits. If local edits are pending, the app says so and does not overwrite them.
- The school UI stays locked until an authorized, validated cloud snapshot has loaded. On sign-out or authorization failure it hides the UI and replaces in-memory records with a blank configuration snapshot.
- Autosave emits an event from its actual lexical `flushAutoSave` function only after successful local persistence. Cloud sync queues versioned edits; edits made while a transaction is busy receive a following transaction instead of being dropped. A listener acknowledgement with `hasPendingWrites` advances the revision without restoring its own snapshot.
- Authentication/listener/write/snapshot errors fail closed: cloud save stops and the school UI remains locked.
- Existing local browser data is never silently uploaded. Cloud initialization is explicit and blank only.
- Local saves still occur. A JSON backup should be exported before reconciling a reported conflict.

## Files

- `index.html` — standalone app shell and Firebase SDK loading
- `app.js` — maintained prototype UI/features, changed to blank first-run data and a new local-storage key
- `cloud-sync.js` — admin Auth/Firestore snapshot guard
- `firestore.rules.candidate` — narrow rules candidate, not deployed
- `firebase.json` — hosting candidate, no deployment performed
- `tests/sync-core.test.js` — deterministic transaction/conflict/sizing model test
- `tests/production-cloud-sync.vm.test.cjs` — VM test that executes the actual production `cloud-sync.js` with DOM/Firebase compatibility stubs; covers lock/unlock, transaction initialization, rapid queued edits, own pending acknowledgement, and sign-out clearing

## Known limits / do not claim

- No live Firebase project rules were applied or tested. The supplied rules deny every legacy/non-admin document while active, so they must not be deployed without a complete project impact review.
- No real admin credentials, browser Firebase sign-in, Firestore network round trip, Hosting deployment, or production permission audit was performed. The VM test uses compatibility stubs, not Firebase services.
- Snapshot syncing has a deliberate whole-school conflict boundary; it is not multi-user record-level merging. A genuine concurrent remote change fails closed and needs backup/reload/reconciliation.
- The local browser copy is deliberately hidden/cleared in memory until cloud authorization; it is not a reliable offline mode in this pilot.
- This is not ready for real pupil records until privacy, safeguarding, retention, backups, roles, recovery procedures, rules audit, and live deployment are reviewed.
