/**
 SJG Mar2018
 Adapted from https://github.com/sarahob/d3ProgressBar/blob/master/d3progressbar.js
 */
export default function progressBar(d3, id) {
    // todo: add options param here and preferentially fill from there first
    var height = 20,
        roundedCorners = 10,
        backgroundFill = 'white',
        blueFill = '#7f1010', // Fill color
        barId = id;

    function bar() {
        var svg = d3.select('#progress_' + barId)
            .append('svg')
            .attr('height', height)
            .attr('width', '100%')
            .attr('style', 'padding-top: 4px; padding-left: 1px; padding-right: 1px')
            .attr('x', 0);

        // Background bubble
        svg.append('rect')
            .attr('class', 'bar-outline')
            .attr('rx', roundedCorners)
            .attr('ry', roundedCorners)
            .attr('fill', backgroundFill)
            .attr('height', 15)
            .attr('width', function () {
                return '90%';
            })
            .attr('x', 0);

        // Progress bubble
        svg.append('rect')
            .attr('class', 'progress-rect')
            .attr('width', 0)
            .attr('height', 15)
            .attr('rx', roundedCorners)
            .attr('ry', roundedCorners)
            .attr('fill', blueFill);

        // Ghost fill this to get rid of initial funky outline
        var bar = d3.select('#progress_' + barId).select('svg').select('.progress-rect');
        bar.transition()
            .duration(700)
            .attr('fill', blueFill)
            .attr('width', "1%");
        bar.transition()
            .duration(700)
            .attr('fill', backgroundFill)
            .attr('width', "0%");
    }

    /*** OUTWARD FACING FUNCTIONS ***/
    bar.moveProgressBar = function (frequency) {
        var svg = d3.select('#progress_' + barId).select('svg');
        var progBar = svg.select('.progress-rect');

        // Fill bar if we have a frequency coming in
        var freqNum = parseInt(frequency);
        if (!isNaN(freqNum) && freqNum > 0 && bar) {
            progBar.transition()
                .duration(700)
                .attr('fill', blueFill)
                .attr('width', function () {
                    var scaledWidth = freqNum * 0.9;  // Progress bar is 90% width of parent svg
                    return scaledWidth > 10 ? (scaledWidth + "%") : "10%"; // Keep width at a minimum so bubble fits into outline
                });
        }
        // Otherwise make bar disappear
        else if (progBar) {
            progBar.transition()
                .duration(700)
                .attr('fill', backgroundFill) // Set to white to get rid of remaining border
                .attr('width', "0%");
        }
    };

    bar.getId = function() {
        return barId;
    };

    return bar;
}
