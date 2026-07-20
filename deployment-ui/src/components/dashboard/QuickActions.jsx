import { useState } from "react";

import SwitchRepositoryModal from "./SwitchRepositoryModal";
import useAuth from "../../hooks/useAuth";

export default function QuickActions({

    refresh,
    repository

}) {

    const { githubTokenConfigured } = useAuth();
    const [switchOpen, setSwitchOpen] = useState(false);

    return (

        <div className="card dashboard-card">

            <h2 className="card-title">

                Quick Actions

            </h2>

            <button

                className="btn btn-primary"

                onClick={refresh}

            >

                Refresh Dashboard

            </button>

            {githubTokenConfigured && (

                <button

                    className="btn btn-secondary"
                    style={{ marginTop: "10px" }}
                    onClick={() => setSwitchOpen(true)}

                >

                    Switch Repository

                </button>

            )}

            <SwitchRepositoryModal

                open={switchOpen}
                currentOwner={repository?.owner?.login}
                currentRepository={repository?.name}
                onClose={() => setSwitchOpen(false)}

            />

        </div>

    );

}
