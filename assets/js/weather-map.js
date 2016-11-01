(function () {

    var width = 960,
        height = 500,
        active = d3.select(null);

    var projection = d3.geoAlbers()
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);
    var zoom;

    var svg;

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var g;

    class WeatherMap extends Visualization {
        constructor() {
            super("WeatherMap");
        }
        setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection, weatherEvents) {
            console.log ("started set data");

            d3.selectAll("#weather-map").remove();
            svg = d3.select("#weather").append("svg")
                .attr("id", "weather-map")
                .attr("width", width)
                .attr("height", height);
            svg.append("rect")
                .attr("class", "background")
                .attr("width", width)
                .attr("height", height);
                //.on("click", reset);
            g = svg.append("g")
                .style("stroke-width", "0.5px");
            zoom = d3.zoom()
            // no longer in d3 v4 - zoom initialises with zoomIdentity, so it's already at origin
            // .translate([0, 0])
            // .scale(1)
                .scaleExtent([1, 8])
                .on("zoom", zoomed);
            svg
                .call(zoom);
            d3.json("/data/state.json", function (error, us) {
                g.selectAll("path")
                    .data(topojson.feature(us, us.objects.state).features)
                    .enter().append("path")
                    .attr("d", path)
                    .attr("class", "feature")
                    .attr("fill", "none")
                    .on("click", clicked);
                g.append("path")
                    .datum(topojson.mesh(us, us.objects.state, (a, b) => a !== b))
                    .attr("class", "mesh")
                    .attr("d", path)
                    .attr("fill", "none");
                d3.json("/data/state-codes.json", function (error, stateCodes){
                    var stateCodesList = [];
                    var options = [];
                    var names = [
                        {id: 'hailCheckBox', name: "Hail"},
                        {id: 'tornadoCheckBox', name: "Tornado"},
                        {id: 'lightningCheckBox', name: "Lightning"}
                    ];
                    for (var key in stateCodes){
                        stateCodesList.push({name: stateCodes[key].name, code: stateCodes[key].stateAbbr});
                    }
                    var states = [];
                    stateCodesList.forEach(function (d){
                        states.push({name: d.name, code: d.code, count: 0, delay: 0});
                    });
                    calculateStateDelays(flights, airports, states);

                    function update(){
                        options = [];
                        names.forEach(function (d){
                            if(d3.select("#" + d.id).property("checked")) {
                                options.push(d.name)
                            }
                        });
                        var events = [];
                        events = filterEvents(weatherEvents, options);
                        var filteredStates = [];
                        filterStates(events, filteredStates, states);
                        draw(events, filteredStates, us);
                    }
                    d3.selectAll(".checkbox").on("change",update);
                    update();
                });
            });

        }

    }
    window.visualizations.push(new WeatherMap());

    function draw(events, states, us){
        // g.selectAll("circle")
        //     .transition()
        //     .duration(750)
        //     .remove();

        var maxDelay = Math.max.apply(Math, states.map(function(d){
            return d.delay;
        }));

        var projection = d3.geoAlbers();
        projection.scale(990);
        var coordinates = events.map(d => projection([parseFloat(d.lon), parseFloat(d.lat)])).filter(d => d != null && !(isNaN(d[0]) || isNaN(d[0])));


        g.selectAll('path')
            .filter(function(d) {
                return d.properties;
            })
            .transition()
            .delay(750)
            .style('fill', function (d){
                if (states[findWithAttr(states, "name", d.properties.NAME10)]) return percentageToHsl((states[findWithAttr(states, "name", d.properties.NAME10)].delay / maxDelay), 120, 0);
                else return '#ccc';
            });

        var selection = g.selectAll("circle")
            .data(coordinates)
            .attr("class", function (d, i){
                var event = events[i];
                var date = new Date(event.YEAR, event.BEGIN_YEARMONTH.substring(event.BEGIN_YEARMONTH.length -2), event.BEGIN_DAY);
                var day = date.getDay();
                if (day == 0) day = 7;
                return `hour-filter h${event.BEGIN_TIME.substring(0,event.BEGIN_TIME.length - 2)} ${dayNameShort(day - 1)}`
            })
            .attr("cx", d => d[0])
            .attr("cy", d => d[1])
            .attr("r", "3px")
            .attr("fill", function (d, i){
                var event = events[i];
                if (event.EVENT_TYPE == "Tornado") return "rgb(51, 102, 204)";
                else if (event.EVENT_TYPE == "Lightning") return "rgb(153, 0, 153)";
                else return "rgb(23, 190, 207)";
            })
            .attr("opacity", 1);

        selection.enter()
            .append("circle")
            .attr("class", function (d, i){
                var event = events[i];
                var date = new Date(event.YEAR, event.BEGIN_YEARMONTH.substring(event.BEGIN_YEARMONTH.length -2), event.BEGIN_DAY);
                var day = date.getDay();
                if (day == 0) day = 7;
                return `hour-filter h${event.BEGIN_TIME.substring(0,event.BEGIN_TIME.length - 2)} ${dayNameShort(day - 1)}`
            })
            .attr("cx", d => d[0])
            .attr("cy", d => d[1])
            .attr("r", "3px")
            .attr("fill", function (d, i){
                var event = events[i];
                if (event.EVENT_TYPE == "Tornado") return "rgb(51, 102, 204)";
                else if (event.EVENT_TYPE == "Lightning") return "rgb(153, 0, 153)";
                else return "rgb(23, 190, 207)";
            })
            .attr("opacity", 0)
            .transition()
            .delay(750)
            .attr("opacity", 1);

        selection.exit().transition()
            .delay(750)
            .remove();
        console.log ("finished draw");

    }
    function findWithAttr(array, attr, value) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i][attr].toLowerCase() === value.toLowerCase()) {
                return i;
            }
        }
        return -1;
    }
    function filterEvents (weatherEvents, options){
        return weatherEvents.filter(function (d){
            var found = false;
            options.forEach(function (option){
                if (option == d.EVENT_TYPE) found = true;
            });
            return found;
        });
    }
    function filterStates(weatherEvents, result, states){
        states.forEach(function (d){
            var index = findWithAttr(weatherEvents, "STATE", d.name);
            if (index > -1){
                result.push(d);
            }
        });
    }
    function calculateStateDelays(flights, airports, states){
        flights.forEach(function (d){
            var flight = d;
            for (var j in flight){
                if (j != "Origin" && j != "Dest" && j != "TailNum") flight[j] = parseInt(flight[j]);
            }
            var airport = airports[findWithAttr(airports, "iata", flight.Origin)];
            if (airport){
                if (!airport.flightCount) {
                    airport.flightCount = 0;
                    airport.WeatherDelay = 0;
                }
                airport.flightCount++;
                airport.WeatherDelay += (flight.WeatherDelay);
            }
        });
        airports.forEach(function (d){
            var index = findWithAttr(states, "code", d.state);
            if(index > -1){
                d.WeatherDelay /= d.flightCount;
                states[index].delay += d.WeatherDelay;
                states[index].count++;
            }
        });
        states = states.filter(function (d){
            return d.count > 0;
        });
        states.forEach(function (d, i){
            d.delay /= d.count;
        });
    }
    function clicked(d) {
        if (active.node() === this) return reset();
        active.classed("active", false);
        active = d3.select(this).classed("active", true);

        var bounds = path.bounds(d),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            x = (bounds[0][0] + bounds[1][0]) / 2,
            y = (bounds[0][1] + bounds[1][1]) / 2,
            scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
            translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(750)
            // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
            .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
    }

    function reset() {
        active.classed("active", false);
        active = d3.select(null);

        svg.transition()
            .duration(750)
            // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
            .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
    }

    function zoomed() {
        g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
        // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
        g.attr("transform", d3.event.transform); // updated for d3 v4
    }

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
    function stopped() {
        if (d3.event.defaultPrevented) d3.event.stopPropagation();
    }
})();