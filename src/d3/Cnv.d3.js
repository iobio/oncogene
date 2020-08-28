export default function cnvD3(d3, vizSettings) {
    /**** CONSTRUCTOR ****/

    // Don't throw null exception
    if (!vizSettings) {
        console.log('WARNING: no vizSettings argument provided to cnv.d3.');
        vizSettings = {};
    }
    var dispatch = d3.dispatch();   // todo: not using for now but can in future OR get rid of

    // Viz-level sizing
    var margin = vizSettings.margin ? vizSettings.margin : {top: 30, right: 0, bottom: 20, left: 110};
    var width = 800,
        height = 100,
        widthPercent = vizSettings.widthPercent ? vizSettings.widthPercent : '100%',
        heightPercent = vizSettings.heightPercent ? vizSettings.heightPercent : '100%';

    // Glyph-level sizing
    var borderRadius = vizSettings.borderRadius ? vizSettings.borderRadius : 1,
        verticalLayers = vizSettings.verticalLayers ? vizSettings.verticalLayers : 1,
        verticalPadding = vizSettings.verticalPadding ? vizSettings.verticalPadding : 2,
        lowestWidth = vizSettings.lowestWidth ? vizSettings.lowestWidth : 3;

    // Scales, Axes, Deltas
    var x = vizSettings.x ? vizSettings.x : d3.scaleLinear(),
        y = vizSettings.y ? vizSettings.y : d3.scaleLinear();

    // Viz-level flags
    var showTransition = vizSettings.showTransition ? vizSettings.showTransition : true;

    /**** CHART DRAWING ****/

    function chart(chartInfo) {
        // Don't throw null exception
        if (!chartInfo) {
            console.log('WARNING: chartInfo parameters not provided to variant.d3 - could not draw variant chart.');
        }
        // Required arguments
        var regionStart = chartInfo.regionStart,
            regionEnd = chartInfo.regionEnd,
            chrom = chartInfo.chromosome,
            selection = chartInfo.selection;

        // Optional arguments
        verticalLayers = chartInfo.verticalLayers ? chartInfo.verticalLayers : verticalLayers;
        lowestWidth = chartInfo.lowestWidth ? chartInfo.lowestWidth : lowestWidth;
        width = chartInfo.width ? chartInfo.width : width;

        // Recalculate the height based on the number of vertical layers
        // Not sure why, but we have to bump up the layers by one; otherwise,
        // y will be negative for first layer
        if (verticalLayers == null) {
            verticalLayers = 1;
        }
        height = verticalLayers * verticalPadding;
        height += verticalPadding;

        // Determine inner height (w/o margins)
        var innerHeight = height - margin.top - margin.bottom;

        selection.each(function(data) {
            // Set svg element
            var container = d3.select(this).classed('ibo-cnv', true);
            container.selectAll("svg").remove();

            if (data && data.length > 0 && data[0]) {
                // Update the x-scale.
                if (regionStart && regionEnd) {
                    x.domain([regionStart, regionEnd]);
                } else {
                    console.log('Could not draw x-scale because no region start and end coords provided to cnv.d3');
                }
                x.range([0, width - margin.left - margin.right]);

                // Update the y-scale.
                y.domain([0, data.length]);
                y.range([innerHeight, 0]);

                // Select the svg element, if it exists.
                var svgData = container.selectAll("svg").data([0]);
                var g = svgData.enter()
                    .append("svg")
                    .attr("width", widthPercent)
                    .attr("height", heightPercent)
                    .attr('viewBox', "0 0 " + parseInt(width + margin.left + margin.right) + " " + parseInt(height + margin.top + margin.bottom))
                    .attr("preserveAspectRatio", "none")
                    .append("g")
                    .attr("class", "group")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                // // Bind svg variable to selection, not data
                container.selectAll('svg');

                // The chart dimensions could change after instantiation, so update viewbox dimensions
                // every time we draw the chart.
                d3.select(this).selectAll("svg")
                    .filter(function () {
                        return this.parentNode === container.node();
                    })
                    .attr('viewBox', "0 0 " + parseInt(width + margin.left + margin.right) + " " + parseInt(height + margin.top + margin.bottom));

                // add tooltip
                var cnvTooltip = container.append("div")
                    .style("opacity", 0)
                    .attr("class", "tooltip")
                    .style("background-color", "white")
                    .style("border", "solid")
                    .style("border-width", "1px")
                    .style("border-radius", "5px")
                    .style("padding", "10px");

                // Start variant model
                // add elements
                var trackCnv = g.selectAll('.track.cnv')
                    .data(data)
                    .join('g')
                    .attr('class', 'track cnv')
                    .attr('transform', function (d, i) {
                        return "translate(0," + (y(i)) + ")"
                    });

                trackCnv.selectAll('.cnv').remove();

                // cnvs
                trackCnv.selectAll('.cnv')
                    .data(function (d) {
                        return d['cnvs'];
                    })
                    .join('rect')
                    .attr('class', 'cnv')
                    .attr('rx', borderRadius)
                    .attr('ry', borderRadius)
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
                    .attr('height', margin.bottom - 10);

                // exit
                trackCnv.exit().remove();

                // update
                if (showTransition) {
                    // todo: implement cool transition
                    console.log('implement cool CNV transition');
                }

                // Add cnv listeners
                trackCnv.on("mouseover", function (d) {
                        cnvTooltip
                            .html("Copy Number Event<br>" + chrom + ":" + d.start + "-" + d.end + "<br>LCN: " + d.lcn + "<br>TCN: " + d.tcn)
                            .style("font-family", "Quicksand")
                            .style("z-index", 256)
                            .style("left", (d3.mouse(this)[0]) + "px")
                            .style("top", (d3.mouse(this)[1]) + "px")
                            .style("opacity", 1);
                    }).on("mouseout", function () {
                        cnvTooltip.style("opacity", 0);
                });
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