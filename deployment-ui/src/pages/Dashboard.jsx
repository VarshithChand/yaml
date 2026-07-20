import { useEffect, useState } from "react";

import {
    getRepository,
    getBranches,
    getArtifacts,
    getWorkflows
} from "../services/githubService";

import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/layout/PageLayout";

import RepositoryCard from "../components/dashboard/RepositoryCard";
import StatisticsCard from "../components/dashboard/StatisticsCard";
import QuickActions from "../components/dashboard/QuickActions";
import RecentDeployments from "../components/dashboard/RecentDeployments";
import PublicRepoLookup from "../components/dashboard/PublicRepoLookup";

export default function Dashboard() {

    const [repository, setRepository] = useState({});
    const [branches, setBranches] = useState([]);
    const [artifacts, setArtifacts] = useState([]);
    const [workflows, setWorkflows] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadData(force = false) {

        try {

            setLoading(true);
            setError("");

            const [

                repositoryResponse,
                branchesResponse,
                artifactsResponse,
                workflowsResponse

            ] = await Promise.all([

                getRepository(force),
                getBranches(force),
                getArtifacts(force),
                getWorkflows(force)

            ]);

            setRepository(repositoryResponse.data || {});

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

        <PageLayout title="Overview">

            {

                error &&

                <div className="error-message">

                    {error}

                </div>

            }

            <div className="grid">

                <RepositoryCard

                    repository={repository}

                />

                <StatisticsCard

                    branches={branches}

                    artifacts={artifacts}

                    workflows={workflows}

                />

                <QuickActions

                    refresh={() => loadData(true)}

                />

            </div>

            <br />

            <RecentDeployments />

            <br />

            <PublicRepoLookup />

        </PageLayout>

    );

}
