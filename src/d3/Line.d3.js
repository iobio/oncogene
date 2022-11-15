export default function lineD3(d3, vizSettings) {
    var dispatch = d3.dispatch("d3brush", "d3rendered", "d3region", "d3horizontallineclick");
    var debug = false;

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

    var container = null;   // todo: think this is circle problem
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

    var theData = null;

    var sampleId = vizSettings.sampleId ? vizSettings.sampleId : '';

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

    function exports(selection) {
        selection.each(function (data) {
            theData = data;
            container = d3.select(this);
            var svgData = d3.select(this)
                .selectAll("svg")
                .data([data]);

            var svg = svgData.enter()
                .append("svg")
                .attr("width", widthPercent)
                .attr("height", heightPercent)
                .attr('viewBox', "0 0 " + (parseInt(width) + margin.left + margin.right) + " " + parseInt(height))
                .attr("preserveAspectRatio", "none")
                .merge(svgData);

            // The chart dimensions could change after instantiation, so update viewbox dimensions
            // every time we draw the chart.
            d3.select(this).selectAll("svg")
                .filter(function () {
                    return this.parentNode === container.node();
                })
                .attr('viewBox', "0 0 " + (parseInt(width) + margin.left + margin.right) + " " + parseInt(height));

            // add a circle and label - todo: old - get rid of
            // svg.selectAll(".circle").data([0])
            //     .enter()
            //     .append('circle')
            //     .attr("class", "circle")
            //     .attr("r", 3)
            //     .style("opacity", 0);
            // svg.selectAll(".circle-label").data([0])
            //     .enter()
            //     .append('text')
            //     .attr("class", "circle-label")
            //     .attr("x", 0)
            //     .attr("y", 0)
            //     .style("opacity", 0);

            // todo: get rid of - variant code

            // var circleClazz = '.' + clazz + '.circle';
            // if (svg.selectAll(circleClazz).empty()) {
            //     svg.selectAll(circleClazz).data([0])
            //         .join('circle')
            //         .attr("class", clazz + " circle")
            //         .attr("cx", 0)
            //         .attr("cy", 0)
            //         .attr("r", variantHeight + 2)
            //         .style("opacity", 0);
            // }

            // add a circle and arrows for 'hover' event and 'pinned' event
            ['hover', 'pinned'].forEach(function(clazz) {
                var circleClazz = '.' + clazz + '.depth';
                var labelClazz = '.' + clazz + '.depth-label';
                svg.selectAll(circleClazz).data([0])
                    .enter()
                    .append('circle')
                    .attr("class", clazz + " depth")
                    .attr("r", 3)
                    .style("opacity", 0);
                svg.selectAll(labelClazz).data([0])
                    .enter()
                    .append('text')
                    .attr("class", clazz + " depth-label")
                    .attr("x", 0)
                    .attr("y", 0)
                    .style("opacity", 0);
            });

            if (kind == KIND_AREA && showGradient) {
                var defs = svg.selectAll("defs").data([data]).enter()
                    .append("defs");

                var lg = defs.selectAll("linearGradient").data([data]).enter()
                    .append("linearGradient")
                    .attr("id", ("area-chart-gradient-" + sampleId))
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

            var yAxis = d3.axisRight(y);
            // if (yAxisLine) {
            //     yAxis.innerTickSize(-innerWidth)
            //         .outerTickSize(0)
            //         .tickPadding(-22)
            //         .orient("left");
            // } else {
            //     yAxis.orient("right");
            // }

            if (yTicks && yTicks === 3) {
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


            svgGroup = svg.selectAll("g.group");
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
            svgGroup = svg.selectAll("g.group");
            svgGroup.select("#line-chart-path").remove();

            var linePath = svgGroup.append("path")
                .datum(data)
                .attr("id", "line-chart-path")
                .attr("class", "line")
                .attr("d", line);
                // .attr("d", line(data));

            if (showTransition) {
                linePath.transition()
                    .duration(1000)
                    .attrTween('d', function () {
                        {
                            var interpolate = d3.scaleQuantile()
                                .domain([0, 1])
                                .range(d3.range(1, data.length + 1));

                            return function (t) {
                                var interpolatedArea = data.slice(0, interpolate(t));
                                return line(interpolatedArea);
                            }
                        }
                    })
                    // .each("end", function () {
                    //     dispatch.d3rendered();
                    // });

            }


            if (kind == KIND_AREA) {
                svgGroup.select("#area-chart-path").remove();
                var areaPath = svgGroup.append("path")
                    .datum(data)
                    .attr("id", "area-chart-path")
                    .attr("d", area(data));

                if (showGradient) {
                    areaPath.style("fill", "url(#area-chart-gradient-" + sampleId + ")");
                }

                if (showTransition) {
                    areaPath.transition()
                        .duration(1000)
                        .attrTween('d', function () {
                            {
                                var interpolate = d3.scaleQuantile()
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
    };

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

    exports.showCircle = function (start, theDepth, pinned) {
        if (container == null) {
            return;
        }

        // Get pinned class
        const pinPrefix = pinned? 'pinned' : 'hover';
        const depthClazz =  '.' + pinPrefix + '.depth'
        const labelClazz = '.' + pinPrefix + '.depth-label';

        // Find the closest position in the data
        var d = null;
        if (theData) {
            for (var i = 0; i < theData.length - 1; i++) {
                if (start >= getPos(theData[i]) && start <= getPos(theData[i + 1])) {
                    d = theData[i];
                    break;
                }
            }
        }

        // Get the x for this position
        if (d) {
            var mousex = Math.round(x(getPos(d)));
            var mousey = Math.round(y(getDepth(d)));
            var posx = Math.round(getPos(d));
            var depthy = Math.round(getDepth(d));

            var invertedx = x.invert(mousex);
            var invertedy = y.invert(mousey);

            if (theDepth == null || theDepth === "") {
                theDepth = depthy.toString();
            }
            var circleText = formatCircleText(posx, theDepth);
            if (debug) {
                circleText += ' ' + posx + ':' + depthy + ' ' + invertedx + ':' + invertedy;
            }

            var label = container.select(labelClazz);
            label.transition()
                .duration(200)
                .style("opacity", 1);
            label.attr("x", 0)
                .attr("y", margin.top + 5)
                .attr("class", pinPrefix + ' depth-label')
                .text(circleText);

            container.select(labelClazz)
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

            var circle = container.select('circle' + depthClazz);
            circle.transition()
                .duration(200)
                .style("opacity", function(pinned) {return pinned ? 1 : .7});
            circle.attr("cx", mousex + margin.left + 2)
                .attr("cy", mousey + margin.top)
                .attr("r", 3)
        }
    };

    exports.hideCircle = function (pinned) {
        if (container == null) {
            return;
        }
        const circleClazz = pinned ? '.pinned.depth' : '.hover.depth';
        const labelClazz = pinned ? '.pinned.depth-label' : '.hover.depth-label';

        container.selectAll(circleClazz).transition()
            .duration(500)
            .style("opacity", 0);

        container.select(labelClazz).transition()
            .duration(500)
            .style("opacity", 0);
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

    function formatCircleText(pos, depth) {
        return depth + 'x';
    }

    return exports;
}