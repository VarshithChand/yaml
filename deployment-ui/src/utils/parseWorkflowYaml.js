import { load } from "js-yaml";

// The most common reason a pasted template fails to parse is whitespace,
// not real structural problems: leading tabs (YAML indentation must be
// spaces) and trailing whitespace confuse the indentation-sensitive
// parser. This fixes only those two things — it deliberately does not try
// to guess at deeper structural misalignment, since a wrong guess there
// would silently change what the workflow means.
export function tryFixIndentation(yamlText) {

    let changed = false;

    const fixedLines = yamlText.split("\n").map((line) => {

        let fixed = line;
        const leadingTabs = fixed.match(/^\t+/);

        if (leadingTabs) {
            fixed = "  ".repeat(leadingTabs[0].length) + fixed.slice(leadingTabs[0].length);
        }

        const trimmed = fixed.replace(/[ \t]+$/, "");

        if (trimmed !== fixed) fixed = trimmed;
        if (fixed !== line) changed = true;

        return fixed;

    });

    return changed ? fixedLines.join("\n") : null;

}

// Turns a pasted GitHub Actions workflow OR Azure DevOps pipeline YAML into
// a job dependency graph: jobs grouped into layers, where layer N only
// contains jobs whose dependencies are all satisfied by earlier layers —
// this is what makes the graph renderable left-to-right without guessing
// at positions.
export function parseWorkflowYaml(yamlText) {

    if (!yamlText || !yamlText.trim()) {
        throw new Error("Paste a workflow or pipeline YAML template first.");
    }

    let doc;

    try {
        doc = load(yamlText);
    }
    catch (err) {
        throw new Error(formatYamlError(err));
    }

    if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
        throw new Error("This doesn't look like a pipeline file — expected a YAML mapping at the top level.");
    }

    const flavor = detectFlavor(doc);

    if (!flavor) {
        throw new Error(
            "No jobs found — this doesn't look like a GitHub Actions workflow (needs a top-level " +
            "\"jobs:\" mapping) or an Azure DevOps pipeline (needs \"stages:\", \"jobs:\", or \"steps:\")."
        );
    }

    const paramsMap = resolveParametersMap(doc);
    const jobs = flavor === "github"
        ? extractGitHubJobs(doc)
        : extractAzureJobs(doc, flavor, paramsMap);

    if (jobs.length === 0) {
        throw new Error("No jobs could be found in this pipeline.");
    }

    const knownIds = new Set(jobs.map((job) => job.id));

    for (const job of jobs) {
        for (const dep of job.needs) {
            if (!knownIds.has(dep)) {
                throw new Error(`Job "${job.id}" depends on "${dep}", which doesn't exist in this pipeline.`);
            }
        }
    }

    const layers = computeLayers(jobs);

    return {
        name: doc.name || "",
        jobs,
        layers,
        // Azure boolean/string parameters, shown as a "Run this pipeline"
        // picker before starting — mirrors Azure's own pre-run parameter
        // dialog. Empty for GitHub Actions workflows.
        runParameters: flavor === "github" ? [] : resolveRunParameters(doc)
    };

}

function formatYamlError(err) {

    if (err && err.name === "YAMLException") {
        const line = err.mark ? err.mark.line + 1 : null;
        const reason = err.reason || err.message;
        return line ? `YAML error at line ${line} — ${reason}` : `YAML error — ${reason}`;
    }

    return `YAML syntax error — ${err.message}`;

}

function detectFlavor(doc) {

    if (doc.jobs && typeof doc.jobs === "object" && !Array.isArray(doc.jobs) && Object.keys(doc.jobs).length > 0) {
        return "github";
    }

    if (Array.isArray(doc.stages)) return "azure-stages";
    if (Array.isArray(doc.jobs)) return "azure-jobs";
    if (Array.isArray(doc.steps)) return "azure-steps";

    return null;

}

//===========================================================
// GitHub Actions
//===========================================================

function extractGitHubJobs(doc) {

    return Object.keys(doc.jobs).map((id) => {

        const raw = doc.jobs[id] || {};

        const needs = raw.needs
            ? (Array.isArray(raw.needs) ? raw.needs : [raw.needs])
            : [];

        const steps = Array.isArray(raw.steps)
            ? raw.steps.map((step, index) => ({ name: githubStepLabel(step, index) }))
            : [];

        // A job targeting an environment with required reviewers pauses
        // for approval on real GitHub — this is what the simulated Run
        // stops for, same as it stops for Azure's own run parameters.
        const environment = typeof raw.environment === "string"
            ? raw.environment
            : (raw.environment && typeof raw.environment === "object" ? raw.environment.name : null);

        return {
            id,
            name: raw.name || id,
            needs,
            runsOn: Array.isArray(raw["runs-on"]) ? raw["runs-on"].join(", ") : (raw["runs-on"] || ""),
            steps,
            environment: environment || null,
            referencedParams: []
        };

    });

}

function githubStepLabel(step, index) {

    if (!step || typeof step !== "object") return `Step ${index + 1}`;

    if (step.name) return step.name;
    if (step.uses) return step.uses;
    if (step.run) return firstLine(step.run);

    return `Step ${index + 1}`;

}

