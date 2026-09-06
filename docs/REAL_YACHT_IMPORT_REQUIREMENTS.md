# Real yacht import reference

Primary stress-test workbook: `Crew Uniform _Crew Sizing _ 2025(1).xlsx` from a real yacht.

The importer must preserve and normalize these real-world concepts:
- yacht confidentiality by default
- crew position slots independent of current occupant
- vacancies
- operational uniform sets (e.g. Boss On / Boss Off)
- product-specific sizing rather than one universal top/bottom size
- department/role-based entitlements
- issued quantities vs spare-store stock
- multiple sizing systems per product
- scratch/working sheets vs authoritative sheets
- duplicated crew numbers
- position conflicts across sheets
- fuzzy name differences across sheets
- vacancy/filled conflicts across sheets
- formula/error cells and stale/manual totals
- semi-structured product descriptions that need splitting into category/model/colour/department/quantity

Reference workbook findings used for UX stress testing:
- 5 main operational uniform sheets detected: Men Boss Off, Men Boss On, Ladies Boss Off, Ladies Boss On, Chefs
- about 89 product blocks
- about 120 numbered crew/position slots
- source workbook also contains a blank sheet and a working/scratch sheet
- real data contains duplicate/mismatched crew/position/name records and workbook formula/error issues

UX rule: YachtUniform adapts to the vessel's existing workbook. The Chief Stew should not have to rebuild or reformat the file before import.

Post-import UX: show a concise Import Ready summary, then surface only the ambiguous/conflicting records that need human review. Never reproduce the giant source matrix as the primary interface.
