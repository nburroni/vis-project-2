(function () {

    const dataPath = "/data/";

    d3.csv(dataPath + "airports.csv", function (error, airports) {
        if (error) throw error;
        d3.json(dataPath + "top-airports.json", function (error, topAirports) {
            if (error) throw error;
            d3.csv(dataPath + "2008-compressed.csv", function (error, flights) {
                if (error) throw error;

                var projection = d3.geoAlbers();
                projection.scale(990);

                var topAirportsByIata = d3.map(topAirports, a => a.iata);
                airports = airports.filter(a => topAirportsByIata.get(a.iata));

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
                    let routeKeyAlt = f.Dest + "-" + f.Origin;
                    if (!flightApKeys[routeKeyAlt]) {
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
                    } else {
                        flightApKeys[routeKeyAlt].delayCount++;
                        flightApKeys[routeKeyAlt].delayTotal += parseFloat(f.DepDelay);
                    }
                });

                var flightNumberKeys = {};
                flights.forEach(f => {
                    let fNum = f.FlightNum;
                    if (!flightNumberKeys[fNum]) {
                        flightNumberKeys[fNum] = {
                            Origin: f.Origin,
                            Dest: f.Dest,
                            DepDelay: 0,
                            delayCount: 1,
                            delayTotal: parseFloat(f.DepDelay)
                        }
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
                    .filter(f => topAirportsByIata.get(f.Origin) && topAirportsByIata.get(f.Dest))
                    .map(f => {
                        if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                        else if (f.DepDelay > 60) f.stdDelay = 60;
                        else f.stdDelay = f.DepDelay;
                        return f;
                    });

                fnumAverages = fnumAverages
                    .filter(f => topAirportsByIata.get(f.Origin) && topAirportsByIata.get(f.Dest))
                    .map(f => {
                        if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                        else if (f.DepDelay > 60) f.stdDelay = 60;
                        else f.stdDelay = f.DepDelay;
                        return f;
                    });

                flights = flights
                    .filter(f => topAirportsByIata.get(f.Origin) && topAirportsByIata.get(f.Dest))
                    .map(f => {
                        if (f.DepDelay == "NA" || f.DepDelay < 0) f.stdDelay = 0;
                        else if (f.DepDelay > 60) f.stdDelay = 60;
                        else f.stdDelay = f.DepDelay;
                        return f;
                    });

                var averageEdgeDataR = routeAverages.map(f => {
                    return {"source": f.Origin, "target": f.Dest, "value": Math.round(Math.sqrt(f.stdDelay))}
                });

                var averageEdgeDataFN = fnumAverages.map(f => {
                    return {"source": f.Origin, "target": f.Dest, "value": Math.round(Math.sqrt(f.stdDelay))}
                });

                var edgeData = flights.map(f => {
                    return {"source": f.Origin, "target": f.Dest, "value": f.stdDelay}
                });

                window.visualizations.forEach(vis => vis.setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeDataR, averageEdgeDataFN, projection))

            });
        });
    });


})();