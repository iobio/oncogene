/**
SJG Aug2020
This is a line chart that initially displays just the graph outline, then populates when fillChart is called,
to allow a dynamic rendering of chart.

 */
export default function lineChart(d3, options) {
    // Instance variables
    var parentId = options.parentId ? options.parentId: 'div',
        dotColor = "#194d81",
        lineColor = '#7f1010';

    // Private variables (can be made public if necessary except for _x and _y)
    var _x, _y,
        margin = {top: 10, right: 0, bottom: 40, left: 50},
        height = 200 - margin.bottom - margin.top,
        width = 300 - margin.left - margin.right,
        legendWidth = 100;


    /* Draws outline of chart and axes */
    function chart(dataMap, sampleLabels, maxYVal) {
        // Remove any old chart
        d3.select('#' + parentId).select('svg').remove();

        maxYVal = maxYVal < 2 ? 2 : maxYVal;

        // Draw new chart
        var svg = d3.select('#' + parentId).append('svg')
            .attr('height', height + margin.top + margin.bottom)
            .attr('width', width + legendWidth + margin.left + margin.right)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Define axes data
        _x = d3.scalePoint()
            .domain(sampleLabels)
            .range([0, width])
            .round(.05)
            .padding(0.5);

        _y = d3.scaleLinear()
            .domain([0, maxYVal])
            .range([height, 0]);

        var xAxis = d3.axisBottom()
            .scale(_x);

        var yAxis = d3.axisLeft(_y)
            .ticks(maxYVal, "d");

        svg.append("g")
            .attr("class", "axis")
            .call(yAxis);

        // Process data
        let tcns = [];
        let mcns =[];

        let i = 0;
        Object.values(dataMap).forEach(dataArr => {
            let maxTcn = 0;
            let matchingMcn = 0;
            dataArr.forEach(currData => {
                // Take max of TCNs
                if ((+currData.tcn) > maxTcn) {
                    maxTcn = (+currData.tcn);
                    matchingMcn = (+currData.lcn);
                }
            });
            tcns.push({label: sampleLabels[i], value: maxTcn});
            mcns.push({label: sampleLabels[i], value: matchingMcn});
            i++;
        });

        // Draw axes and labels
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "center")
            .style("text-overflow", "ellipsis")
            .attr("dx", "-1em")
            .attr("transform", "rotate(-35)");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("dx", "-3em")
            .attr("dy", "-4em")
            .style("text-anchor", "end");


        // Draw Lines
        const line = d3.line()
            .x(function(d) { return _x(d.label); })
            .y(function(d) { return _y(d.value); });

        svg.append("path")
            .datum(tcns) // 10. Binds data to the line
            .attr("class", "line") // Assign a class for styling
            .attr("d", line) // 11. Calls the line generator
            .style("fill", "none")
            .style("stroke", lineColor)
            .style("stroke-width", 1);

        svg.selectAll(".dot")
            .data(tcns)
            .enter().append("circle") // Uses the enter().append() method
            .style("fill", lineColor) // Assign a class for styling
            .attr("cx", function(d) { return _x(d.label) })
            .attr("cy", function(d) { return _y(d.value) })
            .attr("r", 5);

        // Draw dots for LCN
        svg.selectAll(".dot")
            .data(mcns)
            .enter().append("circle") // Uses the enter().append() method
            .style("fill", dotColor) // Assign a class for styling
            .attr("cx", function(d) { return _x(d.label) })
            .attr("cy", function(d) { return _y(d.value) })
            .attr("r", 5);

        // Draw legend
        svg.append("circle").attr("cx",270).attr("cy",25).attr("r", 4).style("fill", lineColor)
        svg.append("circle").attr("cx",270).attr("cy",50).attr("r", 4).style("fill", dotColor)
        svg.append("text").attr("x", 280).attr("y", 25).text("TCN").style("font-size", "15px").attr("alignment-baseline","middle")
        svg.append("text").attr("x", 280).attr("y", 50).text("MCN").style("font-size", "15px").attr("alignment-baseline","middle")
    }

    /*** OUTWARD FACING FUNCTIONS ***/

    /* Takes in array of maps with {label:, value:} entries and draws bars based on provided values.
       Providing an empty data array will zero out all bars.
       NOTE: newDataMap MUST have an identical number of entries as the original dataMap, in the exact same order
     */
    // chart.fillChart = function (newDataMap) {
    //     var svg = d3.select('#' + parentId).select('svg');
    //
    //     // Reset all columns to 0 if nothing in map
    //     if (newDataMap == null || newDataMap.length === 0) {
    //         svg.selectAll("rect")
    //             .transition()
    //             .duration(700)
    //             .attr('y', height)
    //             .attr('height', function () {
    //                 return height - _y(0);
    //             });
    //         svg.selectAll("text").remove();
    //     }
    //     else {
    //         newDataMap.forEach(function (dataBar) {
    //             var barId = "#bar_" + dataBar.label.replace(' ', '_');
    //             var labelId = "#label_" + dataBar.label.replace(' ', '_');
    //             var barHeight = dataBar.value ? dataBar.value : 0;
    //             var column = svg.select(barId);
    //             var label = svg.select(labelId);
    //
    //             if (column) {
    //                 column.style("fill", () => { return lineColor; })
    //                     .attr("y",  () => { return _y(0); })
    //                     .attr("height", 0)
    //                     .transition()
    //                     .duration(750)
    //                     .delay(function (d, i) {
    //                         return i * 250;
    //                     })
    //                     .attr("y", () => { return _y(barHeight); })
    //                     .attr("height",  () => { return height - _y(barHeight); })
    //             }
    //
    //             if (label) {
    //                 label.attr("y",  () => { return _y(0); })
    //                     .attr("height", 0)
    //                     .transition()
    //                     .duration(750)
    //                     .delay((d, i) => { return i * 250; })
    //                     .text(() => { return dataBar.value; })
    //                     .attr("y",  () => { return _y(barHeight) + .1; })
    //                     .attr("dy", "-.7em");
    //             }
    //         })
    //     }
    // };
    return chart;
}
