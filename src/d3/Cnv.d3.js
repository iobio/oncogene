export default function cnvD3(d3, divId, vizSettings) {
    /**** CONSTRUCTOR ****/

    // Don't throw null exception
    if (!vizSettings) {
        console.log('WARNING: no vizSettings argument provided to cnv.d3.');
        vizSettings = {};
    }
    var dispatch = d3.dispatch();   // todo: not using for now but can in future OR get rid of

    // Viz-level sizing
    var margin = vizSettings.margin ? vizSettings.margin : {top: 10, right: 10, bottom: 10, left: 30};
    var width = 800 - margin.right - margin.left,
        height = 75 - margin.top - margin.bottom;

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
            //chrom = chartInfo.chromosome,
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
                var svg = d3.select('#' + id)
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("class", "group")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                // add tooltip
                // var cnvTooltip = container.append("div")
                //     .style("opacity", 0)
                //     .attr("class", "tooltip")
                //     .style("background-color", "white")
                //     .style("border", "solid")
                //     .style("border-width", "1px")
                //     .style("border-radius", "5px")
                //     .style("padding", "10px");

                // add y-axis
                var yAxis = d3.axisRight(y);
                yAxis.tickValues([0.0, 0.5, 1.0]);
                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);

                // Start variant model
                // add elements
                // var trackCnv = svg.selectAll('.track.cnv')
                //     .data(data)
                //     .join('g')
                //     .attr('class', 'track cnv')
                //     .attr('transform', function (d, i) {
                //         return "translate(0," + (y(i)) + ")"
                //     });
                //
                // trackCnv.selectAll('.cnv').remove();

                // shading
                svg.selectAll('.cnv-rect')
                    .data(data)
                    .enter()
                    .append("rect")
                        .attr('class', function(d) {
                            return d.tcn > 2 ? 'cnv-amp cnv-rect' : 'cnv-del cnv-rect';
                        })
                        .attr('x', function(d) {
                            var maxStart = Math.max(d.start, regionStart); // Want right-most start coord
                            return Math.round(x(maxStart));
                        })
                        .attr('y', function() {
                            return Math.round(y(1));
                        })
                        .attr('width', function(d) {
                            var maxStart = Math.max(d.start, regionStart); // Want right-most start coord
                            var minEnd = Math.min(d.end, regionEnd);  // Want left-most end coord
                            return Math.round(x(minEnd) - x(maxStart) + margin.right);
                        })
                        .attr('height', height);

                // fraction lines
                var lines = svg.selectAll('.cnv-line')
                    .data(data)
                    .enter()
                    .append('g');

                lines.append("path")
                    .attr('fill', 'none')
                    .attr('stroke-width', 1.5)
                    .attr("d", function(d) {
                        return d3.line(d.points)
                            .x(function(p) { return x(p.coord); })
                            .y(function(p) { return y(p.ratio); })
                    });

                // exit
                // trackCnv.exit().remove();

                // update
                if (showTransition) {
                    // todo: implement cool transition
                    console.log('implement cool CNV transition');
                }

                // Add cnv listeners
                // trackCnv.on("mouseover", function (d) {
                //         cnvTooltip
                //             .html("Copy Number Event<br>" + chrom + ":" + d.start + "-" + d.end + "<br>LCN: " + d.lcn + "<br>TCN: " + d.tcn)
                //             .style("font-family", "Quicksand")
                //             .style("z-index", 256)
                //             .style("left", (d3.mouse(this)[0]) + "px")
                //             .style("top", (d3.mouse(this)[1]) + "px")
                //             .style("opacity", 1);
                //     }).on("mouseout", function () {
                //         cnvTooltip.style("opacity", 0);
                // });
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