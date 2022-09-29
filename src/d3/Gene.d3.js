export default function geneD3(d3, options) {

    var dispatch = d3.dispatch("d3selected", "d3featuretooltip", "d3featureglyphtooltip", "d3brush", "d3exontooltip");

    // defaults
    var divId = options.divId ? options.divId : "gene-viz";
    var geneD3_showXAxis = options.showXAxis ? options.showXAxis : false;
    var container = null;
    var color = options.color ? options.color : '#424242';
    var inDialog = options.inDialog ? options.inDialog : false;
    var selectedTranscriptId = options.selectedTranscriptId;

    // dimensions
    var margin = options.margin ? options.margin : {top: 5, right: 5, bottom: 5, left: 5},
        geneD3_width = options.width,
        geneD3_height = 10;

    var innerOffset = options.inDialog ? 160 : 0;
    var innerPadding = options.inDialog ? 15 : 0;

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
    var transcriptClass = options.transcriptClass && options.inDialog ? options.transcriptClass :
        function () {
            return 'transcript';
        };

    var geneD3_utrHeight = undefined,
        geneD3_cdsHeight = options.inDialog ? 11 : 15,
        geneD3_arrowHeight = 12,
        geneD3_regionStart = options.regionStart,
        geneD3_regionEnd = options.regionEnd,
        geneD3_widthPercent = !options.inDialog ? '100%' : null,
        geneD3_heightPercent = !options.inDialog ? '100%' : null;

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

        selection.each(function (data) {

                // calculate height
                var padding = (data.length > 1 ? geneD3_trackHeight / 2 : 0);
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
                x.range([innerOffset, geneD3_width - margin.left - margin.right - innerOffset - innerPadding]);

                // Update the y-scale.
                y.domain([0, data.length]);
                y.range([innerHeight, 0]);

                data.forEach(function (transcript) {
                    transcript.features.forEach(function (feature) {
                        feature.transcript_type = transcript.transcript_type;
                    })
                });

                // Select the svg element, if it exists.
                let svg = container.selectAll("svg").data([0]);

                // The chart dimensions could change after instantiation, so update viewbox dimensions
                // every time we draw the chart.
                let g = null;
                if (inDialog) {
                    g = svg.join("svg")
                        .attr('viewBox', "0 -5 " + parseInt(geneD3_width + margin.left + margin.right) + " " + parseInt(geneD3_height + margin.top + margin.bottom + featureGlyphHeight))
                        .attr("preserveAspectRatio", "none")
                        .style("overflow-y", "auto")
                        .join("g");
                } else {
                    g = svg.join("svg")
                        .attr("width", geneD3_widthPercent)
                        .attr("height", geneD3_heightPercent)
                        .join('g')
                        .attr("transform", "translate(" + margin.left + "," + parseInt(margin.top + featureGlyphHeight) + ")");
                }

                g.selectAll(".x.axis").remove();
                if (geneD3_showXAxis) {
                    g.append('g')
                        .attr("class", "x axis")
                        .attr("transform", "translate(0, " + parseInt(geneD3_cdsHeight * 2) + ")")
                        .call(xAxis);
                }

                // Start gene model
                let transcript = g.selectAll('.transcript')
                    .data(data, function (d) {
                        return d.transcript_id;
                    })
                    .join('g')
                    .attr('class', function(d) {
                        return transcriptClass(d, selectedTranscriptId);
                    })
                    .attr("id", function (d) {
                        return 'transcript_' + d.transcript_id.split(".").join("_");
                    })
                    .attr('transform', function () {
                        return "translate(0," + (y(1)) + ")"
                    });

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
                    .attr('class', 't-line')
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
                        if (!inDialog) {
                            // show the tooltip
                            dispatch.call('d3exontooltip', this, d)

                            // select the transcript
                            svg.selectAll('.transcript.selected').classed("selected", false);
                            d3.select(this).classed("selected", true);
                        }
                    })
                    .on("mouseout", function () {
                        if (inDialog) {
                            // hide the tooltip
                            dispatch.call('d3exontooltip', this)

                            // de-select the transcript
                            d3.select(this).classed("selected", false);
                        }
                    })
                    .on("click", function (d) {
                        if (!inDialog) {
                            // select the transcript
                            svg.selectAll('.transcript.current').classed("current", false);
                            d3.select(this).classed("current", true);
                            let selectedTranscript = d3.select(this.parentNode)['_groups'][0][0].__data__;
                            dispatch.call('d3selected', this, selectedTranscript);

                            // show the tooltip
                            var featureObject = d3.select(this);
                            dispatch.call('d3featuretooltip', this, featureObject, d, true);
                        }
                    });

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

                // transition
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

                // Draw selection box over other elements
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
                    .attr('class', 'selection-box')
                    .attr('x', (margin.left * -1) + 8)
                    .attr('y', 0)
                    .attr('width', margin.left + geneD3_width)
                    .attr('height', geneD3_trackHeight)
                    .on("mouseover", function() {
                        if (inDialog) {
                            svg.selectAll('.transcript.selected').classed("selected", false);
                            d3.select(this)
                                .style("outline", "solid 1px #888888")
                                .style("cursor", "pointer");
                        }
                    })
                    .on("mouseout", function() {
                        if (inDialog) {
                            d3.select(this).style("outline", "");
                        }
                    })
                    .on("click", function() {
                        if (inDialog) {
                            let selectedTranscript = d3.select(this).node().parentNode.__data__;
                            svg.selectAll('.transcript.current').classed("current", false);
                            d3.select(this).classed("current", true);
                            dispatch.call('d3selected', this, selectedTranscript)
                        }
                    })

                // Draw brush if desired
                // toggleBrush(geneD3_showBrush, container);
            }
        )
    }

    chart.addLabels = function () {
        let transcripts = d3.select("#" + divId).selectAll('.transcript');
        transcripts.selectAll(".name,.type").remove();

        let tscript_name = transcripts.selectAll('.name').data(function (d) {
            return [[d.start, d.transcript_id, d.isCanonical, d.gene_name]]
        });
        tscript_name.enter()
            .append('text')
            .attr('class', 'name')
            .attr('x', innerPadding)
            .attr('y', 0)
            .attr('dy', geneD3_trackHeight / 2 + margin.top)
            .attr('text-anchor', 'start')
            .attr('alignment-baseline', 'left')
            .text(function (d) {
                return d[1];
            })
            .style('opacity', 0);

        let tscript_type = transcripts.selectAll('.type').data(function (d) {
            return [[d.start, (d.transcript_type ? d.transcript_type : ''),
                (d.canonical_reason ? ' ' + d.canonical_reason : ''), (d.xref != null ? "(" + d.xref + ")" : ''), d.sort]]
        });
        tscript_type.enter()
            .append('text')
            .attr('class', 'type')
            .attr('x', function () {
                return (geneD3_width - innerOffset - margin.left - margin.right - 10)
            })
            .attr('y', geneD3_trackHeight / 2 + margin.top)
            .attr('text-anchor', 'top')
            .attr('alignment-baseline', 'left')
            .style("pointer-events", "none")
            .text(function (d) {
                let type = (d[1] === 'protein_coding' || d[1] === 'mRNA' ? '' : d[1]);
                return type + ' ' + d[2] + ' ' + d[3];
            })
            .style('opacity', 0);

        transcripts.selectAll('.name,.type')
            .transition()
            .duration(400)
            .style('opacity', 1.0);
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
                return ft === 'utr' || ft === 'cds'
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