//===========================================================
// Azure DevOps
//===========================================================

function extractAzureJobs(doc, flavor, paramsMap) {

    if (flavor === "azure-steps") {

        return [{
            id: "job",
            name: doc.name || "Pipeline",
            needs: [],
            runsOn: doc.pool?.vmImage || doc.pool?.name || "",
            steps: doc.steps.map((step, index) => ({ name: azureStepLabel(step, index) }))
        }];

    }

    if (flavor === "azure-jobs") {

        const expanded = expandEachLoops(doc.jobs, doc, paramsMap);
        return expanded.map((raw) => normalizeAzureJob(raw, [])).filter(Boolean);

    }

    // azure-stages: jobs run within a stage in parallel by default; stages
    // themselves run in sequence — so a job with no explicit "dependsOn"
    // implicitly depends on every job in the previous stage, and a job
    // that does specify "dependsOn" (even an empty list, meaning "run
    // immediately regardless of stage order") is respected as-is.
    const expandedStages = expandEachLoops(doc.stages, doc, paramsMap);
    const jobs = [];
    let previousStageJobIds = [];

    expandedStages.forEach((stage) => {

        const stageJobsRaw = Array.isArray(stage?.jobs) ? stage.jobs : [];
        const stageJobIds = [];

        stageJobsRaw.forEach((raw) => {

            const job = normalizeAzureJob(raw, previousStageJobIds);

            if (job) {
                jobs.push(job);
                stageJobIds.push(job.id);
            }

        });

        if (stageJobIds.length > 0) previousStageJobIds = stageJobIds;

    });

    return jobs;

}

function normalizeAzureJob(raw, implicitNeeds) {

    if (!raw || typeof raw !== "object") return null;

    const id = raw.job || raw.deployment || raw.name;
    if (!id) return null;

    const hasDependsOn = Object.prototype.hasOwnProperty.call(raw, "dependsOn");

    const needs = hasDependsOn
        ? (Array.isArray(raw.dependsOn) ? raw.dependsOn : [raw.dependsOn])
        : (implicitNeeds || []);

    const steps = Array.isArray(raw.steps)
        ? raw.steps.map((step, index) => ({ name: azureStepLabel(step, index) }))
        : [];

    return {
        id,
        name: raw.displayName || id,
        needs,
        runsOn: raw.pool?.vmImage || raw.pool?.name || "",
        steps,
        environment: null,
        referencedParams: extractReferencedParams(raw.condition)
    };

}

// Full evaluation of Azure's condition expression language (and/or/eq,
// runtime variables, dependency outputs) isn't something a static preview
// can do faithfully — there's no real git history or prior job output to
// check against. Instead this extracts which boolean run parameters a
// job's condition mentions, so the simulated run can ask about exactly
// those via the same checkbox picker Azure itself shows before a manual
// run, and skip the job if none of them end up checked.
function extractReferencedParams(conditionText) {

    if (typeof conditionText !== "string") return [];

    const names = new Set();

    for (const match of conditionText.matchAll(/\{\{param:(\w+)\}\}/g)) {
        names.add(match[1]);
    }

    for (const match of conditionText.matchAll(/\$\{\{\s*parameters\.(\w+)\s*\}\}/g)) {
        names.add(match[1]);
    }

    return [...names];

}

function azureStepLabel(step, index) {

    if (!step || typeof step !== "object") return `Step ${index + 1}`;

    if (step.displayName) return step.displayName;
    if (step.task) return String(step.task).split("@")[0];
    if (step.checkout) return `Checkout: ${step.checkout}`;
    if (step.script) return firstLine(step.script);
    if (step.powershell) return firstLine(step.powershell);
    if (step.pwsh) return firstLine(step.pwsh);
    if (step.bash) return firstLine(step.bash);
    if (step.publish) return `Publish: ${step.publish}`;
    if (step.download) return `Download: ${step.download}`;
    if (step.template) return `Template: ${step.template}`;

    return `Step ${index + 1}`;

}

//===========================================================
// Azure "${{ each x in y }}:" template-loop expansion
//
// Azure DevOps pipelines commonly generate a job (or a set of steps) per
// item of a parameter list using this loop syntax, which a plain YAML
// parser leaves as a literal, unusable string key. Since the loop source
// is very often a parameter declared with a static default right in the
// same file (as opposed to something only known at pipeline-run time),
// this expands that specific, common case — a fixed list, one level of
// substitution ("${{ item.field }}" / "${{ upper(item.field) }}") — and
// deliberately leaves anything else (conditionals, cross-parameter
// expressions, runtime-only values) untouched rather than guessing.
//===========================================================

const EACH_LOOP_KEY = /^\$\{\{\s*each\s+(\w+)\s+in\s+([\w.]+)\s*\}\}$/;

