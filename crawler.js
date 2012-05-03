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

var crawler = function(hosts, ToGBK) {
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
	this.hosts = hosts;
	this.ToGBK = ToGBK;
	events.call(this);
};

crawler.prototype = Object.create(events.prototype, {
	constructor: {
		value: crawler,
		enumerable: false
	},
	_setPath: function(path) {
		this.hosts.path = path;
	},
	_getPath: function() {
		return this.hosts.path;
	},
	open: function(callback) {
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
	},
	collect: function(callback) {
		var self = this;
		this.open(function(err, str) {
			if (!err) {
				var handler = new htmlparser.DefaultHandler(function(err, dom) {
					if (err) self.emit('error', err);
					else self.emit('collect', null, dom);
					if (callback) callback(err, dom);
				});
				var parser = new htmlparser.Parser(handler);
				parser.parseComplete(str);
			} else {
				self.emit('error', err);
			}
		});
	},
	get: function(path) {
		var self = this;
		if (path && path != self._getPath()) {
			self._setPath(path);
		}
		this.collect(function() {
			self.emit('end');
		});
	}
});

