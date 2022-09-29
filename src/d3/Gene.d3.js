export default function geneD3(d3, options) {

    var dispatch = d3.dispatch("d3selected", "d3featuretooltip", "d3featureglyphtooltip", "d3brush", "d3exontooltip");

    // defaults
    var divId = options.divId ? options.divId : "gene-viz";
    var geneD3_showLabel = options.showLabel ? options.showLabel : false;
    var geneD3_showXAxis = options.showXAxis ? options.showXAxis : false;
    var container = null;
    var selectedTranscript = null;
    var color = options.color ? options.color : '#424242';
    var inDialog = options.inDialog ? options.inDialog : false;

    // dimensions
    var margin = options.margin ? options.margin : {top: 5, right: 5, bottom: 5, left: 5},
        geneD3_width = 750,
        geneD3_height = 10;

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
    var displayOnly = options.displayOnly ? options.displayOnly : false;

    var geneD3_utrHeight = undefined,
        geneD3_cdsHeight = options.inDialog ? 10 : 15,
        geneD3_arrowHeight = 10,
        geneD3_regionStart = options.regionStart,
        geneD3_regionEnd = options.regionEnd,
        geneD3_widthPercent = !options.inDialog ? '100%' : null,
        geneD3_heightPercent = !options.inDialog ? '100%' : null;

    //  options
    var featureClass = function (d) { return d.feature_type.toLowerCase() };
    var featureGlyphHeight = +0;

    // do work
    function chart(selection) {
        // set variables if not user set
        geneD3_cdsHeight = geneD3_cdsHeight || geneD3_trackHeight;
        geneD3_utrHeight = geneD3_utrHeight || geneD3_cdsHeight / 2;
        geneD3_arrowHeight = geneD3_arrowHeight || geneD3_trackHeight / 2;

        selection.each(function(data) {

            // calculate height
            var padding = (data.length > 1 ? geneD3_trackHeight / 2 : 0) + 10;
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
            x.range([0, geneD3_width - margin.left - margin.right]);

            // Update the y-scale.
            y.domain([0, data.length]);
            y.range([innerHeight, 0]);

            data.forEach(function (transcript) {
                transcript.features.forEach(function (feature) {
                    feature.transcript_type = transcript.transcript_type;
                })
            });

            // Select the svg element, if it exists.
            var svg = container.selectAll("svg").data([0]);
            var g = svg.join("svg")
                .attr("width", geneD3_widthPercent ? geneD3_widthPercent : geneD3_width)
                .attr("height", geneD3_heightPercent ? geneD3_heightPercent : geneD3_height + margin.bottom)
                .attr('viewBox', "0 0 " + parseInt(geneD3_width + margin.left + margin.right) + " " + parseInt(geneD3_height + margin.top + margin.bottom + featureGlyphHeight))
                .attr("preserveAspectRatio", "none")
                .append('g')
                .attr("transform", "translate(" + margin.left + "," + parseInt(margin.top + featureGlyphHeight) + ")");


            // The chart dimensions could change after instantiation, so update viewbox dimensions
            // every time we draw the chart.
            if (geneD3_widthPercent && geneD3_heightPercent) {
                d3.select(this).selectAll("svg")
                    .filter(function () {
                        return this.parentNode === container.node();
                    })
                    .attr('viewBox', "0 0 " + parseInt(geneD3_width + margin.left + margin.right) + " " + parseInt(geneD3_height + margin.top + margin.bottom + featureGlyphHeight))
                    .attr("preserveAspectRatio", "none");
            }


            g.selectAll(".x.axis").remove();
            if (geneD3_showXAxis) {
                g.append('g')
                    .attr("class", "x axis")
                    .attr("transform", "translate(0, " + parseInt(geneD3_cdsHeight*2 - 5) + ")")
                    .call(xAxis);
            }


            // Start gene model
            var transcript = g.selectAll('.transcript')
                .data(data, function (d) {
                    return d.transcript_id;
                }).join('g')
                .attr('class', transcriptClass)
                .attr("id", function (d) {
                    return 'transcript_' + d.transcript_id.split(".").join("_");
                })
                .attr('transform', function (d, i) {
                    return "translate(0," + (y(i + 1)) + ")"
                });
            //transcript.exit();

            // todo: need to make sure class w/ cursor + functionality is working here
            transcript.selectAll(".selection-box").remove();
            transcript.selectAll(".selection-box")
                .data(function (d) {
                    if (geneD3_regionStart && geneD3_regionEnd) {
                        return [[geneD3_regionStart, geneD3_regionEnd]];
                    } else {
                        return [[d.start, d.end]]
                    }
                })
                .join('rect')
                .style('fill', 'transparent')
                .attr('x', (margin.left * -1) + 2)
                .attr('y', 0)
                .attr('width', margin.left + geneD3_width)
                .attr('height', geneD3_trackHeight);

            transcript.selectAll(".reference").remove();
            transcript.selectAll('.reference')
                .data(function (d) {
                    if (geneD3_regionStart && geneD3_regionEnd) {
                        return [[geneD3_regionStart, geneD3_regionEnd]];
                    } else {
                        return [[d.start, d.end]]
                    }
                })
                .join('line')
                .style('stroke', color)
                .attr('x1', function (d) {
                    return Math.round(x(d[0]))
                })
                .attr('x2', function (d) {
                    return Math.round(x(d[1]))
                })
                .attr('y1', geneD3_trackHeight / 2)
                .attr('y2', geneD3_trackHeight / 2)
                .style("pointer-events", "none");

            transcript.selectAll(".name,.type").remove();
            if (geneD3_showLabel) {
                let tscript = transcript.selectAll('.name').data(function (d) {
                    return [[d.start, d.transcript_id, d.isCanonical, d.gene_name]]
                });
                tscript.join('text')
                    .attr('class', 'name')
                    .attr('x', function() {
                        return margin.left > 5 ? 5 - margin.left : 0
                    })
                    .attr('y', geneD3_trackHeight / 2 + margin.top)
                    .attr('text-anchor', 'top')
                    //.attr('alignment-baseline', 'left')
                    .text(function (d) {
                        return d[1];
                    });

                if (inDialog) {
                    transcript.selectAll('.type').data(function (d) {
                        return [[d.start, d.transcript_type, (d.isCanonical ? ' CANONICAL' : ''), (d.xref != null ? "(" + d.xref + ")" : ''), d.sort]]
                    })
                        .join('text')
                        .attr('class', 'type')
                        .attr('x', function () {
                            let offset = inDialog ? 0 : 30;
                            return (geneD3_width - margin.left - margin.right - 5) + offset;
                        })
                        .attr('y', geneD3_trackHeight / 2 + margin.top)
                        .attr('text-anchor', 'top')
                        .attr('alignment-baseline', 'left')
                        .style("pointer-events", "none")
                        .text(function (d) {
                            var type = (d[1] === 'protein_coding' || d[1] === 'mRNA' ? '' : d[1]);
                            return type + ' ' + d[2] + ' ' + d[3];
                        })
                } else {
                    transcript.selectAll('.type').data(function (d) {
                        return [[d.start, d.transcript_type, (d.isCanonical ? ' CANONICAL' : ''), (d.xref != null ? "(" + d.xref + ")" : ''), d.sort]]
                    })
                }

            }
            transcript.selectAll(".arrow").remove();
            transcript.selectAll('.arrow').data(centerSpan)
                .join('path')
                .style('stroke', color)
                .style('fill', 'transparent')
                .attr('d', centerArrow);

            var filterFeature = function (feature) {
                if (feature.transcript_type === 'protein_coding'
                    || feature.transcript_type === 'mRNA'
                    || feature.transcript_type === 'transcript'
                    || feature.transcript_type === 'primary_transcript') {
                    return feature.feature_type.toLowerCase() === 'utr' || feature.feature_type.toLowerCase() === 'cds';
                } else {
                    return feature.feature_type.toLowerCase() === 'exon';
                }
            };

            transcript.selectAll('.transcript rect.utr, .transcript rect.cds, .transcript rect.exon').data(function (d) {
                return d['features'].filter(function (d) {
                    return filterFeature(d);
                }, function (d) {
                    return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;
                });
            }).join('rect')
                .style('fill', color)
                .style('stroke', color)
                .attr('rx', borderRadius)
                .attr('ry', borderRadius)
                .attr('x', function (d) {
                    return Math.round(x(d.start))
                })
                .attr('width', function (d) {
                    return Math.max(minFtWidth, Math.round(x(d.end) - x(d.start)))
                })
                .attr('y', function (d) {
                    if (d.feature_type.toLowerCase() === 'utr') return (geneD3_trackHeight - geneD3_utrHeight) / 2;
                    else return (geneD3_trackHeight - geneD3_cdsHeight) / 2;
                })
                .attr('height', function (d) {
                    if (d.feature_type.toLowerCase() === 'utr') return geneD3_utrHeight;
                    else return geneD3_cdsHeight;
                })
                .attr("pointer-events", "all")
                .style("cursor", "pointer")
                .on("mouseover", function (d) {
                    // show the tooltip
                    dispatch.call('d3exontooltip', this, d)

                    // select the transcript
                    svg.selectAll('.transcript.selected').classed("selected", false);
                    // todo: debug this - selected outline not working
                    d3.select(this.parentNode).classed("selected", true);
                })
                .on("mouseout", function () {
                    // hide the tooltip
                    // var featureObject = d3.select(this);
                    dispatch.call('d3exontooltip', this)

                    // de-select the transcript
                    d3.select(this.parentNode).classed("selected", false);
                })
                .on("click", function (d) {
                    if (!displayOnly) {
                        // select the transcript
                        svg.selectAll('.transcript.current').classed("current", false);
                        d3.select(this.parentNode).classed("current", true);
                        selectedTranscript = d3.select(this.parentNode)['_groups'][0][0].__data__;
                        dispatch.call('d3selected', this, selectedTranscript);

                        // show the tooltip
                        var featureObject = d3.select(this);
                        dispatch.call('d3featuretooltip', this, featureObject, d, true);
                    }
                });


            // Add any feature glyphs
            // transcript.selectAll(".feature_glyph").remove();
            // transcript.selectAll('.transcript rect.utr, .transcript rect.cds, .transcript rect.exon').data(function (d) {
            //     return d['features'].filter(function (d) {
            //         return filterFeature(d);
            //     }, function (d) {
            //         return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;
            //     });
            // }).each(function (d, i) {
            //         var me = this;
            //         var featureX = d3.round(x(d.start));
            //         featureGlyph.call(me, d, i, featureX);
            //     });

            // transcript.selectAll(".feature_glyph")
            //     .on("mouseover", function (d) {
            //         // show the tooltip
            //         var featureObject = d3.select(this);
            //         dispatch.d3featureglyphtooltip(featureObject, d, false);
            //     })
            //     .on("mouseout", function (d) {
            //         if (container.select('.tooltip.locked').empty()) {
            //             dispatch.d3featureglyphtooltip();
            //         }
            //     })
            //     .on("click", function (d) {
            //         // show the tooltip
            //         var featureObject = d3.select(this);
            //         dispatch.d3featureglyphtooltip(featureObject, d, true);
            //     })


            // Update class
            transcript.selectAll('.transcript rect.utr, .transcript rect.cds, .transcript rect.exon').data(function (d) {
                return d['features'].filter(function (d) {
                    return filterFeature(d);
                }, function (d) {
                    return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;
                });
            }).attr('class', function (d, i) {
                return featureClass(d, i);
            });


            // update
            transcript.transition()
                .duration(700)
                .attr('transform', function (d, i) {
                    return "translate(0," + (y(i + 1)) + ")"
                });


            transcript.selectAll('.reference').transition()
                .duration(700)
                .attr('x1', function (d) {
                    return x(d[0])
                })
                .attr('x2', function (d) {
                    return x(d[1])
                });

            transcript.selectAll('.arrow').transition()
                .duration(700)
                .attr('d', centerArrow);

            // No idea why update here after the fact
            // transcript.selectAll('.name')
            //     .attr('x', function () {
            //         return margin.left > 5 ? 5 - margin.left : 0;
            //     })
            //     .attr('y', function () {
            //         let offset = inDialog ? 5 : 0;
            //         return margin.left > 5 ? geneD3_trackHeight - (geneD3_trackHeight / 2) + 2 + offset : -10 + offset;
            //     })
            //     .style('font', () => { return inDialog ? '10px Open Sans' : '16px Open Sans' })
            //     .style('fill', '#424242')
            //     .style('fill-opacity', 1);
            //
            // transcript.selectAll('.type')
            //     .attr('x', function () {
            //         return margin.left > 5 ? 5 - margin.left : 0;
            //     })
            //     .attr('y', function () {
            //         let offset = inDialog ? 50 : 0;
            //         return margin.left > 5 ? geneD3_trackHeight - (geneD3_trackHeight / 2) + 2 + offset : -10 + offset;
            //     })
            //     .text(function (d) {
            //         return d[3];
            //     })
            //     .style('font', '11px Quicksand')
            //     .style('fill', '#7f1010')
            //     .style('fill-opacity', 1);

            transcript.selectAll('.utr,.cds,.exon').sort(function (a, b) {
                return parseInt(a.start) - parseInt(b.start)
            })
                .transition()
                .duration(700)
                .attr('x', function (d) {
                    return Math.round(x(d.start))
                })
                .attr('width', function (d) {
                    return Math.max(minFtWidth, Math.round(x(d.end) - x(d.start)))
                })
                .attr('y', function (d) {
                    if (d.feature_type.toLowerCase() === 'utr') return (geneD3_trackHeight - geneD3_utrHeight) / 2;
                    else return (geneD3_trackHeight - geneD3_cdsHeight) / 2;
                })
                .attr('height', function (d) {
                    if (d.feature_type.toLowerCase() === 'utr') return geneD3_utrHeight;
                    else return geneD3_cdsHeight;
                });

            // Update the x-axis.
            svg.select(".x.axis").transition()
                .duration(200)
                .call(xAxis);

            // Draw brush if desired
            // toggleBrush(geneD3_showBrush, container);
        });

    }

    /*** OUTWARD FACING FUNCTIONS ***/
    chart.getDispatch = function () {
        return dispatch;
    };

    chart.updateSize = function(options) {
        geneD3_regionStart = options.regionStart ? options.regionStart : geneD3_regionStart;
        geneD3_regionEnd = options.regionEnd ? options.regionEnd : geneD3_regionEnd;
        geneD3_width = options.width ? options.width : geneD3_width;
    };

    // chart.setZoomBrush = function(brush) {
    //     geneD3_showBrush = brush;
    // };

    chart.getWidth = function() {
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

    return chart;
}