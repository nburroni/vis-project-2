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
            var projection = d3.geoAlbers();
            projection.scale(990);
            var coordinates = airports.map(d => projection([parseFloat(d.long), parseFloat(d.lat)])).filter(d => d != null);
            svg.selectAll("circle")
                .data(coordinates).enter()
                .append("circle")
                .attr("cx", d => d[0])
                .attr("cy", d => d[1])
                .attr("r", "3px")
                .attr("fill", "#00deff")
        })

    });

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

})();