export default function cnvD3(d3, divId, vizSettings) {
    /**** CONSTRUCTOR ****/

    // Don't throw null exception
    if (!vizSettings) {
        console.log('WARNING: no vizSettings argument provided to cnv.d3.');
        vizSettings = {};
    }
    var dispatch = d3.dispatch('d3mouseover', 'd3mouseout', 'd3click');

    // Viz-level sizing
    var margin = vizSettings.margin ? vizSettings.margin : {top: 10, right: 10, bottom: 10, left: 30};
    var width = 800,
        height = 40;
    var lineColor = vizSettings.lineColor ? vizSettings.lineColor : '#464646';

    // Scales, Axes, Deltas
    var x = vizSettings.x ? vizSettings.x : d3.scaleLinear(),
        y = vizSettings.y ? vizSettings.y : d3.scaleLinear();

    // Viz-level flags
    var showTransition = vizSettings.showTransition !== false;

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
                    .attr("preserveAspectRatio", "xMidYMid meet")
                    .attr("viewBox", "-"
                        + 0 + " -"
                        + adj + " "
                        + (width) + " "
                        + (height + adj *3))
                    .style("margin", margin.top + 'px ' + margin.right + 'px ' + margin.bottom + 'px ' + margin.left + 'px')
                    .classed("svg-content", true);

                // Add color gradient for TCN
                const topGradient = maxTcnAllSamples > 2 ? "red" : "#888888";
                svg.append("linearGradient")
                    .attr("id", "tcn-gradient")
                    .attr("gradientUnits", "userSpaceOnUse")
                    .attr("x1", 0)
                    .attr("y1", y(0))
                    .attr("x2", 0)
                    .attr("y2", y(maxTcnAllSamples))
                    .selectAll("stop")
                    .data([
                        {offset: "0%", color: "#194d81"},
                        {offset: "100%", color: topGradient }
                    ])
                    .enter().append("stop")
                    .attr("offset", function(d) { return d.offset; })
                    .attr("stop-color", function(d) { return d.color; });

                // Y-Axis
                var yAxis = d3.axisRight(y);
                yAxis.ticks(maxTcnAllSamples);
                svg.append("g")
                    .attr("class", "axis")
                    .call(yAxis);

                // TCN Area
                const tcnArea = d3.area()
                    .x(function(d) { return x(d.coord); })
                    .y0(height)
                    .y1(function(d) { return y(d.tcn); });

                // Add one element per cnv
                const tcnAreas = svg.selectAll('areas')
                    .data(data)
                    .enter()
                    .append("g");

                // Draw area per element
                tcnAreas.append("path")
                    .attr('fill', 'url(#tcn-gradient)')
                    .attr('stroke', 'url(#line-gradient)')
                    .attr('opacity', 0.5)
                    .attr('stroke-width', '0.5px')
                    .attr("d", function(d) { return tcnArea(d.points); })
                    .on("mouseover", function (d) {
                        dispatch.call('d3mouseover', this, d);
                    })
                    .on("mouseout", function () {
                        dispatch.call('d3mouseout');
                    })
                    .on("click", function (d) {
                        dispatch.call('d3click', this, d, width);
                    });

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
                        .attr('stroke', lineColor)
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

                // Marker circle and label
                svg.selectAll(".circle").data([0])
                    .enter()
                    .append('circle')
                    .attr("class", "circle")
                    .attr("r", 3)
                    .style("opacity", 0);
                svg.selectAll(".circle-label").data([0])
                    .enter()
                    .append('text')
                    .attr("class", "circle-label")
                    .attr("x", 0)
                    .attr("y", 0)
                    .style("opacity", 0);
            }
        });
    }

    /**** OUTWARD-FACING FUNCTIONS ****/
    chart.getDispatch = function() {
        return dispatch;
    };

    chart.showCircles = function (container, start, end, matchingCnvList) {
        if (container == null) {
            return;
        }

        // Get the x for the start coordinate
        if (start) {
            // Circle and text for TCN line
            var mousex = Math.round(x(start));
            var mousey = Math.round(y(matchingCnvList[0].tcn));

            var circleText = formatCircleText(matchingCnvList);

            var label = container.select(".circle-label");
            label.transition()
                .duration(200)
                .style("opacity", 1);
            label.attr("x", 0)
                .attr("y", margin.top + 5)
                .attr("class", "circle-label")
                .text(circleText);

            container.select(".circle-label")
                .attr("x", function () {
                    var w = this.getBBox().width;
                    var x = mousex + margin.left - (w / 2) + 3;

                    if (x + (w / 2) > innerWidth) {
                        // If the circle label is too far to the right,
                        // position it as far right as possible without
                        // truncating the text.
                        x = innerWidth - (w / 2);
                    } else if (x - (w / 2) < 0) {
                        // If the circle label is position out-of-bounds
                        // from the area, position the label to
                        // start at x position 0;
                        x = 0;
                    }
                    return x;
                });

            var circle = container.select(".circle");
            circle.transition()
                .duration(200)
                .style("opacity", .7);
            circle.attr("cx", mousex + margin.left + 2)
                .attr("cy", mousey + margin.top)
                .attr("r", 3)
        }
    };

    chart.hideCircles = function (container) {
        if (container == null) {
            return;
        }
        container.select(".circle").transition()
            .duration(500)
            .style("opacity", 0);

        container.select(".circle-label").transition()
            .duration(500)
            .style("opacity", 0);
    };

    /**** INTERNAL HELPER FUNCTIONS ****/
    function formatCircleText(matchingCnvList) {
        let text = "";

        // Possible if variant encompasses multiple bases that it falls into multiple CNVs
        if (matchingCnvList.length > 1) {
            matchingCnvList.forEach(cnvObj => {
                text += 'TCN: ' + cnvObj.tcn + '/LCN: ' + cnvObj.lcn + ', ';
            });
            return text.substring(0, text.length - 1);
        } else {
            let cnvObj = matchingCnvList[0];
            text += 'TCN: ' + cnvObj.tcn + '/LCN: ' + cnvObj.lcn;
        }
    }


    /*** RETURN OBJECT ****/
    return chart;
}