// Only boolean/string/number parameters make sense as something a person
// picks in a dialog before running — "projects" (an object/list, used only
// as a template-loop source) isn't something to prompt for.
function resolveRunParameters(doc) {

    if (!Array.isArray(doc.parameters)) return [];

    return doc.parameters
        .filter((param) => param && ["boolean", "string", "number"].includes(param.type))
        .map((param) => ({
            name: param.name,
            displayName: param.displayName || param.name,
            type: param.type,
            default: param.default
        }));

}

function resolveParametersMap(doc) {

    const map = {};

    if (Array.isArray(doc.parameters)) {
        doc.parameters.forEach((param) => {
            if (param && param.name !== undefined) map[param.name] = param.default;
        });
    }

    return map;

}

function resolveLoopSource(path, paramsMap) {

    const key = path.startsWith("parameters.") ? path.slice("parameters.".length) : path;
    return Object.prototype.hasOwnProperty.call(paramsMap, key) ? paramsMap[key] : null;

}

function resolveLoopExpr(expr, loopVar, item) {

    const parts = expr.split(".");
    if (parts[0] !== loopVar) return undefined;

    let value = item;

    for (let i = 1; i < parts.length; i++) {
        if (value == null) return undefined;
        value = value[parts[i]];
    }

    return value;

}

function substituteLoopVars(text, loopVar, item) {

    return text
        // parameters[format('build_{0}', project.name)] — a dynamic
        // parameter-name lookup, common in per-item conditions. The name
        // itself ("build_Admin") is knowable now (project.name is), but
        // its VALUE is only chosen later when the user runs the pipeline
        // — so this resolves to a {{param:build_Admin}} marker rather
        // than a value, for extractReferencedParams to pick up.
        .replace(/\$\{\{\s*parameters\[\s*format\(\s*'([^']*)'\s*,\s*([\w.]+)\s*\)\s*\]\s*\}\}/g, (match, fmt, expr) => {
            const value = resolveLoopExpr(expr, loopVar, item);
            return value === undefined ? match : `{{param:${fmt.replace("{0}", String(value))}}}`;
        })
        .replace(/\$\{\{\s*upper\(\s*([\w.]+)\s*\)\s*\}\}/g, (match, expr) => {
            const value = resolveLoopExpr(expr, loopVar, item);
            return value === undefined ? match : String(value).toUpperCase();
        })
        .replace(/\$\{\{\s*([\w.]+)\s*\}\}/g, (match, expr) => {
            const value = resolveLoopExpr(expr, loopVar, item);
            return value === undefined ? match : String(value);
        });

}

function deepSubstitute(node, loopVar, item) {

    if (typeof node === "string") return substituteLoopVars(node, loopVar, item);

    if (Array.isArray(node)) return node.map((entry) => deepSubstitute(entry, loopVar, item));

    if (node && typeof node === "object") {
        const out = {};
        for (const [key, value] of Object.entries(node)) {
            out[substituteLoopVars(key, loopVar, item)] = deepSubstitute(value, loopVar, item);
        }
        return out;
    }

    return node;

}

function expandEachLoops(node, doc, paramsMap) {

    if (Array.isArray(node)) {

        const result = [];

        for (const entry of node) {

            const loopMatch = entry && typeof entry === "object" && !Array.isArray(entry) && Object.keys(entry).length === 1
                ? Object.keys(entry)[0].match(EACH_LOOP_KEY)
                : null;

            if (loopMatch) {

                const [, loopVar, path] = loopMatch;
                const source = resolveLoopSource(path, paramsMap);

                if (Array.isArray(source)) {

                    const body = entry[Object.keys(entry)[0]];

                    source.forEach((sourceItem) => {

                        const substituted = deepSubstitute(body, loopVar, sourceItem);
                        const expanded = expandEachLoops(substituted, doc, paramsMap);

                        if (Array.isArray(expanded)) result.push(...expanded);
                        else result.push(expanded);

                    });

                    continue;

                }

            }

            result.push(expandEachLoops(entry, doc, paramsMap));

        }

        return result;

    }

    if (node && typeof node === "object") {
        const out = {};
        for (const [key, value] of Object.entries(node)) {
            out[key] = expandEachLoops(value, doc, paramsMap);
        }
        return out;
    }

    return node;

}

function firstLine(text) {
    const line = String(text).trim().split("\n")[0];
    return line.length > 60 ? `${line.slice(0, 57)}...` : line;
}

// Kahn's algorithm, grouped into layers instead of a flat order — a job
// lands in the earliest layer where every one of its dependencies has
// already been placed in an earlier layer.
function computeLayers(jobs) {

    const byId = new Map(jobs.map((job) => [job.id, job]));
    const remaining = new Set(jobs.map((job) => job.id));
    const placed = new Set();
    const layers = [];

    while (remaining.size > 0) {

        const layer = [];

        for (const id of remaining) {
            const job = byId.get(id);
            if (job.needs.every((dep) => placed.has(dep))) {
                layer.push(id);
            }
        }

        if (layer.length === 0) {
            throw new Error("Circular dependency detected — can't determine a run order.");
        }

        layer.forEach((id) => {
            remaining.delete(id);
            placed.add(id);
        });

        layers.push(layer);

    }

    return layers;

}
