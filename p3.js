// p3.js: p3 student code
// Copyright (C)  2023 University of Chicago. All rights reserved.
/*
This is only for students and instructors in the 2023 CMSC 23900 ("DataVis") class, for use in that
class. It is not licensed for open-source or any other kind of re-distribution. Do not allow this
file to be copied or downloaded by anyone outside the 2023 DataVis class.
*/
/*
NOTE: Document here (after the "begin  student  code" line)
v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (other resources)
^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (0L in ref)
anyone or anything extra you used for this work.  Besides your instructor and TA (and project
partner, if you partnered with someone) who else did you work with?  What other code or web pages
helped you understand what to do and how to do it?  It is not a problem to seek more help to do
this work!  This is just to help the instructor know about other useful resources, and to help the
graders understand sources of code similarities.
*/
'use strict';
import {
  d3, parm, glob,
  // what else do you want to import from common.js?
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (p3 imports from common)
  sumAllStates,
  votesStates,
  totalmax,
  detailedStates,
  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (1L in ref)
} from './common.js';

/* create the annotated balance bars for popular and electoral college votes */
export const balanceInit = function (did, sid) {
  const div = document.getElementById(did);
  /* appending elements to the div likely changes clientWidth and clientHeight, hence the need to
  save these values representing the original grid */
  const ww = div.clientWidth;
  let hh = div.clientHeight;
  const svg = d3.select('#' + did).append('svg');
  // make svg fully occupy the (original) containing div
  svg.attr('id', sid).attr('width', ww).attr('height', hh);
  const wee = 2;
  const bal = svg.append('g').attr('transform', `translate(0,${2 * wee})`);
  hh -= 2 * wee;
  /* ascii-hard to help keep coordinates and ids straight
                     L                                                        R
  +                  ----------------------------|-----------------------------
        popular vote | #D-pv-bar,#D-pv-txt       |        #R-pv-bar,#R-pv-txt |
  H                  ----------------------------|-----------------------------
                       #D-name                   |                    #R-name
                     ----------------------------|-----------------------------
   electoral college | #D-ec-bar,#D-ec-txt       |        #R-ec-bar,#R-ec-txt |
                     ----------------------------|-----------------------------
  */
  // some convenience variables for defining geometry
  const L = ww / 7,
    R = (6.5 * ww) / 7,
    H = hh / 3;
  // mapping over an array of adhoc parameter objects to avoid copy-pasta
  [
    // create the left-side labels for the two bars
    { y: 0.5 * H, t: 'Popular Vote' },
    { y: 2.5 * H, t: 'Electoral College' },
  ].map((i) => {
    bal
      .append('text')
      .attr('transform', `translate(${L - wee},${i.y})`)
      .style('text-anchor', 'end')
      .html(i.t);
  });
  const parts = [
    /* the bars and text values for the four counts: {D,R}x{popular vote, electoral college}, and,
    the two candidate names */
    { id: 'D-pv', p: -1, y: 0 },
    { id: 'D-name', p: -1, y: H },
    { id: 'D-ec', p: -1, y: 2 * H },
    { id: 'R-pv', p: 1, y: 0 },
    { id: 'R-name', p: 1, y: H },
    { id: 'R-ec', p: 1, y: 2 * H },
  ];
  parts.map((i) => {
    if (!i.id.includes('name')) {
      bal
        .append('rect')
        .attr(
          /* NOTE how these bars are transformed: your code only needs to set width (even though
          the D bars grow rightward, and the R bars grown leftward), and, your code doesn't need to
          know the width in pixels.  Just set width to 0.5 to make the bar go to the middle */
          'transform',
          i.p < 0 ? `translate(${L},0) scale(${R - L},1)` : `translate(${R},0) scale(${L - R},1)`
        )
        .attr('x', 0)
        .attr('y', i.y)
        .attr('height', H)
        .attr('fill', i.p < 0 ? parm.colorDem : parm.colorRep)
        // NOTE: select the bars with '#D-pv-bar', '#D-ec-bar', '#R-pv-bar', '#R-ec-bar'
        .attr('id', `${i.id}-bar`)
        .attr('width', 0.239); // totally random initial fractional value
    }
  });
  parts.map((i) => {
    const txt = bal
      .append('text')
      .attr('transform', `translate(${i.p < 0 ? L + wee : R - wee},${i.y + 0.5 * H})`)
      .style('text-anchor', i.p < 0 ? 'start' : 'end')
      // NOTE: select the text fields with '#D-pv-txt', '#D-ec-txt', '#R-pv-txt', '#R-ec-txt'
      .attr('id', `${i.id}${i.id.includes('name') ? '' : '-txt'}`);
    txt.html('#' + txt.node().id); // initialize text to show its own CSS selector
  });
  bal
    .append('line')
    .attr('x1', (L + R) / 2)
    .attr('x2', (L + R) / 2)
    .attr('y1', 0)
    .attr('y2', hh)
    .attr('stroke-width', 1)
    .attr('stroke', '#fff');
};

