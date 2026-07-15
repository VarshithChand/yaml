import { useEffect, useState } from "react";

import {
    getBranches,
    getArtifacts,
    getWorkflows
} from "../services/githubService";

import DeploymentForm from "../components/DeploymentForm";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/layout/PageLayout";

export default function Deploy() {

    const [branches, setBranches] = useState([]);
    const [artifacts, setArtifacts] = useState([]);
    const [workflows, setWorkflows] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadData() {

        try {

            setLoading(true);
            setError("");

            const [

                branchesResponse,
                artifactsResponse,
                workflowsResponse

            ] = await Promise.all([

                getBranches(),
                getArtifacts(),
                getWorkflows()

            ]);

            setBranches(

                Array.isArray(branchesResponse.data)

                    ? branchesResponse.data

                    : []

            );

            setArtifacts(

                Array.isArray(artifactsResponse.data)

                    ? artifactsResponse.data

                    : []

            );

            if (workflowsResponse.data.workflows) {

                setWorkflows(

                    workflowsResponse.data.workflows

                );

            }
            else {

                setWorkflows(

                    Array.isArray(workflowsResponse.data)

                        ? workflowsResponse.data

                        : []

                );

            }

        }
        catch (err) {

            console.error(err);

            setError(err.response?.data?.message || "Unable to connect to Deployment API.");

        }
        finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        loadData();

    }, []);

    if (loading) {

        return <LoadingSpinner />;

    }

    return (

        <PageLayout title="Deployment Configuration">

            {

                error &&

                <div className="error-message">

                    {error}

                </div>

            }

            <DeploymentForm

                branches={branches}
                artifacts={artifacts}
                workflows={workflows}

            />

        </PageLayout>

    );

}
