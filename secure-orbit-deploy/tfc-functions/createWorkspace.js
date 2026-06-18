// Base44 backend function: createWorkspace
// Invoked from the frontend as base44.functions.invoke('createWorkspace', form)
// Creates a real Terraform Cloud workspace for one deployment, sets its
// variables, uploads the lab's Terraform config, and triggers an apply run.

import { createTfcWorkspace, setWorkspaceVariables, uploadConfigurationVersion, createRun } from "./_lib/workspace.js";

Deno.serve(async (req) => {
  const form = await req.json();
  if (!form.name) {
    return Response.json({ error: "Deployment name is required" }, { status: 400 });
  }

  try {
    const workspaceId = await createTfcWorkspace(form.name);
    await setWorkspaceVariables(workspaceId, form);
    const configurationVersionId = await uploadConfigurationVersion(workspaceId, { speculative: false });
    const runId = await createRun(workspaceId, configurationVersionId, {
      message: `Deploy "${form.name}" via SecLab Orchestrator`,
    });

    return Response.json({ workspaceId, runId });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
