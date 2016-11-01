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
            super("WeatherMap");
        }
        setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection, weatherEvents) {
            console.log ("started set data");
            d3.selectAll("#weather-map").remove();
            svg = d3.select("#map").append("svg")
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
            d3.json("/data/county.json", function (error, us) {
                g.selectAll("path")
                    .data(topojson.feature(us, us.objects.county).features)
                    .enter().append("path")
                    .attr("d", path)
                    .attr("class", "feature");
                g.append("path")
                    .datum(topojson.mesh(us, us.objects.county, (a, b) => a !== b))
                    .attr("class", "mesh")
                    .attr("d", path);
                
                g.selectAll('path')
                    .filter(function(d) {
                        return d.id == "02013"
                    })
                    .style('fill', 'red')
            });
        }

    }
    window.visualizations.push(new WeatherMap());

})();