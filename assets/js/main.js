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

})();