/* canvasInit initializes the HTML canvas that we use to draw a picture of the bivariate colormap
underneath the scatterplot. NOTE THAT AS A SIDE-EFFECT this sets glob.scatContext and
glob.scatImage, which you must use again later when changing the pixel values inside the canvas */
export const canvasInit = function (id) {
  const canvas = document.querySelector('#' + id);
  canvas.width = parm.scatSize;
  canvas.height = parm.scatSize;
  const marg = parm.scatMarg;
  canvas.style.padding = `${marg}px`;
  glob.scatContext = canvas.getContext('2d');
  glob.scatImage = glob.scatContext.createImageData(parm.scatSize, parm.scatSize);
  /* set pixels of glob.scatImage to checkerboard pattern with ramps; the only purpose of this is
  to show an example of traversing the scatImage pixel array, in a way that (with thought and
  scrutiny) identifies how i and j are varying over the image as it is seen on the screen. NOTE
  that nested for() loops like this are an idiomatic way of working with pixel data arrays, as
  opposed to functional idioms like .map() that we use for other kinds of data. */
  for (let k = 0, j = 0; j < parm.scatSize; j++) {
    for (let i = 0; i < parm.scatSize; i++) {
      glob.scatImage.data[k++] =
        100 + // RED channel is a constant plus ...
        (120 * i) / parm.scatSize + // ... ramp up along i,
        30 * (Math.floor(i / 40) % 2); // with wide bands
      glob.scatImage.data[k++] =
        100 + // GREEN channel is a constant plus ...
        (120 * j) / parm.scatSize + // ... ramp up along with j,
        30 * (Math.floor(j / 10) % 2); // with narrow bands
      glob.scatImage.data[k++] = 30; // BLUE channel is constant
      glob.scatImage.data[k++] = 255; // 255 = full OPACITY (don't change)
    }
  }
  /* display scatImage inside canvas.
  NOTE that you will need to call this again (exactly this way, with these variable names)
  anytime you change the scatImage.data canvas pixels */
  glob.scatContext.putImageData(glob.scatImage, 0, 0);
};

/* Place the scatterplot axis labels, and finalize the stacking of both the labels and the
scatterplot marks over the canvas. That this assumes many specific element ids in the DOM is likely
evidence of bad design */
export const scatLabelPos = function () {
  // place the scatterplot axis labels.
  const wee = parm.scatTweak; // extra tweak to text position
  const marg = parm.scatMarg;
  const sz = parm.scatSize;
  /* since these two had style "position: absolute", we have to specify where they will be, and
  this is done relative to the previously placed element, the canvas */
  /* (other functions here in p3.js try to avoid assuming particular element ids, using instead ids
  passed to the function, but that unfortunately became impractical for this function) */
  ['#scat-axes', '#scat-marks-container'].map((pid) =>
    d3
      .select(pid)
      .style('left', 0)
      .style('top', 0)
      .attr('width', 2 * marg + sz)
      .attr('height', 2 * marg + sz)
  );
  d3.select('#y-axis').attr('transform', `translate(${marg - wee},${marg + sz / 2}) rotate(-90)`);
  d3.select('#x-axis').attr('transform', `translate(${marg + sz / 2},${marg + sz + wee})`);
  d3.select('#scat-marks')
    .attr('transform', `translate(${marg},${marg})`)
    .attr('width', sz)
    .attr('height', sz);
};

