export default function stackedBarChartD3(d3, smallVersion) {

  var margin = {top: 30, right: 20, bottom: 50, left: 10},
      width = smallVersion ? 270 : 330, //todo: test with big screen
      height = 320;

  function chart(subcloneObjs, theOptions) {
    const parentId = theOptions.parentId;
    let colors = theOptions.colorMap;

    // Remove any old chart
    d3.select('#' + parentId).select('svg').remove();

    // Draw new chart
    var svg = d3.select('#' + parentId).append('svg')
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + (margin.left + 40) + "," + (margin.top - 15) + ")");


    var vals = d3.rollup(subcloneObjs, ([d]) => d, d => d.timepoint, d => d.subclone).values();

    var colorArr = [];
    for (let key of Object.keys(colors)) {
      if (key !== 'n') {
        colorArr.push(key);
      }
    }

    // NOTE: colorArr must match the number of subclones in length exactly
    var stack = d3.stack()
        .keys(colorArr)
        .value((group, key) => group.get(key).prev)
        .order(d3.stackOrderReverse);
    var s = stack(vals);
    var series = s.map(s => (s.forEach(d => d.data = d.data.get(s.key)), s));

    var color = d3.scaleOrdinal()
        .domain(Object.keys(colors))
        .range(Object.values(colors))

    var x = d3.scaleBand()
        .domain(subcloneObjs.map(d => d.timepoint))
        .rangeRound([margin.left, width - margin.right])

    var y = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))]).nice()
        .range([height - margin.bottom, margin.top])

    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y);

    svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
        .attr("fill", ({key}) => color(key))
        .call(g => g.selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.timepoint))
            .attr("y", d => y(d[1]))
            .attr("width", x.bandwidth())
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("stroke", "#444")
            .attr("stroke-width", "0.5")
            .append("title")
            .text(d => `${d.data.subclone}@${d.data.timepoint}: ${d.data.prev}`));

    svg.append("g")
        .attr("class", "subclone x-axis")
        .attr("transform", "translate(0," + (height - margin.bottom + 2)  + ")")
        .call(xAxis)
        .append("text")
        .attr("x", 0)
        .attr("dx", "13em")
        .attr("dy", "6em")
        .text("Timepoints")
        .attr("id", "x-label")
        .style("fill", "#717171")
        .style("font-size", "14px");

    // rotate x-axis labels
    svg.selectAll('g').classed('x-axis', true)
        .selectAll('text:not(#x-label)').classed("x-label", false)
        .attr("transform", "rotate(-35)");

    svg.append("g")
        .attr("class", "subclone y-axis")
        .call(yAxis)
        .append("text")
        .attr("y", 0)
        .attr("dx", "-11em")
        .attr("dy", "-3em")
        .attr('class', 'subclone-viz')
        .text("Prevalence");

    return svg.node();
  }

  // This adds the "on" methods to our custom exports
  // d3.rebind(chart, dispatch, "on");

  return chart;
}