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
            selection = chartInfo.selection,
            maxTcnAllSamples = chartInfo.maxTcn,
            drawMinorAllele = chartInfo.drawMinorAllele;

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
                y.domain([0, maxTcnAllSamples]);
                y.range([height, 0]);

                // Add svg
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

                // Add color gradient if only showing TCN
                if (!drawMinorAllele) {
                    // Set the gradient
                    const topGradient = maxTcnAllSamples > 2 ? "red" : "#888888";
                    svg.append("linearGradient")
                        .attr("id", "line-gradient")
                        .attr("gradientUnits", "userSpaceOnUse")
                        .attr("x1", 0)
                        .attr("y1", y(0))
                        .attr("x2", 0)
                        .attr("y2", y(maxTcnAllSamples))
                        .selectAll("stop")
                        .data([
                            {offset: "0%", color: "blue"},
                            {offset: "100%", color: topGradient }
                        ])
                        .enter().append("stop")
                        .attr("offset", function(d) { return d.offset; })
                        .attr("stop-color", function(d) { return d.color; });
                }

                // Y-Axis
                var yAxis = d3.axisRight(y);
                yAxis.ticks(maxTcnAllSamples);
                svg.append("g")
                    .attr("class", "axis")
                    .call(yAxis);

                // TCN Line
                const tcnLine = d3.line()
                    .x(function(d) { return x(d.coord); })
                    .y(function(d) { return y(d.tcn); });

                const tcnLines = svg.selectAll('lines')
                    .data(data)
                    .enter()
                    .append("g");

                const tcnPaths = tcnLines.append('path')
                    .attr('stroke-width', 1.5)
                    .attr('stroke', 'url(#line-gradient)')
                    .attr('fill', 'none')
                    .attr("d", function(d) { return tcnLine(d.points); });

                if (showTransition) {
                    let tcnLength = tcnPaths.node().getTotalLength();
                    tcnPaths.attr("stroke-dasharray", tcnLength + " " + tcnLength)
                        .attr("stroke-dashoffset", tcnLength)
                        .transition()
                        .duration(2000)
                        .ease(d3.easeLinear)
                        .attr("stroke-dashoffset", 0);
                }

                // LCN Line
                if (drawMinorAllele) {
                    const lcnLine = d3.line()
                        .x(function(d) { return x(d.coord); })
                        .y(function(d) { return y(d.lcn); });

                    const lcnLines = svg.selectAll('lines')
                        .data(data)
                        .enter()
                        .append("g");

                    const lcnPaths = lcnLines.append('path')
                        .attr('stroke-width', 1.5)
                        .attr('stroke', '#888888')
                        .attr('fill', 'none')
                        .attr("d", function(d) { return lcnLine(d.points); });

                    if (showTransition) {
                        let lcnLength = lcnPaths.node().getTotalLength();
                        lcnPaths.attr("stroke-dasharray", lcnLength + " " + lcnLength)
                            .attr("stroke-dashoffset", lcnLength)
                            .transition()
                            .duration(2000)
                            .ease(d3.easeLinear)
                            .attr("stroke-dashoffset", 0);
                    }
                }
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