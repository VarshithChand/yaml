// A single ratio against a limit reads as a meter, not a 2-slice pie or a bar chart.
export default function Meter({ label, value }) {

    const pct = Math.max(0, Math.min(100, value));

    const tone = pct >= 90 ? "good" : pct >= 70 ? "warning" : "critical";

    return (

        <div className="meter">

            <div className="meter-header">

                <span>{label}</span>

                <span className="meter-value">{pct.toFixed(0)}%</span>

            </div>

            <div className="meter-track">

                <div
                    className={`meter-fill meter-fill-${tone}`}
                    style={{ width: `${pct}%` }}
                />

            </div>

        </div>

    );

}
