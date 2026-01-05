# BUG: Research Prerequisite Check Fails Despite Prerequisite Being Completed

## Summary
Attempting to research items that require prerequisites fails with an error claiming the prerequisite is not completed, even when the prerequisite is visibly shown in the RESEARCHED section.

## Severity
**HIGH** - Blocks research progression

## Steps to Reproduce
1. Start fresh game or reset state
2. Progress to unlock research items
3. Confirm "Basic Website Gigs" appears in REVENUE > RESEARCHED section
4. Attempt to research "API Integration Gigs" (which requires Basic Website Gigs)
5. Error occurs

## Expected Behavior
Research should succeed since "Basic Website Gigs" is already researched.

## Actual Behavior
Server error is thrown:
```
[CONVEX M(research:purchaseResearchNode)] [Request ID: 5b5a850a8dbd977c] Server Error
Uncaught Error: Requires prerequisite research: Basic Website Gigs
  at handler (../convex/research.ts:190:6)
```

## Error Location
- File: `convex/research.ts`
- Line: 190
- Function: `handler` (purchaseResearchNode mutation)

## Affected Research Items
Any research item with prerequisites, confirmed for:
- API Integration Gigs (requires: Basic Website Gigs)

Potentially affects all prerequisite-dependent research items.

## Technical Notes
The prerequisite check at line 190 appears to be checking against incorrect data or using a different identifier than what's stored when a research node is completed.

Possible causes:
1. Research node ID mismatch between completion storage and prerequisite lookup
2. Category/type mismatch in prerequisite validation
3. Player research state not being queried correctly

## Screenshots
N/A (error captured in browser console)

## Environment
- Dev mode with 100x time warp enabled
- Player level: 8
- RP available: 610

## Date Discovered
2026-01-05

## Status
RESOLVED

## Resolution
Fixed in `convex/research.ts`. The `purchaseResearchNode` mutation now checks both:
1. Explicit purchase records in `playerResearch` table
2. Auto-unlocked starter nodes via `isNodeAlreadyUnlocked()` helper

Root cause: Starter nodes (0 RP cost, level 1, no prerequisites) are auto-unlocked into `playerUnlocks` but no record is written to `playerResearch`. The prerequisite check only looked at `playerResearch`, missing these auto-unlocked nodes.

