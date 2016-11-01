(function () {

    const height = 500,
        width = 850,
        padding = 50,
        weekHeight = 400,
        hourStart = padding + 20,
        hourEnd = padding + weekHeight;

    const opTranDuration = 250;
    class WeekVis extends Visualization {

        constructor() {
            super("WeekVis");
        }

        setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection) {
            d3.select("#week svg").remove();
            let sorting = (a, b) => d3.ascending(parseInt(a), parseInt(b));

            const svg = d3.select("#week").append("svg")
                .attr("width", width)
                .attr("height", height);


            let dailyHourAvg = d3.nest()
                // .key(f => f.Month).sortKeys(sorting)
                .key(f => f.DayOfWeek).sortKeys(sorting)
                .key(f => {
                    let hourStr = f.CRSDepTime.toString().substring(0, f.CRSDepTime.toString().length - 2);
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

            svg.append("rect")
                .attr("x", padding)
                .attr("width", width - 2 * padding)
                .attr("y", hourStart)
                .attr("height", hourEnd - hourStart)
                .attr("fill", "#dcdcdc")
                .classed("hour-filter", true);

            let drawWeekLines = function () {
                svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", `translate(${padding}, 0)`)
                    .append("g")
                    .call(hourAxis);

                svg.select("g.axis").selectAll("text")
                    .on("click", h => {
                        const selection = d3.selectAll(`.hour-filter.h${h}`);
                        selection.classed("clicked", !selection.classed("clicked"));
                    })
                    .on("mouseover", h => {
                        if (d3.selectAll('.hour-filter.clicked').size() > 0)
                            d3.selectAll(`.hour-filter.h${h}`).classed("transparency", false).classed("not-transparency", false).transition(`2${h}`).duration(opTranDuration).attr("opacity", 1);
                        else
                            d3.selectAll(`.hour-filter:not(.clicked):not(.h${h})`).classed("transparency", false).classed("not-transparency", false).transition(`0${h}`).duration(opTranDuration).attr("opacity", .05);
                        hoveringOver(`${h} hs`)
                    })
                    .on("mouseout", h => {
                        if (d3.selectAll('.hour-filter.clicked').size() > 0)
                            d3.selectAll(`.hour-filter:not(.clicked).h${h}`).transition(`1${h}`).duration(opTranDuration).attr("opacity", .05);
                        else
                            d3.selectAll(`.hour-filter`).transition(`3${h}`).duration(opTranDuration).attr("opacity", 1);
                        hoveringOut();
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
                .attr("class", d => `hour-filter hour-of-day ${dayNameShort(d.day - 1)} h${d.hour}`)
                .attr("opacity", 1)
                .attr("x", d => dayScale(d.day))
                .attr("y", d => hourScale(d.hour - 0.5))
                .attr("width", d => dayScale(d.day + 1) - dayScale(d.day))
                .attr("height", d => hourScale(d.hour + 0.5) - hourScale(d.hour - 0.5))
                .attr("fill", d => defaultPastelHslScale(d.value.avgDelay / 60))
                .on("click", d => {
                    const selection = d3.selectAll(`.hour-filter.h${d.hour}.${dayNameShort(d.day - 1)}`);
                    selection.classed("clicked", !selection.classed("clicked"));
                })
                .on("mouseover", d => {
                    if (d3.selectAll('.hour-filter.clicked').size() > 0)
                        d3.selectAll(`.hour-filter.h${d.hour}.${dayNameShort(d.day - 1)}`).classed("transparency", false).classed("not-transparency", false).transition(`4${d.hour}`).duration(opTranDuration).attr("opacity", 1);
                    else {
                        d3.selectAll(`.hour-filter:not(.clicked):not(.h${d.hour}):not(.${dayNameShort(d.day - 1)})`).classed("transparency", false).classed("not-transparency", false).transition(`5${d.hour}`).duration(opTranDuration).attr("opacity", .05);
                        d3.selectAll(`.hour-filter:not(.clicked):not(.h${d.hour}).${dayNameShort(d.day - 1)}`).classed("transparency", false).classed("not-transparency", false).transition(`8${d.hour}`).duration(opTranDuration).attr("opacity", .05);
                        d3.selectAll(`.hour-filter:not(.clicked).h${d.hour}:not(.${dayNameShort(d.day - 1)})`).classed("transparency", false).classed("not-transparency", false).transition(`9${d.hour}`).duration(opTranDuration).attr("opacity", .05);
                    }
                    const avgDelay = Math.round(d.value.avgDelay);
                    hoveringOver(`${dayNameShort(d.day - 1)} ${d.hour} hs, Avg Delay: ${avgDelay == 60 ? "60+" : avgDelay} min`)
                })
                .on("mouseout", d => {
                    if (d3.selectAll('.hour-filter.clicked').size() > 0)
                        d3.selectAll(`.hour-filter:not(.clicked).h${d.hour}.${dayNameShort(d.day - 1)}`).transition(`6${d.hour}`).duration(opTranDuration).attr("opacity", .05);
                    else
                        d3.selectAll(`.hour-filter`).transition(`7${d.hour}`).duration(opTranDuration).attr("opacity", 1);
                    hoveringOut()
                });

            drawWeekLines();

            svg.append("g")
                .attr("transform", `translate(${padding}, ${hourEnd + 25})`)
                .append("text")
                .text("Clear selection")
                .classed("hoverable", true)
                .on("click", () => {
                    d3.selectAll(`.hour-filter`).classed("clicked", false).transition(`clear`).duration(opTranDuration).attr("opacity", 1);
                })

        }
    }

    window.visualizations.push(new WeekVis());
})();