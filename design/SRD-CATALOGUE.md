# SRD quick-reference cards

Source: official English SRD 5.2.1, CC-BY-4.0. Required attribution is retained on the 5e page and printable sheets. Only licensed SRD material and original interface copy are used.

`scripts/build-srd-catalogue.py` builds source excerpts with PyMuPDF from the official PDF. It recognizes titles and metadata, joins wrapped text, handles column order and shaded table rows, and records the original physical PDF page. Spell metadata is identified by labels, including the source’s occasional singular “Component”. The source PDF is cached in the OS temporary folder and is not shipped.

Cards use compact excerpts up to 620 characters plus relevant metadata and a source link. Excerpts can omit later conditions, scaling, lists, and tables, so each catalogue explicitly directs readers to the full source for complete mechanics. Class and background summaries are written separately and use the same card component in the builder and reference tabs.

339 spell cards; 17 feats; 232 class/subclass features; 414 item cards (37 weapons, 13 armor/shield entries, tools, adventuring gear, magic items); 18 equipment-property cards; 155 rules/glossary cards. Monster stat blocks are still linked through the official rules reference, not included in these short cards.

Each catalogue loads only when opened, supports keyword search and category filters, and displays 12 entries at a time. Builder reference panels are read-only: users still record their chosen equipment, spells, and features in sheet fields. These cards do not implement leveling, purchases, or automatic character-rule validation.

Content tests check metadata for every spell, source pages, unique entry keys, all weapon/armor rows, representative 2024 mechanics, and correct class assignment at page boundaries. Regenerate with the bundled Python runtime after installing PyMuPDF from PyPI.
