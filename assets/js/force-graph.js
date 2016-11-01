(function () {

    var width = 900,
        height = 600;

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().distance(300).strength(0.5))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    class ForceGraph extends Visualization {

        constructor() {
            super("ForceGraph");
        }

        setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection) {
            d3.select("#force").select("svg").remove();

            var svg = d3.select("#force").append("svg")
                .attr("height", height)
                .attr("width", width);

            var graph = {
                nodes: nodeData, links: averageEdgeDataR.map(e => {
                    let t = Object.assign({}, e);
                    t.source = t.source.substring(1);
                    t.target = t.target.substring(1);
                    return t;
                })
            };

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
                .enter().append("g");

            node
                .append("circle")
                .attr("class", "node")
                .attr("r", 25)
                .attr("fill", "#1f77b4")
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            node.append("title")
                .html(function (d) {
                    return d.airport;
                });

            node.append("text")
                .text(function (d) {
                    return d.id;
                })
                .attr("x", "0")
                .attr("y", "0")
                .attr("pointer-events", "none")
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
        }
    }

    window.visualizations.push(new ForceGraph());

})();