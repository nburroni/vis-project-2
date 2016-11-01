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
            d3.json("/data/state.json", function (error, us) {
                d3.json("/data/state-codes.json", function (error, stateCodes){
                    var stateCodesList = [];
                    for (var key in stateCodes){
                       stateCodesList.push({name: stateCodes[key].name, code: stateCodes[key].stateAbbr});
                    }
                    var options = ["Hail"];
                    var events = filterEvents(weatherEvents, options);
                    var states = [];

                    filterStates(events, states, stateCodesList);
                    calculateStateDelays(flights, airports, states);
                    draw(events, states, us);
                });
            });

        }

    }
    window.visualizations.push(new WeatherMap());

    function draw(events, states, us){
        var maxDelay = Math.max.apply(Math, states.map(function(d){
            return d.delay;
        }));

        var projection = d3.geoAlbers();
        projection.scale(990);
        var coordinates = events.map(d => projection([parseFloat(d.lon), parseFloat(d.lat)])).filter(d => d != null && !(isNaN(d[0]) || isNaN(d[0])));

        g.selectAll("path")
            .data(topojson.feature(us, us.objects.state).features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "feature");
        g.append("path")
            .datum(topojson.mesh(us, us.objects.state, (a, b) => a !== b))
            .attr("class", "mesh")
            .attr("d", path);

        g.selectAll('path')
            .filter(function(d) {
                if (!d.properties) console.log (d);
                else {
                    return findWithAttr(events, "STATE", d.properties.NAME10) > -1;
                }
            })
            .style('fill', function (d){
                if (states[findWithAttr(states, "name", d.properties.NAME10)]) return percentageToHsl((states[findWithAttr(states, "name", d.properties.NAME10)].delay / maxDelay), 120, 0);
            });
        g.selectAll("circle")
            .data(coordinates).enter()
            .append("circle")
            .attr("cx", d => d[0])
            .attr("cy", d => d[1])
            .attr("r", "4px")
            .attr("fill", "#00deff");
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
    function filterStates(weatherEvents, states, stateCodesList){
        weatherEvents.forEach(function (d){
            var index = findWithAttr(states, "name", d.STATE);
            if (index == -1){
                states.push({name: d.STATE, code: stateCodesList[findWithAttr(stateCodesList, "name", d.STATE)].code, count: 0, delay: 0});
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
        states.forEach(function (d, i){
            if (d.count != 0) d.delay /= d.count;
            else states.splice(i,1);
        });
    }
})();