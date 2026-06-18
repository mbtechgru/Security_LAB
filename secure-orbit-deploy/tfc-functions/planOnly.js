// Base44 backend function: planOnly
// Invoked from the frontend as base44.functions.invoke('planOnly', { workspaceId?, ...form })
// Runs a speculative (plan-only) Terraform Cloud run that can never apply, so
// "Test Plan" never touches real AWS resources. Reuses an existing workspace
// if `workspaceId` is provided, otherwise creates a throwaway one.

import { createTfcWorkspace, setWorkspaceVariables, uploadConfigurationVersion, createRun } from "./_lib/workspace.js";

Deno.serve(async (req) => {
  const { workspaceId: existingWorkspaceId, ...form } = await req.json();
  if (!form.name) {
    return Response.json({ error: "Deployment name is required" }, { status: 400 });
  }

  try {
    const workspaceId = existingWorkspaceId || (await createTfcWorkspace(form.name));
    if (!existingWorkspaceId) {
      await setWorkspaceVariables(workspaceId, form);
    }
    const configurationVersionId = await uploadConfigurationVersion(workspaceId, { speculative: true });
    const runId = await createRun(workspaceId, configurationVersionId, {
      message: `Speculative plan for "${form.name}"`,
    });

    return Response.json({ workspaceId, runId });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
