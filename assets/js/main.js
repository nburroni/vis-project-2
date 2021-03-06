(function () {

    window.visualizations = [];

    window.percentageToHsl = (percentage, hue0, hue1) => {
        var hue = (percentage * (hue1 - hue0)) + hue0;
        return 'hsl(' + hue + ', 100%, 50%)';
    };
    window.percentageToPastelHsl = (percentage, hue0, hue1) => {
        var hue = (percentage * (hue1 - hue0)) + hue0;
        return 'hsl(' + hue + ', 100%, 65%)';
    };

    window.defaultHslScale = (percentage) => percentageToHsl(percentage, 120, 0);
    window.defaultPastelHslScale = (percentage) => percentageToPastelHsl(percentage, 120, 0);

    window.dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    window.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    window.dayNameShort = (i) => dayNames[i].substring(0, 3);

    window.hoveringOver = (s) => d3.select("#dashboard #title h2").html(s);
    window.hoveringOut = () => d3.select("#dashboard #title h2").html("Hover over airports or hours");

    hoveringOut();

})();