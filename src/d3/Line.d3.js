export default function lineD3(d3, vizSettings) {
    var dispatch = d3.dispatch("d3brush", "d3rendered", "d3region", "d3horizontallineclick");

    var KIND_LINE = "line";
    var KIND_AREA = "area";
    var kind = vizSettings.kind ? vizSettings.kind : KIND_LINE;

    var maxDepth = vizSettings.maxDepth ? vizSettings.maxDepth : null;

    var margin = vizSettings.margin ? vizSettings.margin : {left: 50, right: 20, top: 10, bottom: 30};

    var width = vizSettings.width ? vizSettings.width : 600 - margin.left - margin.right;
    var height = vizSettings.height ? vizSettings.height : 220 - margin.top - margin.bottom;
    var widthPercent = vizSettings.widthPercentage ? vizSettings.widthPercentage : "95%";
    var heightPercent = vizSettings.heightPercentage ? vizSettings.heightPercentage : "95%";

    var showXAxis = vizSettings.showXAxis ? vizSettings.showXAxis : true;
    var showYAxis = vizSettings.showYAxis ? vizSettings.showYAxis : true;
    var yTicks = vizSettings.yTicks ? vizSettings.yTicks : null;

    var container = null;
    var showBrush = false;
    var x = null;
    var y = null;
    var regionGlyph = null;
    var formatXTick = null;
    // var yAxisLine = false;
    var showTransition = true;
    var showGradient = true;
    var brushHeight = null;
    var xStart = null;
    var xEnd = null;

    var regionStart, regionEnd = null;

    // var formatter = d3.format(',');

    // var theData = null;

    // var pos = function (d) {
    //     return d.pos
    // };
    // var depth = function (d) {
    //     return d.depth
    // };

    // var getScreenCoords = function(x, y, ctm) {
    //   var xn = ctm.e + x*ctm.a;
    //   var yn = ctm.f + y*ctm.d;
    //   return { x: xn, y: yn };
    // }

    // var formatCircleText = function (pos, depth) {
    //     return pos + ',' + depth;
    // }

    // var showCircle = function (start, theDepth) {
    //     if (container == null) {
    //         return;
    //     }
    //     // Find the closest position in the data
    //     var d = null;
    //     if (theData) {
    //         for (var i = 0; i < theData.length - 1; i++) {
    //             if (start >= getPos(theData[i]) && start <= getPos(theData[i + 1])) {
    //                 d = theData[i];
    //                 break;
    //             }
    //         }
    //     }
    //
    //
    //     // Get the x for this position
    //     if (d) {
    //         var mousex = d3.round(x(pos(d)));
    //         var mousey = d3.round(y(depth(d)));
    //         var posx = d3.round(pos(d));
    //         var depthy = d3.round(depth(d));
    //
    //         var invertedx = x.invert(mousex);
    //         var invertedy = y.invert(mousey);
    //
    //         if (theDepth == null || theDepth == "") {
    //             theDepth = depthy.toString();
    //         }
    //         var circleText = formatCircleText(posx, theDepth);
    //         if (debug) {
    //             circleText += ' ' + posx + ':' + depthy + ' ' + invertedx + ':' + invertedy;
    //         }
    //
    //         var label = container.select(".circle-label");
    //         label.transition()
    //             .duration(200)
    //             .style("opacity", 1);
    //         label.attr("x", 0)
    //             .attr("y", margin.top + 5)
    //             .attr("class", "circle-label")
    //             .text(circleText);
    //
    //         container.select(".circle-label")
    //             .attr("x", function () {
    //                 var w = this.getBBox().width;
    //                 var x = mousex + margin.left - (w / 2) + 3;
    //
    //                 if (x + (w / 2) > innerWidth) {
    //                     // If the circle label is too far to the right,
    //                     // position it as far right as possible without
    //                     // truncating the text.
    //                     x = innerWidth - (w / 2);
    //                 } else if (x - (w / 2) < 0) {
    //                     // If the circle label is position out-of-bounds
    //                     // from the area, position the label to
    //                     // start at x position 0;
    //                     x = 0;
    //                 }
    //                 return x;
    //             });
    //
    //         var circle = container.select(".circle");
    //         circle.transition()
    //             .duration(200)
    //             .style("opacity", .7);
    //         circle.attr("cx", mousex + margin.left + 2)
    //             .attr("cy", mousey + margin.top)
    //             .attr("r", 3)
    //
    //     }
    // };
    //
    // var hideCircle = function () {
    //     if (container == null) {
    //         return;
    //     }
    //     container.select(".circle").transition()
    //         .duration(500)
    //         .style("opacity", 0);
    //
    //     container.select(".circle-label").transition()
    //         .duration(500)
    //         .style("opacity", 0);
    //
    // };

    function exports(selection) {
        selection.each(function (data) {
            // theData = data;

            container = d3.select(this);
            var svgData = d3.select(this)
                .selectAll("svg")
                .data([data]);

            var svg = svgData.enter()
                .append("svg")
                .attr("width", widthPercent)
                .attr("height", heightPercent)
                .attr('viewBox', "0 0 " + (parseInt(width) + margin.left + margin.right) + " " + parseInt(height))
                .attr("preserveAspectRatio", "none");

            // The chart dimensions could change after instantiation, so update viewbox dimensions
            // every time we draw the chart.
            d3.select(this).selectAll("svg")
                .filter(function () {
                    return this.parentNode === container.node();
                })
                .attr('viewBox', "0 0 " + (parseInt(width) + margin.left + margin.right) + " " + parseInt(height));

            // add a circle and label
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

            if (kind == KIND_AREA && showGradient) {
                var defs = svg.selectAll("defs").data([data]).enter()
                    .append("defs");

                var lg = defs.selectAll("linearGradient").data([data]).enter()
                    .append("linearGradient")
                    .attr("id", "area-chart-gradient")
                    .attr("x1", "0")
                    .attr("x2", "0")
                    .attr("y1", "0")
                    .attr("y2", "1");

                lg.selectAll("stop.area-chart-gradient-top").data([data]).enter()
                    .append("stop")
                    .attr("class", "area-chart-gradient-top")
                    .attr("offset", "60%");

                lg.selectAll("stop.area-chart-gradient-bottom").data([data]).enter()
                    .append("stop")
                    .attr("class", "area-chart-gradient-bottom")
                    .attr("offset", "100%");
            }


            var svgGroup = svg.selectAll("g.group").data([data]).enter()
                .append("g")
                .attr("class", "group")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            svgGroup.select("g.regions").remove();
            svgGroup.append("g")
                .attr("class", "regions");

            var innerWidth = width - margin.left - margin.right;
            x = d3.scaleLinear()
                .range([0, innerWidth]);

            var innerHeight = height - margin.top - margin.bottom;
            y = d3.scaleLinear()
                .range([innerHeight, 0]);


            if (xStart && xEnd) {
                x.domain([xStart, xEnd]);
            } else {
                x.domain(d3.extent(data, getPos));
            }
            var theMaxDepth = maxDepth ? Math.max(maxDepth, d3.max(data, getDepth)) : d3.max(data, getDepth);
            y.domain([0, theMaxDepth]);


            var brush = x.call(d3.brushX().on('end', function() { dispatch.call('d3brush', brush)}));
            // var brush = d3.svg.brush()
            //     .x(x)
            //     .on("brushend", function () {
            //         dispatch.d3brush(brush);
            //     });

            // var xAxis = d3.svg.axis()
            //     .scale(x)
            var xAxis = d3.axisBottom(x)
                .tickFormat(function (d) {
                    if ((d / 1000000) >= 1)
                        d = d / 1000000 + "M";
                    else if ((d / 1000) >= 1)
                        d = d / 1000 + "K";
                    return d;
                });
                // .orient("bottom");

            if (formatXTick) {
                xAxis.tickFormat(formatXTick);
            }


            // var yAxis = d3.svg.axis()
            //     .scale(y)
            var yAxis = d3.axisRight(y);
            // if (yAxisLine) {
            //     yAxis.innerTickSize(-innerWidth)
            //         .outerTickSize(0)
            //         .tickPadding(-22)
            //         .orient("left");
            // } else {
            //     yAxis.orient("right");
            // }

            if (yTicks && yTicks == 3) {
                var newTickValues = [];
                newTickValues.push(0);
                newTickValues.push(Math.round(y.domain()[1] / 2));
                newTickValues.push(y.domain()[1])
                yAxis.tickValues(newTickValues);
            } else if (yTicks) {
                xAxis.ticks(yTicks);
            }
            if (yTickFormatter) {
                yAxis.tickFormat(yTickFormatter);
            }


            var line = d3.line()
                .x(function (d) {
                    return x(getPos(d));
                })
                .y(function (d) {
                    return y(getDepth(d));
                })
                .curve(d3.curveLinear);

            var area;
            if (kind == KIND_AREA) {
                area = d3.area()
                    .x(function (d) {
                        return x(getPos(d));
                    })
                    .y0(innerHeight)
                    .y1(function (d) {
                        return y(getDepth(d));
                    })
                    .curve(d3.curveLinear);
            }


            svgGroup = svg.selectAll("g.group")
            svgGroup.selectAll("g.x").remove();
            if (showXAxis) {
                svgGroup.selectAll("g.x").data([data]).enter()
                    .append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + innerHeight + ")")
                    .call(xAxis);
            }

            svgGroup.selectAll("g.y").remove();
            if (showYAxis) {
                svgGroup.selectAll("g.y").data([data]).enter()
                    .append("g")
                    .attr("class", "y axis")
                    .call(yAxis);
            }

            // not sure why, but second time through, the svgGroup is a
            // "placeholder", so we will just select the group again
            // to remove the path and then add the new one.
            svgGroup = svg.selectAll("g.group")
            svgGroup.select("#line-chart-path").remove();

            var linePath = svgGroup.append("path")
                .datum(data)
                .attr("id", "line-chart-path")
                .attr("class", "line")
                .attr("d", line(data));

            if (showTransition) {
                linePath.transition()
                    .duration(1000)
                    .attrTween('d', function () {
                        {
                            var interpolate = d3.scale.quantile()
                                .domain([0, 1])
                                .range(d3.range(1, data.length + 1));

                            return function (t) {
                                var interpolatedArea = data.slice(0, interpolate(t));
                                return line(interpolatedArea);
                            }
                        }
                    })
                    .each("end", function () {
                        dispatch.d3rendered();
                    });

            }


            if (kind == KIND_AREA) {
                svgGroup.select("#area-chart-path").remove();
                var areaPath = svgGroup.append("path")
                    .datum(data)
                    .attr("id", "area-chart-path")
                    .attr("d", area(data));

                if (showGradient) {
                    areaPath.style("fill", "url(#area-chart-gradient)");
                }

                if (showTransition) {
                    areaPath.transition()
                        .duration(1000)
                        .attrTween('d', function () {
                            {
                                var interpolate = d3.scale.quantile()
                                    .domain([0, 1])
                                    .range(d3.range(1, data.length + 1));

                                return function (t) {
                                    var interpolatedArea = data.slice(0, interpolate(t));
                                    return area(interpolatedArea);
                                }
                            }
                        });

                }
            }

            let brushY = 0;
            if (showBrush) {
                if (brushHeight == null) {
                    brushHeight = innerHeight;
                    brushY = -6;
                } else {
                    brushY = 0 - (brushHeight / 2);
                }
                svgGroup.append("g")
                    .attr("class", "x brush")
                    .call(brush)
                    .selectAll("rect")
                    .attr("y", brushY)
                    .attr("height", brushHeight);
            }

            if (!showTransition) {
                dispatch.d3rendered();
            }
        });
    }

    /*** OUTWARD FACING FUNCTIONS ***/

    exports.updateSize = function(options) {
        xStart = options.xStart;
        xEnd = options.xEnd;
        maxDepth = options.maxDepth;
        width = options.width;
        height = options.height;
    }

    exports.showHorizontalLine = function (yValue, label, clazz) {
        if (container == null) {
            return;
        }
        if (regionStart && regionEnd) {
            x.domain([regionStart, regionEnd]);
        }

        container.select("svg g.group").selectAll("g." + clazz).remove();
        var lineGroup = container.select("svg g.group")
            .append("g")
            .attr("transform", "translate(0," + Math.round(y(yValue)) + ")")
            .attr("class", clazz);
        lineGroup.append("line")
            .attr("x1", Math.round(x(x.domain()[0])))
            .attr("x2", Math.round(x(x.domain()[1])))
            .attr("y1", 0)
            .attr("y2", 0)
        if (label) {
            lineGroup.append("text")
                .attr("x", Math.round(x(x.domain()[1])))
                .attr("y", 3)
                .attr("text-anchor", "end")
                .text(label)
                .on("click", function () {
                    var label = d3.select(this).text();
                    dispatch.d3horizontallineclick(label);
                })


        }
    };

    exports.highlightRegions = function (regions, options, regionStart, regionEnd, regionHeight) {
        if (container == null) {
            return;
        }

        if (regionStart && regionEnd) {
            x.domain([regionStart, regionEnd]);
            container.select("svg g.group g.regions").selectAll(".region").remove();
            container.select("svg g.group").selectAll(".region-glyph").remove();
        }

        var minRegionWidth = options && options.hasOwnProperty('minHeight') ? options.minHeight : 1;
        regions = container.select("svg g.group g.regions").selectAll(".region").data(regions);
        var theY = regionHeight ? (Math.round(y(regionHeight))) : (height - margin.top - margin.bottom);
        var theHeight = regionHeight ? ((height - margin.top - margin.bottom) - theY) : 0;
        regions.enter();
        regions.enter()
            .append("rect")
            .attr("class", "region")
            .attr("rx", 1)
            .attr("ry", 1)
            .attr("x", function (d) {
                return Math.round(x(d.start))
            })
            .attr("width", function (d) {
                return Math.max(minRegionWidth, Math.round(x(d.end) - x(d.start)))
            })
            .attr("y", theY)
            .attr("height", theHeight);
        regions.exit().remove();


        container.select("svg g.group g.regions").selectAll(".region").each(function (d, i) {
            var me = this;
            var regionX = Math.round(x(d.start));
            var regionWidth = Math.max(minRegionWidth, Math.round(x(d.end) - x(d.start)));
            if (regionGlyph) {
                regionGlyph.call(me, d, i, regionX + regionWidth / 2);
            }
        });

        container.select("svg g.group g.regions").selectAll(".region, .region-glyph")
            .on("mouseover", function (d) {
                // show the tooltip
                var featureObject = d3.select(this);
                dispatch.d3region(featureObject, d, false);
            })
            .on("mouseout", function () {
                dispatch.d3region();
            })
            .on("click", function (d) {
                // show the tooltip
                var featureObject = d3.select(this);
                dispatch.d3region(featureObject, d, true);
            })
    };

    exports.getDispatch = function () {
        return dispatch;
    };

    /*** INTERNAL HELPER FUNCTIONS ***/
    function getPos(d) {
        return d[0];
    }

    function getDepth(d) {
        return d[1];
    }

    function yTickFormatter(val) {
        if (val === 0) {
            return '';
        } else {
            return val + 'x';
        }
    }

    // function formatCircleText(pos, depth) {
    //     return depth + 'x';
    // }

    // todo: leaving out for now...
    // function regionGlyph(d, i, regionX) {
    //     var parent = d3.select(parentNode);
    //     return regionGlyph(d, parent, regionX);
    // }

    // .pos(function (d) {
    //     return d[0]
    // })
    // .depth(function (d) {
    //     return d[1]
    // })
    // .maxDepth(this.maxDepth)
    // .yTickFormat(function (val) {
    //     if (val === 0) {
    //         return "";
    //     } else {
    //         return val + "x";
    //     }
    // })
    // .formatCircleText(function (pos, depth) {
    //     return depth + 'x';
    // })
    // .regionGlyph(function (d, i, regionX) {
    //     var parent = this.d3.select(this.parentNode);
    //     return self.regionGlyph(d, parent, regionX);
    // });


    // exports.showCircle = function (_) {
    //     if (!arguments.length) return showCircle;
    //     showCircle = _;
    //     return exports;
    // };
    //
    // exports.hideCircle = function (_) {
    //     if (!arguments.length) return hideCircle;
    //     hideCircle = _;
    //     return exports;
    // };
    //
    // exports.regionGlyph = function (_) {
    //     if (!arguments.length) return regionGlyph;
    //     regionGlyph = _;
    //     return exports;
    // };
    //
    // exports.margin = function (_) {
    //     if (!arguments.length) return margin;
    //     margin = _;
    //     return exports;
    // };
    //
    // exports.width = function (_) {
    //     if (!arguments.length) return width;
    //     width = _;
    //     return exports;
    // };
    //
    // exports.height = function (_) {
    //     if (!arguments.length) return height;
    //     height = _;
    //     return exports;
    // };
    //
    // exports.widthPercent = function (_) {
    //     if (!arguments.length) return widthPercent;
    //     widthPercent = _;
    //     return exports;
    // };
    //
    // exports.heightPercent = function (_) {
    //     if (!arguments.length) return heightPercent;
    //     heightPercent = _;
    //     return exports;
    // };
    //
    // exports.brush = function (_) {
    //     if (!arguments.length) return brush;
    //     brush = _;
    //     return exports;
    // };
    //
    // exports.pos = function (_) {
    //     if (!arguments.length) return pos;
    //     pos = _;
    //     return exports;
    // };
    //
    // exports.depth = function (_) {
    //     if (!arguments.length) return depth;
    //     depth = _;
    //     return exports;
    // };
    //
    // exports.kind = function (_) {
    //     if (!arguments.length) return kind;
    //     kind = _;
    //     return exports;
    // };
    //
    // exports.maxDepth = function (_) {
    //     if (!arguments.length) return maxDepth;
    //     maxDepth = _;
    //     return exports;
    // };
    //
    // exports.showXAxis = function (_) {
    //     if (!arguments.length) return showXAxis;
    //     showXAxis = _;
    //     return exports;
    // };
    //
    // exports.showYAxis = function (_) {
    //     if (!arguments.length) return showYAxis;
    //     showYAxis = _;
    //     return exports;
    // };
    //
    // exports.yAxisLine = function (_) {
    //     if (!arguments.length) return yAxisLine;
    //     yAxisLine = _;
    //     return exports;
    // };
    //
    // exports.yTicks = function (_) {
    //     if (!arguments.length) return yTicks;
    //     yTicks = _;
    //     return exports;
    // };
    //
    // exports.yTickFormat = function (_) {
    //     if (!arguments.length) return yTickFormat;
    //     yTickFormat = _;
    //     return exports;
    // };
    //
    // exports.formatXTick = function (_) {
    //     if (!arguments.length) return formatXTick;
    //     formatXTick = _;
    //     return exports;
    // };
    //
    // exports.showTransition = function (_) {
    //     if (!arguments.length) return showTransition;
    //     showTransition = _;
    //     return exports;
    // };
    //
    // exports.showGradient = function (_) {
    //     if (!arguments.length) return showGradient;
    //     showGradient = _;
    //     return exports;
    // };
    //
    // exports.showBrush = function (_) {
    //     if (!arguments.length) return showBrush;
    //     showBrush = _;
    //     return exports;
    // };
    //
    // exports.brushHeight = function (_) {
    //     if (!arguments.length) return brushHeight;
    //     brushHeight = _;
    //     return exports;
    // };
    //
    // exports.xStart = function (_) {
    //     if (!arguments.length) return xStart;
    //     xStart = _;
    //     return exports;
    // };
    //
    // exports.xEnd = function (_) {
    //     if (!arguments.length) return xEnd;
    //     xEnd = _;
    //     return exports;
    // };
    //
    // exports.formatCircleText = function (_) {
    //     if (!arguments.length) return formatCircleText;
    //     formatCircleText = _;
    //     return exports;
    // };

    // This adds the "on" methods to our custom exports
    // d3.rebind(exports, dispatch, "on");
    return exports;
}