export default function geneD3(d3, options) {

    var dispatch = d3.dispatch("d3selected", "d3featuretooltip", "d3featureglyphtooltip", "d3brush", "d3exontooltip");

    // defaults
    var geneD3_showLabel = options.showLabel ? options.showLabel : false;
    var geneD3_showXAxis = options.showXAxis ? options.showXAxis : false;
    var container = null;
    var selectedTranscript = null;
    var divId = options.divId ? options.divId : "gene-viz";
    var displayOnly = options.displayOnly ? options.displayOnly : false;
    var color = options.color ? options.color : '#424242';
    var inDialog = options.inDialog ? options.inDialog : false;

    // dimensions
    var margin = options.margin ? options.margin : {top: 5, right: 5, bottom: 5, left: 110},
        geneD3_width = 1000,
        geneD3_height = 100;

    // scales
    var x = d3.scaleLinear(),
        y = d3.scaleLinear();

    // axis
    var xAxis = d3.axisBottom(x)
        .tickFormat(tickFormatter);

    // variables
    var geneD3_trackHeight = options.trackHeight ? options.trackHeight : 30,
        borderRadius = 1,
        minFtWidth = 0.5;
    var transcriptClass = function () {
        return 'transcript';
    };

    var geneD3_utrHeight = undefined,
        geneD3_cdsHeight = 12,
        geneD3_arrowHeight = 8,
        geneD3_regionStart = options.regionStart,
        geneD3_regionEnd = options.regionEnd;

    //  options
    var featureClass = function (d) {
        return d.feature_type.toLowerCase()
    };
    var featureGlyphHeight = +0;

    // do work
    function chart(selection) {

        // set variables if not user set
        geneD3_cdsHeight = geneD3_cdsHeight || geneD3_trackHeight;
        geneD3_utrHeight = geneD3_utrHeight || geneD3_cdsHeight / 2;
        geneD3_arrowHeight = geneD3_arrowHeight || geneD3_trackHeight / 2;

        selection.each(function(data) {

            let dataNew = [];
            let uniqueIds = [];
            for (let i = 0; i < data.length; i++) {
                if (!uniqueIds.includes(data[i].transcript_id)) {
                    uniqueIds.push(data[i].transcript_id);
                    dataNew.push(data[i]);
                }
            }
            data = dataNew;

            // calculate height
            var padding = data.length > 1 ? geneD3_trackHeight / 2 : 0;
            geneD3_height = data.length * (geneD3_trackHeight + padding);

            // determine inner height (w/o margins)
            var innerHeight = geneD3_height - margin.top - margin.bottom;

            // set svg element
            container = d3.select("#" + divId);
            container.selectAll("svg").remove();

            // Update the x-scale.
            if (geneD3_regionStart && geneD3_regionEnd) {
                x.domain([geneD3_regionStart, geneD3_regionEnd]);
            } else {
                x.domain([ d3.min(data, function(d) {
                    return d3.min(d.features, function(f) { return parseInt(f.start); })
                }),
                    d3.max(data, function(d) {
                        return d3.max(d.features, function(f) { return parseInt(f.end); })
                    })
                ]);

            }
            x.range([0, geneD3_width - margin.left - margin.right]);

            // Update the y-scale.
            y.domain([0, data.length]);
            y.range([innerHeight , 0]);


            data.forEach(function(transcript) {
                transcript.features.forEach(function(feature) {
                    feature.transcript_type = transcript.transcript_type;
                })
            })


            // Select the svg element, if it exists.
            var svg = container.selectAll("svg").data([0]);
            svg.join("svg")
                .attr("width", geneD3_widthPercent ? geneD3_widthPercent : geneD3_width)
                .attr("height", geneD3_heightPercent ? geneD3_heightPercent : geneD3_height+margin.top+margin.bottom);

            // todo: left off here - mirror oncogene changes?

            // The chart dimensions could change after instantiation, so update viewbox dimensions
            // every time we draw the chart.
            if (geneD3_widthPercent && geneD3_heightPercent) {
                d3.select(this).selectAll("svg")
                    .filter(function() {
                        return this.parentNode === container.node();
                    })
                    .attr('viewBox', "0 0 " + parseInt(geneD3_width+margin.left+margin.right) + " " + parseInt(geneD3_height+margin.top+margin.bottom+featureGlyphHeight))
                    .attr("preserveAspectRatio", "none");
            }

            container.selectAll("svg")
                .attr("width", geneD3_widthPercent ? geneD3_widthPercent : geneD3_width)
                .attr("height", geneD3_heightPercent ? geneD3_heightPercent : geneD3_height+margin.top+margin.bottom);


            // Otherwise, create the skeletal chart.
            svg.selectAll("g").data([0]).enter().append('g');

            let g = svg.select('g');
            // Update the inner dimensions.
            g.attr("transform", "translate(" + margin.left + "," + parseInt(margin.top+featureGlyphHeight) + ")");


            // Brush
            let brush = d3.svg.brush()
                .x(x)
                .on("brushend", function() {
                    let extentRect = d3.select("g.x.brush rect.extent");
                    let xExtent = +extentRect.attr("x");

                    extentRect.attr("x", xExtent - 1);

                    if (brush.empty()) {
                        container.selectAll("svg").selectAll(".x.brush .resize line")
                            .style("visibility", "hidden");
                        container.selectAll("svg").selectAll(".x.brush .resize path")
                            .style("visibility", "hidden");
                    }

                    dispatch.d3brush(brush);


                })
                .on("brush", function() {
                    container.selectAll("svg").selectAll(".x.brush .resize line")
                        .style("visibility", "visible");
                    container.selectAll("svg").selectAll(".x.brush .resize path")
                        .style("visibility", "visible");
                })

            let axisEnter = svg.selectAll("g.x.axis").data([0]).enter().append('g');
            if (geneD3_showXAxis) {
                axisEnter.attr("class", "x axis")
                    .attr("transform",   "translate(" + margin.left + "," + "0" + ")");
                svg.selectAll("g.x.axis").attr("transform",   "translate(" + margin.left + "," + parseInt(geneD3_height+margin.top+margin.bottom+featureGlyphHeight) + ")");
                // svg.selectAll("g.x.axis").attr("transform",   "translate(" + margin.left + "," + parseInt(geneD3_height+margin.top+margin.bottom+featureGlyphHeight + 10) + ")");

            }

            // Start gene model
            // add elements
            let transcript = g.selectAll('.transcript')
                .data(data, function(d) { return d.transcript_id; });


            transcript.enter().append('g')
                .attr('class', transcriptClass)
                .attr("id", function(d,i) { return 'transcript_' +  d.transcript_id.split(".").join("_"); })
                .attr('transform', function(d,i) { return "translate(0," + y(i+1) + ")"});
            transcript.exit().remove();

            transcript.selectAll(".selection-box").remove();
            if (geneD3_showLabel) {
                transcript.selectAll(".selection-box")
                    .data(function(d) {
                        if (geneD3_regionStart && geneD3_regionEnd) {
                            return [[geneD3_regionStart,geneD3_regionEnd]];
                        } else {
                            return [[d.start, d.end]]

                        }
                    })
                    .enter().append('rect')
                    .attr('class', 'selection-box')
                    .attr('x', (margin.left * -1) + 2)
                    .attr('y', 0)
                    .attr('width', margin.left + geneD3_width)
                    .attr('height', geneD3_trackHeight)
                    .on("mouseover", function(d) {
                        svg.selectAll('.transcript.selected').classed("selected", false);
                        d3.select(this.parentNode).classed("selected", true);
                    })
                    .on("mouseout", function(d) {
                        d3.select(this.parentNode).classed("selected", false);
                    })
                    .on("click", function(d) {
                        selectedTranscript = d3.select(this.parentNode)[0][0].__data__;
                        svg.selectAll('.transcript.current').classed("current", false);
                        d3.select(this.parentNode).classed("current", true);
                        dispatch.d3selected(selectedTranscript);
                    })

            }

            transcript.selectAll(".reference").remove();
            transcript.selectAll('.reference')
                .data(function(d) {
                    if (geneD3_regionStart && geneD3_regionEnd) {
                        return [[geneD3_regionStart,geneD3_regionEnd]];
                    } else {
                        return [[d.start, d.end]]

                    }
                })
                .enter().append('line')
                .attr('class', 'reference')
                .attr('x1', function(d) { return d3.round(x(d[0]))})
                .attr('x2', function(d) { return d3.round(x(d[1]))})
                .attr('y1', geneD3_trackHeight/2)
                .attr('y2', geneD3_trackHeight/2)
                .style("pointer-events", "none");

            transcript.selectAll(".name,.type").remove();
            if (geneD3_showLabel) {
                transcript.selectAll('.name').data(function(d) { return [[d.start, d.transcript_id]] })
                    .enter().append('text')
                    .attr('class', 'name')
                    .attr('x', function(d) { return margin.left > 5 ?  5 - margin.left : 0 })
                    .attr('y', 0 )
                    .attr('text-anchor', 'top')
                    .attr('alignment-baseline', 'left')
                    .text(function(d) {
                        return d[1];
                    })
                    .style('fill-opacity', 0)
                    .style("pointer-events", "none");


                transcript.selectAll('.type').data(function(d){ return [[d.start, (d.transcript_type && d.transcript_type != 'null' ? d.transcript_type : ''), (d.canonical_reason ? ' ' + d.canonical_reason : ''), (d.xref != null  ? "(" + d.xref + ")": ''),  d.sort]] })
                    .enter().append('text')
                    .attr('class', 'type')
                    .attr('x', function(d) { return (geneD3_width - margin.left - margin.right - 5) + 10 })
                    .attr('y', 12 )
                    .attr('text-anchor', 'top')
                    .attr('alignment-baseline', 'left')
                    .style("pointer-events", "none")
                    .text(function(d) {
                        var type =  (d[1] == 'protein_coding' || d[1] == 'mRNA' ? '' : d[1]);
                        return type + ' ' + d[2] + ' ' + d[3];
                    })

            }

            transcript.selectAll(".arrow").remove();
            transcript.selectAll('.arrow').data(centerSpan)
                .enter().append('path')
                .attr('class', 'arrow')
                .attr('d', centerArrow);


            var filterFeature = function(feature) {
                if ( feature.transcript_type === 'protein_coding'
                    || feature.transcript_type === 'mRNA'
                    || feature.transcript_type === 'transcript'
                    || feature.transcript_type === 'primary_transcript') {
                    return feature.feature_type.toLowerCase() === 'utr' || feature.feature_type.toLowerCase() === 'cds';
                } else {
                    return feature.feature_type.toLowerCase() === 'exon';
                }
            }


            transcript.selectAll('.transcript rect.utr, .transcript rect.cds, .transcript rect.exon').data(function(d) {
                return d['features'].filter( function(d) {
                    return filterFeature(d);
                }, function(d) {
                    return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;
                });
            }).enter().append('rect')
                .attr('class', function(d,i) {
                    return featureClass(d,i, geneD3_relationship);
                })
                .attr("modelName", geneD3_modelName)
                .attr('rx', borderRadius)
                .attr('ry', borderRadius)
                .attr('x', function(d) { return d3.round(x(d.start))})
                .attr('width', function(d) { return Math.max(minFtWidth, d3.round(x(d.end) - x(d.start)))})
                .attr('y', function(d) {
                    if(d.feature_type.toLowerCase() ==='utr') return (geneD3_trackHeight - geneD3_utrHeight)/2;
                    else return (geneD3_trackHeight - geneD3_cdsHeight)/2; })
                .attr('height', function(d) {
                    if(d.feature_type.toLowerCase() ==='utr') return geneD3_utrHeight;
                    else return geneD3_cdsHeight; })

                .attr("pointer-events", "all")
                .style("cursor", "pointer")
                .on("mouseover", function(d) {
                    // show the tooltip
                    let featureObject = d3.select(this);
                    dispatch.d3featuretooltip(featureObject, d, false);

                    // select the transcript
                    svg.selectAll('.transcript.selected').classed("selected", false);
                    d3.select(this.parentNode).classed("selected", true);
                })
                .on("mouseout", function(d) {
                    dispatch.d3featuretooltip();
                    // de-select the transcript
                    d3.select(this.parentNode).classed("selected", false);

                })
                .on("click", function(d) {
                    // select the transcript
                    svg.selectAll('.transcript.current').classed("current", false);
                    d3.select(this.parentNode).classed("current", true);
                    selectedTranscript = d3.select(this.parentNode)[0][0].__data__;
                    dispatch.d3selected(selectedTranscript);


                    // show the tooltip
                    var featureObject = d3.select(this);
                    dispatch.d3featuretooltip(featureObject, d, true);
                })


            // Add any feature glyphs
            transcript.selectAll(".feature_glyph").remove();
            transcript.selectAll('.transcript rect.utr, .transcript rect.cds, .transcript rect.exon').data(function(d) {
                return d['features'].filter( function(d) {
                    return filterFeature(d);
                }, function(d) {
                    return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;
                });
            })
                .each(function(d,i) {
                    var me = this;
                    var featureX = d3.round(x(d.start));
                    featureGlyph.call(me, d, i, featureX);
                });

            transcript.selectAll(".feature_glyph")
                .on("mouseover", function(d) {
                    // show the tooltip
                    var featureObject = d3.select(this);
                    dispatch.d3featureglyphtooltip(featureObject, d, false);
                })
                .on("mouseout", function(d) {
                    if (container.select('.tooltip.locked').empty()) {
                        dispatch.d3featureglyphtooltip();
                    }
                })
                .on("click", function(d) {
                    // show the tooltip
                    var featureObject = d3.select(this);
                    dispatch.d3featureglyphtooltip(featureObject, d, true);
                })


            // Update class
            transcript.selectAll('.transcript rect.utr, .transcript rect.cds, .transcript rect.exon').data(function(d) {
                return d['features'].filter( function(d) {
                    return filterFeature(d);
                }, function(d) {
                    return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;
                });
            })
                .attr('class', function(d,i) {
                    return featureClass(d,i, geneD3_relationship);
                });

            // update
            transcript.transition()
                .duration(700)
                .attr('transform', function(d,i) { return "translate(0," + y(i+1) + ")"});

            transcript.selectAll('.reference').transition()
                .duration(700)
                .attr('x1', function(d) { return x(d[0])})
                .attr('x2', function(d) { return x(d[1])});

            transcript.selectAll('.arrow').transition()
                .duration(700)
                .attr('d', centerArrow);

            transcript.selectAll('.name').transition()
                .duration(700)
                .attr('x', function(d) { return margin.left > 5 ?  5 - margin.left : 0; })
                .attr('y', function(d) { return margin.left > 5 ? geneD3_trackHeight - (geneD3_trackHeight/2) + 2 : -10; })
                .text(function(d) { return d[1]; })
                .style('fill-opacity', 1);

            transcript.selectAll('.utr,.cds,.exon').sort(function(a,b){ return parseInt(a.start) - parseInt(b.start)})
                .transition()
                .duration(700)
                .attr('x', function(d) {
                    if(d.feature_type.toLowerCase() ==='utr') return d3.round(x(d.start));
                    else return d3.round(x(d.start)) + 0.4; //To avoid any overlapping
                })
                .attr('width', function(d) { return Math.max(minFtWidth, d3.round(x(d.end) - x(d.start)))})
                .attr('y', function(d) {
                    if(d.feature_type.toLowerCase() ==='utr') return (geneD3_trackHeight - geneD3_utrHeight)/2;
                    else return (geneD3_trackHeight - geneD3_cdsHeight)/2; })
                .attr('height', function(d) {
                    if(d.feature_type.toLowerCase() ==='utr') return geneD3_utrHeight;
                    else return geneD3_cdsHeight; });

            // Update the x-axis.
            svg.select(".x.axis").transition()
                .duration(200)
                .call(xAxis);

            if (geneD3_showBrush) {
                var brushHeight = geneD3_height + margin.top + margin.bottom;
                var brushY = (margin.top-1) * -1;
                container.select('svg').selectAll("g.x.brush").remove();
                var theBrush = container.select('svg').selectAll("g.x.brush").data([0]);
                theBrush.enter().append("g")
                    .attr("class", "x brush")
                    .call(brush)
                    .selectAll("rect")
                    .attr("y", 0)
                    .attr("height", brushHeight)

                theBrush.selectAll(".resize")
                    .append("line")
                    .style("visibility",  "visible" )
                    .attr("y2", brushHeight);
                theBrush.selectAll(".resize.e rect")
                    .attr("y0", 0);
                theBrush.selectAll(".resize")
                    .append("path")
                    .style("visibility",  "visible")
                    .attr("d", d3.svg.symbol().type("triangle-up").size(20))
                    .attr("transform", function(d,i) {
                        return i ?  "translate(-4," + (brushHeight/2) + ") rotate(-90)" : "translate(4," + (brushHeight/2) + ") rotate(90)";
                    });
            }
        });
    }

    /*** OUTWARD FACING FUNCTIONS ***/
    chart.getDispatch = function () {
        return dispatch;
    };

    chart.updateSize = function (options) {
        geneD3_regionStart = options.regionStart ? options.regionStart : geneD3_regionStart;
        geneD3_regionEnd = options.regionEnd ? options.regionEnd : geneD3_regionEnd;
        geneD3_width = options.width ? options.width : geneD3_width;
    };

    // chart.setZoomBrush = function(brush) {
    //     geneD3_showBrush = brush;
    // };

    chart.getWidth = function () {
        return geneD3_width;
    };

    // moves selection to front of svg
    // function moveToFront(selection) {
    //     return selection.each(function () {
    //         this.parentNode.appendChild(this);
    //     });
    // }

    /*** HELPER FUNCTIONS ***/
    // updates the hash with the center of the biggest span between features
    function centerSpan(d) {
        var span = 0;
        var center = 0;
        var sorted = d.features
            .filter(function (f) {
                var ft = f.feature_type.toLowerCase();
                return ft == 'utr' || ft == 'cds'
            })
            .sort(function (a, b) {
                return parseInt(a.start) - parseInt(b.start)
            });

        for (var i = 0; i < sorted.length - 1; i++) {
            var currSpan = parseInt(sorted[i + 1].start) - parseInt(sorted[i].end);
            if (span < currSpan) {
                span = currSpan;
                center = parseInt(sorted[i].end) + span / 2;
            }
        }
        d.center = center;
        return [d];
    }

    // generates the arrow path
    function centerArrow(d) {
        var arrowHead = parseInt(d.strand + '5');
        var pathStr = "M ";
        pathStr += x(d.center) + ' ' + (geneD3_trackHeight - geneD3_arrowHeight) / 2;
        pathStr += ' L ' + parseInt(x(d.center) + arrowHead) + ' ' + geneD3_trackHeight / 2;
        pathStr += ' L ' + x(d.center) + ' ' + parseInt(geneD3_trackHeight + geneD3_arrowHeight) / 2;
        return pathStr;
    }

    function tickFormatter(d) {
        if ((d / 1000000) >= 1)
            d = d / 1000000 + "M";
        else if ((d / 1000) >= 1)
            d = d / 1000 + "K";
        return d;
    }

    // Call chart
    // chart(selection);    // todo: needs to be moved to component level

    return chart;
}