(function () {


    var svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().distance(10).strength(0.5))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    d3.csv("/data/airports.csv", function (error, airports) {
        d3.json("/data/top-airports.json", function (error, topAirports) {
            if (error) throw error;
            var topAirportsByIata = d3.map(topAirports, a => a.iata);
            airports = airports.filter(a => topAirportsByIata.get(a.iata));

            d3.csv("/data/2008-1-average.csv", function (error, flights) {
                if (error) throw error;

                var projection = d3.geoAlbers();
                projection.scale(990);
                var nodeData = airports.map(d => {
                    var p = projection([parseFloat(d.long), parseFloat(d.lat)]);
                    d.x = p[0];
                    d.y = p[1];
                    d.id = d.iata;
                    return d;
                });

                var flightApKeys = {};
                flights.forEach(f => {
                    let routeKey = f.Origin + "-" + f.Dest;
                    if (!flightApKeys[routeKey]) {
                        flightApKeys[routeKey] = {
                            Origin: f.Origin,
                            Dest: f.Dest,
                            DepDelay: 0,
                            delayCount: 1,
                            delayTotal: parseFloat(f.DepDelay)
                        }
                    } else {
                        flightApKeys[routeKey].delayCount++;
                        flightApKeys[routeKey].delayTotal += parseFloat(f.DepDelay);
                    }
                });

                var routeAverages = [];
                for (let k in flightApKeys) {
                    if (flightApKeys.hasOwnProperty(k)) {
                        let f = flightApKeys[k];
                        f.DepDelay = f.delayTotal / f.delayCount;
                        routeAverages.push(f);
                    }
                }

                routeAverages = routeAverages
                    .filter(f => topAirportsByIata.get(f.Origin) && topAirportsByIata.get(f.Dest))
                    .map(f => {
                        if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                        else if (f.DepDelay > 60) f.stdDelay = 60;
                        else f.stdDelay = f.DepDelay;
                        return f;
                    });
                var edgeData = routeAverages.map(f => {
                    return { "source": f.Origin, "target": f.Dest, "value": f.stdDelay }
                });

                var graph = {nodes: nodeData, links: edgeData};

                var nodes = graph.nodes,
                    nodeById = d3.map(nodes, function (d) {
                        return d.id;
                    }),
                    links = graph.links,
                    bilinks = [];

                links.forEach(function (link) {
                    var s = link.source = nodeById.get(link.source),
                        t = link.target = nodeById.get(link.target),
                        i = {}; // intermediate node
                    nodes.push(i);
                    links.push({source: s, target: i}, {source: i, target: t});
                    bilinks.push([s, i, t]);
                });

                var link = svg.selectAll(".link")
                    .data(bilinks)
                    .enter().append("path")
                    .attr("class", "link");

                var node = svg.selectAll(".node")
                    .data(nodes.filter(function (d) {
                        return d.id;
                    }))
                    .enter().append("circle")
                    .attr("class", "node")
                    .attr("r", 15)
                    .attr("fill", function (d) {
                        return color(d.group);
                    })
                    .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));

                node.append("title")
                    .text(function (d) {
                        return d.id;
                    });

                node.append("text")
                    .text(function (d) {
                        return d.id;
                    })
                    .attr("x", "50%")
                    .attr("y", "50%")
                    .attr("font-size", "1rem")
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .attr("alignment-baseline", "middle")
                    .attr("stroke-width", "2px");

                simulation
                    .nodes(nodes)
                    .on("tick", ticked);

                simulation.force("link")
                    .links(links);

                function ticked() {
                    link.attr("d", positionLink);
                    node.attr("transform", positionNode);
                }
            });
        });
    });

    function positionLink(d) {
        return "M" + d[0].x + "," + d[0].y
            + "S" + d[1].x + "," + d[1].y
            + " " + d[2].x + "," + d[2].y;
    }

    function positionNode(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x, d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x, d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null, d.fy = null;
    }

})();