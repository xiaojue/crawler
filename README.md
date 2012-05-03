### Crawler by nodejs
  
#### usage
  
````js
var crawler = require('./crawler.js').crawler;

var test = new crawler({
	host: 'www.baidu.com',
	path: '/s?wd=',
	port: 80,
	method: 'get'
},
function(dom, select) {
	var pool = [];
	select(dom, 'a').forEach(function(ele) {
		pool.push(ele.attribs.href);
	});
	return pool;
},
true);

test.on('error', function(e) {
	console.log(e);
});

test.on('end', function(pool) {
	console.log(pool.length);
});

for (var i = 0; i < 4; i++) {
	var pn = i * 10;
	test.register('/s?wd=test&pn=' + pn);
}

test.start();
````

#### dependent
  htmlparser
  iconv
  soupselect
