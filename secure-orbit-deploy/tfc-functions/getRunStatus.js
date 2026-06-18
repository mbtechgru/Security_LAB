// Base44 backend function: getRunStatus
// Invoked from the frontend as base44.functions.invoke('getRunStatus', { runId })
// Polled every few seconds while a deployment is planning/applying/destroying.
// Returns the run's status plus the real plan/apply log text so the UI's
// terminal panel streams genuine Terraform output instead of a simulation.

import { tfcRequest, tfcRawGet } from "./_lib/tfcClient.js";

async function fetchLog(type, id) {
  if (!id) return "";
  const res = await tfcRequest(`/${type}/${id}`);
  const logUrl = res.data.attributes["log-read-url"];
  if (!logUrl) return "";
  return tfcRawGet(logUrl);
}

Deno.serve(async (req) => {
  const { runId } = await req.json();
  if (!runId) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  try {
    const run = await tfcRequest(`/runs/${runId}`);
    const status = run.data.attributes.status;
    const planId = run.data.relationships.plan?.data?.id;
    const applyId = run.data.relationships.apply?.data?.id;

    const [planLog, applyLog] = await Promise.all([fetchLog("plans", planId), fetchLog("applies", applyId)]);

    return Response.json({ status, planLog, applyLog });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
