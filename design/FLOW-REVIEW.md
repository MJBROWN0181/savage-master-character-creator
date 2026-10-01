# Prototype flow review — October 1, 2026

Checked all twelve main destinations. Each shows one view, one selected sidebar item and appropriate heading. Account plans remains a small Workspace link. Journals now have their own group; sidebar scrolls on short desktop screens.

Removed storyboard-only controls from Table View. Game Mat and Table View now share one turn tracker and one Epic Roll form that move into the selected play view, avoiding duplicate state and navigation away during play. Turn notifications appear only in play views. Campaign-specific headings no longer appear in settings, support, marketplace or personal library screens.

Feature boundaries: Storyboard prepares scenes; Table View is the simple session screen; Game Mat is its optional customizable alternative; Tome holds reusable preparation; Vault holds files; Books & Resources holds web/book references; player journal preserves the player's journey; GM journal holds private planning/reflections; marketplace sells; Keepsake Studio prepares future physical products. Quick notes in multiple play views intentionally write to one session-note source. Epic Roll reads into the journal from one source rather than creating separate editable copies.

Verified destination selection, visible-view counts, toolbar placement and Game Mat Epic Roll opening/cancel. Remaining implementation gaps: mock sample characters/campaign context, playable Tome runs, cloud permissions/sync, document previews, working purchases, live reports/social features and durable backups. Player/GM role-specific navigation must be implemented with account permissions. Keep advanced Game Mat optional so new users can use Table View immediately. Prototype data is local and must not be mistaken for secure cloud features.