/* scatMarksInit() creates the per-state circles to be drawn over the scatterplot */
export const scatMarksInit = function (id, data) {
  /* maps interval [0,data.length-1] to [0,parm.scatSize-1]; this is NOT an especially informative thing
  to do; it just gives all the tickmarks some well-defined initial location */
  const tscl = d3
    .scaleLinear()
    .domain([0, data.length - 1])
    .range([0, parm.scatSize]);
  /* create the circles */
  d3.select('#' + id)
    .selectAll('circle')
    .data(data)
    .join('circle')
    .attr('class', 'stateScat')
    // note that every scatterplot mark gets its own id, eg. 'stateScat_IL'
    .attr('id', d => `stateScat_${d.StateAbbr}`)
    .attr('r', parm.circRad)
    .attr('cx', (d, ii) => tscl(ii))
    .attr('cy', (d, ii) => parm.scatSize - tscl(ii));
};

export const formsInit = function (tlid, yid, years, mdid) {
  // finish setting up timeline for choosing the year
  const tl = d3.select('#' + tlid);
  tl.attr('min', d3.min(years))
    .attr('max', d3.max(years))
    .attr('step', 4) // presidential elections are every 4 years
    // responding to both input and click facilitates being activated from code
    .on('input click', function () {
      /* This is one of the situations in which you CANNOT use an arrow function; you need a real
      "function" so that "this" is usefully set (here, "this" is this input element) */
      d3.select('#' + yid).html(this.value);
      yearSet(+this.value); // need the + so year is numeric
    });
  // create radio buttons for choosing colormap/scatterplot mode
  const radioModes = Object.keys(glob.modeDesc).map(id => ({
    id,
    str: glob.modeDesc[id]
  }));
  // one span per choice
  const spans = d3
    .select('#' + mdid)
    .selectAll('span')
    .data(radioModes)
    .join('span');
  // inside each span, put a radio button
  spans
    .append('input')
    // add some spacing left of 2nd and 3rd radio button; the 'px' units are in fact needed
    .style('margin-left', (_, i) => `${20 * !!i}px`)
    .attr('type', 'radio')
    .attr('name', 'mode') // any string that all the radiobuttons share
    .attr('id', (d) => d.id) // so label can refer to this, and is thus clickable
    .attr('value', (d) => d.id) // so that form as a whole has a value
    // respond to being selected by calling the modeSet function (in this file).
    .on('input', function (d) {
      modeSet(this.value);
    });
  // also in each span put the choice description
  spans
    .append('label')
    .attr('for', (d) => d.id)
    .html((d) => d.str);
};

/* TODO: finish dataProc, which takes the global state object, and modifies it as needed prior to
interactions starting. You will want to do things with the results of reading all the CSV data,
currently sitting in glob.csvData. */
export const dataProc = function (glob) {
  // some likely useful things are computed for you
  // glob.years: sorted array of all numerical years
  glob.years = glob.csvData.votes.columns // all column headers from voting data CSV
    .filter((c) => c.includes('_')) // select the years (works for given votes.csv)
    .map((c) => c.split('_')[1]) // extract year part (dropping 'DN', 'DE', 'RN', 'RE')
    // select only unique elements (note the use of all 3 args of filter function)
    .filter((d, i, A) => i == A.indexOf(d))
    .map((y) => +y) // and make into numbers
    .sort(); // make sure sorted if not already
  // glob.stateName: maps from two-letter abbreviation to full "state" name.
  glob.stateName = {};
  glob.csvData.stateNames.forEach(s => glob.stateName[s.StateAbbr] = s.StateName);
  // glob.cname: maps from election year to little object with D and R candidate names
  glob.cname = {};
  glob.csvData.candidateNames.forEach(nn => {
    glob.cname[+nn.year] = {
      D: nn.D,
      R: nn.R,
    };
  });
  // what other arrays or objects do you want to set up?
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (p3 dataProc)
  glob.sumVotes = sumAllStates(glob.years, glob.csvData.votes); // gets total votes in a year
  glob.eachState = votesStates(glob.years, glob.csvData.votes); // gets total votes for a state each year
  glob.maxVote = totalmax(glob.years, glob.eachState); // const maximum vote

  // dummy data table
  var data = [
    { "one" : ' ', "two" : 'D', "three": 'R' },
    { "one" : 'popular', "two" : 50, "three": 60 },
    { "one" : 'electoral', "two" : 55, "three": 59 }
  ]

  // adds tooltip as a global variable with info from dummy table
  glob.tip = d3.select('body').append('table')
    .style('top', '100px').style('left', '100px')
    .style('opacity', 0).style('position', 'relative') // stylistic things, makes invisible for now
    .style('background-color', '#202020')
    .style('font-size', '12px').style('font-family', 'sans-serif').style('text-anchor', 'middle')

  // title and body of table
  var thead = glob.tip.append('thead')
  var	tbody = glob.tip.append('tbody');
  thead.append('tr').append('th').attr('colspan', 3).text('hey')
  var rows = tbody.selectAll('tr') // makes tr for each entry of data
      .data(data)
      .enter()
      .append('tr');
  var cells = rows.selectAll('td') 
      .data(function (row) {
        return ['one', 'two', 'three'].map(function (column) {
          return {column: column, value: row[column]}; 
        });
      })
      .enter()
      .append('td')
        .text(function (d) { return d.value; }); // fills table in
  glob.byState = detailedStates(glob.years, glob.csvData.votes) // same as votes but by year instead of by state
  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (51L in ref)
};

