/**
 * @author fuqiang[designsor@gmail.com]
 * @description Crawler
 */

var http = require('http'),
Iconv = require('iconv').Iconv,
gb2312_to_utf8_iconv = new Iconv('GBK', 'UTF-8'),
htmlparser = require('htmlparser'),
select = require('soupselect').select;

function mix(o, s) {
	for (var i in s) {
		o[i] = s[i];
	}
}

var crawler = function(param) {
	this.param = {
		target: 'baidu',
		maxsize: 10,
		key: '测试',
		dir: './temp'
	};
	this.len = 0;
    this.pool = [];
	mix(this.param, param);
};

crawler.prototype = {
	constructor: crawler,
	collector: function(key) {
		var collection = {
			baidu: {
				host: 'www.baidu.com',
				path: '/s?wd=' + key,
				port: 80,
				method: 'get'
			},
			google: {
				host: 'www.google.com',
				path: '/search?hl=zh-CN&oe=utf-8&ie=utf-8&q=' + key,
				port: 80,
				method: 'get'
			}
		};
		var codingToGBK = {
			baidu: true,
			google: false
		};
		return [collection[this.param.target], codingToGBK[this.param.target]];
	},
	open: function(callback) {
		var param = this.collector(this.param.key),
		pageStr = '',
		request = http.get(param[0], function(res) {
			var buffers = [],
			size = 0,
			pageStr;
			res.on('data', function(buffer) {
				buffers.push(buffer);
				size += buffer.length;
			});
			res.on('end', function() {
				var buffer = new Buffer(size),
				pos = 0;
				for (var i = 0, len = buffers.length; i < len; i++) {
					buffers[i].copy(buffer, pos);
					pos += buffers[i].length;
				}
				if (param[1]) {
					var utf8_buffer = gb2312_to_utf8_iconv.convert(buffer);
					pageStr = utf8_buffer.toString();
				} else {
					pageStr = buffers.toString();
				}
				callback(null, pageStr);
			});
		});
		request.on('error', function(e) {
			callback(e);
		});
	},
	hrefcollect: function(callback) {
        var self = this;
		this.open(function(err, str) {
			var handler = new htmlparser.DefaultHandler(function(err, dom) {
				if (!err) {
                    var pool = [];
					select(dom, 'a').forEach(function(ele) {
                        pool.push(ele.attribs.href);                        
					});
                    callback(null,pool);
				}else{
                    callback(err);    
                }
			});
			var parser = new htmlparser.Parser(handler);
			parser.parseComplete(str);
		});
	}
};

var test = new crawler();
test.hrefcollect(function(err,pool){
    console.log(pool);
});

