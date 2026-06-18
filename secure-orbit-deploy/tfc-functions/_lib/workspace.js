import { tfcOrg, tfcRequest, tfcRawPut } from "./tfcClient.js";
import { buildTarGz } from "./tar.js";
import { MAIN_TF, VARIABLES_TF, OUTPUTS_TF } from "./terraformConfig.js";

// The React form / Deployment entity calls this field `instance_type`, but the
// actual Terraform variable (variables.tf) is `instance_type_free_tier`.
const FORM_TO_TF_VAR = {
  instance_type: "instance_type_free_tier",
};

const SENSITIVE_VARS = new Set(["dsrm_password"]);

const TF_VAR_KEYS = [
  "region",
  "vpc_cidr",
  "attacker_subnet_cidr",
  "victim_subnet_cidr",
  "services_subnet_cidr",
  "key_pair_name",
  "allowed_admin_cidr",
  "domain_name",
  "dsrm_password",
  "instance_type",
  "kali_ami_id",
  "metasploitable_ami_id",
  "windows_ami_id",
];

function slugify(name) {
  return (name || "lab")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function createTfcWorkspace(deploymentName) {
  const org = tfcOrg();
  const name = `seclab-${slugify(deploymentName)}-${Date.now().toString(36)}`;
  const res = await tfcRequest(`/organizations/${org}/workspaces`, {
    method: "POST",
    body: {
      data: {
        type: "workspaces",
        attributes: {
          name,
          "execution-mode": "remote",
          "auto-apply": true,
        },
      },
    },
  });
  return res.data.id;
}

export async function setWorkspaceVariables(workspaceId, formValues) {
  for (const key of TF_VAR_KEYS) {
    if (formValues[key] === undefined || formValues[key] === "") continue;
    const tfKey = FORM_TO_TF_VAR[key] || key;
    await tfcRequest(`/workspaces/${workspaceId}/vars`, {
      method: "POST",
      body: {
        data: {
          type: "vars",
          attributes: {
            key: tfKey,
            value: String(formValues[key]),
            category: "terraform",
            sensitive: SENSITIVE_VARS.has(key),
            hcl: false,
          },
        },
      },
    });
  }

  const awsKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecret = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  if (awsKeyId && awsSecret) {
    for (const [key, value] of [
      ["AWS_ACCESS_KEY_ID", awsKeyId],
      ["AWS_SECRET_ACCESS_KEY", awsSecret],
    ]) {
      await tfcRequest(`/workspaces/${workspaceId}/vars`, {
        method: "POST",
        body: {
          data: {
            type: "vars",
            attributes: { key, value, category: "env", sensitive: true, hcl: false },
          },
        },
      });
    }
  }
}

export async function uploadConfigurationVersion(workspaceId, { speculative }) {
  const cv = await tfcRequest(`/workspaces/${workspaceId}/configuration-versions`, {
    method: "POST",
    body: {
      data: {
        type: "configuration-versions",
        attributes: { "auto-queue-runs": false, speculative },
      },
    },
  });

  const uploadUrl = cv.data.attributes["upload-url"];
  const tarGz = await buildTarGz([
    { name: "main.tf", content: MAIN_TF },
    { name: "variables.tf", content: VARIABLES_TF },
    { name: "outputs.tf", content: OUTPUTS_TF },
  ]);
  await tfcRawPut(uploadUrl, tarGz);

  return cv.data.id;
}

export async function createRun(workspaceId, configurationVersionId, { isDestroy = false, message } = {}) {
  const run = await tfcRequest("/runs", {
    method: "POST",
    body: {
      data: {
        type: "runs",
        attributes: {
          "auto-apply": true,
          "is-destroy": isDestroy,
          message: message || "Triggered by SecLab Orchestrator",
        },
        relationships: {
          workspace: { data: { type: "workspaces", id: workspaceId } },
          ...(configurationVersionId
            ? { "configuration-version": { data: { type: "configuration-versions", id: configurationVersionId } } }
            : {}),
        },
      },
    },
  });
  return run.data.id;
}