/* TODO: finish visInit, which sets up any other state or resources that your visualization code
will use to support fast user interaction */
export const visInit = function (glob) {
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (p3 visInit)
  const canvas = document.querySelector('#scat-canvas'); // scatPlot initialization
  canvas.width = parm.scatSize;
  canvas.height = parm.scatSize;
  const marg = parm.scatMarg;
  canvas.style.padding = `${marg}px`;
  glob.scatContext = canvas.getContext('2d');
  glob.scatImage = glob.scatContext.createImageData(parm.scatSize, parm.scatSize);

  // warp functions
  const warpA = (x, p) => 1 - Math.pow(1 - x, p)
  const warpC = (x, p) => (x > 0 ? warpA(x, p) : -warpA(-x, p));

  if (glob.currentMode == 'RVD'){
    for (var k = 0, j = 0; j < parm.scatSize; j++) {
      for (let i = 0; i < parm.scatSize; i++) {
        
        if (k >= ((j+1)*parm.scatSize-j)*4) {
          setCol(255, 0, 0, 255, k); // makes lower diagonal half red pixel by pixel
        } else {
          setCol(0, 0, 255, 255, k); // makes top diagonal half blue
        }
        k += 4 // increment current pixel
      }
    }
  } 
  else if (glob.currentMode == 'PUR'){
    const cMap = d3 // map PL to colors
      .scaleLinear()
      .domain([-1, 0, 1])
      .range([parm.colorDem, "#792898", parm.colorRep]); //blue, purple, red

    for (let j = canvas.height; j >= 0; j--){ //draw diagonals for bottom left half of plot
      for(let i = 0, ji = j; ji < canvas.height; ji++, i++){ //i is incrementing cols, ji incrementing rows
        const dVotes = canvas.height - ji;
        const PL = (2 * i / (1 + (i + dVotes))) - 1; // calculate corresponding PL at current pixel
        const col = d3.rgb(cMap(warpC(PL, 5))); // get color that represents the pixel's PL
        let pos = 4*(canvas.width*(ji+1) + i); // get current pixel
        setCol(col.r, col.g, col.b, 255, pos);  // set color
      }
    }

    for (let j = 0; j < canvas.width; j++){ //draw diagonals for top right half of plot
      for(let i = 0, ji = j; ji < canvas.width; ji++, i++){ //i incrementing rows, ji incrementing cols
        const dVotes = canvas.height - i;
        const PL = (2 * ji / (1 + (ji + dVotes))) - 1; // calculate corresponding PL at current pixel
        const col = d3.rgb(cMap(warpC(PL, 5))); // get color that represents the pixel's PL
        let pos = 4*((canvas.width * i) + ji); // get current pixel
        setCol(col.r, col.g, col.b, 255, pos); // set color
      }
    }
  } 
  else if (glob.currentMode == 'LVA') {
    const PL = d3.scaleLinear() //map x axis position to PL
      .domain([0, canvas.width])
      .range([-1,1])

    const rowScale = d3.scaleLinear() //map PL to colors
      .domain([-1,0,1])
      .range([parm.colorDem, 'rgb(200,200,200)', parm.colorRep])

    const vertScale = d3.scaleLinear().domain([0, canvas.height]).range([0,1])

    for(let r = 0; r < canvas.height; r++){
      for(let c = 0; c < canvas.width; c++){
        let pos = 4 * ((canvas.width * r) + c); //get current pixel
        const col = d3.rgb(rowScale(warpC(PL(c), 4))); //find hue of the pixel from top row gradient

        const base = 15; //last row is rgb(15,15,15)
        const rgbMax = d3.max([col.r, col.g, col.b]); 
        const maxDecr = (rgbMax - base) / canvas.height;
        const factor = warpA(vertScale(r), 2.5); // decrease luminance the same way the scatter points were warped
        const allDecr = factor * maxDecr / (rgbMax - base);
        // to decrease luminance, decrease each color channel by the same proportion
        const newR = col.r - (r * allDecr * (col.r - base)); 
        const newG = col.g - (r * allDecr * (col.g - base));
        const newB = col.b - (r * allDecr * (col.b - base));
        setCol(newR, newG, newB, 255, pos) // set color at pixel
      }
    }
  }

  // hover events
  d3.select('#scat-marks') // hovering over the scatterplot
      .selectAll('.stateScat')
      .data(glob.csvData.votes)
      .on('mouseover', function (ev, d) {
        d3.select(this)
            .style('stroke', 'yellow') // highlight the scat marks in yellow
            .style('stroke-width', 4);
        d3.select(`#stateHex_${d.StateAbbr}`) // highlight the state in yello
            .style('stroke', 'yellow')
            .style('stroke-width', 2);
        updateToolTip(ev, d, glob) // make tooltip show up
      })
      .on('mouseout', function (ev, d) {
        d3.select(this)
          .style('stroke', 'white') // return scat highlight to normal
          .style('stroke-width', 1.3);
        d3.select(`#stateHex_${d.StateAbbr}`)
          .style('stroke-width', 0); // return state highlight back to normal
        glob.tip.style('opacity', 0); // hide tooltip
      });
        

  d3.select('#us-map') // hovering over the states
    .selectAll('g.state')
    .data(glob.csvData.votes)
    .on('mouseover', (ev, d) => {

      d3.select(`#stateHex_${d.StateAbbr}`) 
          .style('stroke', 'yellow') // highlight state in yellow
          .style('stroke-width', 2)
      d3.select(`#stateScat_${d.StateAbbr}`)
            .style('stroke', 'yellow') //highlight scatterplot in yellow
            .style('stroke-width', 4)

            updateToolTip(ev, d, glob) // update tool tip with info from state

    })

    .on('mouseout', (ev, d) => {
      d3.select(`#stateHex_${d.StateAbbr}`)
        .style('stroke', 'none') // no state highlight
      d3.select(`#stateScat_${d.StateAbbr}`)
        .style('stroke', 'white') // return scat highlight to normal
        .style('stroke-width', 1.3)
      glob.tip.style('opacity', 0); // hide tooltip
    })

  glob.scatContext.putImageData(glob.scatImage, 0, 0); //update colormap
  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (66L in ref)
};

