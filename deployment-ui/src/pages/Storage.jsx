import { useEffect, useState } from "react";

import { getArtifacts, getDockerImages } from "../services/githubService";
import { getSettings } from "../services/settingsService";

import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/layout/PageLayout";
import ArtifactsTable from "../components/storage/ArtifactsTable";
import DockerImagesTable from "../components/storage/DockerImagesTable";

export default function Storage() {

    const [owner, setOwner] = useState("");
    const [repository, setRepository] = useState("");

    const [artifacts, setArtifacts] = useState([]);
    const [images, setImages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [imagesError, setImagesError] = useState("");

    async function load() {

        try {

            setLoading(true);

            const [settings, artifactsResponse] = await Promise.all([
                getSettings(),
                getArtifacts()
            ]);

            setOwner(settings.gitHubOwner || "");
            setRepository(settings.gitHubRepository || "");

            setArtifacts(
                Array.isArray(artifactsResponse.data) ? artifactsResponse.data : []
            );

            try {

                const imagesResponse = await getDockerImages();

                setImages(
                    Array.isArray(imagesResponse.data) ? imagesResponse.data : []
                );

                setImagesError("");

            }
            catch (err) {

                console.error(err);
                setImages([]);
                setImagesError(
                    err.response?.data?.message
                        || "Unable to load container images for this owner."
                );

            }

        }
        catch (err) {

            console.error(err);

        }
        finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        load();

    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (

        <PageLayout title="Artifacts & Images">

            <ArtifactsTable
                artifacts={artifacts}
                owner={owner}
                repository={repository}
            />

            <br />

            {imagesError && (
                <div className="error-message">
                    {imagesError}
                </div>
            )}

            <DockerImagesTable
                images={images}
                owner={owner}
            />

        </PageLayout>

    );

}
