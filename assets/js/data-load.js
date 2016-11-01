(function () {

    const dataPath = "/data/";
    let selectedMonth = 1;

    load();

    function load() {
        d3.csv(dataPath + "airports.csv", function (error, airports) {
            if (error) throw error;
            d3.json(dataPath + "top-airports.json", function (error, topAirports) {
                if (error) throw error;

                var topAirportsByIata = d3.map(topAirports, a => a.iata);
                airports = airports.filter(a => topAirportsByIata.get(a.iata));

                var placeFilters = function () {
                    let apFilters = d3.select("#filters")
                        .append("div")
                        .attr("id", "airport-filters")
                        .attr("class", "row");

                    let apNameFilter = apFilters.append("div").attr("class", "col-md-3");

                    apNameFilter.append("span").html("Airports: ");
                    apNameFilter.append("select")
                        .attr("id", "ap-select")
                        .attr("multiple", "multiple")
                        .selectAll("option")
                        .data(airports).enter()
                        .append("option")
                        .attr("value", d => d.iata)
                        .html(d => d.airport);

                    const select = $('select#ap-select');
                    select.multiselect({
                        maxHeight: 500,
                        buttonWidth: 150,
                        includeSelectAllOption: true,
                        enableFiltering: true,
                        filterBehavior: 'both',
                        enableCaseInsensitiveFiltering: true,
                        onChange: function (option, checked, select) {
                            let iatas = $('#airport-filters option:selected').toArray().map(o => o.value);
                            let filteredAirports = [];
                            iatas.forEach(sIata => filteredAirports = filteredAirports.concat(airports.filter(a => a.iata == sIata)));
                            crunchData(filteredAirports);
                        },
                        onSelectAll: function () {
                            crunchData(airports)
                        }
                    });
                    select.multiselect('selectAll', false);
                    select.multiselect('updateButtonText');

                    let monthFilter = apFilters.append("div").attr("class", "col-md-3");

                    monthFilter.append("span").html("Month: ");
                    monthFilter.append("select")
                        .attr("id", "month")
                        .attr("class", "form-control")
                        .on("change", () => {
                                selectedMonth = parseInt(d3.select("select#month").property("value"));
                                loadFlights();
                            }
                        )
                        .selectAll("option")
                        .data(d3.range(1, 12)).enter()
                        .append("option")
                        .attr("value", m => m)
                        .html(m => monthNames[m - 1])
                        .each(function(m) {
                            if (selectedMonth == m) d3.select(this).attr("selected", true)
                        });

                };

                var crunchData = function (airports, flights) {
                    var projection = d3.geoAlbers();
                    projection.scale(990);

                    airports = airports.filter(a => topAirportsByIata.get(a.iata));
                    let airportsByIata = d3.map(airports, a => a.iata);

                    let filteredFlights = flights
                        .filter(f => airportsByIata.get(f.Origin) || airportsByIata.get(f.Dest))
                        .map(f => {
                            if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                            else if (f.DepDelay > 60) f.stdDelay = 60;
                            else f.stdDelay = f.DepDelay;
                            return f;
                        });

                    var nodeData = airports.map(d => {
                        var p = projection([parseFloat(d.long), parseFloat(d.lat)]);
                        d.x = p[0];
                        d.y = p[1];
                        d.id = d.iata;
                        return d;
                    });

                    var flightApKeys = {};
                    filteredFlights.forEach(f => {
                        let routeKey = f.Origin + "-" + f.Dest;
                        let routeKeyAlt = f.Dest + "-" + f.Origin;
                        if (!flightApKeys[routeKeyAlt]) {
                            if (!flightApKeys[routeKey]) {
                                flightApKeys[routeKey] = Object.assign({}, f);
                                flightApKeys[routeKey].DepDelay = 0;
                                flightApKeys[routeKey].delayCount = 1;
                                flightApKeys[routeKey].delayTotal = parseFloat(f.DepDelay);
                            } else {
                                flightApKeys[routeKey].delayCount++;
                                flightApKeys[routeKey].delayTotal += parseFloat(f.DepDelay);
                            }
                        } else {
                            flightApKeys[routeKeyAlt].delayCount++;
                            flightApKeys[routeKeyAlt].delayTotal += parseFloat(f.DepDelay);
                        }
                    });

                    var flightNumberKeys = {};
                    filteredFlights.forEach(f => {
                        let fNum = f.FlightNum;
                        if (!flightNumberKeys[fNum]) {
                            flightNumberKeys[fNum] = Object.assign({}, f);
                            flightNumberKeys[fNum].DepDelay = 0;
                            flightNumberKeys[fNum].delayCount = 1;
                            flightNumberKeys[fNum].delayTotal = parseFloat(f.DepDelay);
                        } else {
                            flightNumberKeys[fNum].delayCount++;
                            flightNumberKeys[fNum].delayTotal += parseFloat(f.DepDelay);
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

                    var fnumAverages = [];
                    for (let k in flightNumberKeys) {
                        if (flightNumberKeys.hasOwnProperty(k)) {
                            let f = flightNumberKeys[k];
                            f.DepDelay = f.delayTotal / f.delayCount;
                            fnumAverages.push(f);
                        }
                    }

                    routeAverages = routeAverages
                        .filter(f => airportsByIata.get(f.Origin) && airportsByIata.get(f.Dest))
                        .map(f => {
                            if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                            else if (f.DepDelay > 60) f.stdDelay = 60;
                            else f.stdDelay = f.DepDelay;
                            return f;
                        });

                    fnumAverages = fnumAverages
                        .filter(f => airportsByIata.get(f.Origin) && airportsByIata.get(f.Dest))
                        .map(f => {
                            if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                            else if (f.DepDelay > 60) f.stdDelay = 60;
                            else f.stdDelay = f.DepDelay;
                            return f;
                        });

                    const mapper = f => {
                        f.source = "$" + f.Origin;
                        f.target = "$" + f.Dest;
                        f.value = Math.round(Math.sqrt(f.stdDelay));
                        return f;
                    };

                    var averageEdgeDataR = routeAverages.map(mapper);

                    var averageEdgeDataFN = fnumAverages.map(mapper);

                    var edgeData = filteredFlights.map(mapper);

                    window.visualizations.forEach(vis => vis.setData(airports, filteredFlights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection))
                };

                if (d3.select("#filters").size() > 0)
                    placeFilters();

                var loadFlights = function () {
                    d3.csv(`${dataPath}2008-${selectedMonth}-compressed.csv`, function (error, flights) {
                        if (error) throw error;
                        crunchData(airports, flights);
                    });
                };

                loadFlights();
            });
        });
    }

})();