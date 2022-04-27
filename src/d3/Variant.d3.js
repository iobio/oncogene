import { event as currentEvent } from 'd3';

export default function variantD3(d3, vizSettings) {
    /**** CONSTRUCTOR ****/

    // Don't throw null exception
    if (!vizSettings) {
        console.log('WARNING: no vizSettings argument provided to variant.d3.');
        vizSettings = {};
    }
    var dispatch = d3.dispatch("d3brush", "d3outsideclick", "d3click", "d3mouseover", "d3mouseout", "d3glyphmouseover", "d3glyphmouseout");

    // Viz-level sizing
    var margin = vizSettings.margin ? vizSettings.margin : {top: 30, right: 0, bottom: 20, left: 110};
    var width = 800,
        height = 100,
        widthPercent = vizSettings.widthPercent ? vizSettings.widthPercent : '100%',
        heightPercent = vizSettings.heightPercent ? vizSettings.heightPercent : '100%';

    // Glyph-level sizing
    var variantHeight = vizSettings.variantHeight ? vizSettings.variantHeight : 8,
        borderRadius = vizSettings.borderRadius ? vizSettings.borderRadius : 1,
        verticalLayers = vizSettings.verticalLayers ? vizSettings.verticalLayers : 1,
        verticalPadding = vizSettings.verticalPadding ? vizSettings.verticalPadding : 2,
        lowestWidth = vizSettings.lowestWidth ? vizSettings.lowestWidth : 3;

    // Scales, Axes, Deltas
    var x = vizSettings.x ? vizSettings.x : d3.scaleLinear(),
        y = vizSettings.y ? vizSettings.y : d3.scaleLinear();
    var xTickFormat = vizSettings.xTickFormat ? vizSettings.xTickFormat : tickFormatter;
    var xAxis = vizSettings.xAxis ? vizSettings.xAxis : d3.axisTop(x).tickFormat(xTickFormat);
    var clazz = vizSettings.clazz ? vizSettings.clazz : null;

    // Viz-level flags
    var showXAxis = vizSettings.showXAxis ? vizSettings.showXAxis : false,
        showBrush = vizSettings.showBrush ? vizSettings.showBrush : false,
        brushHeight = vizSettings.brushHeight ? vizSettings.brushHeight : null,
        showTransition = vizSettings.showTransition ? vizSettings.showTransition : true,
        dividerLevel = vizSettings.dividerLevel ? vizSettings.dividerLevel : null;


    /**** CHART DRAWING ****/

    function chart(chartInfo) {
        // Don't throw null exception
        if (!chartInfo) {
            console.log('WARNING: chartInfo parameters not provided to variant.d3 - could not draw variant chart.');
        }
        // Required arguments
        var regionStart = chartInfo.regionStart,
            regionEnd = chartInfo.regionEnd;
        var selection = chartInfo.selection;

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
        height = verticalLayers * (variantHeight + verticalPadding);
        height += (variantHeight + verticalPadding);

        // Account for the margin when we are showing the xAxis
        if (showXAxis) {
            height += margin.bottom;
        }
        if (dividerLevel) {
            height += (variantHeight + verticalPadding);
        }
        var dividerY = dividerLevel ? height - ((dividerLevel + 1) * (variantHeight + verticalPadding)) : null;


        // Determine inner height (w/o margins)
        var innerHeight = height - margin.top - margin.bottom;

        selection.each(function(data) {
            // Set svg element
            var container = d3.select(this).classed('ibo-variant', true);
            container.selectAll("svg").remove();

            if (data && data.length > 0 && data[0] && data[0].features) {

                // Update the x-scale.
                if (regionStart && regionEnd) {
                    x.domain([regionStart, regionEnd]);
                } else {
                    x.domain([d3.min(data, function (d) {
                        return d3.min(d.features, function (f) {
                            return parseInt(f.start);
                        })
                    }),
                        d3.max(data, function (d) {
                            return d3.max(d.features, function (f) {
                                return parseInt(f.end);
                            })
                        })
                    ]);

                }
                x.range([0, width - margin.left - margin.right]);

                // Update the y-scale.
                y.domain([0, data.length]);
                y.range([innerHeight, 0]);

                var circleSymbolAdjust = variantHeight >=16 ? 0 : variantHeight <= 8 ? 1 : 2;

                var symbolScaleCircle = d3.scaleOrdinal()
                    .domain([3, 4, 5, 6, 7, 8, 10, 12, 14, 16])
                    .range([9, 15, 25, 38, 54, 58, 64, 70, 100, 130]);
                var symbolSizeCircle = symbolScaleCircle(variantHeight + circleSymbolAdjust);

                var symbolScale = d3.scaleOrdinal()
                    .domain([3, 4, 5, 6, 7, 8, 10, 12, 14, 16])
                    .range([9, 15, 20, 25, 32, 58, 70, 100, 130, 160]);
                var symbolSize = symbolScale(variantHeight);

                // Brush
                var brush = x.call(d3.brushX().on('end', function() { dispatch.call('d3brush', brush)}));

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
                var svg = container.selectAll('svg');

                // The chart dimensions could change after instantiation, so update viewbox dimensions
                // every time we draw the chart.
                d3.select(this).selectAll("svg")
                    .filter(function () {
                        return this.parentNode === container.node();
                    })
                    .attr('viewBox', "0 0 " + parseInt(width + margin.left + margin.right) + " " + parseInt(height + margin.top + margin.bottom));


                // Add grouping for flagged variants
                svg.select("g.flagged-variants").remove();
                svg.append("g")
                    .attr("class", "flagged-variants");


                // Create the X-axis.
                g.selectAll(".x.axis").remove();
                if (showXAxis) {
                    g.append("g")
                        .attr("class", "x axis")
                        .style('font-size', '14px')
                        .attr("transform", "translate(0," + (y.range()[0] + margin.bottom - margin.top) + ")")
                        .call(xAxis);
                }


                // Create dividing line
                g.selectAll(".divider").remove();
                if (dividerLevel) {
                    var divider = g.append("g")
                        .attr("class", "divider")
                        .attr("transform", "translate(0," + dividerY + ")");
                    divider.append("line").attr("class", "dashed")
                        .attr("x1", 0)
                        .attr("x2", width)
                        .attr("y", 0);
                    divider.append("text").attr("x", width / 2)
                        .attr("y", 20)
                        .text("Heterozygous");
                    divider.append("text").attr("x", width / 2)
                        .attr("y", -10)
                        .text("Homozygous");

                }

                // add tooltip div
                container.selectAll(".tooltip").data([0])
                    .join('div')
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                // Start variant model
                // add elements
                var track = g.selectAll('.track.snp')
                    .data(data)
                    .join('g')
                    .attr('class', 'track snp')
                    .attr('transform', function (d, i) {
                        return "translate(0," + y(i + 1) + ")"
                    });

                var trackindel = g.selectAll('.track.indel')
                    .data(data)
                    .join('g')
                    .attr('class', 'track indel')
                    .attr('transform', function (d, i) {
                        return "translate(0," + y(i + 1) + ")"
                    });

                var brushY = 0;
                if (showBrush) {
                    if (brushHeight == null) {
                        brushHeight = variantHeight;
                    }
                    track.selectAll("g.x.brush").data([0])
                        .join("g")
                        .attr("class", "x brush")
                        .call(brush)
                        .selectAll("rect")
                        .attr("y", brushY)
                        .attr("height", brushHeight);
                }

                track.selectAll('.variant').remove();
                trackindel.selectAll('.variant').remove();

                // precompute y-coord for SNPs and INDELs to use same for w/ and w/o transition
                var computedSnpY = function(d) {
                    return height - ((d.level + 1) * (variantHeight + verticalPadding));
                };
                var indelOffset = (variantHeight >= 16 ? 0 : variantHeight <= 8 ? 2 : 3) * 2;
                var computedIndelY = function(d) {
                    return height - ((d.level + 1) * (variantHeight + verticalPadding) - indelOffset);
                };


                // snps
                track.selectAll('.variant')
                    .data(function (d) {
                        return d['features'].filter(function (d) {
                            return d.type.toUpperCase() === 'SNP' || d.type.toUpperCase() === 'MNP';
                        });
                    }).join('rect')
                    .attr('class', function (d) {
                        return clazz(d);
                    })
                    .attr('id', function (d) {
                        return d.id;
                    })
                    .attr('rx', borderRadius)
                    .attr('ry', borderRadius)
                    .attr('x', function (d) {
                        return Math.round(x(d.start) - (variantHeight / 2) + (variantHeight / 4));
                    })
                    .attr('width', function () {
                        return showTransition ? 0 : variantHeight;
                    })
                    .attr('y', function (d) {
                        return showTransition ? 0 : computedSnpY(d);
                    })
                    .attr('height', variantHeight);


                // insertions, deletions, complex
                trackindel.selectAll('.variant').data(function (d) {
                    var indels = d['features'].filter(function (d) {
                        return d.type.toUpperCase() === 'DEL'
                            || d.type.toUpperCase() === 'INS'
                            || d.type.toUpperCase() === 'COMPLEX';
                    });
                    return indels;
                }).join('path')
                    .attr("d", function (d) {
                        return d3.symbol()
                            .size(symbolSize)
                            .type(getSymbol(d))();
                    })
                    .attr('class', function (d) {
                        return clazz(d);
                    })
                    .attr('id', function (d) {
                        return d.id;
                    })
                    .attr("transform", function (d) {
                        var xCoord = x(d.start) + 2;
                        var yCoord = showTransition ? 0 : computedIndelY(d);
                        var tx = "translate(" + xCoord + "," + yCoord + ")";
                        return tx;
                    });

                // exit
                track.exit().remove();
                trackindel.exit().remove();

                // update
                if (showTransition) {
                    var interval = 1000 / data[0].features.length;

                    track.transition()
                        .duration(1000)
                        .attr('transform', function (d, i) {
                            return "translate(0," + y(i + 1) + ")"
                        });

                    track.selectAll('.variant.snp, .variant.mnp').sort(function (a, b) {
                        return parseInt(a.start) - parseInt(b.start)
                    })
                        .transition()
                        .duration(1000)
                        .delay(function (d, i) {
                            return i * interval;
                        })
                        .ease(d3.easeBounce)
                        .attr('x', function (d) {
                            return Math.round(x(d.start) - (variantHeight / 2) + (variantHeight / 4));
                        })
                        .attr('width', function () {
                            return variantHeight;
                        })
                        .attr('y', function (d) {
                            return computedSnpY(d);
                        })
                        .attr('height', function () {
                            return variantHeight;
                        });

                    trackindel.selectAll('.variant.del')
                        .transition()
                        .duration(1000)
                        .delay(function (d, i) {
                            return i * interval;
                        })
                        .ease(d3.easeBounce)
                        .attr("d", function (d) {
                            return d3.symbol()
                                .size(symbolSize)
                                .type(getSymbol(d))();
                        })
                        .attr("transform", function (d) {
                            var xCoord = x(d.start) + 2;
                            var yCoord = computedIndelY(d);
                            var tx = "translate(" + xCoord + "," + yCoord + ")";
                            return tx;
                        });

                    trackindel.selectAll('.variant.ins')
                        .transition()
                        .duration(1000)
                        .delay(function (d, i) {
                            return i * interval;
                        })
                        .ease(d3.easeBounce)
                        .attr("d", function (d) {
                            return d3.symbol()
                                .size(symbolSizeCircle)
                                .type(getSymbol(d))();
                        })
                        .attr("transform", function (d) {
                            var xCoord = x(d.start) + 2;
                            var yCoord = computedIndelY(d);
                            var tx = "translate(" + xCoord + "," + yCoord + ")";
                            return tx;
                        });

                    trackindel.selectAll('.variant.complex')
                        .transition()
                        .duration(1000)
                        .delay(function (d, i) {
                            return i * interval;
                        })
                        .attr("d", function (d) {
                            return d3.symbol()
                                .size(symbolSize)
                                .type(getSymbol(d))();
                        })
                        .attr("transform", function (d) {
                            var xCoord = x(d.start) + 2;
                            var yCoord = computedIndelY(d);
                            var tx = "translate(" + xCoord + "," + yCoord + ")";
                            return tx;
                        });
                }

                // Add listeners after adjusting symbol width, etc
                g.selectAll('.variant')
                    .on("click", function (d) {
                        let xCoord = d ? x(d.start) + 2 : null;
                        dispatch.call('d3click', this, d, xCoord);
                        // todo: is stop prop here culprit for turning off highlight
                        currentEvent.stopPropagation();
                    })
                    .on("mouseover", function (d) {
                        dispatch.call('d3mouseover', this, d);
                    })
                    .on("mouseout", function () {
                        dispatch.call('d3mouseout');
                    });

                // Generate the x axis
                if (showXAxis) {
                    if (xTickFormat) {
                        xAxis.tickFormat(xTickFormat);
                    }
                    svg.select(".x.axis").transition()
                        .duration(200)
                        .call(xAxis);
                }

                // add a circle and arrows for 'hover' event and 'pinned' event
                ['hover', 'pinned'].forEach(function(clazz) {
                    var circleClazz = '.' + clazz + '.circle';
                    if (svg.selectAll(circleClazz).empty()) {
                        svg.selectAll(circleClazz).data([0])
                            .join('circle')
                            .attr("class", clazz + " circle")
                            .attr("cx", 0)
                            .attr("cy", 0)
                            .attr("r", variantHeight + 2)
                            .style("opacity", 0);
                    }

                    var arrowClazz = 'g.' + clazz + '.arrow';
                    if (svg.selectAll(arrowClazz).empty()) {
                        var garrow = svg.selectAll(arrowClazz).data([0])
                            .join("g")
                            .attr("class", clazz + " arrow")
                            .attr("transform", "translate(1,0)");

                        garrow.append('line')
                            .attr("class", "arrow arrow-line")
                            .attr("x1", variantHeight + 2)
                            .attr("x2", -2)
                            .attr("y1", variantHeight + 2)
                            .attr("y2", 0)
                            .style("opacity", 0);
                        garrow.append('line')
                            .attr("class", "arrow arrow-line")
                            .attr("x1", variantHeight + 2)
                            .attr("x2", -2)
                            .attr("y1", 0)
                            .attr("y2", variantHeight + 2)
                            .style("opacity", 0);
                    }
                });
                d3.selectAll('svg').filter(':not(.variant)')
                    .on("click", function() {
                        dispatch.call('d3outsideclick', null);
                    })
            }
        });
    }

    /**** OUTWARD-FACING FUNCTIONS ****/

    chart.showFlaggedVariant = function(svg, variant, key) {
        // Find the matching variant
        var matchingVariant = null;
        svg.selectAll(".variant").each(function (d) {
            if (d.start === variant.start
                && d.end === variant.end
                && d.ref === variant.ref
                && d.alt === variant.alt
                && d.type.toLowerCase() === variant.type.toLowerCase()) {
                matchingVariant = d;
            }
        });
        if (!matchingVariant) {
            return;
        }

        // Get the x, y for the variant's position
        var mousex = Math.round(x(matchingVariant.start));
        var mousey = height - ((matchingVariant.level + 1) * (variantHeight + verticalPadding));

        var xpos = 0;
        var ypos = mousey - 2;
        if (variant.type.toUpperCase() === "DEL" || variant.type.toUpperCase() === "COMPLEX") {
            xpos = mousex;
        } else if (variant.type.toUpperCase() === "INS") {
            xpos = mousex - .5;
        } else {
            xpos = mousex + .5;
        }

        var group = svg.select("g.flagged-variants")
            .append("g")
            .attr("class", "flagged-variant")
            .attr("id", key ? key : "")
            .attr("transform", "translate(" + xpos + "," + ypos + ")");


        var flagGroup = group.append("g")
            .attr("transform", "translate(-5,-5)");
        flagGroup.append("rect")
            .attr("x", 1)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20);

        return chart;
    };

    // chart.removeFlaggedVariant = function(svg, variant) {
    // Find the matching variant
    // svg.selectAll(".variant").each(function (d) {
    //     if (d.start === variant.start
    //         && d.end === variant.end
    //         && d.ref === variant.ref
    //         && d.alt === variant.alt
    //         && d.type.toLowerCase() === variant.type.toLowerCase()) {
    //     }
    // });
    // };

    chart.showCircle = function(d, svgContainer, indicateMissingVariant, pinned) {
        // Find the matching variant
        var matchingVariant = null;
        svgContainer.selectAll(".variant").each(function (variant) {
            if (d.start === variant.start
                && d.end === variant.end
                && d.ref === variant.ref
                && d.alt === variant.alt
                && d.type.toLowerCase() === variant.type.toLowerCase()) {
                if (variant.zygosity != null && variant.zygosity.toLowerCase() === 'homref') {
                    // we want to show an "x" for homozygous reference variants
                    // instead of a circle
                } else {
                    matchingVariant = variant;
                }
            }
        });

        // Get the x for this position
        if (matchingVariant) {
            var mousex = x(matchingVariant.start);
            var mousey = height - ((matchingVariant.level + 1) * (variantHeight + verticalPadding));

            var circleClazz = pinned ? '.pinned.circle' : '.hover.circle';
            var circle = svgContainer.select(circleClazz);
            circle.transition()
                .duration(200)
                .style("opacity", 1);
            circle.attr("cx", mousex + margin.left + 2)
                .attr("cy", mousey + margin.top + 4);

            var matrix = circle.node()
                .getScreenCTM()
                .translate(+circle.node().getAttribute("cx"), +circle.node().getAttribute("cy"));
            var boundRect = circle.node().getBoundingClientRect();

            // Firefox doesn't consider the transform (slideout's shift left) with the getScreenCTM() method,
            // so instead the app will use getBoundingClientRect() method instead which does take into consideration
            // the transform.
            matchingVariant.screenX = Math.round(boundRect.left + (boundRect.width / 2));

            // Since the body is vertically scrollable, we need to calculate the y by offsetting to a height of the
            // scroll position in the container.
            matchingVariant.screenY = Math.round((window.pageYOffset + matrix.f + margin.top) - boundRect.height);

            //showCoordinateFrame(matchingVariant.screenX);

        } else if (indicateMissingVariant) {
            let mousex = Math.round(x(d.start));
            let mousey = height - verticalPadding;

            var arrowClazz = pinned ? 'g.pinned.arrow' : 'g.hover.arrow';
            var garrow = svgContainer.select(arrowClazz);
            garrow.attr("transform", "translate(" + (mousex + margin.left - variantHeight / 2) + "," + (mousey + margin.top - 6) + ")");
            garrow.selectAll('.arrow').transition()
                .duration(200)
                .style("opacity", 1);
        }
    };

    chart.hideCircle = function(svgContainer, pinned) {
        var circleClazz = pinned ? '.pinned.circle' : '.hover.circle';
        var arrowClazz = pinned ? 'g.pinned.arrow' : 'g.hover.arrow';
        svgContainer.selectAll(circleClazz).transition()
            .duration(500)
            .style("opacity", 0);
        if (pinned) {
            svgContainer.selectAll(arrowClazz).selectAll(".arrow").transition()
                .duration(500)
                .style("opacity", 0);
        }
        if (!pinned) {
            svgContainer.selectAll(arrowClazz).selectAll(".arrow").transition()
                .duration(500)
                .style("opacity", 0);
        }
    };

    chart.clearVariants = function(svgContainer) {
        svgContainer.selectAll("svg").remove();
    };

    /* Updates styling classes applied to variants. Utilized in somatic filter application. */
    chart.updateVariantClasses = function(svgContainer) {
        var allVariants = svgContainer.selectAll(".variant");

        // REPLACE classes here (except filter status - this is guaranteed by classifyByImpact)
        allVariants.attr('class', function (d) {
            return clazz(d);
        });
    };

    /* Returns true if selected variant passes filter and is visible. */
    chart.checkForSelectedVar = function(selectedVarId, svgContainer) {
        var stillVisible = false;
        svgContainer.selectAll('.filtered').each(function (d) {
            if (d.id === selectedVarId) {
                stillVisible = true;
            }
        });
        return stillVisible;
    };

    chart.getDispatch = function() {
        return dispatch;
    };


    /**** INTERNAL HELPER FUNCTIONS ****/

    function getSymbol(d) {
        if (d.type.toUpperCase() === 'DEL') {
            return d3.symbolTriangle;
        } else if (d.type.toUpperCase() === 'INS') {
            return d3.symbolCircle;
        } else if (d.type.toUpperCase() === 'COMPLEX') {
            return d3.symbolDiamond;
        }
    }

    /* Returns the value of the variant.
     * As more filters are added, they can be listed here.  */
    // function getVarValue(filterName, d) {
    //     // Note: if filterName does not match variant prop, can add translation here
    //     return d[filterName];
    // }

    function tickFormatter(d) {
        if ((d / 1000000) >= 1)
            d = d / 1000000 + "M";
        else if ((d / 1000) >= 1)
            d = d / 1000 + "K";
        return d;
    }

    /*** RETURN OBJECT ****/
    return chart;
}