const updateAxes = function (mode) {
  if ('PUR' == mode) mode = 'RVD'; // RVD and PUR same; handle RVD
  const label = {
    RVD: ['Republican Votes', 'Democratic Votes'],
    LVA: ['Political Leaning', 'Amount of Votes'],
  }[mode];
  d3.select('#x-axis').html(label[0]);
  d3.select('#y-axis').html(label[1]);
};

/* TODO: here will go the functions that you write, including those called by modeSet and yearSet.
By the magic of hoisting, any functions you add here will also be visible to dataProc and visInit
above. */
// v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (p3 new functions)
const setCol = function(r, g, b, a, pos) { // setting pixel colors
  glob.scatImage.data[pos++] = r
  glob.scatImage.data[pos++] = g
  glob.scatImage.data[pos++] = b; 
  glob.scatImage.data[pos++] = a;
}

const updateBars = function (year) {
  // get total DN, DE, RN, RE for the year
  var DN = glob.sumVotes[year].DN
  var DE = glob.sumVotes[year].DE
  var RN = glob.sumVotes[year].RN
  var RE = glob.sumVotes[year].RE
  // calculate proportion of democratic/republican to toal
  var DN_bar = DN/(DN+RN)
  var RN_bar = RN/(DN+RN)
  var DE_bar = DE/(DE+RE)
  var RE_bar = RE/(DE+RE)

  // change text for bars to votes
  // select each element and change html
  d3.select('#D-pv-txt').html(DN);
  d3.select('#R-pv-txt').html(RN);
  d3.select('#D-ec-txt').html(DE);
  d3.select('#R-ec-txt').html(RE);
  // set candidate names
  d3.select('#D-name').html(glob.cname[year].D)
  d3.select('#R-name').html(glob.cname[year].R)
  // adjust balance bars with voting proportions
  // add transitions
  d3.select('#R-ec-bar').transition().duration(parm.transDur).attr('width', RE_bar);
  d3.select('#D-ec-bar').transition().duration(parm.transDur).attr('width', DE_bar);
  d3.select('#D-pv-bar').transition().duration(parm.transDur).attr('width', DN_bar);
  d3.select('#R-pv-bar').transition().duration(parm.transDur).attr('width', RN_bar);

}

