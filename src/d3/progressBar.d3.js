/**
 SJG Mar2018
 Adapted from https://github.com/sarahob/d3ProgressBar/blob/master/d3progressbar.js
 */
export default function progressBar(d3) {
    var dispatch = d3.dispatch("d3rendered");
    var height = 20,
        svgSegmentWidth = 500,
        segmentWidth = 200,
        roundedCorners = 10,
        backgroundFill = 'white',
        blueFill = '#6c94b7', // Fill color
        currentStatus,
        parentId,
        states;

    var moveProgressBar = function (frequency) {
        var svg = d3.select('#' + parentId).select('svg');
        var progBar = svg.select('.progress-rect');

        // Fill bar if we have a frequency coming in
        var freqNum = parseInt(frequency);
        if (freqNum.isNaN() && freqNum > 0 && bar) {
            progBar.transition()
                .duration(700)
                .attr('fill', blueFill)
                .attr('width', function () {
                    var scaledWidth = freqNum * 0.9;  // Progress bar is 90% width of parent svg
                    // SJG_BOG TODO: this is going to need to change for smaller layout
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

    function bar() {
        var svg = d3.select('#' + parentId)
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
        var bar = d3.select('#' + parentId).select('svg').select('.progress-rect')
        bar.transition()
            .duration(700)
            .attr('fill', blueFill)
            .attr('width', "1%");
        bar.transition()
            .duration(700)
            .attr('fill', backgroundFill)
            .attr('width', "0%");

        dispatch.d3rendered();
    }

    bar.height = function (_) {
        if (!arguments.length) {
            return height;
        }
        height = _;
        return bar;
    };

    bar.svgSegmentWidth = function (_) {
        if (!arguments.length) {
            return svgSegmentWidth;
        }
        svgSegmentWidth = _;
        return bar;
    };

    bar.segmentWidth = function (_) {
        if (!arguments.length) {
            return segmentWidth;
        }
        segmentWidth = _;
        return bar;
    };

    bar.roundedCorners = function (_) {
        if (!arguments.length) {
            return roundedCorners;
        }
        roundedCorners = _;
        return bar;
    };

    bar.backgroundFill = function (_) {
        if (!arguments.length) {
            return backgroundFill;
        }
        backgroundFill = _;
        return bar;
    };

    bar.currentStatus = function (_) {
        if (!arguments.length) {
            return currentStatus;
        }
        currentStatus = _;
        return bar;
    };

    bar.parentId = function (_) {
        if (!arguments.length) {
            return parentId;
        }
        parentId = _;
        return bar;
    };

    bar.states = function (_) {
        if (!arguments.length) {
            return states;
        }
        states = _;
        return bar;
    };

    bar.moveProgressBar = function (_) {
        if (!arguments.length) {
            return moveProgressBar;
        }
        states = _;
        return bar;
    }

    // d3.rebind(bar, dispatch, "on");
    return bar;
}
