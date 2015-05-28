var fs = require('fs');
var async = require('async');
var json2csv = require('json2csv');
var request = require('request')
var google =require('google'); //graphical scraper not used
var _ = require('underscore');
var jf = require('jsonfile');
var util = require('util');

var config = __dirname+'/config.json'

var googlekey = ''; 
var cx = '';
var yelp_ConsumerKey = '';
var yelp_ConsumerSecret = '';
var yelp_Token = '';
var yelp_TokenSecret ='';


var zips = [
	94102, 94110, 94111, 94112, 94114, 94115, 94116, 94117, 94118,
	94119, 94120, 94121, 94122, 94123, 94124, 94125, 94126, 94127, 94128,
	94129, 94130, 94131, 94132, 94133, 94134, 94135, 94137, 94139, 94140,
	94141, 94142, 94143, 94144, 94145, 94146, 94147, 94151, 94153, 94154,
	94156, 94158, 94159, 94160, 94161, 94162, 94163, 94164, 94171, 94172,
	94177, 94188, 94199, 94501, 94502, 94601, 94602, 94603, 94604, 94605,
	94606, 94607, 94608, 94609, 94610, 94611, 94612, 94613, 94614, 94615,
	94617, 94618, 94618, 94619, 94621, 94622, 94622, 94623, 94624, 94649,
	94659, 94660, 94661, 94666, 94701, 94702, 94703, 94704, 94708, 94709,
	94720
]

var categories = [
	'art',
	'design',
	'beauty',
	'spa',
	'education',
	'entertainment',
	'food',
	'drink',
	'bars',
	'restaurants',
	'grocery',
	'health',
	'fitness',
	'yoga',
	'childcare',
	'nonprofit',
	'retail',
	'real estate',
	'insurance'
];

var masterResults=[]

var searchYelp = function(zip,term,cb){
	var client = require('yelp').createClient({
		consumer_key:yelp_ConsumerKey,
		consumer_secret:yelp_ConsumerSecret,
		token:yelp_Token,
		token_secret:yelp_TokenSecret,
	});
	client.search({term: term, location: zip}, function(error, data) {
		if(error){console.log(error);}
		if(data.businesses){
			searchGoogleAndParse(null,zip,term,data.businesses,cb);
		}
	});
};
var searchGoogleAndParse = function(err,zip,term,data,cb){
	var results=_.map(data,function(datum){
		
		var cur = {
			business:datum.name,
			locationCity:datum.location.city,
			locationNeighborhood:'',
			website:[datum.url.toString()],
			category:_.flatten(datum.categories)
		};
		if(datum.location.neighborhoods){
			cur.locationNeighborhood = datum.location.neighborhoods.toString()+' '+zip;
			cur.locationNeighborhood = cur.locationNeighborhood.replace(/,/g , ' ');
		}
		google.resultsPerPage = 1;
		google.requestOptions = {timeout:10000}
		cur.category = cur.category.toString().replace(/,/g , ' ')+' '+term;
		// masterResults.push(cur);
		// return cur;
		// console.log(cur);
		request({url:'https://www.googleapis.com/customsearch/v1?cx='+cx+'&q='+cur.business+'%2B'+zip+'&num=1&key='+googlekey,
			method:'GET'},function(err,res,body){
				console.log(res.body);
				if(res.body.items){
					cur.website.push(res.body.items[0].link);
				}
				cur.website = cur.website.toString().replace(/,/g , ' ');
				// console.log(cur);
				return cur;	
		});
	});
	masterResults.concat(results);
	console.log(masterResults);
	// console.log(masterResults.results);
	cb()
}

var initVars = function(obj){
	googlekey = obj.googlekey;
	cx = obj.cx;
	yelp_ConsumerKey = obj.yelp_ConsumerKey;
	yelp_ConsumerSecret = obj.yelp_ConsumerSecret;
	yelp_Token = obj.yelp_Token;
	yelp_TokenSecret = obj.yelp_TokenSecret;
}

var masterHarness=function(cb){
	jf.readFile(config,function(err,obj){
		if(err){
			console.log(err);
			console.log('config file read error');
		}
		else{
			initVars(obj);
			async.map(zips,subIterator,cb);
		}
	});
}

var subIterator= function(zip,cb){
	async.each(categories,function(category,cb){
		searchYelp(zip,category,cb);
	},cb);
}

var saveResults = function(err, results){
	console.log('******************&&&&&&&&&&&&&&&&&&&&&&&&&**********************');
	console.log(masterResults);
	var tmpFile = __dirname+'/EmailList';
	json2csv({data:masterResults,fields:['business','locationCity','locationNeighborhood','website','category']},function(err,csv){
		if(err){console.log(err);}
		fs.writeFile(tmpFile+'.csv', csv, function(err){
			if (err) {console.log(err);}
		});
	});
}

var testRun=function(){
	var zip = zips[1];
	var term = categories[0];
	request({
		url:'https://www.googleapis.com/customsearch/v1?cx=011240648699576407672:nbbwnlmpodi&q='+'Creativity Explored'+'%2B'+zip+'&num=1&key='+googlekey,
		method:'GET'},function(err,res,body){
			console.log(JSON.parse(body).items);
			if(res.body.items){
				cur.website.push(res.body.items[0].link);
		}
	});
}

masterHarness(saveResults);
// searchYelp(saveResults);
// testRun();
