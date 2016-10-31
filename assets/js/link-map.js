(function () {

    var width = 960,
        height = 500,
        active = d3.select(null);

    var projection = d3.geoAlbers()
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height)
        .on("click", reset);

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var g = svg.append("g")
        .style("stroke-width", "1.5px");
    var scale;
    var translate;
    var zoomed = false;
    var globalAirports = [];

    class LinkMap extends Visualization {
        constructor() {
            super("LinkMap");
        }
        setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection) {
            d3.json("/data/us.json", function (error, us) {
                console.log ("Got airports");
                if (error) throw error;

                g.selectAll("path")
                    .data(topojson.feature(us, us.objects.states).features)
                    .enter().append("path")
                    .attr("d", path)
                    .attr("class", "feature")
                .on("click", clicked); //TODO uncomment for zoom

                g.append("path")
                    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
                    .attr("class", "mesh")
                    .attr("d", path);

                globalAirports = airports;
                var projection = d3.geoAlbers();
                projection.scale(990);
                var coordinates = airports.map(d => projection([parseFloat(d.long), parseFloat(d.lat)])).filter(d => d != null && !(isNaN(d[0]) || isNaN(d[0])));

                var nodeData = d3.map(airports.map(d => {
                    var p = projection([parseFloat(d.long), parseFloat(d.lat)]);
                    d.x = p[0];
                    d.y = p[1];
                    return d;
                }), d => d.iata);
                flights = averageEdgeDataR;
                console.log ("Iterate flights");
                flights = flights.map (f => {
                    if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                    else if (f.DepDelay > 100) f.stdDelay = 100;
                    else f.stdDelay = f.DepDelay;
                    return f;
                });
                console.log ("Calculate bundles");

                var fbundling = d3.ForceEdgeBundling()
                    //.iterations(10)
                    .nodes(nodeData)
                    .edges(averageEdgeDataR);
                console.log ("Finished step 2");

                var t0 = performance.now();

                var results  = fbundling();

                var t1 = performance.now();
                console.log("Call to doSomething took " + (t1 - t0)/1000 + " seconds.");
                console.log ("Finished step 3");

                var d3line = d3.line().x(d => d.x ).y(d => d.y );
                console.log ("Finished step 4");

                var maxDelay = Math.max.apply(Math, flights.map(function(d){
                    return d.stdDelay;
                }));

                console.log ("Draw paths");

                results.forEach((edge_subpoint_data, index, array) => {
                    var flight = flights[index];
                    var delay = flight.stdDelay;
                    for (var j in flight){
                        if (j != "Origin" && j != "Dest" && j != "TailNum") flight[j] = parseInt(flight[j]);
                    }
                    var airport = airports[findWithAttr(airports, "iata", flight.Origin)];
                    if (airport){
                        if (!airport.flightCount) {
                            airport.flightCount = 0;
                            airport.DepDelay = 0;
                            airport.WeatherDelay = 0;
                            airport.CarrierDelay = 0;
                            airport.NASDelay = 0;
                            airport.SecurityDelay = 0;
                            airport.LateAircraftDelay = 0;
                        }
                        airport.flightCount++;
                        airport.DepDelay += (flight.DepDelay);
                        airport.WeatherDelay += (flight.WeatherDelay);
                        airport.CarrierDelay += (flight.CarrierDelay);
                        airport.NASDelay += (flight.NASDelay);
                        airport.SecurityDelay += (flight.SecurityDelay);
                        airport.LateAircraftDelay += (flight.LateAircraftDelay);
                    }
                    // for each of the arrays in the results
                    // draw a line between the subdivions points for that edge
                    var path = svg.append("path")
                        .attr("d", d3line(edge_subpoint_data))
                        .style("stroke-width", 1)
                        .attr("class", flight.Origin + " " + flight.Dest + " flight")
                        // .style("stroke", percentageToHsl((delay / maxDelay) * 100, 120, 0))
                        .style("stroke", percentageToHsl((delay / maxDelay), 120, 0))
                        .style("fill", "none")
                        .style('stroke-opacity', 0.75) //use opacity as blending
                        .on("click", function (d){
                            console.log (d);
                        });
                    var totalLength = path.node().getTotalLength();
                    path
                        .attr("stroke-dasharray", totalLength + " " + totalLength)
                        .attr("stroke-dashoffset", totalLength)
                        .transition()
                        .duration(2000)
                        // .ease("linear")
                        .attr("stroke-dashoffset", 0);
                });
                airports.forEach(function (d){
                    d.DepDelay = d.DepDelay / d.flightCount;
                    d.WeatherDelay = d.WeatherDelay / d.flightCount;
                    d.CarrierDelay = d.CarrierDelay / d.flightCount;
                    d.NASDelay = d.NASDelay / d.flightCount;
                    d.SecurityDelay = d.SecurityDelay / d.flightCount;
                    d.LateAircraftDelay = d.LateAircraftDelay / d.flightCount;
                });
                svg.selectAll("circle")
                    .data(coordinates).enter()
                    .append("circle")
                    .attr("cx", d => d[0])
                    .attr("cy", d => d[1])
                    .attr("r", "4px")
                    .attr("fill", "#00deff")
                    .on("mouseover", function (d, i){
                        svg.selectAll("path.flight:not(." + airports[i].iata + ")")
                            .classed("transparency", true)
                            .classed("not-transparency", false);
                    })
                    .on("mouseleave", function (d, i){
                        svg.selectAll("path.flight:not(." + airports[i].iata + ")")
                            .classed("transparency", false)
                            .classed("not-transparency", true);
                    })
                    .on("click", function (d, i){
                        if (!svg.selectAll(".pie")._groups[0].length > 0){
                            console.log (d3.event.pageX + " " + d3.event.pageY);
                            var airport = globalAirports[i];
                            var labels = ['CarrierDelay','WeatherDelay','NASDelay','SecurityDelay','LateAircraftDelay'];
                            var colors = ['rgb(255, 153, 51)', 'rgb(0, 0, 204)', 'rgb(102, 204, 0)', 'rgb(153, 153, 255)', 'rgb(255, 255, 51)'];
                            var dataset = [airport.CarrierDelay, airport.WeatherDelay, airport.NASDelay, airport.SecurityDelay, airport.LateAircraftDelay];
                            var total = airport.CarrierDelay + airport.WeatherDelay + airport.NASDelay + airport.SecurityDelay + airport.LateAircraftDelay;
                            var currentAngle = 0;
                            var PI = Math.PI;
                            var arcMin = 55;        // inner radius of the first arc
                            var arcWidth = 15;      // width
                            var arcPad = 1;         // padding between arcs

                            // arc accessor
                            //  d and i are automatically passed to accessor functions,
                            //  with d being the data and i the index of the data
                            var drawArc = d3.arc()
                                .innerRadius(function(d, i) {
                                    return  0;
                                })
                                .outerRadius(function(d, i) {
                                    return 0;
                                })
                                .startAngle(function (d, i){
                                    var myAngle = currentAngle;
                                    currentAngle += ((dataset[i] / total) * 360 * (PI/180));
                                    return myAngle;
                                })
                                .endAngle(function(d, i) {
                                    return currentAngle;
                                });

                            var pie = d3.pie()
                                .sort(null)
                                .value(function(d) {
                                    return d;
                                });

                            var groupChart = svg.selectAll(".pie")
                                .data([d])
                                .enter()
                                .append("g")
                                .classed("pie", true)
                                .on("mouseleave", function (d, i){
                                    var coordinates = [0, 0];
                                    coordinates = d3.mouse(this);
                                    var x = coordinates[0];
                                    var y = coordinates[1];
                                    if (zoomed){
                                        var rectangle = this.getBBox();
                                        if (Math.pow((x - (rectangle.x + rectangle.width/2)), 2) + Math.pow((y - (rectangle.y + rectangle.height/2)), 2) > Math.pow(70, 2)) {
                                            svg.selectAll(".arc-path, text")
                                                .classed("transparency", true);
                                            setTimeout(() => svg.selectAll(".pie").remove(), 1000);
                                        }
                                    }
                                    else if (Math.pow((x - d[0]), 2) + Math.pow((y - d[1]), 2) > Math.pow(70, 2)) {
                                        svg.selectAll(".arc-path, text")
                                            .classed("transparency", true);
                                        setTimeout(() => svg.selectAll(".pie").remove(), 1000);
                                    }
                                });

                            var g = groupChart.selectAll(".arc")
                                .data(pie(dataset))
                                .enter().append("g")
                                .attr("class", "arc");

                            var chart = g.append("path")
                                .attr("d", drawArc)
                                .classed("arc-path", true)
                                .style("fill", function(d, i) {
                                    return colors[i];
                                })
                                .attr("transform", function (){
                                    var j = d;
                                    return "translate("+ d3.event.pageX + "," + d3.event.pageY + ")";
                                });

                            chart.on('mouseenter', function (d, i){
                                    div.transition()
                                        .duration(200)
                                        .style("opacity", .9);
                                    div	.html(labels[i] + '</br>' + Math.floor(dataset[i]) + ' mins')
                                        .style("display", "inline-block")
                                        .style("left", (d3.event.pageX) + "px")
                                        .style("top", (d3.event.pageY - 28) + "px");
                                })
                                .on("mouseleave", function (){
                                    div.transition()
                                        .duration(500)
                                        .style("opacity", 0);
                                })
                                .transition()
                                .delay(100)
                                .duration(1000)
                                .attrTween("d", arcTweenEnter);

                            groupChart.append("text")
                                .attr("x", function(d) { return d3.event.pageX; })
                                .attr("y", function (d) { return d3.event.pageY + 20; })
                                .attr("dy", ".35em")
                                .attr("font-family", "sans-serif")
                                .style("text-anchor", "middle")
                                .attr( "fill-opacity", 0 ).transition().delay(500)
                                .attr( "fill-opacity", 1 )
                                .text(function(d) {
                                    return airport.airport;
                                });
                            function arcTweenEnter(d) {
                                var i = d3.interpolateNumber(0, arcMin);
                                var j = d3.interpolateNumber(0, arcMin + 15);

                                return function(t) {
                                    var r = i(t);
                                    var rMax = j(t),
                                        drawArc = d3.arc()
                                            .outerRadius(rMax)
                                            .innerRadius(r);
                                    return drawArc(d);
                                };
                            }
                        }
                        else {
                            svg.selectAll(".arc-path, text")
                                .classed("transparency", true);
                            setTimeout(() => svg.selectAll(".pie").remove(), 1000);
                            function arcTweenExit(d) {
                                var i = d3.interpolateNumber(arcMin, 0);
                                var j = d3.interpolateNumber(arcMin + 15, 0);

                                return function(t) {
                                    var r = i(t);
                                    var rMax = j(t),
                                        drawArc = d3.arc()
                                            .outerRadius(rMax)
                                            .innerRadius(r);
                                    return drawArc(d);
                                };
                            }
                        }

                    });
            });
        }

    }
    window.visualizations.push(new LinkMap());


    function findWithAttr(array, attr, value) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i][attr] === value) {
                return i;
            }
        }
        return -1;
    }
    function clicked(d) {
        if (active.node() === this) return reset();
        active.classed("active", false);
        active = d3.select(this).classed("active", true);

        var bounds = path.bounds(d),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            x = (bounds[0][0] + bounds[1][0]) / 2,
            y = (bounds[0][1] + bounds[1][1]) / 2;
        scale = .9 / Math.max(dx / width, dy / height);
        translate = [width / 2 - scale * x, height / 2 - scale * y];
        zoomed = true;

        g.transition()
            .duration(250)
            .style("stroke-width", 1.5 / scale + "px")
            .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
        svg.selectAll("circle, .flight")
            .transition()
            .attr("duration", 4000)
            .attr("transform", "translate(" + translate + ")scale(" + scale + ")")
            .attr("r", "2px")
        ;
    }

    function reset() {
        active.classed("active", false);
        active = d3.select(null);
        zoomed = false;
        g.transition()
            .duration(250)
            .style("stroke-width", "1.5px")
            .attr("transform", "");
        svg.selectAll("circle, .flight")
            .transition()
            .attr("duration", 5000)
            .attr("transform", "")
            .attr("r", "4px")
        ;
    }
})();