# Isolated academic fixes

Unpublished. Target: fictional mara-school-workspace hosted baseline only. Do not deploy this whole branch: baseline parity is unproven.

1. In academics(), replace target.innerHTML += template with target.insertAdjacentHTML("beforeend", template). Preserve existing legacy form nodes and their submit handlers.
2. In workflowDraft(), supply classId: learner.classId to buildMarkDraft after ...v. Keep matching learner/subject class validation.

Exact patched source, original and regression test are preserved in the assistant workspace output/academic-fix. JavaScript syntax passes and 10 focused model regression checks pass, including reproducing original handler loss/missing class and validating fixed rendering, matching draft, mismatched class, invalid scores and real builder contract.

NOT verified: Firebase write persistence, browser rendering of the patched hosted build, or complete workflow. No hosting, rules or database changes made. Hosting publication blocked pending a supported authenticated route and exact version file/config mapping. Preserve existing hosted release for rollback.
