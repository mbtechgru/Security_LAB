// Base44 backend function: getOutputs
// Invoked from the frontend as base44.functions.invoke('getOutputs', { workspaceId })
// Called once a deploy run reaches "applied" to read the real outputs
// (kali_public_ip, vuln_bucket_name, vpc_id) from the workspace's latest state.

import { tfcRequest } from "./_lib/tfcClient.js";

Deno.serve(async (req) => {
  const { workspaceId } = await req.json();
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  try {
    const res = await tfcRequest(`/workspaces/${workspaceId}/current-state-version-outputs`);
    const outputs = {};
    for (const item of res.data) {
      outputs[item.attributes.name] = item.attributes.value;
    }
    return Response.json({
      kali_public_ip: outputs.kali_public_ip,
      vuln_bucket_name: outputs.vuln_bucket_name,
      vpc_id: outputs.vpc_id,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
