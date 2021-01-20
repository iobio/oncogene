export default function cnvBarD3(d3, divId, vizSettings) {
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
        height = 60;

    // Scales, Axes, Deltas
    var x = vizSettings.x ? vizSettings.x : d3.scaleLinear(),
        y = vizSettings.y ? vizSettings.y : d3.scaleLinear();

    // Viz-level flags
    // var showTransition = vizSettings.showTransition ? vizSettings.showTransition : true;

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
            maxMcnAllSamples = chartInfo.maxMcn ? chartInfo.maxMcn : 1;
            // drawMinorAllele = chartInfo.drawMinorAllele;

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
                y.domain([-maxMcnAllSamples, maxTcnAllSamples]);
                y.range([height - y(maxMcnAllSamples), 0]);

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

                // X-Axis & zero line
                // var xAxis = d3.axisTop(x).ticks(0).tickSize(0);
                // svg.append("g")
                //     .attr("transform", `translate(0,${y(0) - y(maxTcnAllSamples)})`)
                //     .attr("class", "axis")
                //     .call(xAxis);

                // Y-Axis
                var yAxis = d3.axisRight(y);
                yAxis.ticks(maxTcnAllSamples + maxMcnAllSamples);
                svg.append("g")
                    .attr("class", "axis")
                    .call(yAxis);

                // Bar constant
                const bars = svg.selectAll('rect')
                    .data(data)
                    .enter()
                    .append('g');

                // Outline
                // bars.append('rect')
                //     .attr('x', function() { return x(regionStart); })
                //     .attr('y', function() { return y(maxTcnAllSamples); })
                //     .attr('height', function() { return y(0) - y(maxMcnAllSamples + maxTcnAllSamples); })
                //     .attr('width', function() { return x(regionEnd) - x(regionStart); })
                //     .attr('fill', 'transparent')
                //     .attr('stroke-width', 1.0)
                //     .attr('stroke', '#888888')
                //     .attr('opacity', 0.5);

                // TCN bars
                bars.append('rect')
                    .attr('x', function(d) { return x(d.start); })
                    .attr('y', function(d) { return y(d.tcn); })
                    .attr('height', function(d) { return y(0) - y(d.tcn) })
                    .attr('width', function (d) { return x(d.end) - x(d.start); })
                    .attr('fill', '#965757')
                    .attr('opacity', 0.5);

                // MCN bars
                bars.append('rect')
                    .attr('x', function(d) { return x(d.start); })
                    .attr('y', function() { return y(0); })
                    .attr('height', function(d) { return y(0) - y(d.lcn) })
                    .attr('width', function (d) { return x(d.end) - x(d.start); })
                    .attr('fill', '#194d81')
                    .attr('opacity', 0.5);


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

    // todo: left off connecting dots up to variant card/home component and testing circles

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

            // todo: draw circle on lcn line if that line is displayed

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