const getStateHex = function(statei) {
  //dem and rep votes for the state at current year
  const DN = glob.csvData.votes[statei][`DN_${glob.currentYear}`];
  const RN = glob.csvData.votes[statei][`RN_${glob.currentYear}`];
  var x = 0;
  var y = 0;

  // get the corresponding color from the colormap by calculating position of the scatmark
  // using our warp functions in changeScat()
  if (glob.currentMode == 'LVA'){
    const warpA = (x, p) => 1- Math.pow(1- x, p);
    const xscale = d3.scaleLinear().domain([-1, 1]).range([0, parm.scatSize])
    const yscale = d3.scaleLinear().domain([0, glob.maxVote]).range([0, 1])
    x = Math.floor(xscale(getPL(glob.csvData.votes[statei], glob.currentYear)))
    y = Math.floor(parm.scatSize - (warpA(yscale(+DN + +RN), 2.5) * parm.scatSize))
  } else{
    const warpA = (x, p) => Math.pow(x, 1/p);
    const xscale = d3.scaleLinear().domain([0, 11110250]).range([0, 1]);
    const yscale = d3.scaleLinear().domain([0, 11110250]).range([0, 1]);
    y = Math.floor(parm.scatSize - warpA(yscale(DN), 2.5) * parm.scatSize);
    x = Math.floor(warpA(xscale(RN), 2.5) * parm.scatSize);
  }

  var pix = 4 * ((parm.scatSize * y + x));
  var red = glob.scatImage.data[pix++];
  var green = glob.scatImage.data[pix++];
  var blue = glob.scatImage.data[pix++];
  var alpha = glob.scatImage.data[pix++];

  return (`rgb(${red},${green},${blue})`);
}

// returns political lean based off given equation
const getPL = function(data, year) {
  var RN = data[`RN_${year}`]
  var DN = data[`DN_${year}`]
  var TN = +RN + +DN
  var PL = 2*RN/(1+TN) - 1
  return PL
}

