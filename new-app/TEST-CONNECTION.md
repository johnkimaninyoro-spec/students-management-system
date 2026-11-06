# Isolated test connection

Only mara-school-test is configured in cloud-sync.js. The default CLI project in this directory is the test project. No deployment was performed. Main and production were not changed.

The test database retains deny-all rules. No account, admin assignment, school snapshot or teacher access is provisioned. TEST_ADMIN_NOT_CONFIGURED deliberately keeps login disabled. Configure a dedicated test identity and reviewed project-specific rules before enabling access. Do not copy a production identity or credentials.

The public UI preview remains disconnected. This branch change alone does not update that preview or deploy a site.
