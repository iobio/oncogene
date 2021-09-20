export default function stackedBarChartD3(d3) {

  //var dispatch = d3.dispatch("d3click");

  var margin = {top: 30, right: 20, bottom: 20, left: 50},
      width = 200,
      height = 100;


  function chart(data, theOptions) {
    const parentId = theOptions.parentId;
    let colors = theOptions.colorMap;

    // Remove any old chart
    d3.select('#' + parentId).select('svg').remove();

    // Draw new chart
    var svg = d3.select('#' + parentId).append('svg')
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    data = [
      {"subclone": "C1", "timepoint": "B1", "prev": "0.32"},
      {"subclone": "C1", "timepoint": "B2", "prev": "0.32"},
    ];

    debugger;
    // todo: left off here - .map throwing err
    // todo: finish this, transform data here and for treeviz
    // todo: test pagination
    // todo: pop-up for variants
    let series = d3.stack()
        .keys(colors.keys())
        .value((group, key) => group.get(key).value)
        .order(d3.stackOrderReverse);
    (d3.rollup(data, ([d]) => d, d => d.subclone, d => d.timepoint).values())
        .map(s => (s.forEach(d => d.data = d.data.get(s.key)), s))

    let color = d3.scaleOrdinal()
        .domain(colors.keys())
        .range(colors.values())

    let x = d3.scaleBand()
        .domain(data.map(d => d.subclone))
        .rangeRound([margin.left, width - margin.right]);

    let y = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))]).nice()
        .range([height - margin.bottom, margin.top]);

    let xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .tickValues(d3.ticks(...d3.extent(x.domain()), width / 80))
            .tickSizeOuter(0))

    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y)
            .tickFormat(x => (x / 1e9).toFixed(0)))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Clonal Prevalence"));

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
            .attr("width", x.bandwidth() - 1)
            .attr("height", d => y(d[0]) - y(d[1]))
            .append("title")
            .text(d => d.data.subclone));

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    return svg.node();

  }



  // This adds the "on" methods to our custom exports
  // d3.rebind(chart, dispatch, "on");

  return chart;
}