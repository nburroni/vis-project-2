(function () {

    window.visualizations = [];

    window.percentageToHsl = percentageToHsl;
    window.defaultHslScale = (percentaje) => percentageToHsl(percentaje, 120, 0);

    function percentageToHsl(percentage, hue0, hue1) {
        var hue = (percentage * (hue1 - hue0)) + hue0;
        return 'hsl(' + hue + ', 100%, 50%)';
    }
    
})();