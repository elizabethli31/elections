// common.js: things possibly useful across p3
// Copyright (C)  2023 University of Chicago. All rights reserved.
/*
This is only for students and instructors in the 2023 CMSC 23900 ("DataVis") class, for use in that
class. It is not licensed for open-source or any other kind of re-distribution. Do not allow this
file to be copied or downloaded by anyone outside the 2023 DataVis class.
*/
'use strict';

// import and then export d3.
import * as d3 from './d3.js';
export { d3 };

// parameters that control geometry and appearance
export const parm = {
  transDur: 230, // duration of all transition()s
  circRad: 6, // size of circle marks in scatterplot
  scatSize: 350, // width and height of scatterplot
  scatMarg: 30, // margin around scatterplot
  scatTweak: 7, // tweak to text label positions
  colorDem: d3.rgb(40, 50, 255), // color showing pure democratic vote
  colorRep: d3.rgb(230, 30, 20), // color showing pure democratic vote
  hexWidth: 52, // size of individual hexagons in US map
  hexScale: 1,  // hexagon scaling; 1 = edges touching
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (common parm)
  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (0L in ref)
};

/* global bag of state; could be called "state" but that could be confusing with a US "state". The
  description "global bag of state" is a hint that this is not the cleanest design :) */
export const glob = {
  csvData: {}, // the results of d3.csv() data reads
  /* how the colormap mode is described in the UI.  NOTE: these identifiers
    'RVD', 'PUR', 'LVA' will not change; feel free to use them as magic constant strings throughout
    your code */
  modeDesc: {
    RVD: 'red/blue',
    PUR: 'purple',
    LVA: 'lean-vs-amount',
  },
  currentMode: null, // colormapping mode currently displayed
  currentYear: null, // election year currently displayed
  currentAbbrHide: false, // whether to hide state abbreviations in US map (toggled by 'd')
  scatContext: null, // "context" of scatterplot image canvas
  scatImage: null,   // underlying RGBA pixel data for scatterplot image canvas
  // v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (common glob)
  // ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (1L in ref)
}

// little utility functions, use or not as you see fit
export const lerp3 = function (a, b, w) {
  return (1 - w) * a + w * b;
};
export const lerp5 = function (y0, y1, x0, x, x1) {
  const w = (x - x0) / (x1 - x0);
  return (1 - w) * y0 + w * y1;
};
export const clamp = function (a, v, b) {
  return v < a ? a : v > b ? b : v;
};

// define, and export, anything else here that you want to use in p3
// v.v.v.v.v.v.v.v.v.v.v.v.v.v.v  begin student code (new in common)
export function sumAllStates(years, votes){
  var tot = new Object()
  for(let i = 0; i < years.length; i++){
    var obj = new Object()
    var DN = 0;
    var DE = 0;
    var RN = 0;
    var RE = 0;
    for(let s = 0; s < votes.length; s++){ //iterating through states
      let DNstr = "DN_" + years[i]; let DEstr = "DE_"+years[i]; let RNstr = "RN_"+years[i]; let REstr = "RE_"+years[i];
      DN += parseInt(votes[s][DNstr])
      DE += parseInt(votes[s][DEstr])
      RN += parseInt(votes[s][RNstr])
      RE += parseInt(votes[s][REstr])
    }
    obj.DN = DN
    obj.DE = DE
    obj.RN = RN
    obj.RE = RE
    const year = years[i]
    tot[year] = obj
  }
  return tot
}

export function votesStates(years, votes) {
  var stateVotes = new Object()
  for(let i = 0; i < years.length; i++) {
    var obj = new Object()
    for(let s = 0; s < votes.length; s++){ //iterating through states
      let DNstr = "DN_" + years[i]; let RNstr = "RN_"+years[i]; 
      var DN = parseInt(votes[s][DNstr])
      var RN = parseInt(votes[s][RNstr])
      var count = DN + RN
      var state = votes[s]['StateAbbr']
      obj[state] = count
    }
    const year = years[i]
    stateVotes[year] = obj
  }
  return stateVotes
}

export function totalmax(years,states) {
  var max = 0;
  for(let i = 0; i < years.length; i++) {
    var year = years[i]
    var arr = Object.values(states[year])
    var this_max = Math.max(...arr)
    var max = Math.max(max, this_max)
  }
  return max
}

export function detailedStates(years, votes) {
  var stateVotes = new Object()
  for(let i = 0; i < years.length; i++) {
    var obj = new Object()
    for(let s = 0; s < votes.length; s++){ //iterating through states
      let DNstr = "DN_" + years[i]; let DEstr = "DE_"+years[i]; let RNstr = "RN_"+years[i]; let REstr = "RE_"+years[i];
      var DN = parseInt(votes[s][DNstr])
      var DE = parseInt(votes[s][DEstr])
      var RN = parseInt(votes[s][RNstr])
      var RE = parseInt(votes[s][REstr])
      var state = votes[s]['StateAbbr']
      obj[`${state}_DN`] = DN
      obj[`${state}_DE`] = DE
      obj[`${state}_RN`] = RN
      obj[`${state}_RE`] = RE
    }
    const year = years[i]
    stateVotes[year] = obj
  }
  return stateVotes
}
// ^'^'^'^'^'^'^'^'^'^'^'^'^'^'^  end student code (0L in ref)
