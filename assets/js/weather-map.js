(function () {

    var width = 960,
        height = 500,
        active = d3.select(null);

    var projection = d3.geoAlbers()
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    var svg;

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var g;

    class WeatherMap extends Visualization {
        constructor() {
            super("LinkMap");
        }
        setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection) {
            console.log ("started set data");
            d3.selectAll("#weather-map").remove();
            svg = d3.select("#map").append("svg")
                .attr("id", "weather-map")
                .attr("width", width)
                .attr("height", height);
            svg.append("rect")
                .attr("class", "background")
                .attr("width", width)
                .attr("height", height)
                .on("click", reset);
            g = svg.append("g")
                .style("stroke-width", "0.8px");
            d3.json("/data/us.json", function (error, us) {
                g.selectAll("path")
                    .data(topojson.feature(us, us.objects.counties).features)
                    .enter().append("path")
                    .attr("d", path)
                    .attr("class", "feature");
                g.append("path")
                    .datum(topojson.mesh(us, us.objects.counties, (a, b) => a !== b))
                    .attr("class", "mesh")
                    .attr("d", path);
            });
        }

    }
    window.visualizations.push(new WeatherMap());

})();