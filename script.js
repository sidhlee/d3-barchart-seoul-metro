const Chart = (function () {
	d3.json('./assets/서울시 지하철 호선별 역별 시간대별 승하차 인원 정보.json') // specify extension!
		.then(init);

	let svg, x, y, xAxis, yAxis, chartWrapper, width, height, margin = {},
		timeAndPassengers, bars, barWidth, tooltip;

	function init(json) {

		/* process data */
		console.log(json)
		const availableYearMonth = json.DATA.map(o => o.use_mon).sort(); // sort() returns sorted array!
		console.log("avilableYearMonth: " + availableYearMonth);

		// loop through and add option element to select
		d3.select('#month')
			.selectAll('option')
			.data(availableYearMonth)
			.enter().append('option')
			.attr('name', 'month')
			.attr('id', d => "m" + d) // id and name MUST begin with a letter!
			.attr('value', d => d)
			.html(d => d);

		// select data from json based on query string
		const urlParams = new URLSearchParams(window.location.search);
		const DEFAULT_DATASET = json.DATA[0];
		const selectedMonth = urlParams.get('month');
		const onOff = urlParams.get('onOff'); // bording / leaving passengers
		const DATASET = json.DATA.filter(o => o.use_mon == selectedMonth)[0] || DEFAULT_DATASET;

		d3.select('#m' + selectedMonth) // show the selected month after refreshing
			.attr('selected', true);
		d3.select(-onOff ? "#on" : "#off") // string "0" is truthy!!
			.attr('checked', true);

		timeAndPassengers = getSelectedData(DATASET, onOff) // [{hour: Date, passengers: Number}] sorted by Date(asc)
		console.log(timeAndPassengers)

		/* init scales */
		const xDomainExtent = d3.extent(timeAndPassengers, d => d.hour);
		x = d3.scaleTime()
			.domain(xDomainExtent);
		const yDomainExtent = d3.extent(timeAndPassengers, d => d.passengers);
		y = d3.scaleLinear()
			.domain(yDomainExtent);

		svg = d3.select('#svg');
		chartWrapper = svg.append('g');
		bars = chartWrapper.selectAll('rect')
			.data(timeAndPassengers)
			.enter().append('rect')
			.attr('class', 'bar')
		chartWrapper.append('g').classed('x axis', true);
		chartWrapper.append('g').classed('y axis', true);

		tooltip = d3.select('body').append('div')
			.attr('id', 'tooltip')
			.attr('class', 'tooltip')
			.style('opacity', 0)
			.style('pointer-events', 'none')

		render();
	}

	function render() {
		updateDimensions(window.innerWidth);

		const md = window.innerWidth > 768;


		//update svg dimensions
		svg.attr('width', width + margin.right + margin.left)
			.attr('height', height + margin.top + margin.bottom);
		chartWrapper.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// set x/y scales based on updatedDimensions
		x.range([0, width]);
		y.range([height, 0]);

		// set axis
		xAxis = d3.axisBottom(x)
			.ticks(d3.timeHour.every(md ? 1 : 2))
			.tickFormat(d3.timeFormat((md) ? '%I%p' : '%I')) // hour(12) + AM/PM

		yAxis = d3.axisLeft(y);

		//position x/y axis
		svg.select('.x.axis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis)


		svg.select('.y.axis')
			.call(yAxis);

		// draw bars
		barWidth = Math.ceil(width / timeAndPassengers.length);

		bars.attr('width', barWidth)
			.attr('height', d => height - y(d.passengers))
			.attr('x', d => x(d.hour))
			.attr('y', d => y(d.passengers))
			.style('fill', 'lightblue');

		// addListener for tooltip
		bars.on('mouseover', (d, i) => {
			d3.select(d3.event.target)
				.style('fill', "rgb(133, 186, 204)");

			const rect = tooltip.node().getBoundingClientRect();
			tooltip.html(`<p>${d3.timeFormat('%Y년 %m월 %e일 %I시(%p)')(d.hour)}</p>
			<p>${d.passengers} 명</p>`)
				.style('left', (d3.event.pageX - rect.width + 50) + "px")
				.style('top', (d3.event.pageY - rect.height - 50) + "px")
				.transition()
				.duration(100)
				.style('opacity', 0.9)

			bars.on('mouseout', () => {
				d3.select(d3.event.target)
					.style('fill', 'lightBlue')
				tooltip.transition().duration(200)
					.style('opacity', 0)
			})
		})



	}

	function updateDimensions(winWidth) {
		margin.top = 20;
		margin.right = 50;
		margin.left = 50;
		margin.bottom = 50;

		width = (winWidth < 1000) ? winWidth - margin.left - margin.right : 1000
		height = 0.7 * width //aspect ratio: 0.7
	}

	function getSelectedData(DATASET, onOff) {
		const endsWith = (onOff) ? "_ride_num" : "_alight_num"
		const props = [];

		for (let prop in DATASET) {
			if (prop.endsWith(endsWith)) {
				props.push(prop);
			}
		}

		const timeAndPassengers = props.map(prop => {
			return {
				hour: hourToDate(prop, DATASET.use_mon),
				passengers: DATASET[prop]
			}
		})

		return timeAndPassengers.sort((a, b) => a.hour - b.hour);

	}


	function hourToDate(hourStr, fullYearMonth) {

		const wordToNumber = {
			one: 1,
			two: 2,
			three: 3,
			four: 4,
			five: 5,
			six: 6,
			seven: 7,
			eight: 8,
			nine: 9,
			ten: 10,
			eleven: 11,
			twelve: 12,
			thirteen: 13,
			fourteen: 14,
			fifteen: 15,
			sixteen: 16,
			seventeen: 17,
			eighteen: 18,
			nineteen: 19,
			twenty: 20,
			twenty_one: 21,
			twenty_two: 22,
			twenty_three: 23,
			midnight: 24,
		};

		const year = fullYearMonth.substring(0, 4);
		const month = fullYearMonth.substring(4, 6);
		const word = hourStr.match(/(.*)_(alight|ride)_num$/)[1]
		const numberHour = wordToNumber[word]
		const date = new Date(year, month, 1, numberHour);
		return date;
	}



	return { render: render }

})()

window.addEventListener('resize', Chart.render)