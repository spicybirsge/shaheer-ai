import { JustBashSandbox } from "eve/sandbox/just-bash";
import { defineSandbox } from "eve/sandbox";
// No shell tool is exposed. This in-memory provider avoids provisioning paid VMs.
export const environment = JustBashSandbox.environment();
export default defineSandbox(() => environment.open());
