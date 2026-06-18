// Base44 backend function: destroyWorkspace
// Invoked from the frontend as base44.functions.invoke('destroyWorkspace', { workspaceId })
// Triggers a real Terraform Cloud destroy run against the deployment's workspace.
// Call again with { workspaceId, action: 'delete' } once getRunStatus shows the
// destroy run as "applied", to remove the now-empty workspace from the TFC org.

import { tfcRequest, tfcOrg } from "./_lib/tfcClient.js";
import { createRun } from "./_lib/workspace.js";

Deno.serve(async (req) => {
  const { workspaceId, action } = await req.json();
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  try {
    if (action === "delete") {
      const ws = await tfcRequest(`/workspaces/${workspaceId}`);
      await tfcRequest(`/organizations/${tfcOrg()}/workspaces/${ws.data.attributes.name}`, { method: "DELETE" });
      return Response.json({ deleted: true });
    }

    const runId = await createRun(workspaceId, null, {
      isDestroy: true,
      message: "Destroy via SecLab Orchestrator",
    });
    return Response.json({ runId });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
