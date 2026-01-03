import { internalMutation } from "../_generated/server";

// Migration to remove reputation field from existing labState documents
export const removeReputationFromLabState = internalMutation({
  args: {},
  handler: async (ctx) => {
    const labStates = await ctx.db.query("labState").collect();
    
    let updated = 0;
    for (const labState of labStates) {
      // Replace document without reputation field
      await ctx.db.replace(labState._id, {
        labId: labState.labId,
        cash: labState.cash,
        researchPoints: labState.researchPoints,
        computeUnits: labState.computeUnits,
        staffCapacity: labState.staffCapacity,
        parallelTasks: labState.parallelTasks,
        juniorResearchers: labState.juniorResearchers,
      });
      updated++;
    }
    
    return { updated, total: labStates.length };
  },
});

// Migration to add visibility field to existing trainedModels
export const addVisibilityToModels = internalMutation({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query("trainedModels").collect();
    
    let updated = 0;
    for (const model of models) {
      // Add visibility field if missing (default to private)
      if (!model.visibility) {
        await ctx.db.patch(model._id, {
          visibility: "private",
        });
        updated++;
      }
    }
    
    return { updated, total: models.length };
  },
});

