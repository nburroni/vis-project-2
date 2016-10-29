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

    var g = svg.append("g")
        .style("stroke-width", "1.5px");

    d3.json("/data/us.json", function (error, us) {
        if (error) throw error;

        g.selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "feature")
            /*.on("click", clicked)*/; //TODO uncomment for zoom

        g.append("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr("class", "mesh")
            .attr("d", path);

        d3.csv("/data/airports.csv", function (error, airports) {
            d3.json("/data/top-airports.json", function (error2, topAirports){
                airports = airports.filter(d => {if (findWithAttr(topAirports, "name", d.iata) > -1) return d;});
                var projection = d3.geoAlbers();
                projection.scale(990);
                var coordinates = airports.map(d => projection([parseFloat(d.long), parseFloat(d.lat)])).filter(d => d != null && !(isNaN(d[0]) || isNaN(d[0])));
                svg.selectAll("circle")
                    .data(coordinates).enter()
                    .append("circle")
                    .attr("cx", d => d[0])
                    .attr("cy", d => d[1])
                    .attr("r", "2px")
                    .attr("fill", "#00deff")
                    .on("mouseover", function (d){
                        var labels = ['CarrierDelay','WeatherDelay','NASDelay','SecurityDelay','LateAircraftDelay'];
                        var dataset = [1,2,3,4,5,6];
                        var PI = Math.PI;
                        var arcMin = 75;        // inner radius of the first arc
                        var arcWidth = 15;      // width
                        var arcPad = 1;         // padding between arcs

                        // arc accessor
                        //  d and i are automatically passed to accessor functions,
                        //  with d being the data and i the index of the data
                        var drawArc = d3.arc()
                            .innerRadius(function(d, i) {
                                return  arcMin;
                            })
                            .outerRadius(function(d, i) {
                                return arcMin + (arcWidth);
                            })
                            .startAngle(0 * (PI/180))
                            .endAngle(function(d, i) {
                                return i * 30 * (PI/180);
                            });

                        // bind the data
                        var arcs = svg.selectAll("path.arc-path").data(dataset);

                        // *** update existing arcs -- redraw them ***
                        arcs.attr("d", drawArc)
                            .attr("fill", function(d){
                                // we need to redefine the fills as well since we have new data,
                                //  otherwise the colors would no longer be relative to the data
                                //  values (and arc length). if your fills weren't relative to
                                //  the data, this would not be necessary
                                var grn = Math.floor((1 - d/60)*255);
                                return "rgb(0, "+ grn +", 0)";
                            });

                        // draw arcs for new data
                        arcs.enter().append("svg:path")
                            .attr("class", "arc-path")                  // assigns a class for easier selecting
                            .attr("transform", "translate(400,200)")    // sets position--easier than setting x's and y's
                            .attr("fill", function(d){
                                // fill is an rgb value with the green value determined by the data
                                // smaller numbers result in a higher green value (1 - d/60)
                                // you should also look into using d3 scales to create gradients
                                var grn = Math.floor((1 - d/60)*255);
                                return "rgb(0, "+ grn +", 0)";
                            })
                            .attr("d", drawArc);      // draw the arc
                    });

                d3.csv("/data/2008-compressed.csv", function (error, flights) {
                    var nodeData = d3.map(airports.map(d => {
                        var p = projection([parseFloat(d.long), parseFloat(d.lat)]);
                        d.x = p[0];
                        d.y = p[1];
                        return d;
                    }), d => d.iata);
                    flights = flights.splice(Math.floor(Math.random()*flights.length) - 500,500);
                    flights = flights.map (f => {
                        if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                        else if (f.DepDelay > 60) f.stdDelay = 60;
                        else f.stdDelay = f.DepDelay;
                        return f;
                    });
                    var edgeData = flights.map(f => { return { "source": '$' + f.Origin, "target": '$' + f.Dest } });
                    var fbundling = d3.ForceEdgeBundling()
                        .nodes(nodeData)
                        .edges(edgeData);
                    var results  = fbundling();
                    var d3line = d3.line().x(d => d.x ).y(d => d.y );

                    var maxDelay = Math.max.apply(Math, flights.map(function(d){
                        return d.stdDelay;
                    }));

                    results.forEach((edge_subpoint_data, index, array) => {
                        var flight = flights[index];
                        var delay = flight.stdDelay;

                        // for each of the arrays in the results
                        // draw a line between the subdivions points for that edge
                        var path = svg.append("path")
                            .attr("d", d3line(edge_subpoint_data))
                            .style("stroke-width", 1)
                            // .style("stroke", percentageToHsl((delay / maxDelay) * 100, 120, 0))
                            .style("stroke", percentageToHsl((delay / maxDelay), 120, 0))
                            .style("fill", "none")
                            .style('stroke-opacity', 0.45); //use opacity as blending
                        var totalLength = path.node().getTotalLength();
                        path
                            .attr("stroke-dasharray", totalLength + " " + totalLength)
                            .attr("stroke-dashoffset", totalLength)
                            .transition()
                            .duration(2000)
                            // .ease("linear")
                            .attr("stroke-dashoffset", 0);
                    });
                });
            });
            

        })

    });
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
            y = (bounds[0][1] + bounds[1][1]) / 2,
            scale = .9 / Math.max(dx / width, dy / height),
            translate = [width / 2 - scale * x, height / 2 - scale * y];

        g.transition()
            .duration(750)
            .style("stroke-width", 1.5 / scale + "px")
            .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
    }

    function reset() {
        active.classed("active", false);
        active = d3.select(null);

        g.transition()
            .duration(750)
            .style("stroke-width", "1.5px")
            .attr("transform", "");
    }

    function percentageToHsl(percentage, hue0, hue1) {
        var hue = (percentage * (hue1 - hue0)) + hue0;
        return 'hsl(' + hue + ', 100%, 50%)';
    }

})();