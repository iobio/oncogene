/*
SJG Jan2019
Adapted from http://bl.ocks.org/d3noob/8952219

This is a bar chart that initially displays just the graph outline, then populates when fillChart is called,
to allow a dynamic rendering of chart fill.

NOTE: initial dataMap and newDataMap must contain an IDENTICAL number of entries IN THE SAME EXACT ORDER
*/
export default function barChart(d3) {
    var dispatch = d3.dispatch("d3rendered");

    // Instance variables
    var parentId,
        barColor = '#6c94b7',
        comingSoonFlag = false,
        yValueMax = 575,
        yTicks = 0;

    // Private variables (can be made public if necessary except for _x and _y)
    var _x, _y,
        margin = {top: 10, right: 0, bottom: 40, left: 50},
        height = 200 - margin.bottom - margin.top,
        width = 300 - margin.left - margin.right,
        roundedCorners = 2;


    /* Takes in array of maps with {label:, value:} entries and draws bars based on provided values.
       Providing an empty data array will zero out all bars.
       NOTE: newDataMap MUST have an identical number of entries as the original dataMap, in the exact same order
     */
    var fillChart = function (newDataMap) {
        var svg = d3.select('#' + parentId).select('svg');

        // Reset all columns to 0 if nothing in map
        if (newDataMap == null || newDataMap.length === 0) {
            svg.selectAll("rect")
                .transition()
                .duration(700)
                .attr('y', height)
                .attr('height', function (d) {
                    return height - _y(0);
                });
        }
        else {
            newDataMap.forEach(function (dataBar) {
                var barId = "#bar_" + dataBar.label.replace(' ', '_');
                var barHeight = dataBar.value ? dataBar.value : 0;
                var column = svg.select(barId);

                if (column) {
                    column.transition()
                        .duration(700)
                        .style('fill', barColor)
                        .attr("y", function (d) {
                            return _y(barHeight);
                        })
                        .attr('height', function (d) {
                            return height - _y(barHeight);
                        });
                }
            })
        }
    };

    // var redrawYAxis = function (newYValueMax, newYValueTicks = 5) {
    //     _y = d3.scale.linear().range([height, 0]);
    //
    //     var yAxis = d3.svg.axis()
    //         .scale(_y)
    //         .orient("left")
    //         .ticks(newYValueTicks);
    //
    //     _y.domain([0, newYValueMax]);
    //
    //     var currAxis = d3.select('#' + parentId).select('svg').select('y axis');
    //     currAxis.transition()
    //         .duration(700)
    //         .style("opacity", 1);
    // };

    /* Draws outline of chart and axes */
    function chart(dataMap) {
        var svg = d3.select('#' + parentId).append('svg')
            .attr('height', height + margin.top + margin.bottom)
            .attr('width', width + margin.left + margin.right)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Define axes data
        _x = d3.scale.ordinal().rangeRoundBands([0, width], .05);
        _y = d3.scale.linear().range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(_x)
            .orient("bottom, center");

        // d3.svg.axis()
        //     .tickFormat(function(e){
        //         if(Math.floor(e) != e)
        //         {
        //             return;
        //         }
        //
        //         return e;
        //     });

        var yAxis = d3.svg.axis()
            .scale(_y)
            .orient("left")
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
        _y.domain([0, yValueMax]);

        // Draw axes and labels
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.3em")
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
                .attr("width", _x.rangeBand())
                .attr("y", function (d) {
                    return _y(d.value);
                })
                .attr("height", function (d) {
                    return height - _y(d.value);
                });
        }

        dispatch.d3rendered();
    }

    /* Getters and setters */
    chart.fillChart = function (_) {
        if (!arguments.length) {
            return fillChart;
        }
        fillChart = _;
        return chart;
    };

    chart.redrawYAxis = function (_) {
        if (!arguments.length) {
            return redrawYAxis;
        }
        redrawYAxis = _;
        return chart;
    }

    chart.parentId = function (_) {
        if (!arguments.length) {
            return parentId;
        }
        parentId = _;
        return chart;
    };

    chart.yValueMax = function (_) {
        if (!arguments.length) {
            return yValueMax;
        }
        yValueMax = _;
        return chart;
    };

    chart.yTicks = function (_) {
        if (!arguments.length) {
            return yTicks;
        }
        yTicks = _;
        return chart;
    };

    chart.barColor = function (_) {
        if (!arguments.length) {
            return barColor;
        }
        barColor = _;
        return chart;
    };

    chart.comingSoonFlag = function (_) {
        if (!arguments.length) {
            return comingSoonFlag;
        }
        comingSoonFlag = _;
        return chart;
    };

    // d3.rebind(chart, dispatch, "on");
    return chart;
}
