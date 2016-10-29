class Visualization {

    constructor(name) {
        this.name = name;
    }

    setData(airports, flights, nodeData, edgeData, routeAverages, averageEdgeData, projection) {
        throw new NotImplementedError("Function setData not implemented for " + this.name + ".")
    }

    dataFiltered(airports, flights, nodeData, edgeData, routeAverages, averageEdgeData, projection) {
        throw new NotImplementedError("Function dataFiltered not implemented for " + this.name + ".")
    }

}

function NotImplementedError(message) {
    this.name = 'NotImplementedError';
    this.message = message;
    this.stack = (new Error()).stack;
}
NotImplementedError.prototype = new Error;