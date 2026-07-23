# Starts DeploymentAPI, the three sample services, and the frontend dev
# server, each in its own PowerShell window, so you can watch/stop them
# independently instead of one process's output drowning out the others.
#
# For VS Code users, .vscode/tasks.json has the same thing as a task
# ("Run Everything (APIs + Frontend)") if you'd rather use the Tasks
# panel instead of five extra windows.

$root = $PSScriptRoot

function Start-Service($title, $workDir, $command) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = '$title'; Set-Location '$workDir'; $command"
    )
}

Start-Service "DeploymentAPI (5279)" "$root\src\DeploymentAPI" "dotnet run --urls http://localhost:5279"
Start-Service "AdminAPI (5274)"      "$root\src\AdminAPI"      "dotnet run --urls http://localhost:5274"
Start-Service "PMSCoreAPI (5116)"    "$root\src\PMSCoreAPI"    "dotnet run --urls http://localhost:5116"
Start-Service "SecurityAPI (5159)"   "$root\src\SecurityAPI"   "dotnet run --urls http://localhost:5159"
Start-Service "Frontend (5173)"      "$root\deployment-ui"     "npm run dev"

Write-Host "Started 5 windows: DeploymentAPI, AdminAPI, PMSCoreAPI, SecurityAPI, Frontend."
Write-Host "Open http://localhost:5173 once they're all up."
