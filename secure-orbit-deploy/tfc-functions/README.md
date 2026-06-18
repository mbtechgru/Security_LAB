# Terraform Cloud backend functions (reference source)

These are Deno backend functions written for Base44's hosted function runtime. **They are not picked up automatically by this repo or by Base44** — Base44 functions are authored and deployed through the Base44 app editor itself, which has no local file sync into this git checkout. To deploy these:

1. Open this app in the Base44 editor and create five backend functions named exactly:
   `createWorkspace`, `planOnly`, `getRunStatus`, `getOutputs`, `destroyWorkspace`.
2. Paste the contents of the matching file in this folder into each one. Each file's `_lib/*` imports are inlined as relative imports — if Base44's editor doesn't support multi-file functions, copy the contents of `_lib/tfcClient.js`, `_lib/tar.js`, and `_lib/terraformConfig.js` to the top of every function that imports them (only `createWorkspace.js` and `planOnly.js` need `tar.js` and `terraformConfig.js`; all five need `tfcClient.js`).
3. In the Base44 secret/env manager for this app, set:
   - `TFC_API_TOKEN` — a Terraform Cloud API token (Team token scoped to manage workspaces is preferred over a personal token).
   - `TFC_ORG` — your Terraform Cloud organization name.
   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — credentials the remote TFC runs use to create the lab's AWS resources. These get written as **sensitive** TFC workspace variables on every workspace these functions create, not exposed to the browser.
4. Confirm the frontend can reach these via `base44.functions.invoke('createWorkspace', {...})` etc. (already wired in `src/pages/Deployments.jsx`).

## Why one workspace per deployment

`createWorkspace` provisions a new Terraform Cloud workspace per "Deploy Lab" click, uploads `main.tf` + `variables.tf` + `outputs.tf` (embedded in `_lib/terraformConfig.js` — **keep that file in sync manually if you change the root `.tf` files**, since these functions can't read this git repo at runtime), sets the form values as workspace variables, and triggers a real run. This matches the existing multi-deployment History UI in the app, where each row is independently deployable/destroyable.

## Variable name mapping

The React form / `Deployment` entity field is `instance_type`, but the actual Terraform variable (in `variables.tf`) is `instance_type_free_tier`. `createWorkspace.js` and `planOnly.js` remap this — keep that mapping in sync if `variables.tf` changes.

## Known follow-ups (not implemented here, out of scope for this pass)

- AWS OIDC dynamic credentials instead of static `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` workspace variables.
- Automatic deletion of ephemeral speculative-plan workspaces created by `planOnly` when no `workspaceId` is passed in (they accumulate in the TFC org over time; clean up manually until this is automated).
