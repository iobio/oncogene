export default function variantD3(d3, divId) {
    // dimensions
    // var margin = {top: 74, right: 10, bottom: 10, left: 10},
    //     width = 1920,
    //     height = 1080;
    // var innerHeight = height - margin.top - margin.bottom;

    // scales
    // var x = d3.scaleLinear().domain(0, 1).range(0, width);
    //     // y = d3.scaleLinear().domain().range(innerHeight);
    //
    // var symbolScaleCircle = d3.scaleOrdinal()
    //     .domain([3, 4, 5, 6, 7, 8, 10, 12, 14, 16])
    //     .range([9, 15, 25, 38, 54, 58, 70, 100, 130, 260]);
    //
    // var symbolScale = d3.scaleOrdinal()
    //     .domain([3, 4, 5, 6, 7, 8, 10, 12, 14, 16])
    //     .range([9, 15, 20, 25, 32, 58, 70, 100, 130, 320]);
    //
    // // variables
    // var variantHeight = 16,
    //     container = null;
    // helpers
    // function getRandomInt(min, max) {
    //     min = Math.ceil(min);
    //     max = Math.floor(max);
    //     return Math.floor(Math.random() * (max - min + 1)) + min;
    // }
    //
    // function getSymbolSize(variant) {
    //     if (variant.type === 'INS') {
    //         return symbolScaleCircle(variantHeight);
    //     } else {
    //         return symbolScale(variantHeight);
    //     }
    // }
    //
    function chart() {
        //     // determine inner height (w/o margins)
        //
        //
        //     // Draw SVG
        //     container = d3.select('#' + divId);
        //     container.selectAll("svg").remove();
        //     var svg = container.selectAll("svg").data([0]);
        //     var g = svg.join("svg")
        //         .attr("width", 1920)
        //         .attr("height", 70)
        //         .attr('viewBox', "0 0 " + parseInt(width + margin.left + margin.right) + " " + parseInt(height + margin.top + margin.bottom))
        //         .attr("preserveAspectRatio", "none")
        //         .append("g")
        //         .attr("class", "group")
        //         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        //
        //     g.attr('height', 70);
        //
        //     // var bottomScreen = y(innerHeight);
        //
        //     // var d = new Date();
        //     // var start = d.getTime();
        //     // var cutoff = 300000; // 5 min
        //     // // while (true) {
        //     //     var now = d.getTime();
        //     //     var diff = now - start;
        //         var featureArrs = [];   // array of arrays of features
        //         var featureArrIdx = 0;
        //
        //         // while (diff < cutoff) {
        //             // Create array of 15 random variant objects
        //             var features = [];
        //             var varsPerLine = 15;
        //             for (var i = 0; i < varsPerLine; i++) {
        //                 var currVar = {};
        //
        //                 // Get random x coordinate
        //                 var randCoord = x(Math.random());
        //                 currVar.x = randCoord;
        //
        //                 // Get random symbol type
        //                 var randIdx = getRandomInt(1, 4) - 1;
        //                 var symbolTypes = ['SNP', 'DEL', 'INS', 'COMPLEX'];
        //                 var symbols = [d3.symbolSquare, d3.symbolTriangle, d3.symbolCircle, d3.symbolDiamond];
        //                 currVar.type = symbolTypes[randIdx];
        //                 currVar.symbol = symbols[randIdx];
        //
        //                 // Get random color
        //                 randIdx = getRandomInt(1, 4) - 1;
        //                 var colors = ['#E0292B', '#F49A73', '#f9e4b5', 'rgba(181, 207, 107, 0.65)'];
        //                 currVar.color = colors[randIdx];
        //
        //                 // TODO: maybe put variable time length for transition here too
        //
        //                 // Create variant object and add to current array
        //                 features.push(currVar);
        //             }
        //             // Keep track of these so we don't lose them during next loop
        //             featureArrs.push(features);
        //
        //             // Draw variants and apply vertical transition
        //             var currFeatArr = featureArrs[featureArrIdx];
        //
        //             // SNP
        //             g.selectAll('.splash_variant')
        //                 .data(function () {
        //                     return currFeatArr.filter(function (d) {
        //                         return d.type === 'SNP';
        //                     });
        //                 }).join('rect')
        //                 .style('fill', function(d) {
        //                     return d.color;
        //                 })
        //                 .attr('x', function (d) {
        //                     return d.x;
        //                 })
        //                 .attr('y', function () {
        //                     return variantHeight;
        //                 })
        //                 .attr('width', function () {
        //                     return 160;
        //                 })
        //                 .attr('height', 160);
        //
        //             // INS, DEL, COMPLEX
        //             g.selectAll('.splash_variant')
        //                 .data(function () {
        //                 var indels = currFeatArr.filter(function (d) {
        //                     return d.type === 'DEL'
        //                         || d.type === 'INS'
        //                         || d.type === 'COMPLEX';
        //                 });
        //                 return indels;
        //             }).join('path')
        //                 .attr("d", function (d) {
        //                     return d3.symbol()
        //                         .size(getSymbolSize(d))
        //                         .type(d.symbol)();
        //                 })
        //                 .style('fill', function(d) {
        //                     return d.color;
        //                 })
        //                 .attr("transform", function (d) {
        //                     var xCoord = d.x + 2;
        //                     var yCoord = variantHeight;
        //                     var tx = "translate(" + xCoord + "," + yCoord + ")";
        //                     return tx;
        //                 });

        // Start transitions
        // var transitionTime = 5000;
        // g.selectAll('.splash_variant')
        //     .transition()
        //     .duration(transitionTime)
        //     // TODO: can add random delay here...
        //     // .delay(function (d, i) {
        //     //     return i * interval;
        //     // })
        //     .ease(d3.easeBounce)
        //     .attr('x', function (d) {
        //         return d.x;
        //     })
        //     .attr('width', function () {
        //         return variantHeight;
        //     })
        //     .attr('y', function () {
        //         return bottomScreen;
        //     })
        //     .attr('height', function () {
        //         return variantHeight;
        //     });

        // Update time
        // now = d.getTime();
        // diff = now - start;

        // Update feature array idx
        // featureArrIdx++;

        // Wait a couple seconds before looping again
        // var sleepTime = 2000;  // 2 seconds
        // var innerStart = d.getTime();
        // var innerNow = d.getTime();
        // var innerDiff = innerNow - innerStart;
        // var counter = 0;    // Add counter and log to avoid compiling out
        // while(innerDiff < sleepTime) {
        //     counter++;
        //     innerNow = d.getTime();
        //     innerDiff = innerNow - innerStart;
        // }
        // console.log('Sleep counter: ' + counter);

        var symbolGenerator = d3.symbol().size(300);

        var symbolTypes = ['symbolCircle', 'symbolCross', 'symbolDiamond', 'symbolSquare', 'symbolStar', 'symbolTriangle', 'symbolWye'];

        var xScale = d3.scaleLinear().domain([0, symbolTypes.length - 1]).range([0, 700]);

        // var container = d3.select('#' + divId);
        // container.selectAll("svg").remove();
        //
        // var svg = container.selectAll("svg").data([0]);
        // var g = svg.append("g").attr('transform', 'translate(50, 20)');

        d3.select('#' + divId).selectAll('svg').selectAll('g').selectAll('path')
            .data(symbolTypes)
            .enter()
            .append('path')
            .attr('transform', function (d, i) {
                return 'translate(' + xScale(i) + ',' + 100 + ')';
            })
            .attr('class', 'rain-var')
            .attr('d', function (d) {
                symbolGenerator
                    .type(d3[d]);

                return symbolGenerator();
            });


        d3.selectAll('.rain-var')
            .transition()
            .duration(5000)
            // .delay(100)
            // .ease(d3.easeBounce)
            .attr('transform', function (d, i) {
                return 'translate(' + xScale(i) + ',' + 1920 + ')';
            });
        // .delay(function (d, i) {
        //     return i * interval;
        // })
    }

    // }
    // Do actual drawing
    chart();

    return chart;
}