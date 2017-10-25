'use strict';

const cheerio = require('cheerio');
const request = require('request');
const sql = require('mysql')

var dayURL = 'https://www.basketball-reference.com/boxscores/?month=2&day=2&year=2017';

var player = function(names, rebounds, assists, steals, blocks, points)	{
	this.name = names;
	this.rbs = rebounds;
	this.ast = assists;
	this.stl = steals;
	this.blk = blocks;
	this.pts = points;
}


var con = sql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password: '',
	database: 'nba'
});

function initSQL  ()	{
	con.connect(function(err)	{
		if(err) console.log(err)
		console.log("Connected")
	})
}

////////////////////////////////////
//initSQL()

function createDatabase(str)	{
	var db = "CREATE DATABASE nba"
		con.query(db, function(err, results)	{
			if (err) console.log(err)
			console.log("Created database")
	})
}

function createTable(name)	{
	var tb = "CREATE TABLE " + name + " (name VARCHAR(255), points VARCHAR(255), rebounds VARCHAR(255), assists VARCHAR(255), steals VARCHAR(255), blocks VARCHAR(255))"
	con.query(tb, function(err, results)	{
		if (err) console.log(err)
		console.log("Created table: " + name)
	})		
}

function insertRecords(str, values)	{
	con.query(str, [values], function(err, results)	{
		if (err) console.log(err)
		console.log("Inserted record")
	})
}

function checkTable()	{
	con.connect(function(err)	{ 
		if(err) console.log(err)
		con.query("SELECT * FROM boxscore", function (err, result, fields)	{
			if (err) console.log(err)
			console.log(result)
			//console.log(fields)
		});
	});	
}

function printStats ()	{
	
	console.log('The player with the most points is ' + maxptsname + " with " + maxpt + " points.");
	console.log('The player with the most assists is ' + maxastname + " with " + maxast + " assists.");
	console.log('The player with the most rebounds is ' + maxrbsname + " with " + maxrb + " rebounds.");
	console.log('The player with the most steals is ' + maxstlname + " with " + maxstl + " steals.");
	console.log('The player with the most blocks is ' + maxblkname + " with " + maxblk + " blocks."); 
}

function scrapePage (URL, callback) {	// and callback param should be the last one
    //make an HTTP request for the page to be scraped
    request(URL, function(err, response, HTML){        

        //write the entire scraped page to the local file system
        //console.log(HTML)
		callback(HTML)
    }) ;
}

var skip = 0


	// initial load into the daily page
scrapePage(dayURL, function (base)	{
	const $ = cheerio.load(base)	
	

	
	
	$('p').each(function(err, p)	{
		if (p.attribs.class == 'links')	{
			var a = p.children[0]
			var gameURL = "https://www.basketball-reference.com" + a.attribs.href
			

			scrapePage(gameURL, function(body)	{
				
				
				var tableTitle
	
				
				
				// MAKE the stats be here so they dont overlap
				var sqlList = [];
				var playerlist = [];

				
				sqlList.push(['Name', 'Pt', 'Rb', 'Ast', 'Stl', 'Blk'])
				 const $ = cheerio.load(body)	
				 
					$('title').each(function(err, title)	{
						var str = title.children[0].data
						str = str.substr(0, str.length-27)
						var teams = str.substr(0, str.indexOf("Box")); 
						var date = str.substr (str.indexOf(",")+ 2, str.length)
						tableTitle = teams + "@ " + date
					})
					 
				 
				   $('tbody').each(function(err, tbody){	// find every tr tag - stuff we want might have specific tags 
				   var limit = ($(this).children().length)
						if (skip) {
							skip = 0;
							return;	// to continue to skip the advanced stats
						}	
						
						 for (var i = 1; i < limit * 2; i++) {
							 if (tbody.children[i].name = "tr")	{
								var tr = tbody.children[i]

								if (tr.type != "text" && tr.attribs.class != "thead")	{
								//console.log(tr)
				
									var th = tr.children[0]
									if (th.type != "text")	{
										var a = th.children[0]
										var name = a.children[0].data
										//console.log(name)
									}
									if (tr.children[2] != null)	{	// added for DNP checking
										if (tr.children[13].type != "text")	{
											var rb = tr.children[13].children[0].data
											//console.log("RB:" + rb)
										}
										if (tr.children[14].type != "text")	{
											var ast = tr.children[14].children[0].data
										}
										 //console.log("AST: " + ast)
										if (tr.children[15].type != "text")	{
											var stl = tr.children[15].children[0].data
											//console.log("STL: " + stl)
										}
										if (tr.children[16].type != "text")	{
											var blk = tr.children[16].children[0].data
											//console.log("BLK: " + blk)
										}
										if (tr.children[19].type != "text")	{
											var pts = tr.children[19].children[0].data
											//console.log("PTS: " + pts)
										}
									}
									var toadd = new player(name, rb, ast, stl, blk, pts);
									sqlList.push([name, pts, rb, ast, stl, blk]);
									//var str = "INSERT INTO boxscore (name, points, rebounds, assists, steals, blocks) VALUES ?";
									//insertRecords(str, val)
									playerlist.push(toadd);	// add the player to the list 
								}
							 }
					   } 
					
				  skip = 1;

				  })
				  
				  
					/* createTable(tableTitle)
					var str = "INSERT INTO " + tableTitle  + " (name, points, rebounds, assists, steals, blocks) VALUES ?";
					insertRecords(str, sqlList)
					 */
					
					
					
					//checkTable();
					/* 
					var maxpt = 0;
					var maxptsname = '';
					var maxrb = 0;
					var maxrbsname = '';
					var maxast = 0;
					var maxastname = '';
					var maxstl = 0;
					var maxstlname = '';
					var maxblk = 0;
					var maxblkname = '';
					
					for (var i = 0; i < playerlist.length; i++)	{
						if (playerlist[i].pts > maxpt)	{
							maxpt = playerlist[i].pts;
							maxptsname = playerlist[i].name;
						}
						if (playerlist[i].rbs > maxrb)	{
							maxrb = playerlist[i].rbs;
							maxrbsname = playerlist[i].name;
						}
						if (playerlist[i].ast > maxast)	{
							maxast = playerlist[i].ast;
							maxastname = playerlist[i].name;
						}
						if (playerlist[i].stl > maxstl)	{
							maxstl = playerlist[i].stl;
							maxstlname = playerlist[i].name;
						}
						if (playerlist[i].blk > maxblk)	{
							maxblk = playerlist[i].blk;
							maxblkname = playerlist[i].name;
						}	
					}	
					
					
					console.log('The player with the most points is ' + maxptsname + " with " + maxpt + " points.");
					console.log('The player with the most assists is ' + maxastname + " with " + maxast + " assists.");
					console.log('The player with the most rebounds is ' + maxrbsname + " with " + maxrb + " rebounds.");
					console.log('The player with the most steals is ' + maxstlname + " with " + maxstl + " steals.");
					console.log('The player with the most blocks is ' + maxblkname + " with " + maxblk + " blocks.");
					console.log() */
					
			});
			
		}
	});
	
});





