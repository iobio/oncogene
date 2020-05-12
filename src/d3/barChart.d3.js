/**
SJG Jan2019
Adapted from http://bl.ocks.org/d3noob/8952219

This is a bar chart that initially displays just the graph outline, then populates when fillChart is called,
to allow a dynamic rendering of chart fill.

NOTE: initial dataMap and newDataMap must contain an IDENTICAL number of entries IN THE SAME EXACT ORDER
*/
export default function barChart(d3, options) {
    // Instance variables
    var parentId = options.parentId ? options.parentId: 'div',
        barColor = '#7f1010',
        yValueMax = options.yValMax ? options.yValMax : 500,
        yTicks = options.yTicks ? options.yTicks : 10,
        dataMap = options.dataMap;

    // Private variables (can be made public if necessary except for _x and _y)
    var _x, _y,
        margin = {top: 10, right: 0, bottom: 40, left: 50},
        height = 200 - margin.bottom - margin.top,
        width = 300 - margin.left - margin.right,
        roundedCorners = 2;


    /* Draws outline of chart and axes */
    function chart() {
        // Remove any old chart
        d3.select('#' + parentId).select('svg').remove();

        // Draw new chart
        var svg = d3.select('#' + parentId).append('svg')
            .attr('height', height + margin.top + margin.bottom)
            .attr('width', width + margin.left + margin.right)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Define axes data
        _x = d3.scaleBand()
            .range([0, width])
            .round(.05)
            .padding(0.1);
        _y = d3.scaleLinear().range([height, 0]);

        var xAxis = d3.axisBottom()
            .scale(_x);

        var yAxis = d3.axisLeft()
            .scale(_y)
            .tickFormat(function(e){
                if(Math.floor(e) !== e)
                {
                    return;
                }
                return e;
            })
            .ticks(yTicks);    // Max of 5 ticks

        _x.domain(dataMap.map(function (d) {
            return d.label;
        }));
        _y.domain([0, yValueMax + 100]);

        // Draw axes and labels
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .style("text-overflow", "ellipsis")
            .attr("dx", "1.0em")
            .attr("transform", "rotate(-35)");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("dx", "-3em")
            .attr("dy", "-4em")
            .style("text-anchor", "end")
            .text("# Samples");

        // Draw bars
        if (dataMap.length > 0) {
            svg.selectAll("bar")
                .data(dataMap)
                .enter()
                .append("rect")
                .attr('id', function (d) {
                    return 'bar_' + d.label.replace(' ', '_');
                })  // Label each rect so we can find it later
                .attr('rx', roundedCorners)
                .attr('ry', roundedCorners)
                .style("fill", "white")
                .attr("x", function (d) {
                    return _x(d.label);
                })
                .attr("width", _x.bandwidth())
                .attr("y", function (d) {
                    return _y(d.value);
                })
                .attr("height", function (d) {
                    return height - _y(d.value);
                });

            // Draw labels
            svg.selectAll("bar")
                .data(dataMap)
                .enter()
                .append("text")
                .attr('id', function (d) {
                    return 'label_' + d.label.replace(' ', '_');
                })
                .attr('class', "bar-label")
                .attr("width", _x.bandwidth())
                .attr("text-anchor", "start")
                .attr("x", ( d => { return _x(d.label) + (_x.bandwidth() / 2) - 9 ; }))
                .attr("y", function (d) {
                    return _y(d.value);
                });
        }
    }

    /*** OUTWARD FACING FUNCTIONS ***/

    /* Takes in array of maps with {label:, value:} entries and draws bars based on provided values.
       Providing an empty data array will zero out all bars.
       NOTE: newDataMap MUST have an identical number of entries as the original dataMap, in the exact same order
     */
    chart.fillChart = function (newDataMap) {
        var svg = d3.select('#' + parentId).select('svg');

        // Reset all columns to 0 if nothing in map
        if (newDataMap == null || newDataMap.length === 0) {
            svg.selectAll("rect")
                .transition()
                .duration(700)
                .attr('y', height)
                .attr('height', function () {
                    return height - _y(0);
                });
            svg.selectAll("text").remove();
        }
        else {
            newDataMap.forEach(function (dataBar) {
                var barId = "#bar_" + dataBar.label.replace(' ', '_');
                var labelId = "#label_" + dataBar.label.replace(' ', '_');
                var barHeight = dataBar.value ? dataBar.value : 0;
                var column = svg.select(barId);
                var label = svg.select(labelId);

                if (column) {
                    column.style("fill", () => { return barColor; })
                        .attr("y",  () => { return _y(0); })
                        .attr("height", 0)
                        .transition()
                        .duration(750)
                        .delay(function (d, i) {
                            return i * 250;
                        })
                        .attr("y", () => { return _y(barHeight); })
                        .attr("height",  () => { return height - _y(barHeight); })
                }

                if (label) {
                    label.attr("y",  () => { return _y(0); })
                        .attr("height", 0)
                        .transition()
                        .duration(750)
                        .delay((d, i) => { return i * 250; })
                        .text(() => { return dataBar.value; })
                        .attr("y",  () => { return _y(barHeight) + .1; })
                        .attr("dy", "-.7em");
                }
            })
        }
    };
    return chart;
}
