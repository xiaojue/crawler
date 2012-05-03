/**
 * @author fuqiang[designsor@gmail.com]
 * @description Crawler
 */

var http = require('http'),
events = require('events').EventEmitter,
Iconv = require('iconv').Iconv,
gb2312_to_utf8_iconv = new Iconv('GBK', 'UTF-8'),
htmlparser = require('htmlparser'),
select = require('soupselect').select;

var crawler = function(hosts, selector, ToGBK) {
	/*
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
    */
	events.call(this);
	this.hosts = hosts;
	this.ToGBK = ToGBK;
	this.selector = selector;
	this.map = [];
	this.pools = [];
};

crawler.prototype = Object.create(events.prototype, {
	constructor: {
		value: crawler,
		enumerable: false
	},
	_setPath: {
		value: function(path) {
			this.hosts.path = path;
		}
	},
	_getPath: {
		value: function() {
			return this.hosts.path;
		}
	},
	open: {
		value: function(callback) {
			var request = http.get(this.hosts, function(res) {
				var buffers = [],
				size = 0,
				pageStr = '';
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
					if (this.ToGBK) {
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
		}
	},
	collect: {
		value: function(path, callback) {
			var self = this;
			this._setPath(path);
			this.open(function(err, str) {
				if (!err) {
					var handler = new htmlparser.DefaultHandler(function(err, dom) {
						if (err) {
							self.emit('error', err);
						} else {
							var pool = self.selector(dom, select);
							if (callback) callback(pool);
						}
					});
					var parser = new htmlparser.Parser(handler);
					parser.parseComplete(str);
				} else {
					self.emit('error', err);
				}
			});
		}
	},
	register: {
		value: function(path) {
			var self = this;
			this.map.push([path, false]);
		}
	},
	ready: {
		value: function(map) {
			for (var i = 0; i < map.length; i++) {
				if (!map[i][1]) return false;
			}
			return true;
		}
	},
	start: {
		value: function() {
			var self = this;
			console.log(this.map);
			this.map.forEach(function(T, index) {
				self.collect(T[0], function(pool) {
					self.map[index][1] = true;
					self.pools[index] = pool;
					if (self.ready(self.map)) {
						var endpool = [];
						self.pools.forEach(function(pool) {
							endpool = endpool.concat(pool);
						});
						self.emit('end', endpool);
						self.pools = [];
						self.map = [];
					}
				});
			});
		}
	}
});

exports.crawler = crawler;

