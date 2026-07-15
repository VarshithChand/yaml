function roundedTopRectPath(x, y, width, height, radius) {

    if (height <= 0) {
        return "";
    }

    const r = Math.min(radius, width / 2, height);

    return `M ${x},${y + height}
            L ${x},${y + r}
            Q ${x},${y} ${x + r},${y}
            L ${x + width - r},${y}
            Q ${x + width},${y} ${x + width},${y + r}
            L ${x + width},${y + height}
            Z`;

}

// Sequential one-hue column chart: compares magnitude across categories
// (days, branches) rather than distinguishing multiple series.
export default function BarChart({
    data,
    height = 200,
    color = "var(--viz-series-1)",
    showValues = false,
    formatValue = (v) => v
}) {

    const width = 640;
    const paddingLeft = 34;
    const paddingRight = 12;
    const paddingTop = showValues ? 26 : 12;
    const paddingBottom = 28;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const max = Math.max(1, ...data.map((d) => d.value));
    const niceMax = Math.ceil(max / 5) * 5 || 1;

    const gridSteps = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
        y: paddingTop + plotHeight * (1 - t),
        value: Math.round(niceMax * t)
    }));

    const slotWidth = plotWidth / Math.max(1, data.length);
    const barWidth = Math.min(28, slotWidth * 0.6);

    return (

        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="bar-chart"
            role="img"
            preserveAspectRatio="xMidYMid meet"
        >

            {gridSteps.map((g) => (

                <g key={g.value}>

                    <line
                        x1={paddingLeft}
                        x2={width - paddingRight}
                        y1={g.y}
                        y2={g.y}
                        className="bar-chart-grid"
                    />

                    <text
                        x={paddingLeft - 8}
                        y={g.y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="bar-chart-axis-label"
                    >
                        {g.value}
                    </text>

                </g>

            ))}

            {data.map((d, i) => {

                const barHeight = (d.value / niceMax) * plotHeight;
                const x = paddingLeft + slotWidth * i + (slotWidth - barWidth) / 2;
                const y = paddingTop + plotHeight - barHeight;

                return (

                    <g key={d.label}>

                        <path d={roundedTopRectPath(x, y, barWidth, barHeight, 4)} fill={color}>
                            <title>{`${d.label}: ${formatValue(d.value)}`}</title>
                        </path>

                        {showValues && d.value > 0 && (

                            <text
                                x={x + barWidth / 2}
                                y={y - 6}
                                textAnchor="middle"
                                className="bar-chart-value-label"
                            >
                                {formatValue(d.value)}
                            </text>

                        )}

                        <text
                            x={x + barWidth / 2}
                            y={height - paddingBottom + 16}
                            textAnchor="middle"
                            className="bar-chart-axis-label"
                        >
                            {d.label}
                        </text>

                    </g>

                );

            })}

            <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={paddingTop + plotHeight}
                y2={paddingTop + plotHeight}
                className="bar-chart-baseline"
            />

        </svg>

    );

}
