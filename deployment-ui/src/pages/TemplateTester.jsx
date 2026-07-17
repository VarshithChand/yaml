import { useRef, useState } from "react";

import PageLayout from "../components/layout/PageLayout";
import WorkflowGraph from "../components/templateTester/WorkflowGraph";
import { parseWorkflowYaml, tryFixIndentation } from "../utils/parseWorkflowYaml";

const EXAMPLE_YAML = `name: Example CI/CD

on:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Lint
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-artifact@v4

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh
`;

const STEP_MS = 350;
const JOB_SETTLE_MS = 200;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TemplateTester() {

    const [yamlText, setYamlText] = useState("");
    const [graph, setGraph] = useState(null);
    const [error, setError] = useState("");
    const [suggestedFix, setSuggestedFix] = useState(null);
    const [jobStates, setJobStates] = useState({});
    const [running, setRunning] = useState(false);

    // Guards against a stale simulation still updating state after the
    // user re-clicks Run (or edits the YAML) mid-animation.
    const runToken = useRef(0);

    function handleTextChange(value) {
        setYamlText(value);
        setError("");
        setSuggestedFix(null);
        setGraph(null);
    }

    function loadExample() {
        handleTextChange(EXAMPLE_YAML);
    }

    // Validates the given text and returns the parsed graph on success.
    // On failure it sets the error message and, when the problem looks
    // like an indentation/whitespace issue rather than a real structural
    // mistake, a corrected version the user can review and apply — this
    // is the "ask for adjustment" step before anything is allowed to run.
    function validate(text) {

        try {
            const parsed = parseWorkflowYaml(text);
            setGraph(parsed);
            setError("");
            setSuggestedFix(null);
            return parsed;
        }
        catch (err) {

            setError(err.message);
            setGraph(null);

            const fixed = tryFixIndentation(text);

            if (fixed) {
                try {
                    parseWorkflowYaml(fixed);
                    setSuggestedFix(fixed);
                }
                catch {
                    setSuggestedFix(null);
                }
            }
            else {
                setSuggestedFix(null);
            }

            return null;

        }

    }

    async function runSimulation(parsed) {

        const token = ++runToken.current;
        const initialStates = {};
        parsed.jobs.forEach((job) => { initialStates[job.id] = { status: "pending", stepIndex: -1 }; });
        setJobStates(initialStates);
        setRunning(true);

        for (const layer of parsed.layers) {

            if (runToken.current !== token) return;

            setJobStates((prev) => {
                const next = { ...prev };
                layer.forEach((id) => { next[id] = { status: "running", stepIndex: -1 }; });
                return next;
            });

            await Promise.all(layer.map(async (id) => {

                const job = parsed.jobs.find((j) => j.id === id);
                const stepCount = Math.max(job.steps.length, 1);

                for (let i = 0; i < stepCount; i++) {

                    await sleep(STEP_MS);
                    if (runToken.current !== token) return;

                    setJobStates((prev) => ({ ...prev, [id]: { status: "running", stepIndex: i } }));

                }

                await sleep(JOB_SETTLE_MS);
                if (runToken.current !== token) return;

                setJobStates((prev) => ({ ...prev, [id]: { status: "success", stepIndex: stepCount - 1 } }));

            }));

        }

        if (runToken.current === token) setRunning(false);

    }

    // Validate first — only proceeds straight to running when that
    // succeeds. A validation failure stops here and leaves the error (and
    // any suggested fix) on screen instead of attempting to run anything.
    function handleRun() {
        const parsed = validate(yamlText);
        if (parsed) runSimulation(parsed);
    }

    function handleApplyFix() {
        setYamlText(suggestedFix);
        const parsed = validate(suggestedFix);
        if (parsed) runSimulation(parsed);
    }

    return (

        <PageLayout title="Template Tester">

            <div className="card">

                <h2 className="card-title">Workflow YAML</h2>

                <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                    Paste a GitHub Actions workflow or an Azure DevOps pipeline — this validates it
                    locally, then plays back the job graph based on each job's dependencies ("needs:"
                    or "dependsOn:"), entirely in your browser. Nothing here is sent to GitHub/Azure
                    or committed anywhere. Azure "${'{{'} each x in y {'}}'}:" loops are expanded when the
                    source is a parameter with a static default in the same file.
                </p>

                <textarea
                    className="form-control"
                    style={{ fontFamily: "monospace", fontSize: "13px", minHeight: "260px", resize: "vertical" }}
                    value={yamlText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Paste your workflow.yml or azure-pipelines.yml content here..."
                    spellCheck={false}
                />

                <div className="button-row" style={{ marginTop: "15px" }}>

                    <button className="btn btn-primary" onClick={handleRun} disabled={running}>
                        {running ? "Running..." : "Run"}
                    </button>

                    <button className="btn btn-secondary" onClick={loadExample} disabled={running}>
                        Load example
                    </button>

                </div>

                {error && (
                    <div className="error-message" style={{ marginTop: "15px" }}>
                        {error}
                    </div>
                )}

                {suggestedFix && (

                    <div className="card" style={{ background: "var(--table-row-hover)", marginTop: "15px" }}>

                        <h3 style={{ marginTop: 0 }}>Suggested fix</h3>

                        <p className="empty-state" style={{ padding: "0 0 10px", textAlign: "left" }}>
                            This looks like a whitespace problem — tabs or trailing spaces where YAML
                            expects plain indentation. Here's a corrected version:
                        </p>

                        <pre className="workflow-fix-preview">{suggestedFix}</pre>

                        <div className="button-row" style={{ marginTop: "10px" }}>
                            <button className="btn btn-primary" onClick={handleApplyFix}>
                                Apply fix &amp; run
                            </button>
                        </div>

                    </div>

                )}

            </div>

            {graph && (

                <div className="card">

                    <h2 className="card-title">{graph.name || "Pipeline"}</h2>

                    <WorkflowGraph jobs={graph.jobs} layers={graph.layers} jobStates={jobStates} />

                </div>

            )}

        </PageLayout>

    );

}
