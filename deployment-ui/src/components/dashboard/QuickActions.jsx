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

            <div className="quick-actions-buttons">

                <button

                    className="btn btn-primary"

                    onClick={refresh}

                >

                    Refresh Dashboard

                </button>

                {githubTokenConfigured && (

                    <button

                        className="btn btn-primary"
                        onClick={() => setSwitchOpen(true)}

                    >

                        Switch Repository

                    </button>

                )}

            </div>

            <SwitchRepositoryModal

                open={switchOpen}
                currentOwner={repository?.owner?.login}
                currentRepository={repository?.name}
                onClose={() => setSwitchOpen(false)}

            />

        </div>

    );

}
