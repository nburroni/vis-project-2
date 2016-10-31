(function () {

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const dayNameShort = (i) => dayNames[i].substring(0, 3);

    const height = 800,
        width = 1100,
        padding = 100,
        weekHeight = 400,
        hourStart = padding + 20,
        hourEnd = padding + weekHeight;

    const opTranDuration = 250;

    const svg = d3.select("#week").append("svg")
        .attr("width", width)
        .attr("height", height);

    class WeekVis extends Visualization {

        constructor() {
            super("WeekVis");
        }

        setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection) {

            let sorting = (a, b) => d3.ascending(parseInt(a), parseInt(b));

            let dailyHourAvg = d3.nest()
                // .key(f => f.Month).sortKeys(sorting)
                .key(f => f.DayOfWeek).sortKeys(sorting)
                .key(f => {
                    let hourStr = f.CRSDepTime.substring(0, f.CRSDepTime.length - 2);
                    return hourStr == "" ? "0" : hourStr;
                }).sortKeys(sorting)
                .rollup((hourData) => {
                    let delayTotal = hourData.map(f => parseFloat(f.stdDelay)).reduce((d1, d2) =>
                        d1 + d2
                    );
                    return {
                        delayTotal: delayTotal,
                        delayCount: hourData.length,
                        avgDelay: delayTotal / hourData.length
                    }
                })
                .entries(flights);

            const hourScale = d3.scaleLinear().domain([-0.5, 23.5]).range([hourStart, hourEnd]);
            const hourAxis = d3.axisLeft(hourScale).ticks(24).tickPadding(5).tickFormat(d => d + " hs");

            const dayScale = d3.scaleLinear().domain([1, 8]).range([padding, width - padding]);

            let drawWeekLines = function () {
                svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", `translate(${padding}, 0)`)
                    .append("g")
                    .call(hourAxis);

                svg.select("g.axis").selectAll("text")
                    .on("click", h => {
                        const selection = svg.selectAll(`.hour-of-day.h${h}`);
                        selection.classed("clicked", !selection.classed("clicked"));
                    })
                    .on("mouseover", h => {
                        if (svg.selectAll('.hour-of-day.clicked').size() > 0)
                            svg.selectAll(`.hour-of-day.h${h}`).transition(`2${h}`).duration(opTranDuration).attr("opacity", 1);
                        else
                            svg.selectAll(`.hour-of-day:not(.clicked):not(.h${h})`).transition(`0${h}`).duration(opTranDuration).attr("opacity", .2);
                    })
                    .on("mouseout", h => {
                        if (svg.selectAll('.hour-of-day.clicked').size() > 0)
                            svg.selectAll(`.hour-of-day:not(.clicked).h${h}`).transition(`1${h}`).duration(opTranDuration).attr("opacity", .2);
                        else
                            svg.selectAll(`.hour-of-day`).transition(`3${h}`).duration(opTranDuration).attr("opacity", 1);
                    });

                svg.append("g")
                    .attr("class", "week-lines")
                    .selectAll("line.week-line")
                    .data(d3.range(1, 8)).enter()
                    .append("line")
                    .attr("class", "week-line")
                    .attr("x1", d => dayScale(d + 1))
                    .attr("x2", d => dayScale(d + 1))
                    .attr("y1", hourStart)
                    .attr("y2", hourEnd)
                    .attr("stroke-width", 1)
                    .attr("stroke", "black");

                svg.append("g")
                    .attr("class", "day-names")
                    .selectAll("text.day-name")
                    .data(d3.range(1, 8)).enter()
                    .append("text")
                    .attr("class", "day-name")
                    .attr("x", d => dayScale(d + 0.5))
                    .attr("y", padding)
                    .attr("text-anchor", "middle")
                    .text(d => dayNameShort(d - 1));

                let startEndLines = svg.append("g").attr("class", "start-end-lines");
                startEndLines.append("line")
                    .attr("x1", padding)
                    .attr("x2", width - padding)
                    .attr("y1", hourStart)
                    .attr("y2", hourStart)
                    .attr("stroke", "black");
                startEndLines.append("line")
                    .attr("x1", padding)
                    .attr("x2", width - padding)
                    .attr("y1", hourEnd)
                    .attr("y2", hourEnd)
                    .attr("stroke", "black");
            };

            svg.append("g")
                .attr("class", "delays")
                .selectAll("g.day-of-week")
                .data(dailyHourAvg).enter()
                .append("g")
                .attr("class", "day-of-week")
                .selectAll("rect.hour-of-day")
                .data(d => d.values.map(v => {
                    v.day = parseInt(d.key);
                    v.hour = parseInt(v.key);
                    delete v.key;
                    return v;
                })).enter()
                .append("rect")
                .attr("class", d => `hour-of-day h${d.hour}`)
                .attr("opacity", 1)
                .attr("x", d => dayScale(d.day))
                .attr("y", d => hourScale(d.hour - 0.5))
                .attr("width", d => dayScale(d.day + 1) - dayScale(d.day))
                .attr("height", d => hourScale(d.hour + 0.5) - hourScale(d.hour - 0.5))
                .attr("fill", d => defaultPastelHslScale(d.value.avgDelay / 60));

            drawWeekLines();

            svg.append("g")
                .attr("transform", `translate(${padding}, ${hourEnd + 25})`)
                .append("text")
                .text("Clear selection")
                .classed("hoverable", true)
                .on("click", () => {
                    svg.selectAll(`.hour-of-day`).classed("clicked", false).transition(`clear`).duration(opTranDuration).attr("opacity", 1);
                })

        }
    }

    window.visualizations.push(new WeekVis());
})();