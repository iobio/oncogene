export default function variantD3(d3, divId, vizWidth, vizHeight) {
    // constants
    const symbolSize = 500;
    const numSymbolsPerLine = 40;
    const types = ['symbolCircle', 'symbolDiamond', 'symbolSquare', 'symbolTriangle'];
    const colors = ['#E0292B', '#F49A73', '#f9e4b5', 'rgba(181, 207, 107, 0.65)'];
    const symbolGenerator = d3.symbol().size(symbolSize);
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, vizWidth]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([0, vizHeight]);

    // helpers
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function chart() {
        // Generate some random variant symbols
        let wave = [];
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

            wave.push(currVar);
        }

        const navBarHeight = d3.select('.v-sheet.v-toolbar').node().getBoundingClientRect().height;
        let g = d3.select('#' + divId).selectAll('svg').select('g').selectAll('path');
        g.data(wave)
            .enter().append('path')
            .attr('transform', function (d) {
                return 'translate(' + xScale(d.x) + ',' + (yScale(0) - navBarHeight - 10) + ')';
            })
            .style('fill', function (d) {
                return d.color;
            })
            .attr('d', function (d) {
                symbolGenerator.type(d3[d.type]);
                return symbolGenerator();
            })
            .transition()
            .duration(3000)
            .delay(function(d, i) { return i * 400; })
            .on("start", function rain() {
                d3.active(this)
                    .attr('transform', function (d) {
                        return 'translate(' + xScale(d.x) + ',' + (yScale(0) - navBarHeight - 10) + ')';
                    })
                    .transition()
                    .attr('transform', function (d) {
                        return 'translate(' + xScale(d.x) + ',' + yScale(100) + ')';
                    })
                    .transition()
                    .on("start", rain);
            });
    }
    // Do actual drawing
    chart();
    return chart;
}