// changes scatterplot mark positions based on mode and year
const changeScat = function(glob) {
  if (glob.currentMode == 'LVA') {
    const warpA = (x, p) => 1- Math.pow(1- x, p); // warp function keeps lowest and highest points in place
    // scale for LV from -1 to 1 
    // y scale to the largest total voting population in the dataset
    const xscale = d3.scaleLinear().domain([-1, 1]).range([0, parm.scatSize])
    const yscale = d3.scaleLinear().domain([0, glob.maxVote]).range([0, 1])

    // select scat parms
    d3.select('#scat-marks')
      .selectAll('circle')
      .data(glob.csvData.votes)
      .transition()
      .duration(parm.transDur)
      .attr('cy', (d) => parm.scatSize - 
        (warpA(yscale(+d[`DN_${glob.currentYear}`] + +d[`RN_${glob.currentYear}`]), 2.5) 
        * parm.scatSize)) // change y position of scat marks based on yscale and warp to spread points out
      .attr('cx', (d) => xscale(getPL(d,glob.currentYear))); // place scattermarks based off their political lean
      
    } else {
    // for RVD and PUR modes
    const warpA = (x, p) => Math.pow(x, 1/p);

    // hardcoded to domain from 0 to California's 2020 Democratic vote (largest vote)
    const xscale = d3.scaleLinear().domain([0, 11110250]).range([0, 1]);
    const yscale = d3.scaleLinear().domain([0, 11110250]).range([0, 1]);
    
    d3.select('#scat-marks')
      .selectAll('circle')
      .data(glob.csvData.votes)
      .transition()
      .duration(parm.transDur)
      // set y position by democratic and x by republican 
      // diagonal location warped by size of the voting population
      .attr('cy', (d) =>  parm.scatSize - warpA(yscale(d[`DN_${glob.currentYear}`]), 2.5) * parm.scatSize)
      .attr('cx', (d) => warpA(xscale(d[`RN_${glob.currentYear}`]), 2.5) * parm.scatSize);

  }
}

// set the color for the state based off its corresponding scattermark
const makeColor = function(votes) {
  for (let i = 0; i < votes.length; i++) {
    var state = votes[i]['StateAbbr']
    d3.select(`#stateHex_${state}`).attr('fill', getStateHex(i))
  }
}

// changes tooltip
const updateToolTip = function(ev, dat, glob) {
  // fills in dummy data table with new data
  var state = glob.stateName[dat.StateAbbr]
  var year = glob.currentYear
  var yearState = glob.byState[year]
  var DN = yearState[`${dat.StateAbbr}_DN`]
  var RN = yearState[`${dat.StateAbbr}_RN`]
  var DE = yearState[`${dat.StateAbbr}_DE`]
  var RE = yearState[`${dat.StateAbbr}_RE`]
  var data = [
    { "one" : ' ', "two" : 'D', "three": 'R' },
    { "one" : 'popular', "two" : DN, "three": RN },
    { "one" : 'electoral', "two" : DE, "three": RE }
  ]
  
  // changes title to State in Year
  d3.selectAll('thead')
    .selectAll('tr')
    .selectAll('th')
    .text(state + " in " + year)
  
  // updates table with new data
  d3.selectAll('tbody')
    .selectAll('tr')
    .data(data)
    .each(function (d) {
      var self = d3.select(this);
      self.selectAll("td")
          .data(function (row) {
            return ['one', 'two', 'three'].map(function (column) {
              return {column: column, value: row[column]};
            });
          })
          .text(function(d) {
            return d.value; 
          });
      })
      // makes tooltip visible and places location to where the mouse is
      glob.tip.style('opacity', 0.8)
              .style('top', (ev.pageY - 350 - 108 - 150) + 'px')
              .style('left', (ev.pageX + 10) + "px")
}


// ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (110L in ref)

// UI wants to set the new colormapping mode to "mode"
const modeSet = function (mode) {
  console.log(`modeSet(${mode}): hello`);
  if (glob.currentMode == mode) return; // nothing to do
  // else do work to display mode "mode"
  updateAxes(mode);
  /* Your code should:
  update the colormap image underneath the scatterplot,
  the position of the marks in the scatterplot, and
  how the states in the US map are filled */
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (p3 modeSet)
  glob.currentMode = mode;
  visInit(glob); // sets mode color and tooltip hover
  makeColor(glob.csvData.votes); // changes state color based on mode
  changeScat(glob); // updates scat marks based on mode
  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (3L in ref)
  glob.currentMode = mode;
};

// UI wants to set the near year to "year"
const yearSet = function (year) {
  console.log(`yearSet(${year}): hello`);
  if (glob.currentYear == year) return; // nothing to do
  /* else do work to display year "year". Your code should:
  update the position of the marks in the scatterplot,
  how the states in the US map are filled,
  and the balance bars */
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (p3 yearSet)
  updateBars(year);
  // makeColor(glob.csvData.votes);
  glob.currentYear = year; // resets new year
  
  changeScat(glob); // updates scat marks based on year
  makeColor(glob.csvData.votes); // updates state colors based on year
  
  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (4L in ref)
  glob.currentYear = year;
};
