export default function cnvD3(d3, divId, vizSettings) {
    /**** CONSTRUCTOR ****/

    // Don't throw null exception
    if (!vizSettings) {
        console.log('WARNING: no vizSettings argument provided to cnv.d3.');
        vizSettings = {};
    }
    var dispatch = d3.dispatch('d3cnv');

    // Viz-level sizing
    var margin = vizSettings.margin ? vizSettings.margin : {top: 10, right: 10, bottom: 10, left: 30};
    var width = 800,
        height = 40;

    // Scales, Axes, Deltas
    var x = vizSettings.x ? vizSettings.x : d3.scaleLinear(),
        y = vizSettings.y ? vizSettings.y : d3.scaleLinear();

    // Viz-level flags
    var showTransition = vizSettings.showTransition ? vizSettings.showTransition : true;

    var id = divId;

    /**** CHART DRAWING ****/

    function chart(chartInfo) {
        // Don't throw null exception
        if (!chartInfo) {
            console.log('WARNING: chartInfo parameters not provided to variant.d3 - could not draw variant chart.');
        }
        // Required arguments
        var regionStart = chartInfo.regionStart,
            regionEnd = chartInfo.regionEnd,
            selection = chartInfo.selection;

        // Optional arguments
        width = chartInfo.width ? chartInfo.width : width;

        selection.each(function(data) {
            // Set svg element
            var container = d3.select(this).classed('ibo-cnv', true);
            container.selectAll("svg").remove();

            if (data && data.length > 0) {
                // Update the x-scale.
                if (regionStart && regionEnd) {
                    x.domain([regionStart, regionEnd]);
                } else {
                    console.log('Could not draw x-scale because no region start and end coords provided to cnv.d3');
                }
                x.range([0, width - margin.left - margin.right]);

                // Update the y-scale.
                y.domain([0, 1]);
                y.range([height, 0]);

                // Select the svg element, if it exists.
                const adj = 5;
                var svg = d3.select('#' + id)
                    .append('svg')
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", "-"
                        + 0 + " -"
                        + adj + " "
                        + (width) + " "
                        + (height + adj *3))
                    .style("margin", margin.top + 'px ' + margin.right + 'px ' + margin.bottom + 'px ' + margin.left + 'px')
                    .classed("svg-content", true);

                // Y-Axis
                var yAxis = d3.axisRight(y);
                yAxis.tickValues([0.0, 0.5, 1.0]);
                svg.append("g")
                    .attr("class", "axis")
                    .call(yAxis);

                // TCN Shading
                let rects = svg.selectAll('.cnv-rect')
                    .data(data)
                    .enter()
                    .append("rect")
                        .attr('class', function(d) {
                            return d.tcn > 2 ? 'cnv-amp cnv-rect' : d.tcn < 2 ? 'cnv-del cnv-rect' : 'cnv-flat cnv-rect';
                        })
                        .attr('x', function(d) {
                            var maxStart = Math.max(d.start, regionStart); // Want right-most start coord
                            return Math.round(x(maxStart));
                        })
                        .attr('y', function() {
                            return Math.round(y(1));
                        })
                        .attr('width', function(d) {
                            if (showTransition) {
                                return 0;
                            } else {
                                var maxStart = Math.max(d.start, regionStart); // Want right-most start coord
                                var minEnd = Math.min(d.end, regionEnd);  // Want left-most end coord
                                return (x(minEnd) - x(maxStart));
                            }
                        })
                        .attr('height', height)
                        .on('mouseover', function(d) {
                            dispatch.call('d3cnv', this, d);
                        })
                        .on('mouseout', function() {
                            dispatch.call('d3cnv');
                        });

                if (showTransition) {
                    rects.transition()
                        .duration(2000)
                        .attr('width', function(d) {
                            var maxStart = Math.max(d.start, regionStart); // Want right-most start coord
                            var minEnd = Math.min(d.end, regionEnd);  // Want left-most end coord
                            return (x(minEnd) - x(maxStart));
                        })
                }

                // Ratio Lines
                const line = d3.line()
                    .x(function(d) { return x(d.coord); })
                    .y(function(d) { return y(d.ratio); });

                const lines = svg.selectAll('lines')
                    .data(data)
                    .enter()
                    .append("g");

                const paths = lines.append('path')
                    .attr('stroke-width', 1.5)
                    .attr('stroke', '#888888')
                    .attr('fill', 'none')
                    .attr("d", function(d) { return line(d.points); });

                let totalLength = paths.node().getTotalLength();

                paths.attr("stroke-dasharray", totalLength + " " + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(2000)
                    .ease(d3.easeLinear)
                    .attr("stroke-dashoffset", 0);
            }
        });
    }

    /**** OUTWARD-FACING FUNCTIONS ****/
    chart.getDispatch = function() {
        return dispatch;
    };

    /**** INTERNAL HELPER FUNCTIONS ****/


    /*** RETURN OBJECT ****/
    return chart;
}