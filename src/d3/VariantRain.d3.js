export default function variantD3(d3, divId, vizWidth, vizHeight) {
    // constants
    const symbolSize = 300;
    const numSymbolsPerLine = 20;
    const types = ['symbolCircle', 'symbolDiamond', 'symbolSquare', 'symbolTriangle'];
    const colors = ['#E0292B', '#F49A73', '#f9e4b5', 'rgba(181, 207, 107, 0.65)'];
    const symbolGenerator = d3.symbol().size(symbolSize);
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, vizWidth]);

    // helpers
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function repeat() {
        d3.selectAll('.rain-var')
            .transition()
            .duration(15000)
            .delay(function (d, i) {
                return i * 500;
            })
            .attr('transform', function (d) {
                return 'translate(' + xScale(d.x) + ',' + (vizHeight + 500) + ')';
            })
            .transition()
            .duration(0)
            .delay(16000)
            .attr('transform', function (d) {
                return 'translate(' + xScale(d.x) + ',' + (100) + ')';
            })
            .on('end', repeat);
    }

    function chart() {
        // Generate some random variant symbols
        let symbols = [];
        for (let i = 0; i < numSymbolsPerLine; i++) {
            let currVar = {};

            // Get random x-coordinate
            currVar.x = Math.random();

            // Get random symbol type
            let randIdx = getRandomInt(1, 4) - 1;
            currVar.type = types[randIdx];

            // Get random color
            randIdx = getRandomInt(1, 4) - 1;
            currVar.color = colors[randIdx];

            symbols.push(currVar);
        }

        d3.select('#' + divId).selectAll('svg').selectAll('g').selectAll('path')
            .data(symbols)
            .enter()
            .append('path')
            .attr('transform', function (d) {
                return 'translate(' + xScale(d.x) + ',' + 100 + ')';
            })
            .attr('class', 'rain-var')
            .attr('fill', function (d) {
                return d.color;
            })
            .attr('d', function (d) {
                symbolGenerator.type(d3[d.type]);
                return symbolGenerator();
            });

        repeat();
    }
    // Do actual drawing
    chart();

    return chart;
}