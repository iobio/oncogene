export default function variantD3(d3) {
    // dimensions
    var margin = {top: 10, right: 0, bottom: 20, left: 110},
        width = 1000,
        height = 400;
    // scales
    var x = d3.scaleLinear(),
        y = d3.scaleLinear();

    // variables
    var variantHeight = 12,
        container = null;

    function chart() {
        // determine inner height (w/o margins)
        var innerHeight = height - margin.top - margin.bottom;

        // Draw SVG
        container = d3.select(this);
        container.selectAll("svg").remove();
        var svg = container.selectAll("svg").data([0]);
        var g = svg.join("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr('viewBox', "0 0 " + parseInt(width + margin.left + margin.right) + " " + parseInt(height + margin.top + margin.bottom))
            .attr("preserveAspectRatio", "none")
            .append("g")
            .attr("class", "group")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Get static ending y coordinate
        y.domain([0, innerHeight]);
        var bottomScreen = y(innerHeight);

        var d = new Date();
        var start = d.getTime();
        var cutoff = 300000; // 5 min
        while (true) {
            var now = d.getTime();
            var diff = now - start;
            var featureArrs = [];   // array of arrays of features
            var featureArrIdx = 0;

            while (diff < cutoff) {
                // Create array of 15 random variant objects
                var features = [];
                var varsPerLine = 15;
                for (var i = 0; i < varsPerLine; i++) {
                    var currVar = {};

                    // Get random x coordinate
                    x.domain([0, 1]);
                    var randCoord = x(Math.random());
                    currVar.start = randCoord;

                    // Get random symbol type
                    var randIdx = ((Math.random() * 100) / 4) * 100 / 100;
                    var symbolTypes = ['SNP', 'DEL', 'INS', 'COMPLEX'];
                    var symbols = [d3.symbolSquare, d3.symbolTriangle, d3.symbolCircle, d3.symbolDiamond];
                    currVar.type = symbolTypes[randIdx];
                    currVar.symbol = symbols[randIdx];

                    // Get random color
                    randIdx = ((Math.random() * 100) / 4) * 100 / 100;
                    var colors = ['#E0292B', '#F49A73', '#f9e4b5', 'rgba(181, 207, 107, 0.65)'];
                    currVar.color = colors[randIdx];

                    // TODO: maybe put variable time length for transition here too

                    // Create variant object and add to current array
                    features.push(currVar);
                }
                // Keep track of these so we don't lose them during next loop
                featureArrs.push(features);

                // Draw variants and apply vertical transition
                var currFeatArr = featureArrs[featureArrIdx];

                // SNP
                g.selectAll('.splash_variant')
                    .data(function () {
                        return currFeatArr.filter(function (d) {
                            return d.type === 'SNP';
                        });
                    }).join('rect')
                    .style('fill', function(d) {
                        return d.color;
                    })
                    .attr('x', function (d) {
                        return d.start;
                    })
                    .attr('y', function () {
                        return variantHeight;
                    })
                    .attr('width', function () {
                        return variantHeight;
                    })
                    .attr('height', variantHeight);

                // INS, DEL, COMPLEX
                g.selectAll('.splash_variant')
                    .data(function () {
                    var indels = currFeatArr.filter(function (d) {
                        return d.type === 'DEL'
                            || d.type === 'INS'
                            || d.type === 'COMPLEX';
                    });
                    return indels;
                }).join('path')
                    .attr("d", function (d) {
                        return d3.symbol()
                            .size(variantHeight)
                            .type(d.symbol)();
                    })
                    .style('fill', function(d) {
                        return d.color;
                    })
                    .attr("transform", function (d) {
                        var xCoord = d.start + 2;
                        var yCoord = variantHeight;
                        var tx = "translate(" + xCoord + "," + yCoord + ")";
                        return tx;
                    });

                // Start transitions
                var transitionTime = 5000;
                g.selectAll('.splash_variant')
                    .transition()
                    .duration(transitionTime)
                    // TODO: can add random delay here...
                    // .delay(function (d, i) {
                    //     return i * interval;
                    // })
                    .ease(d3.easeBounce)
                    .attr('x', function (d) {
                        return d3.format('d')(x(d.start) - (minWidth / 2) + (minWidth / 4));
                    })
                    .attr('width', function () {
                        return variantHeight;
                    })
                    .attr('y', function () {
                        return bottomScreen;
                    })
                    .attr('height', function () {
                        return variantHeight;
                    });

                // Update time
                now = d.getTime();
                diff = now - start;

                // Update feature array idx
                featureArrIdx++;

                // Wait a couple seconds before looping again
                var sleepTime = 2000;  // 2 seconds
                var innerStart = d.getTime();
                var innerNow = d.getTime();
                var innerDiff = innerNow - innerStart;
                var counter = 0;    // Add counter and log to avoid compiling out
                while(innerDiff < sleepTime) {
                    counter++;
                    innerNow = d.getTime();
                    innerDiff = innerNow - innerStart;
                }
                console.log('Sleep counter: ' + counter);
            }
        }
    }
    // Do actual drawing
    chart();

    return chart;
}