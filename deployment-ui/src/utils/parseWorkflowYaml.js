import { load } from "js-yaml";

// Turns a pasted GitHub Actions workflow YAML into a job dependency graph:
// jobs grouped into layers, where layer N only contains jobs whose `needs:`
// are all satisfied by earlier layers — this is what makes the graph
// renderable left-to-right without guessing at positions.
export function parseWorkflowYaml(yamlText) {

    if (!yamlText || !yamlText.trim()) {
        throw new Error("Paste a workflow YAML template first.");
    }

    let doc;

    try {
        doc = load(yamlText);
    }
    catch (err) {
        throw new Error(`YAML syntax error — ${err.message}`);
    }

    if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
        throw new Error("This doesn't look like a workflow file — expected a YAML mapping at the top level.");
    }

    const jobsRaw = doc.jobs;

    if (!jobsRaw || typeof jobsRaw !== "object" || Array.isArray(jobsRaw)) {
        throw new Error("No \"jobs:\" section found — a workflow needs at least one job.");
    }

    const jobIds = Object.keys(jobsRaw);

    if (jobIds.length === 0) {
        throw new Error("The \"jobs:\" section is empty.");
    }

    const knownIds = new Set(jobIds);

    const jobs = jobIds.map((id) => {

        const raw = jobsRaw[id] || {};

        const needs = raw.needs
            ? (Array.isArray(raw.needs) ? raw.needs : [raw.needs])
            : [];

        for (const dep of needs) {
            if (!knownIds.has(dep)) {
                throw new Error(`Job "${id}" needs "${dep}", which doesn't exist in this workflow.`);
            }
        }

        const steps = Array.isArray(raw.steps)
            ? raw.steps.map((step, index) => ({
                name: stepLabel(step, index)
            }))
            : [];

        return {
            id,
            name: raw.name || id,
            needs,
            runsOn: Array.isArray(raw["runs-on"]) ? raw["runs-on"].join(", ") : (raw["runs-on"] || ""),
            steps
        };

    });

    const layers = computeLayers(jobs);

    return {
        name: doc.name || "",
        jobs,
        layers
    };

}

function stepLabel(step, index) {

    if (!step || typeof step !== "object") {
        return `Step ${index + 1}`;
    }

    if (step.name) return step.name;
    if (step.uses) return step.uses;

    if (step.run) {
        const firstLine = String(step.run).trim().split("\n")[0];
        return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
    }

    return `Step ${index + 1}`;

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
            throw new Error("Circular dependency detected in \"needs:\" — can't determine a run order.");
        }

        layer.forEach((id) => {
            remaining.delete(id);
            placed.add(id);
        });

        layers.push(layer);

    }

    return layers;

}
